# LV-004 — Historical Archive Validation & CVI Integrity

**Status:** Complete. **Scope:** data integrity only — no CVI redesign, no formula change, no new datasets, no UI/pricing changes. Every claim below is sourced from the code as it exists in this commit; nothing here is aspirational.

## 1. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph External APIs
        A1[ADSB.lol -- live aircraft]
        A2[OpenSky -- 24h arrival count]
        A3["/api/aviation/snapshot (this app)"]
        A4["/api/hotels (this app)"]
        A5[Open-Meteo -- weather]
    end

    subgraph "app/api/cron/snapshot/route.js"
        B1[Fetch all five sources]
        B2[Compute flightScore, demandMomentum\nvia 30-day rolling window]
        B3[Compute weatherScore]
        B4[Compute CVI = weighted sum]
        B5[Idempotency check\nby business date]
    end

    subgraph Firestore
        C1[(daily_metrics/{date})]
    end

    subgraph Triggers & Verification
        D1[functions/index.js\ndailySnapshot -- Cloud Scheduler,\n00:05 America/Los_Angeles]
        D2["/api/cron/snapshot/status\noperational check"]
        D3[scripts/validate-archive.mjs\nfull-archive audit]
    end

    D1 -->|authenticated HTTPS call| B5
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B3
    B1 --> B2
    B2 --> B4
    B3 --> B4
    B5 --> B1
    B4 --> C1
    C1 --> D2
    C1 --> D3
