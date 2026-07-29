# LV-011 — Bind RESEND_API_KEY as a Cloud Functions v2 Secret

**Status:** Not started. Filed as a follow-up from LV-010 (Production Deployment and End-to-End Snapshot Verification) — discovered while preparing to deploy `dailySnapshot` and `weeklyMovementBrief`, out of scope for that ticket because it requires a code change.

## 1. The Defect

`functions/index.js:18` reads the Resend API key as a bare environment variable:

```js
const resend = new Resend(process.env.RESEND_API_KEY);
```

This executes at **module scope**, so it runs once on cold start for *any* function exported from this file — both `dailySnapshot` and `weeklyMovementBrief` share it.

Cloud Functions v2 does not ambiently expose Secret Manager secrets as `process.env` entries. A secret must be explicitly declared with `defineSecret(...)` and included in the deploying function's `secrets: [...]` option — exactly the pattern already used correctly for `CRON_SECRET`:

```js
const CRON_SECRET = defineSecret("CRON_SECRET");
// ...
exports.dailySnapshot = onSchedule(
    { /* ... */ secrets: [CRON_SECRET] },
    async () => { await runDailySnapshot(CRON_SECRET.value(), ...); }
);
```

`RESEND_API_KEY` has no equivalent `defineSecret` call and is not listed in either function's `secrets` array. Creating the secret's value in Secret Manager (done earlier via `firebase functions:secrets:set RESEND_API_KEY`) does **not** fix this — the value exists in Secret Manager but is never mounted into the function's runtime environment.

## 2. Confirmed Impact

Verified locally (no deployment performed):

```
$ node -e "require('./functions/index.js')"
Error: Missing API key. Pass it to the constructor `new Resend("re_123")`
    at Object.<anonymous> (functions/index.js:18:16)
```

The `Resend` SDK constructor throws synchronously on a missing/undefined key. Since this is module-level code, **deploying either function today would crash both on cold start**, on every invocation, including the ones triggered by `dailySnapshot`'s own schedule (which does not even use Resend — `weeklyMovementBrief` is the only one that sends email — but both live in the same file and therefore share the same crash).

## 3. Minimal Fix (not applied in this ticket)

```js
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
// remove the module-level `new Resend(...)` call entirely
```

and construct the Resend client lazily inside `runWeeklyMovementBrief` (or wherever it's actually used), using `RESEND_API_KEY.value()`, with `secrets: [RESEND_API_KEY]` added to `weeklyMovementBrief`'s `onSchedule` options. `dailySnapshot` does not need this secret at all and should not declare it.

This requires re-reading `functions/index.js` in full to confirm there's no other use of the module-level `resend` binding before making the change, and updating `functions/index.test.js` accordingly.

## 4. Separate, Independent Finding: functions/ Lockfile Drift

While investigating this, `functions/package-lock.json` was found to independently fail a cold `npm ci` on a real Linux runner (ubuntu-22.04, Node 22.23.1) — the same class of Windows/Linux npm hoisting divergence fixed for the root `package-lock.json` in commit `dcace73`, but never addressed for the `functions/` subproject. This was not diagnosed in detail (out of scope for the LV-010 investigation that found it) but should be checked and likely fixed the same way (regenerate `functions/package-lock.json` on Linux, e.g. via the same disposable-GitHub-Actions-workflow technique) as part of this ticket, since a Functions deploy builds on Linux and could fail here independently of the Resend fix above.

## 5. Suggested Scope for This Ticket

1. Bind `RESEND_API_KEY` correctly per §3.
2. Regenerate `functions/package-lock.json` on Linux per §4 and confirm a cold `npm ci` passes there.
3. Verify locally: `node -e "require('./functions/index.js')"` no longer throws (with a placeholder/test value), `npm --prefix functions ci` passes on both Windows and Linux, existing `functions/index.test.js` / `functions/businessDate.test.js` still pass via the root `vitest run`.
4. Deploy `dailySnapshot` and `weeklyMovementBrief` (targeted deploy only, per LV-010's established pattern: `firebase deploy --only functions:dailySnapshot,functions:weeklyMovementBrief`).
5. Complete the Scheduler and weekly-brief verification steps LV-010 deferred (deployed schedule/timezone confirmation, first live run check).

## 6. Not In Scope for This Ticket

No changes to CVI calculation, classification logic, fallback behavior, or snapshot cadence. No changes to the daily snapshot HTTP route (`app/api/cron/snapshot`) — that path is already verified working in production independent of this defect.
