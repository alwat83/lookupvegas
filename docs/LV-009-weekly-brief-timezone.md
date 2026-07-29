# LV-009 — Weekly Movement Brief Timezone Alignment

**Status:** Complete. Resolves LV-004 Finding F6. Scope: scheduling and date interpretation only — no CVI, schema, classifier, recipient, or report-content change.

## 1. The Previous Risk

`weeklyMovementBrief` was declared as `onSchedule("every monday 08:00", handler)` — the plain-string form. Confirmed empirically against the installed `firebase-functions` v6.6.0 source (`node_modules/firebase-functions/lib/v2/providers/scheduler.js`): when `onSchedule` receives a string, `getOpts()` returns `{ schedule: args, opts: {} }`, and `timeZone` is never present on `separatedOpts`, so `copyIfPresent(ep.scheduleTrigger, separatedOpts, "timeZone")` never sets it on the deployed endpoint. With no `timeZone` configured, Google Cloud Scheduler's own documented default (`Etc/UTC`) applies. The function was therefore executing at **08:00 UTC every Monday** — **00:00 Pacific Standard Time** or **01:00 Pacific Daylight Time** — not the Monday-morning Las Vegas business report the schedule string evidently intended (8am is a sensible time to receive a weekly business email; midnight-to-1am is not a plausible deliberate choice).

The report's own Firestore query (`orderBy("date","desc").limit(7)`), by contrast, had **no timezone bug** — it already read the correct, pre-computed Las Vegas business-date string field written by the daily snapshot pipeline. The defect was entirely in the scheduler declaration and the *implicitness* of the reporting window, not in any `new Date()`/UTC date-math inside the function.

## 2. Authoritative Timezone

`America/Los_Angeles`, the same IANA zone the daily snapshot pipeline (`app/api/cron/snapshot/route.js`) already uses — defined as `BUSINESS_TIMEZONE` at the top of `functions/index.js`.

## 3. Scheduler Declaration

```js
exports.weeklyMovementBrief = onSchedule(
    { schedule: "every monday 08:00", timeZone: "America/Los_Angeles" },
    async () => { await runWeeklyMovementBrief(db, resend); }
);
```

The schedule expression itself — `"every monday 08:00"` — is **unchanged**, per the requirement not to alter cadence to manually compensate for UTC. Only the timezone it's interpreted in is now explicit. This changes the *effective UTC instant* the function fires at, while preserving the *intended* local day and clock time:

| | Before (UTC default) | After (explicit `America/Los_Angeles`) |
|---|---|---|
| Winter (PST, UTC-8) | Executes 08:00 UTC = Monday 00:00 Pacific | Executes Monday 08:00 Pacific = 16:00 UTC |
| Summer (PDT, UTC-7) | Executes 08:00 UTC = Monday 01:00 Pacific | Executes Monday 08:00 Pacific = 15:00 UTC |

## 4. Reporting-Window Convention

**Week-start convention preserved, made explicit.** The prior implicit behavior — "the 7 most recently written documents, ordered descending" — is now an explicit, auditable range: `weeklyBusinessDateRange(referenceInstant, "America/Los_Angeles")` returns `{ start, end }` where `end` is the Las Vegas business date *of the moment the function runs* and `start` is 6 calendar days before it — a 7-day, **inclusive** window matching the report's own "past 7 days" copy. In the gap-free case this selects the identical 7 documents as before. **One deliberate behavior difference:** if the archive has a gap, the new range query correctly reflects fewer than 7 real business days, rather than silently reaching back past a full calendar week to pad the count to 7 the way `.limit(7)` alone would have. This is judged a correction, not a regression — Requirement 2 of this ticket explicitly calls for defined, explicit boundaries rather than an implicit "however many documents happen to exist."

## 5. Query Method

```js
dbClient.collection("daily_metrics")
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "desc")
    .limit(7)
    .get();
```

