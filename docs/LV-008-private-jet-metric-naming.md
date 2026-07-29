# LV-008 — Private-Jet Metric Naming (Compatibility Migration)

**Status:** Complete. Resolves LV-004 Finding F5 as a compatibility deprecation, not a breaking rename. Scope: naming and dual-write compatibility only — no classification, ratio, normalization, or CVI-formula change.

## 1. Why `private_jet_count` Is Inaccurate

It has never stored a literal count of private jets. Its value is `(privateAircraft ÷ totalDescendingAircraft) ÷ 0.08` — a baseline-relative index of private-jet *share* among descending traffic, not a quantity of aircraft. It can be `0`, and it can exceed `1` (a 16% private share yields `2.0`). Presenting it as a "count" misleads any future analytics, API consumer, dashboard label, or documentation that takes the field name at face value.

## 2. Exact Mathematical Semantics

Raw ADSB.lol `.ac[]` → descending-aircraft filter (`alt_baro<20000 && baro_rate<-200`, unchanged) → classified via `isPrivateJet` (LV-007, unchanged) into `privCount`/`commCount` → `total = privCount+commCount` → **`(privCount/total)/0.08`**. This is the value now persisted under both field names. It is then separately normalized (`min(100, ×50)`) into `private_jet_index_normalized`, which is what actually feeds the CVI's `×0.10` term — a distinct value, computed from this one, but never confused with it.

## 3. Naming Candidates Considered

| Candidate | Reflects share? | Reflects `/0.08` baseline? | Avoids implying [0,1] bound? | Reads as index, not raw ratio? | Verdict |
|---|---|---|---|---|---|
| `private_jet_ratio` | Yes | No | **No** | No | Rejected — actively misleading about bounds and omits the baseline entirely |
| `private_jet_intensity` | No | Weak | Yes | No | Rejected — too vague to document precisely |
| `private_jet_activity_index` | Weak (implied) | Yes | Yes | Yes | **Selected** |
| `private_jet_share_index` | Yes | Yes | Yes | Yes | Close second; not selected only because the ticket's own worked example already anchors on `activity_index`, and both satisfy every required property equally |

## 4. Selected Canonical Name: `private_jet_activity_index`

Chosen because it satisfies every required property: does not imply a literal count, is clearly distinct from `private_jet_index_normalized` (a different, already-accurately-named value), documents the `/0.08` baseline implicitly through "index" framing (an index is baseline-relative by convention, like a price index), and does not promise a bounded `[0,1]` range the way "ratio" would.

## 5. Writer Inventory

The only writer of either field is `app/api/cron/snapshot/route.js`. As of this ticket, it writes:

```js
private_jet_activity_index: privateJetActivityIndex,  // canonical
private_jet_count: privateJetActivityIndex,            // deprecated compatibility alias, numerically identical
private_jet_index_normalized: privateJetIndex_normalized, // unchanged, unrelated to this rename
```

No other route persists to `daily_metrics`.

## 6. Reader Inventory

| Reader | Reads Firestore? | Renders UI? | Validates arithmetic? | Exports data? | Assumed literal count? | Compatibility behavior required |
|---|---|---|---|---|---|---|
| `lib/archiveValidation.js` (schema/range checks) | No (pure functions on passed-in data) | No | Yes | No | No | Updated: accepts either field, flags disagreement (§8) |
| `scripts/validate-archive.mjs` | Yes | No (console output) | Via the above | No | No | Updated: prefers canonical via `readPrivateJetActivityIndex`, reports migration progress |
| `/api/cron/snapshot/status` | Yes | No | No | Yes (JSON) | No | Reviewed — does not reference either field at all; no change needed |
| `functions/index.js` (`weeklyMovementBrief`) | Yes | No (email) | No | No | No | Reviewed — reads only `city_velocity_index`/`hotel_compression_score`; confirmed untouched |

No consumer outside this repository is known, and none was found requiring the legacy field's removal.

## 7. Historical-Document Compatibility

| Document state | Reader behavior |
|---|---|
| Legacy — only `private_jet_count` | `readPrivateJetActivityIndex` falls back to it, `source: 'legacy'` |
| New — both fields present, equal | Uses canonical, `source: 'canonical'` |
| Malformed — both present, disagree beyond tolerance (default `0.05`) | Reported as `ok: false, reason: 'disagreement'` — never silently resolved |
| Neither field present | Reported as `ok: false, reason: 'missing'` |

## 8. The Canonical Reader Contract

```js
readPrivateJetActivityIndex(doc, tolerance = 0.05)
```

Priority: (1) canonical field if finite and valid; (2) legacy field if the canonical is absent/malformed; (3) if both are valid but disagree beyond tolerance, report the disagreement rather than silently choosing; (4) if neither is valid, report `missing`. Pure, dependency-free, directly testable (`lib/archiveValidation.test.js`). `validateDocumentSchema` calls it internally so a disagreement surfaces as a schema-drift finding through `auditArchive` without duplicating the check.

## 9. Schema-Version Decision

**Bumped from `v2` to `v3`.** Per the precedent LV-004 itself established — `schema_version` tracks the document *shape*, and a new persisted field is exactly the class of change that justified `v2` in the first place — introducing `private_jet_activity_index` is the same class of change. `cvi_version` remains `v1`, unchanged: the weighting formula and every input's computation are untouched. `SCHEMA_VERSION` is now exported once from `lib/archiveValidation.js` and imported by the cron route, rather than being defined independently in both places — a small consolidation made while already touching both files for this reason, reducing exactly the kind of two-sources-of-truth risk this ticket is about.

## 10. Deprecation Policy

`private_jet_count` is marked deprecated in code (`app/api/cron/snapshot/route.js`) with an inline comment. It is **not removed** in this ticket, remains numerically identical to `private_jet_activity_index` on every record written from here forward, and receives no runtime deprecation logging (would be noisy — one line per snapshot run, forever, for a fact already documented once here).

**Prerequisites before `private_jet_count` could ever be removed** (not scheduled, not implemented — a future decision):
1. Confirm no external consumer depends on it (none is currently known, but that is not the same as verified).
2. A majority of the archive's retention window should carry the canonical field (mixed archives are expected and permanently supported otherwise — see LV-004/LV-006's no-migration policy).
3. A separate, deliberate ticket — a field removal is exactly the kind of schema-breaking change this ticket was designed to avoid doing incidentally.

## 11. Remaining Risks

- No historical documents were rewritten (by design), so the archive will contain a long-lived mix of `v1-legacy`/`v2` (legacy-only) and `v3` (dual-written) records. This is expected and validated for, not a defect.
- `readPrivateJetActivityIndex`'s `0.05` disagreement tolerance is a starting default, not empirically tuned against real production data (none exists yet with both fields present to diverge).
