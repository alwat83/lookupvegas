import { describe, it, expect } from 'vitest';
import {
    validateDocumentSchema,
    validateRanges,
    validateSourceFreshness,
    verifyCviArithmetic,
    auditArchive,
    readPrivateJetActivityIndex,
} from './archiveValidation.js';

function goodDoc(overrides = {}) {
    return {
        id: '2026-07-20',
        date: '2026-07-20',
        flight_arrivals_total: 480,
        hotel_compression_score: 55,
        event_impact_score: 55,
        city_velocity_index: 62.3,
        private_jet_count: 1.1,
        demand_momentum: 58,
        flight_score: 60,
        weather_score: 100,
        private_jet_index_normalized: 55,
        timestamp: '2026-07-20T07:05:00.000Z',
        cvi_version: 'v1',
        schema_version: 'v2',
        status: 'success',
        error_summary: [],
        source_freshness: { aviation: 'ok', openSky: 'ok', hotels: 'ok', adsb: 'ok', weather: 'ok' },
        ...overrides,
    };
}

// LV-008: a schema_version v3 document additionally carries the canonical
// private_jet_activity_index alongside the deprecated private_jet_count,
// numerically identical for a newly-written record.
function goodDocV3(overrides = {}) {
    return goodDoc({
        schema_version: 'v3',
        private_jet_activity_index: 1.1,
        private_jet_count: 1.1,
        ...overrides,
    });
}

describe('validateDocumentSchema', () => {
    it('accepts a complete, well-formed v2 document', () => {
        const result = validateDocumentSchema(goodDoc());
        expect(result.valid).toBe(true);
        expect(result.schemaGeneration).toBe('v2');
    });

    it('flags every missing required field individually', () => {
        const result = validateDocumentSchema({ date: '2026-07-20' });
        expect(result.valid).toBe(false);
        const fields = result.issues.map(i => i.field);
        expect(fields).toContain('city_velocity_index');
        expect(fields).toContain('status');
        expect(fields).toContain('timestamp');
    });

    it('flags a malformed date field', () => {
        const result = validateDocumentSchema(goodDoc({ date: '07/20/2026' }));
        expect(result.issues.some(i => i.field === 'date')).toBe(true);
    });

    it('flags an unexpected status value', () => {
        const result = validateDocumentSchema(goodDoc({ status: 'done' }));
        expect(result.issues.some(i => i.field === 'status')).toBe(true);
    });

    it('flags error_summary when it is not an array', () => {
        const result = validateDocumentSchema(goodDoc({ error_summary: 'none' }));
        expect(result.issues.some(i => i.field === 'error_summary')).toBe(true);
    });

    it('classifies a legacy (pre-LV-004) document as v1-legacy without flagging it as schema drift', () => {
        const legacyDoc = {
            date: '2026-01-05',
            flight_arrivals_total: 400,
            hotel_compression_score: 50,
            event_impact_score: 50,
            city_velocity_index: 55,
            private_jet_count: 1.0,
            demand_momentum: 50,
            timestamp: '2026-01-05T08:05:00.000Z',
            cvi_version: 'v1',
            status: 'success',
            error_summary: [],
        };
        const result = validateDocumentSchema(legacyDoc);
        expect(result.schemaGeneration).toBe('v1-legacy');
        expect(result.valid).toBe(true);
    });

    it('flags a v2 document that is missing one of the v2-only component fields as inconsistent', () => {
        const result = validateDocumentSchema(goodDoc({ schema_version: 'v2', weather_score: undefined }));
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.field === 'weather_score')).toBe(true);
    });

    it('accepts a complete, well-formed v3 document with the canonical private-jet field', () => {
        const result = validateDocumentSchema(goodDocV3());
        expect(result.valid).toBe(true);
        expect(result.schemaGeneration).toBe('v3');
    });

    it('does not falsely fail a v2 document merely for predating the canonical field (LV-008)', () => {
        // A real v2 document, as written before LV-008 existed -- no
        // private_jet_activity_index, only the legacy private_jet_count.
        const result = validateDocumentSchema(goodDoc());
        expect(result.valid).toBe(true);
        expect(result.issues.some(i => i.field === 'private_jet_activity_index')).toBe(false);
    });

    it('flags a v3 document missing the canonical field as inconsistent', () => {
        const result = validateDocumentSchema(goodDocV3({ private_jet_activity_index: undefined }));
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.field === 'private_jet_activity_index' && i.problem.includes('missing'))).toBe(true);
    });

    it('flags a document where the canonical and legacy private-jet fields materially disagree', () => {
        const result = validateDocumentSchema(goodDocV3({ private_jet_activity_index: 1.1, private_jet_count: 4.0 }));
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.field === 'private_jet_activity_index' && i.problem.includes('disagree'))).toBe(true);
    });

    it('does not flag a document where the canonical and legacy fields agree within tolerance', () => {
        const result = validateDocumentSchema(goodDocV3({ private_jet_activity_index: 1.10, private_jet_count: 1.12 }));
        expect(result.valid).toBe(true);
    });
});