A range filter on the existing `date` string field, combined with `orderBy` on that same field — Firestore's automatic single-field index covers this natively (the same pattern already used by the daily snapshot's own rolling-window query; no composite index is required). `.limit(7)` remains as a defensive cap; the `where()` range is what actually defines the window now, not an implicit trust that "the last 7 documents" are the right 7.

## 6. Shared Helper

`functions/businessDate.js` (new) — `businessDateString`, `addDays`, `weeklyBusinessDateRange`. This is a deliberate, narrowly-scoped duplicate of the single-day math already tested in `lib/businessDate.js`, **not an import** — Firebase Functions deploys only the `functions/` directory's own contents, with no runtime access to `../lib/`, the same constraint that produced `functions/structuredLog.js` in LV-004. `weeklyBusinessDateRange` itself is new; no equivalent exists in `lib/businessDate.js` to duplicate from.

## 7. DST and Boundary Examples

| Reference instant | Las Vegas business date | Reporting window |
|---|---|---|
| `2026-07-20T15:00:00Z` (ordinary Monday, PDT) | `2026-07-20` | `2026-07-14` to `2026-07-20` |
| `2026-03-09T15:00:00Z` (first Monday after spring-forward) | `2026-03-09` | `2026-03-03` to `2026-03-09` |
| `2026-11-02T16:00:00Z` (first Monday after fall-back) | `2026-11-02` | `2026-10-27` to `2026-11-02` |
| `2026-07-20T05:00:00Z` (UTC already Monday; Vegas still Sunday) | `2026-07-19` | `2026-07-13` to `2026-07-19` |
| `2028-03-06T15:00:00Z` (spans leap day) | `2028-03-06` | `2028-02-29` to `2028-03-06` |

## 8. Logging

`weeklyMovementBrief` now uses the existing `logEvent` structured-logging helper (already used by `dailySnapshot`; not modified by this ticket) instead of plain `console.log`/`console.error`. Each run logs a start event (execution instant, business date, reporting window) and a terminal event (`weeklyBrief_complete` / `weeklyBrief_no_data` / `weeklyBrief_no_recipients` / `weeklyBrief_failed`) carrying the document count and success/failure status. Recipient **count** is logged; recipient email addresses and report HTML content are never logged, verified by an explicit test.

## 9. Deployment and Verification

**Deploy:** `firebase deploy --only functions:weeklyMovementBrief` (or `--only functions` for both scheduled functions together).

**Post-deploy verification steps** (not performed as part of this ticket — no deployment occurred; this is the checklist for whoever deploys it):
1. `firebase functions:list` or the GCP Console → Cloud Scheduler — confirm the job's configured schedule reads `every monday 08:00` and timezone reads `America/Los_Angeles`.
2. Confirm the next scheduled execution shown in the Cloud Scheduler console converts to `16:00 UTC` (PST) or `15:00 UTC` (PDT) on the upcoming Monday.
3. After the first live run, check Cloud Logging for the `weeklyBrief_started` entry's reporting window and confirm it matches the intended 7-day Las Vegas range.
4. Confirm the `weeklyBrief_complete` entry's document count matches the actual number of `daily_metrics` records in that window.
5. Confirm a report was actually received (or `weeklyBrief_no_recipients`/`weeklyBrief_no_data` logged, if applicable).

**No production verification is claimed here** — this ticket's changes have not been deployed.

## 10. Rollback Procedure

`git revert` this commit and redeploy `functions`. This restores the plain-string `onSchedule("every monday 08:00", ...)` form and the implicit `.limit(7)` query — i.e., reverts to the UTC-default execution time, not recommended except as an emergency measure, since it restores the exact inconsistency this ticket exists to fix. No data migration is needed either direction — no Firestore schema changed.

## 11. Remaining Risks

- The reporting window's exact 7-day boundary has not been exercised against a real, imperfect production archive (one with an actual gap) — the gap-handling behavior change (§4) is tested against fixtures, not live data.
- No production deployment or live verification has occurred as part of this ticket (see §9).
