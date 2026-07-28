# LV-005 — Aviation Source Health Contract

**Status:** Complete. Resolves LV-004 Finding F1. Scope: making an aviation-data failure observable and correctly propagated — no CVI formula, weight, private-jet classifier, or schema-field-rename changes.

## 1. The Contract

`GET /api/aviation/snapshot` now returns three additive top-level fields alongside its existing, unchanged response shape:

```js
{
  // ...existing fields: timestamp, dataSource, refreshRate, currentSnapshot,
  //    weather, stakeholderInsights, dataProvenance — all unchanged...
  source: "live" | "fallback",
  status: "success" | "partial",
  error_summary: string[]  // empty on a clean run
}
```

No existing field was removed, renamed, or restructured. All eight consumers of this endpoint (`AviationPulse`, `StakeholderCards`, `Hero`, `LiveSnapshot`, `ArrivalsDashboard`, `AirspaceRadar`, `TrustMetrics`, and the cron snapshot route) were audited before this change — none read a field named `source`, `status`, or `error` at the top level, so this is unambiguously additive.

## 2. Legitimate Zero vs. Fallback Zero

Before this ticket, both looked identical: `data.ac || []` treated a missing/malformed `.ac` field and a genuinely empty array the same way — zero counts, no signal either way.

Now:
- **Legitimate zero** — ADSB.lol responds `200` with `{ac: []}` (a real, empty aircraft list). `source: 'live'`, `status: 'success'`, counts are genuinely `0`. This is real data, not degradation.
- **Fallback zero** — any of: a network-level fetch failure, ADSB.lol responding non-2xx, a response body that fails `JSON.parse`, or a response body where `.ac` is present but not an array. All of these produce `source: 'fallback'`, `status: 'partial'`, and a specific entry in `error_summary` describing which failure occurred. Counts still default to `0`, but the contract makes clear those zeros are not a real reading.
- **Defense in depth:** every computed output field (`inboundFlights`, `outboundFlights`, `estimatedArrivingPax`, `estimatedDepartingPax`, `estimatedDailyPax`, `privateJetIndex`, `arrivalRatePerHour`) is checked for being a finite number before the response is built; a non-finite value — however it arose — also flips the record to `fallback`/`partial`. Every division in `lib/flightUtils.js` already guards its own zero case, so this cannot currently be triggered through the live route; it's a safety net against a future regression there, not a condition demonstrable today. `findNonFiniteFields()` is exported and unit-tested directly for exactly this reason.

## 3. Propagation Through the Cron Route

`app/api/cron/snapshot/route.js` previously trusted `avRes.ok` (the HTTP status) alone. It now additionally requires `avData.source === 'live' && avData.status === 'success'` before recording `sourceFreshness.aviation = 'ok'`. Anything else — `'fallback'`, an unrecognized value, or the fields being absent entirely — is treated as fallback. This fails closed deliberately: an aviation response that doesn't explicitly assert health is never assumed healthy.

When aviation is degraded:
- `sourceFreshness.aviation = 'fallback'`
- The overall snapshot `status` becomes `'partial'` (via the existing `anyFallback` check — no new status-derivation logic was added)
- `error_summary` gains an entry prefixed `aviation snapshot degraded: ...`, built from the aviation endpoint's own `error_summary` when present
- The CVI calculation itself is untouched: aviation only ever contributes `flight_arrivals_total` as a number, and that number flows into the same formula regardless of the health label attached to it — verified directly by a regression test that runs the same numeric input through both a healthy and a degraded aviation response and asserts identical `city_velocity_index`, `flight_score`, and `flight_arrivals_total`.

## 4. Expected Logs

Both routes emit structured JSON via `lib/structuredLog.js` (`console.log` with an explicit `severity` field — see LV-003/Task 4 for why that matters for Cloud Logging severity). New event names:

| Event | Where | Severity | Meaning |
|---|---|---|---|
| `aviation_source_failed` | aviation route | ERROR | ADSB.lol network failure, non-2xx, malformed JSON, missing `.ac`, or a non-finite computed field |
| `aviation_endpoint_failed` | aviation route | ERROR | The entire handler threw unexpectedly (caught by the outer try/catch) |
| `snapshot_source_failed` (source: `'aviation'`) | cron route | ERROR | The aviation endpoint reported `source !== 'live'` or `status !== 'success'` |

## 5. Troubleshooting

1. **Cron archive shows `sourceFreshness.aviation: 'fallback'` for a given day:** call `/api/aviation/snapshot` directly and check its `error_summary` — it names the exact failure category (network, HTTP status, parse failure, missing field, or a specific non-finite field name).
2. **Aviation endpoint itself returns `source: 'fallback'`:** check for an `aviation_source_failed` log entry at the same timestamp — the `error` field there is a sanitized (never a stack trace or raw payload) one-line reason.
3. **Suspect the health signal isn't propagating:** the cron route's check is intentionally strict (`source === 'live' && status === 'success'`, nothing else). If the aviation endpoint's contract is ever extended, any new value must be explicitly added to that check — it does not default to trusting new/unknown values.