describe('validateRanges', () => {
    it('accepts values within their theoretical bounds', () => {
        expect(validateRanges(goodDoc()).valid).toBe(true);
    });

    it('flags an impossible negative CVI', () => {
        const result = validateRanges(goodDoc({ city_velocity_index: -5 }));
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.field === 'city_velocity_index')).toBe(true);
    });

    it('flags a CVI above the theoretical maximum', () => {
        const result = validateRanges(goodDoc({ city_velocity_index: 142 }));
        expect(result.issues.some(i => i.field === 'city_velocity_index')).toBe(true);
    });

    it('flags a non-numeric value distinctly from an out-of-range one', () => {
        const result = validateRanges(goodDoc({ demand_momentum: 'high' }));
        expect(result.issues.some(i => i.field === 'demand_momentum' && i.problem.includes('not a number'))).toBe(true);
    });

    it('flags a non-finite (Infinity/overflow) value', () => {
        const result = validateRanges(goodDoc({ flight_score: Infinity }));
        expect(result.issues.some(i => i.field === 'flight_score' && i.problem.includes('non-finite'))).toBe(true);
    });

    it('flags NaN distinctly', () => {
        const result = validateRanges(goodDoc({ weather_score: NaN }));
        expect(result.issues.some(i => i.field === 'weather_score')).toBe(true);
    });

    it('flags an implausible arrivals count as an outlier without rejecting it outright', () => {
        const result = validateRanges(goodDoc({ flight_arrivals_total: 50000 }));
        expect(result.valid).toBe(true); // no hard ceiling exists for this field
        expect(result.outliers.some(o => o.field === 'flight_arrivals_total')).toBe(true);
    });
});

describe('validateSourceFreshness', () => {
    it('reports allFresh when every expected source is ok', () => {
        expect(validateSourceFreshness(goodDoc()).allFresh).toBe(true);
    });

    it('reports stale sources', () => {
        const result = validateSourceFreshness(goodDoc({
            source_freshness: { aviation: 'ok', openSky: 'ok', hotels: 'fallback', adsb: 'ok', weather: 'ok' },
        }));
        expect(result.stale).toEqual(['hotels']);
        expect(result.allFresh).toBe(false);
    });

    it('reports a source as missing (not merely stale) when absent entirely, e.g. a legacy document', () => {
        const result = validateSourceFreshness({});
        expect(result.missing.length).toBe(5);
        expect(result.allFresh).toBe(false);
    });
});

