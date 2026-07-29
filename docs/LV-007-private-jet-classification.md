# LV-007 — Private-Jet Classification Unification

**Status:** Complete. Resolves LV-004 Finding F3. Scope: classification logic only — no CVI formula, weight, or field-name change.

## 1. The Prior Duplication

Two independent implementations decided "is this aircraft a private jet":

- **`lib/flightUtils.js`'s `classifyAircraft(type, callsign)`** — used by the live aviation dashboard (`/api/aviation/snapshot`, `/api/flights/arrivals`, `/api/intelligence/demand`, `/api/radar`). Checks a 20-entry ICAO business-jet type allowlist first, then airline/cargo callsign-prefix exclusions, then an ICAO commercial-type-prefix exclusion, and only then falls back to an N-number callsign pattern.
- **An inline heuristic in `app/api/cron/snapshot/route.js`**, used only for the archived CVI's private-jet component — a single rule (`callsign.startsWith('N') && length <= 6`), with no type awareness at all, and no case normalization on the callsign.

## 2. Behavioral Comparison (11 classification fixtures + 1 safety fixture)

| Fixture | Old (cron) | Authoritative | Disagree | Why |
|---|---|---|---|---|
| Business jet, N callsign (`C56X`/`N123AB`) | Private | Private | No | |
| Airline flight (`B738`/`SWA1234`) | Not private | Commercial | No | |
| Cargo flight (`B763`/`FDX1234`) | Not private | Cargo | No | |
| Military, no callsign (`C130`/``) | Not private | Other | No | |
| Helicopter, N-registered (`EC35`/`N911MD`) | Private | Private | No | Shared, pre-existing limitation — not introduced or fixed here |
| GA piston, N-registered (`C172`/`N738DK`) | Private | Private | No | Same limitation as above |
| Business jet, **no callsign** (`GLF5`/``) | Not private | **Private** | **Yes** | Old heuristic never read aircraft type at all |
| Airline callsign, missing type (`null`/`JBU2001`) | Not private | Commercial | No | |
| **Lowercase/padded** business jet (`c56x`/`  n456cd  `) | Not private | **Private** | **Yes** | Old heuristic never uppercased the callsign — a real case-sensitivity bug |
| Misleading N-callsign on a **regional jet** (`CRJ2`/`N123CR`) | **Private (false positive)** | **Commercial** | **Yes** | Type-based commercial exclusion correctly overrides the N-number fallback |
| Business jet, non-N callsign (`GLF6`/`EXEC42`) | Not private | **Private** | **Yes** | Same root cause as the no-callsign case |
| Malformed (`{}`/`{}`) | Threw an exception | `Other`, no throw | N/A | Both implementations were unguarded against non-string input; hardened here for both |

**4 of 11 classification fixtures disagree** (reproduced and asserted by an automated test, not just hand analysis — see `lib/flightUtils.test.js`'s "LV-007 disagreement quantification" suite). No systematic directional bias: 3 patterns were true positives the old heuristic missed, 1 was a false positive it wrongly counted.

## 3. Consumer Inventory

`classifyAircraft` is called from **four** places, none of which are modified: `/api/aviation/snapshot`, `/api/flights/arrivals`, `/api/intelligence/demand`, `/api/radar`. All four consume the string return value the same way (`=== 'Private'`/`'Commercial'`/etc.) and are unaffected — the only behavioral change is hardened non-string input handling, which is identical to the prior behavior for every string/null/undefined input that has ever actually occurred. `app/api/cron/snapshot/route.js` is the only consumer whose classification results change, because it previously used a different (and materially cruder) implementation.

## 4. The Authoritative Classifier

```js
export function isPrivateJet(type, callsign) {
  return classifyAircraft(type, callsign) === 'Private';
}
```

A thin boolean wrapper, not a second implementation — `classifyAircraft` remains the single place aircraft evidence becomes a classification decision.

**Input fields:** ICAO type designator (`t` in raw ADSB.lol records) and flight callsign (`flight`).

**Evidence order:** (1) ICAO type against a business-jet allowlist (Gulfstream, Citation, Challenger, Falcon, Learjet, Beechjet, Hawker, HondaJet/Phenom families) — decisive regardless of callsign; (2) callsign prefix against ~20 known commercial airlines; (3) callsign prefix against 4 known cargo carriers; (4) ICAO type prefix (`B7`/`A3`/`E7`/`CRJ`) as a commercial-type exclusion; (5) callsign N-number pattern (starts with `N`, length ≤6) as a last resort, explicitly excluded when the type already indicated commercial.

**Normalization:** both fields are coerced to a real string (non-strings become `''`, not passed through), then uppercased and trimmed, before any comparison.

**Malformed-data behavior (hardened in this ticket):** a non-string truthy `type`/`callsign` (an object, a number) previously threw inside `.toUpperCase()`, crashing the entire aircraft-processing loop for both pipelines. Both arguments are now type-checked before coercion; any non-string value is treated as absent, and the function always returns a value, never throws.

## 5. Effect on Archive Consistency

The cron route no longer computes a private-jet count that could disagree with what the live dashboard would show for the identical aircraft. The descending-aircraft filter, the private/total ratio, the `/0.08` baseline normalization, and the `×50` / `min(100, …)` normalization are **byte-for-byte unchanged** — only which boolean feeds the numerator changed. `lib/flightUtils.js` now also exposes a `total evaluated / private count` structured log line per run (no per-aircraft logging, no raw payloads), giving future audits a direct signal for how much of a given day's `private_jet_count` came from type-based vs. callsign-based evidence.

## 6. Versioning Decision

Per LV-004's established contract, `cvi_version` tracks the **weighting formula** and `schema_version` tracks the **document shape** — neither changed here (the classification logic feeds one existing input; the formula, weights, and persisted fields are identical). Bumping either would misrepresent what actually changed and would make historical version comparisons misleading.

**This surfaces a real gap, not covered by this ticket:** there is currently no version field tracking "how an input was computed" as distinct from "what the formula does with it." A classifier or heuristic change to any input (private-jet detection, weather scoring, etc.) has no place to be recorded today. **Recommended follow-up (not implemented here): a `classifier_version` field**, bumped only when input-computation logic changes, orthogonal to both existing version fields. Filed as a candidate for a future ticket, not created speculatively here.

## 7. Historical Document Policy

No historical `daily_metrics` documents are migrated, rewritten, or reprocessed. Every existing record's `private_jet_count`/`private_jet_index_normalized` reflects whichever classifier was in effect when it was written — pre-LV-007 records used the cruder heuristic; every record from this point forward uses the unified classifier. This is a forward-only behavior change, consistent with LV-004's and LV-006's policy of never migrating archived data.

## 8. Remaining Limitations (not addressed by this ticket)

- **Rotorcraft and small GA piston aircraft with N-number registrations are still classified `'Private'`** by the authoritative classifier (fixtures 5 and 6 above) — a pre-existing limitation inherited from `classifyAircraft`, not introduced or corrected here. The "private jet" metric is really measuring "N-registered general aviation traffic" as a proxy, not strictly business jets.
- **The cron route independently re-fetches raw ADSB.lol data** rather than reusing `/api/aviation/snapshot`'s already-computed classification — a separate architectural duplication (of the *fetch*, not the *classification logic*, which this ticket resolved), out of scope here. Candidate for a future ticket.
- No new persisted field or version was added to record which classifier generation produced a given historical value (see §6).