```

## 2. Data Lineage — Every Persisted Field

| Field | Origin | Transformation |
|---|---|---|
| `date` | Request (`?date=`) or `businessDateString()` | Formatted in `America/Los_Angeles`, explicitly (not UTC) |
| `flight_arrivals_total` | `/api/aviation/snapshot` (`inboundFlights × 24`), overridden by OpenSky's 24h arrival count if that succeeds | Raw count, no scoring |
| `flight_score` | Derived from `flight_arrivals_total` + the prior 30 days' `flight_arrivals_total` values | Z-score of today's arrivals vs. the rolling mean/stddev, mapped to 0–100. **Added in this ticket** — previously computed but never persisted |
| `demand_momentum` | Same rolling 30-day window | % change of the trailing-7-day average vs. the prior-7-day average, mapped to 0–100 |
| `hotel_compression_score` / `event_impact_score` | `/api/hotels` (`compressionScore`) | **Identical value stored under two field names** — see Finding F4 |
| `weather_score` | Open-Meteo (temp/wind/precipitation) | Penalty-based deduction from 100. **Added in this ticket** — previously computed but never persisted |
| `private_jet_count` | Raw ADSB.lol fetch (independent of `/api/aviation/snapshot`) | `(private aircraft ÷ total descending aircraft) ÷ 0.08` — a ratio, **not a count** despite the field name; see Finding F5 |
| `private_jet_index_normalized` | `private_jet_count` | `min(100, private_jet_count × 50)` — the actual CVI input. **Added in this ticket** |
| `city_velocity_index` | The five fields above | `flight_score×0.35 + demand_momentum×0.25 + event_impact_score×0.20 + weather_score×0.10 + private_jet_index_normalized×0.10` — **unchanged by this ticket** |
| `cvi_version` | Constant `'v1'` | Tracks the *formula*. Unchanged here. |
| `schema_version` | Constant `'v2'` (new) | Tracks the *document shape*, deliberately separate from `cvi_version` — a document's fields can change without the calculation changing, and vice versa |
| `source_freshness` | Per-source try/catch outcome | `'ok'` or `'fallback'` per source |
| `status` | Derived | `'success'` (all sources ok), `'partial'` (≥1 fallback), or `'failed'` (write itself failed) |
| `error_summary` | Accumulated per-source error messages | Array, empty on a clean run |
| `execution_duration_ms` | `Date.now()` at start/end of the route | Added in LV-003 (Task 4) |
| `backfilled` | `requestedDate !== todayDate` | **New in this ticket** — see §5 |
| `timestamp` | `new Date().toISOString()` | When this run executed — not when the labeled business date occurred |

## 3. CVI Reproducibility — the Honest Answer

The ticket asks: *"A snapshot generated today for a historical date should produce the same CVI. If not, explain why."* It will not, and this has two genuinely different causes that must not be conflated:

**a) Arithmetic reproducibility — now YES, for any document written from this commit forward.** `lib/archiveValidation.js`'s `verifyCviArithmetic()` recomputes the weighted sum from a document's own five persisted component fields and compares it to the stored `city_velocity_index`. Before this ticket, this check was *impossible*: `flight_score` and `weather_score` were computed in memory and discarded, never written to Firestore. Two of the formula's five terms were unrecoverable from the archive. That gap is closed by persisting them (§2) — no formula changed, only what was already being computed is now written down.

**b) Input/historical reproducibility — NO, and this is a permanent limitation, not a bug.** Every upstream source (ADSB.lol, OpenSky, Open-Meteo, the aviation/hotels sub-routes) serves *current* conditions only. There is no way to ask any of them "what were conditions on 2026-03-01." Re-running the pipeline for a past date, as the new `?date=` parameter allows, computes the CVI from **today's live conditions, labeled with a historical date** — it does not and cannot reconstruct what actually happened that day. This is why backfilled records carry `backfilled: true` and why the arithmetic check is the only reproducibility guarantee this system can honestly offer for a targeted date. A record's *arithmetic* is always reproducible once persisted; its *inputs* were only ever real at the moment they were fetched, for whichever date was current at that moment.

**Sources of non-determinism, explicitly:**
1. Live external API responses change from second to second (expected, not an integrity defect — it's what "real-time" means).
2. The 30-day rolling window used for `flight_score`/`demand_momentum` is evaluated against whatever the archive contains *at computation time* — the same target date recomputed after the archive has grown or been backfilled elsewhere can legitimately produce a different `flight_score`, because the window's membership changed, not because of a bug. This ticket makes the window date-relative (`where('date', '<', snapshotDate)`) instead of always "the most recent 30" — necessary for a backfill to be causally sane, but it does not eliminate this source of variance, since the archive's content up to that point can still change over time.
3. Floating-point arithmetic itself is **not** a source of non-determinism here: identical inputs through identical code produce bit-identical results in JS. `cvi_version` exists precisely to flag the one thing that *would* change results — the formula's code changing.

## 4. Historical Integrity & Firestore Audit

**Write semantics:** `docRef.set(record, {merge: true})`. Merge, not a bare `set`, so a retried run only touches fields the current run actually computed — no unrelated data loss on a partial retry.

**Idempotency:** by business-date document ID. A `status: 'success'` record is never recomputed on a duplicate delivery, unless `force=true` is explicitly supplied (§5). A `'failed'` or `'partial'` record, or a missing one, is always eligible for retry.

**Document IDs:** the business-date string itself (`YYYY-MM-DD`) — this is what makes "duplicate days" structurally impossible *unless* a document's internal `date` field disagrees with its own ID (a real corruption mode; `auditArchive()` checks for it explicitly).

**Indexes:** the new rolling-window query (`where('date', '<', X).orderBy('date', 'desc').limit(30)`) is a single-field range filter combined with `orderBy` on that same field — Firestore's automatic single-field indexing covers this natively. **No composite index needs to be created.**

**Retention:** none exists. There is no TTL policy, no archival/cold-storage tier, and no code path that ever deletes a `daily_metrics` document. This is appropriate given the archive *is* the product's core asset — flagging it here only so it's a documented decision, not an oversight.

**Backfill compatibility:** see §5 below — this was the one explicitly-authorized implementation in this ticket, since the answer to "can the system safely regenerate a past date" was previously **no**: there was no way to even target a date other than today.

## 5. Backfill Procedure

```
GET /api/cron/snapshot?date=YYYY-MM-DD
Authorization: Bearer <CRON_SECRET>
```

- `date` must be a real calendar date, `YYYY-MM-DD`, and cannot be in the future relative to the actual current Las Vegas business date. Malformed or future dates return `400`.
- If the target date already has a `status: 'success'` record, the request is a no-op (`already_completed`) **unless** `&force=true` is also supplied — an explicit, deliberate action, never a silent overwrite.
- The response and the persisted record both carry `backfilled: true` whenever the target date isn't today, so a backfilled record can never be mistaken for a live one.
- **What this does not do:** recover the true historical conditions for that date. It recomputes today's live external data, labeled with the requested date. Use it to fill a genuinely missing/failed day (where no real historical value ever existed to lose), not to "correct" an old record — a `'partial'` record from three weeks ago reflects what conditions genuinely looked like at the time it ran; overwriting it with today's conditions under that old label would replace real (if imperfect) history with fabricated history. Only use `force=true` with that distinction in mind.

**To regenerate yesterday:** `?date=<yesterday's date>`. **To regenerate a range:** call once per date in the range (there is deliberately no batch/range endpoint — that would be a feature, out of scope here; see follow-up tickets).

## 6. Validation Framework Reference (`lib/archiveValidation.js`)