describe('readPrivateJetActivityIndex', () => {
    it('uses the canonical field when only it is present', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 1.5 });
        expect(result).toMatchObject({ value: 1.5, source: 'canonical', ok: true });
    });

    it('falls back to the legacy field when only it is present', () => {
        const result = readPrivateJetActivityIndex({ private_jet_count: 1.5 });
        expect(result).toMatchObject({ value: 1.5, source: 'legacy', ok: true });
    });

    it('uses the canonical value when both fields are exactly equal', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 1.5, private_jet_count: 1.5 });
        expect(result).toMatchObject({ value: 1.5, source: 'canonical', ok: true });
    });

    it('uses the canonical value when both fields agree within tolerance', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 1.50, private_jet_count: 1.53 }, 0.05);
        expect(result).toMatchObject({ value: 1.50, source: 'canonical', ok: true });
    });

    it('flags -- does not silently resolve -- a material disagreement between the two fields', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 1.5, private_jet_count: 4.0 });
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('disagreement');
        expect(result.value).toBeNull();
        expect(result.issue).toContain('disagree');
    });

    it('falls back to a valid legacy value when the canonical field is malformed', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: NaN, private_jet_count: 1.5 });
        expect(result).toMatchObject({ value: 1.5, source: 'legacy', ok: true });
    });

    it('uses a valid canonical value when the legacy field is malformed', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 1.5, private_jet_count: 'not-a-number' });
        expect(result).toMatchObject({ value: 1.5, source: 'canonical', ok: true });
    });

    it('reports missing/unverifiable when both fields are absent', () => {
        const result = readPrivateJetActivityIndex({});
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('missing');
        expect(result.value).toBeNull();
    });

    it('preserves a legitimate zero', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 0 });
        expect(result).toMatchObject({ value: 0, ok: true });
    });

    it('preserves a value greater than 1, since the index is not bounded to [0,1]', () => {
        const result = readPrivateJetActivityIndex({ private_jet_activity_index: 8.75 });
        expect(result).toMatchObject({ value: 8.75, ok: true });
    });

    it('rejects NaN and Infinity on both fields as unverifiable', () => {
        expect(readPrivateJetActivityIndex({ private_jet_activity_index: NaN, private_jet_count: Infinity }).ok).toBe(false);
        expect(readPrivateJetActivityIndex({ private_jet_activity_index: -Infinity }).ok).toBe(false);
    });
});

describe('verifyCviArithmetic', () => {
    it('confirms a match when the stored CVI equals the weighted sum of its persisted components', () => {
        const doc = goodDoc({
            flight_score: 60, demand_momentum: 58, event_impact_score: 55, weather_score: 100, private_jet_index_normalized: 55,
        });
        doc.city_velocity_index = 60 * 0.35 + 58 * 0.25 + 55 * 0.20 + 100 * 0.10 + 55 * 0.10;
        const result = verifyCviArithmetic(doc);
        expect(result.verifiable).toBe(true);
        expect(result.match).toBe(true);
        expect(result.diff).toBeLessThan(0.001);
    });

    it('detects a genuine mismatch between stored CVI and its own components', () => {
        const doc = goodDoc({ city_velocity_index: 999 });
        const result = verifyCviArithmetic(doc);
        expect(result.verifiable).toBe(true);
        expect(result.match).toBe(false);
    });

    it('reports not verifiable (never fabricates a pass) for a legacy document missing component fields', () => {
        const legacyDoc = { city_velocity_index: 55, demand_momentum: 50, event_impact_score: 50 };
        const result = verifyCviArithmetic(legacyDoc);
        expect(result.verifiable).toBe(false);
        expect(result.match).toBeNull();
        expect(result.reason).toContain('flight_score');
    });

    it('tolerates floating-point noise within the default tolerance', () => {
        const doc = goodDoc();
        doc.city_velocity_index = (doc.flight_score * 0.35) + (doc.demand_momentum * 0.25)
            + (doc.event_impact_score * 0.20) + (doc.weather_score * 0.10) + (doc.private_jet_index_normalized * 0.10)
            + 0.0000001;
        expect(verifyCviArithmetic(doc).match).toBe(true);
    });

    // LV-008: verifyCviArithmetic uses private_jet_index_normalized, which
    // is untouched by this ticket -- it must be unaffected regardless of
    // which of the two private-jet compatibility fields a fixture carries.
    it('verifies CVI arithmetic identically for a canonical-only private-jet fixture', () => {
        const doc = goodDocV3();
        delete doc.private_jet_count; // canonical field only
        doc.city_velocity_index = (doc.flight_score * 0.35) + (doc.demand_momentum * 0.25)
            + (doc.event_impact_score * 0.20) + (doc.weather_score * 0.10) + (doc.private_jet_index_normalized * 0.10);
        expect(verifyCviArithmetic(doc).match).toBe(true);
    });

    it('verifies CVI arithmetic identically for a legacy-only private-jet fixture', () => {
        const doc = goodDoc(); // no private_jet_activity_index at all
        doc.city_velocity_index = (doc.flight_score * 0.35) + (doc.demand_momentum * 0.25)
            + (doc.event_impact_score * 0.20) + (doc.weather_score * 0.10) + (doc.private_jet_index_normalized * 0.10);
        expect(verifyCviArithmetic(doc).match).toBe(true);
    });
});

