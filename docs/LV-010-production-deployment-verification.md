# LV-010 — Production Deployment and End-to-End Snapshot Verification

**Status:** Partially complete. App Hosting deployment verified end-to-end (auth boundary only — no successful snapshot run exists yet in production). Cloud Functions deployment deliberately withheld; see LV-011.

## 1. Deployed Project

- Firebase project: `lookupvegas-337b3`
- App Hosting backend: `lookupvegas` (`alwat83-lookupvegas` repo connection), region `us-east4`
- Production URL: `https://lookupvegas--lookupvegas-337b3.us-east4.hosted.app`
- Automatic Build and Rollout (ABIU): **Disabled** — every deploy requires a manual `firebase apphosting:rollouts:create`.

## 2. Deployed Commit

`580d5f3` (`chore(ci): remove temporary npm-ci-diagnostic workflow`), deployed via:

```
firebase apphosting:rollouts:create lookupvegas --git-branch main --force
```

Preceded by the actual fix commit `dcace73` (`fix(deps): make App Hosting lockfile Linux-reproducible`) and the App Hosting env-wiring commit `3cc56c6` (`chore(deploy): wire CRON_SECRET into App Hosting via Secret Manager`).

## 3. What Was Verified

### 3.1 App Hosting build and release
- `firebase apphosting:rollouts:create lookupvegas --git-branch main --force` — succeeded (four prior attempts failed on `npm ci`; root-caused and fixed as `package-lock.json` Windows/Linux drift, see commit `dcace73`).
- `curl https://lookupvegas--lookupvegas-337b3.us-east4.hosted.app/` → `200`.

### 3.2 `/api/cron/snapshot` auth boundary
- No `Authorization` header → `401 {"error":"Unauthorized"}`.
- Malformed `Authorization: Bearer <wrong value>` → `401 {"error":"Unauthorized"}`.
- `/api/cron/snapshot/status` (unauthenticated) → `401 {"error":"Unauthorized"}`.
- A real, successful invocation (`Authorization: Bearer <CRON_SECRET>`) was **not** performed by this session — using the live secret directly from an automated tool call against the production endpoint was blocked by the platform's safety classifier, and per explicit instruction, privileged production invocations are to be run by the project owner directly, not by this agent. The exact command, for you to run:

  ```bash
  curl -s -H "Authorization: Bearer $(firebase functions:secrets:access CRON_SECRET)" \
    "https://lookupvegas--lookupvegas-337b3.us-east4.hosted.app/api/cron/snapshot"
  ```

  (Adjust the secret-retrieval step to however you prefer to read the value — `firebase functions:secrets:access CRON_SECRET` prints it to your own terminal.)

### 3.3 Firestore / archive validator
```
node scripts/validate-archive.mjs
```
Result: **PASS**, `Loaded 0 document(s) from daily_metrics.` No structural issues, no range violations, no CVI mismatches — vacuously, because the collection is currently empty. This matches the Firestore Console inspection done earlier in this engagement (no `daily_metrics` collection exists in production). **The daily snapshot pipeline has never successfully run against production.** There is no existing document to inspect against the schema checklist (document ID, `schema_version`, `cvi_version`, `private_jet_activity_index`/`private_jet_count` agreement, `source_freshness`, etc.) — that check can only happen after a first real invocation (§3.2).

### 3.4 Structured logs
Not independently inspected this session. App Hosting's runtime logs are Cloud Run logs, viewable at the Firebase Console (Console → App Hosting → `lookupvegas` → Logs) or GCP Cloud Logging; no CLI path was available without either browser authentication (blocked — the in-session browser isn't logged into your Google account) or installing `gcloud` (not installed on this machine, would need your go-ahead). Once you run the manual invocation in §3.2, the resulting `snapshot_run_complete` (and any `snapshot_source_failed` / `snapshot_auth_rejected`) structured log entries can be checked there directly.

## 4. Cloud Functions: Not Deployed (Deliberately)

`firebase functions:list` confirms `dailySnapshot` and `weeklyMovementBrief` are **not** among the 16 functions currently live in this project.

Deployment was withheld after directly reproducing a crash:

```
$ node -e "require('./functions/index.js')"
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
    at Object.<anonymous> (functions/index.js:18:16)
```

`RESEND_API_KEY` is read as a bare `process.env` value at module scope, never bound via `defineSecret`/`secrets: [...]` the way `CRON_SECRET` correctly is. Deploying either function today would deploy code that crashes on every cold start. Filed as [LV-011](./LV-011-functions-resend-secret-binding.md), which also separately found `functions/package-lock.json` fails a cold `npm ci` on Linux (same class of issue as the App Hosting fix, unaddressed here).

### 4.1 Scheduler configuration (as declared in source — not live)