| Function | Checks |
|---|---|
| `validateDocumentSchema(doc)` | Required fields present; `date` format; `status` enum; `error_summary` is an array; v2 documents have all three newly-added component fields (flags inconsistent schema) |
| `validateRanges(doc)` | Each CVI component within its mathematically possible [0,100] range; non-number/NaN/Infinity detection; `flight_arrivals_total` outlier ceiling (heuristic, informational only) |
| `validateSourceFreshness(doc)` | Which of the five expected sources are missing vs. stale (`'fallback'`) |
| `verifyCviArithmetic(doc, tolerance)` | Recomputes CVI from persisted components; reports `verifiable: false` (never a false pass) when required fields are absent |
| `auditArchive(docs)` | Duplicate dates, gaps in the date range (leap-day and DST-safe), document ID vs. internal date mismatches, per-document schema drift, malformed date fields |

Run against the real archive via `node scripts/validate-archive.mjs` (requires `GOOGLE_APPLICATION_CREDENTIALS`). Exits non-zero on any failing check.

## 7. Known Assumptions

- The `America/Los_Angeles` IANA zone is treated as authoritative for "the Las Vegas business day." (Las Vegas has no distinct zone; it observes Pacific time.)
- `flight_arrivals_total > 2000/day` is flagged as an outlier by heuristic, not by any authoritative source on true airport capacity.
- A document is considered `schema_version: 'v1-legacy'` if it lacks `schema_version` and lacks all three v2-only component fields — this is an inference, since no explicit version tag existed before this ticket.
- The validation framework assumes Firestore document data has already been deserialized to plain JS objects (i.e., `doc.data()` has been called) — it does not accept raw Firestore snapshot objects.

## 8. Recovery Procedure

1. Run `node scripts/validate-archive.mjs` to get a full report.
2. **Missing date, no prior attempt:** `GET /api/cron/snapshot?date=<date>` — no `force` needed, nothing to overwrite.
3. **`'failed'` or `'partial'` record:** same call — existing idempotency logic already allows recomputation without `force`.
4. **Genuine data corruption in a `'success'` record** (e.g., an `auditArchive` schema-drift or range-violation finding): confirm via `verifyCviArithmetic` whether it's an arithmetic inconsistency (real bug, needs code investigation, not just a rerun) or a stale-input problem, before deciding whether `force=true` is appropriate.
5. **ID/date mismatch found by `auditArchive`:** this indicates a document was written with an incorrect ID relative to its own data — investigate manually in the Firestore console before touching it programmatically; no code path in this repo currently writes such a document, so its presence would itself be the finding to investigate.

## 9. Findings Deliberately Not Fixed in This Ticket

Per the ticket's own rule — *"If additional work is discovered: do not implement it, create follow-up tickets"* — the following were identified but left untouched:

- **F1 — RESOLVED by LV-005.** `app/api/aviation/snapshot/route.js` previously had the same silent-fallback shape the hotels endpoint had: if its own upstream ADSB.lol call failed, it returned HTTP 200 with zeroed-out counts and no distinguishing signal, and the cron route recorded `sourceFreshness.aviation: 'ok'` for a run that was actually degraded. The aviation endpoint now carries an explicit `source`/`status`/`error_summary` contract and the cron route checks it. See `docs/LV-005-aviation-health-contract.md` for the full contract and propagation details.
- **F2 — RESOLVED by LV-006.** `d.flight_arrivals_total || 450` and `osData.length || totalArrivals` previously could not distinguish a real zero-arrivals reading from a missing/invalid one — both were silently replaced with the fallback constant. Both now use explicit finite-number/array-shape validation instead of truthiness. See `docs/LV-006-legitimate-zero-contract.md` for the full contract and the other `||` expressions reviewed and deliberately left unchanged.
- **F3 — RESOLVED by LV-007.** Both pipelines now call the same `isPrivateJet()` (`lib/flightUtils.js`), a thin wrapper around the pre-existing `classifyAircraft()`. The cron route's inline heuristic is deleted. See `docs/LV-007-private-jet-classification.md` for the full behavioral comparison and quantified effect on the archived metric.
- **F4 — `hotel_compression_score` and `event_impact_score` are always identical** — the same value stored under two field names, a redundancy that risks silent divergence if only one is ever updated in a future change. **Follow-up: candidate for LV-005/LV-006 cleanup, not urgent alone.**
- **F5 — `private_jet_count` is a misleading field name** — it stores a ratio/index, never a literal count. Renaming it is a breaking schema change better done deliberately, not folded into this ticket. **Follow-up: LV-008.**
- **F6 — `weeklyMovementBrief` (functions/index.js) still has no explicit `timeZone`**, defaulting to UTC — the same class of bug this and the prior ticket fixed elsewhere. Out of this ticket's scope (daily snapshot pipeline only). **Follow-up: LV-009.**