describe('auditArchive', () => {
    it('handles an empty archive without error', () => {
        const result = auditArchive([]);
        expect(result.ok).toBe(true);
        expect(result.documentCount).toBe(0);
        expect(result.dateRange).toBeNull();
    });

    it('passes a clean, contiguous, well-formed archive', () => {
        const docs = ['2026-07-18', '2026-07-19', '2026-07-20'].map(date => goodDoc({ id: date, date }));
        const result = auditArchive(docs);
        expect(result.ok).toBe(true);
        expect(result.findings.duplicateDates).toEqual([]);
        expect(result.findings.missingDates).toEqual([]);
    });

    it('passes a mixed archive spanning v1-legacy, v2, and v3 schema generations without false schema-drift findings (LV-008)', () => {
        const v1Doc = {
            id: '2026-07-17', date: '2026-07-17', flight_arrivals_total: 400, hotel_compression_score: 50,
            event_impact_score: 50, city_velocity_index: 55, private_jet_count: 1.0, demand_momentum: 50,
            timestamp: '2026-07-17T08:05:00.000Z', cvi_version: 'v1', status: 'success', error_summary: [],
        };
        const docs = [
            v1Doc,
            goodDoc({ id: '2026-07-18', date: '2026-07-18' }), // v2
            goodDocV3({ id: '2026-07-19', date: '2026-07-19' }), // v3
        ];
        const result = auditArchive(docs);
        expect(result.ok).toBe(true);
        expect(result.findings.schemaDrift).toEqual([]);
    });

    it('detects a missing day inside the observed date range', () => {
        const docs = ['2026-07-18', '2026-07-20'].map(date => goodDoc({ id: date, date })); // 07-19 is missing
        const result = auditArchive(docs);
        expect(result.ok).toBe(false);
        expect(result.findings.missingDates).toEqual(['2026-07-19']);
    });

    it('detects a duplicate business date (two documents claiming the same day)', () => {
        const docs = [
            goodDoc({ id: '2026-07-20', date: '2026-07-20' }),
            goodDoc({ id: '2026-07-20-retry', date: '2026-07-20' }),
        ];
        const result = auditArchive(docs);
        expect(result.ok).toBe(false);
        expect(result.findings.duplicateDates).toEqual([{ date: '2026-07-20', count: 2 }]);
    });

    it('detects a document whose ID disagrees with its own internal date field', () => {
        const docs = [goodDoc({ id: '2026-07-19', date: '2026-07-20' })];
        const result = auditArchive(docs);
        expect(result.ok).toBe(false);
        expect(result.findings.idMismatches).toEqual([{ id: '2026-07-19', internalDate: '2026-07-20' }]);
    });

    it('reports per-document schema drift without crashing the whole audit', () => {
        const docs = [
            goodDoc({ id: '2026-07-19', date: '2026-07-19' }),
            { id: '2026-07-20', date: '2026-07-20' }, // missing everything else
        ];
        const result = auditArchive(docs);
        expect(result.ok).toBe(false);
        expect(result.findings.schemaDrift.length).toBe(1);
        expect(result.findings.schemaDrift[0].id).toBe('2026-07-20');
    });

    it('isolates a document with an unparseable date instead of throwing', () => {
        const docs = [
            goodDoc({ id: '2026-07-19', date: '2026-07-19' }),
            goodDoc({ id: 'garbage', date: 'not-a-date' }),
        ];
        const result = auditArchive(docs);
        expect(result.ok).toBe(false);
        expect(result.findings.dateFormatIssues).toEqual([{ id: 'garbage', date: 'not-a-date' }]);
    });

    it('correctly spans a leap day without a false gap', () => {
        const docs = ['2028-02-28', '2028-02-29', '2028-03-01'].map(date => goodDoc({ id: date, date }));
        const result = auditArchive(docs);
        expect(result.ok).toBe(true);
        expect(result.findings.missingDates).toEqual([]);
    });

    it('detects a gap that spans a DST transition correctly (no false positive or false negative)', () => {
        // 2026-11-01 is the US fall-back DST transition date.
        const docs = ['2026-10-31', '2026-11-02'].map(date => goodDoc({ id: date, date })); // 11-01 missing
        const result = auditArchive(docs);
        expect(result.findings.missingDates).toEqual(['2026-11-01']);
    });
});
