# LV-006 — Legitimate Zero Contract

**Status:** Complete. Resolves LV-004 Finding F2. Scope: value-selection correctness only — no CVI formula, weight, threshold, classifier, or persisted-field-name change.

## 1. The Governing Test

A `value || fallback` expression only corrupts data when `fallback` could differ from a legitimate zero for that field. Every `||`-style numeric selection across `app/api/cron/snapshot/route.js`, `app/api/aviation/snapshot/route.js`, `app/api/hotels/route.js`, and `lib/flightUtils.js` was reviewed against this test (full inventory in the LV-006 ticket record). Only two failed it — both explicitly named in the ticket — and both are fixed here. Everything else either can't legitimately be zero (hotels' `compressionScore`, mathematically bounded ≥40 by its own formula) or already has a fallback that equals the legitimate zero (weather readings, per-aircraft altitude/rate — `0 || 0` and `undefined || 0` produce the same result, so no corruption is possible regardless of style). Those were deliberately left unchanged rather than mechanically rewritten.

## 2. The Numeric Selection Contract

`lib/numericSelection.js` exports `selectFiniteNumber(value, fallback, { allowNegative = false })`:

| Input | Result |
|---|---|
| `0` | `0` |
| positive finite number | itself |
| negative finite number | `fallback`, unless `allowNegative: true` |
| `null`, `undefined`, missing property | `fallback` |
| `NaN`, `Infinity`, `-Infinity` | `fallback` |
| numeric string, empty string | `fallback` (rejected, not parsed) |
| object, array, boolean | `fallback` |

**Numeric strings are rejected, not parsed** — a deliberate decision, not an oversight. Firestore preserves the JS number type a field was originally written with, and `Array.length` is never a string by language definition, so neither of this ticket's two use sites legitimately produces a string. Silently parsing one would mask a real upstream contract violation instead of surfacing it.

## 3. Which Fields Allow Zero, and When the Existing Default Applies

| Field | Zero legitimate? | Existing default (unchanged) | When it applies now |
|---|---|---|---|
| `flight_arrivals_total` (archived, read for the rolling window) | Yes — a genuine zero-arrivals day | `450` | Only on missing/null/`NaN`/`Infinity`/negative/wrong-type — **not** on a stored `0` |
| OpenSky arrival count | Yes — a genuinely empty 24h window | The prior aviation-derived `totalArrivals` value | Only when the response is not a real array (network failure, non-2xx, or a malformed/non-array body) — **not** on a real empty array |

No other field's selection logic changed. `hotel_compression_score`/`event_impact_score` (via `hData.data.compressionScore || 50.0`) were reviewed and left as-is: the hotels endpoint's own formula (base 40, only ever adds, clamped to 100) makes `0` mathematically unreachable in either its success or fallback path, so this expression has no legitimate zero to lose.

## 4. OpenSky: Empty Result vs. Failure

These were previously indistinguishable — both silently kept the prior value, and both were marked `sourceFreshness.openSky: 'ok'` regardless of which had actually occurred. Now:

- **Empty result** — HTTP 200, body is a real JSON array, `.length === 0`. This **explicitly overrides** `totalArrivals` to `0`. `sourceFreshness.openSky: 'ok'`, run status unaffected (a valid zero is not itself degradation).
- **Failure** — network rejection, non-2xx response, or a 200 response whose body is *not* an array (missing entirely, an object, a string, `null`). The **prior** `totalArrivals` value (from the aviation-derived calculation) is preserved untouched. `sourceFreshness.openSky: 'fallback'`, `error_summary` gains an OpenSky-specific entry, and the run status becomes `'partial'`.

## 5. Historical Records Are Not Migrated

This ticket changes **value selection at read time** — how a currently-running snapshot job interprets an archived document's `flight_arrivals_total` when building the rolling window. It does not rewrite, backfill, or migrate any existing `daily_metrics` document. A pre-LV-006 document whose `flight_arrivals_total` was previously written *because of* the bug (i.e., a day that was actually zero but got stored as some other value through an unrelated path, if one exists) is unaffected by this change — this ticket cannot retroactively know what should have been stored; it only ensures **future reads** of any archived `0` are trusted rather than discarded. Both `schema_version: 'v1-legacy'` and `'v2'` records are read identically by this fix — the fallback logic considered here operates on the single field `flight_arrivals_total`, present in every schema generation.

## 6. Operational Meaning of a Zero-Arrival Snapshot

A persisted record with `flight_arrivals_total: 0` and `source_freshness.openSky: 'ok'` (or `aviation: 'ok'`) means the pipeline observed and trusted a genuinely quiet arrivals window — not that data was missing. This is now a normal, valid archive state, not an error condition. It will pull `flightScore` toward the low end of the rolling window's distribution (correctly, since it's a real low-activity signal) rather than being silently overwritten with a mid-range default that would have masked the very signal the archive exists to capture.