| | `dailySnapshot` | `weeklyMovementBrief` |
|---|---|---|
| Schedule expression | `5 0 * * *` | `every monday 08:00` |
| Timezone | `America/Los_Angeles` | `America/Los_Angeles` |
| Next Las Vegas-local run (once deployed) | Daily, 00:05 Pacific | Monday, 08:00 Pacific |
| Corresponding UTC (current DST state, PDT/UTC-7) | 07:05 UTC | 15:00 UTC |
| Next calendar occurrence from 2026-07-29 | 2026-07-30 00:05 PDT | 2026-08-03 08:00 PDT |

Both are unchanged from LV-004/LV-009 — no cadence modification made or proposed.

### 4.2 `weeklyMovementBrief` configuration-level checks (code inspection only, not runtime-verified)
- **Recipient configuration exists**: recipients are queried live from Firestore (`intelligenceUsers`, `enterpriseUsers` collections), not a static list — `functions/index.js:230-232`.
- **Resend configuration exists but is broken**: `RESEND_API_KEY` secret value was set in Secret Manager earlier this session, but is not bound to the function (§4, LV-011).
- **Structured logging is present**: uses the shared `logEvent` helper (`weeklyBrief_started`/`weeklyBrief_complete`/`weeklyBrief_no_recipients`/`weeklyBrief_failed`), recipient **count** only, never addresses or report content — confirmed in LV-009.
- No safe dry-run path exists for this function (it has no HTTP-invocable equivalent, unlike `dailySnapshot`/the App Hosting route) — configuration-level verification is what LV-010 allows in that case, and is what's recorded here.

## 5. Ticketmaster Secret — Urgent Follow-up

`apphosting.yaml` declares `TICKETMASTER_API_KEY` as a **plaintext `value:`**, not a `secret:` reference (unlike `OPENSKY_USERNAME`/`OPENSKY_PASSWORD`/`CRON_SECRET`). It is committed in version control and appears in plaintext in Cloud Build's own logs ("Final app hosting schema" dump). Not rotated or modified by this session. Recommended remediation:
1. Rotate the key in the Ticketmaster developer dashboard (this session did not do this, and does not have a safe replacement value).
2. Store the new value via `firebase apphosting:secrets:set TICKETMASTER_API_KEY`.
3. Change its `apphosting.yaml` entry from `value:` to `secret: TICKETMASTER_API_KEY`.
4. Remove `BUILD` availability for it unless the build step genuinely needs it (it appears to be used only server-side at runtime, in API routes).

## 6. Rollback Procedure

**App Hosting:** `firebase apphosting:rollouts:create lookupvegas --git-commit 1e4ea04` (the last known-good release prior to this deployment sequence, "feat: integrate live data telemetry for aviation and hotel pipelines"). ABIU is disabled, so this is always a manual, explicit action — nothing auto-rolls-forward or back.

**Cloud Functions:** N/A — `dailySnapshot`/`weeklyMovementBrief` are not deployed; there is nothing to roll back. Once LV-011 is resolved and they are deployed for the first time, rollback is `firebase deploy --only functions:dailySnapshot,functions:weeklyMovementBrief` against a prior good commit, or `firebase functions:delete dailySnapshot weeklyMovementBrief` to remove them entirely.

**Scheduler:** Scheduler jobs are managed entirely through the `onSchedule` declarations redeployed with their owning function — no separate Cloud Scheduler rollback step exists outside of redeploying the function itself.

**Environment/secrets:** `apphosting.yaml`'s `CRON_SECRET` entry and the `functions:secrets:set`/`apphosting:secrets:grantaccess` grants made this session are additive (a new env var and a new IAM grant on an existing secret) — reverting them means removing the `CRON_SECRET` entry from `apphosting.yaml` and re-deploying; the underlying Secret Manager secret itself is unaffected either way.

## 7. Unresolved Issues

1. **LV-011** (filed) — `RESEND_API_KEY` not bound as a Cloud Functions v2 secret; blocks deploying `dailySnapshot`/`weeklyMovementBrief`.
2. **`functions/package-lock.json`** Linux/Windows drift (found while investigating LV-011, folded into that ticket's scope) — would independently block a Functions deploy even after the Resend fix.
3. **`TICKETMASTER_API_KEY`** plaintext in `apphosting.yaml` (§5) — needs manual rotation; not safely automatable in this session.
4. **No production snapshot document exists yet** — the first real invocation (§3.2) has not been performed; this is the one step that specifically needs you to run it (or explicitly authorize it) rather than this agent, per your instruction.
5. **Structured-log inspection** — not done; requires either Firebase Console access (browser auth) or `gcloud` (not installed).

## 8. Pre-existing, Unrelated Findings (not fixed here)

- `npm run lint`: 2 pre-existing errors (`app/terminal/api/page.js:20` — variable used before declaration; `components/modules/VelocityChart.js:77` — component created during render) and 1 warning (`proxy-worker.js:1` — anonymous default export), unchanged since commits `053abb4`/`ec567d5`, long before this or any LV-004..010 work.
