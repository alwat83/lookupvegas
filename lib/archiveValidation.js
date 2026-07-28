// LV-004: automated validation for the daily_metrics archive. Pure
// functions operating on plain document data -- no Firestore dependency --
// so they can be unit tested with fixtures and reused by both an ops
// script (scripts/validate-archive.mjs) that reads the real collection
// and any future callers, without duplicating the rules.

export const SCHEMA_VERSION = 'v2';

const CORE_REQUIRED_FIELDS = [
    'date',
    'flight_arrivals_total',
    'hotel_compression_score',
    'city_velocity_index',
    'private_jet_count',
    'demand_momentum',
    'event_impact_score',
    'timestamp',
    'cvi_version',
    'status',
    'error_summary',
];

// Only guaranteed on documents written after LV-004 (schema_version 'v2').
// Older documents legitimately lack these -- that is a documented
// limitation (see docs/LV-004), not itself a defect to flag as schema
// drift on every legacy record.
const V2_ONLY_FIELDS = ['flight_score', 'weather_score', 'private_jet_index_normalized'];

const VALID_STATUSES = ['success', 'partial', 'failed'];

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

export function validateDocumentSchema(doc) {
    const issues = [];

    for (const field of CORE_REQUIRED_FIELDS) {
        if (doc[field] === undefined || doc[field] === null) {
            issues.push({ field, problem: 'missing required field' });
        }
    }

    if (doc.date !== undefined && !DATE_FORMAT.test(doc.date)) {
        issues.push({ field: 'date', problem: `not in YYYY-MM-DD format: ${JSON.stringify(doc.date)}` });
    }

    if (doc.status !== undefined && !VALID_STATUSES.includes(doc.status)) {
        issues.push({ field: 'status', problem: `unexpected value: ${JSON.stringify(doc.status)}` });
    }

    if (doc.error_summary !== undefined && !Array.isArray(doc.error_summary)) {
        issues.push({ field: 'error_summary', problem: 'expected an array' });
    }

    const schemaGeneration = doc.schema_version === SCHEMA_VERSION || V2_ONLY_FIELDS.some(f => doc[f] !== undefined)
        ? SCHEMA_VERSION
        : 'v1-legacy';

    if (schemaGeneration === SCHEMA_VERSION) {
        for (const field of V2_ONLY_FIELDS) {
            if (doc[field] === undefined || doc[field] === null) {
                issues.push({ field, problem: `missing on a ${SCHEMA_VERSION} document (inconsistent schema)` });
            }
        }
    }

    return { valid: issues.length === 0, issues, schemaGeneration };
}

// Ranges are derived from what the current formula can actually produce,
// not guessed -- each of the five CVI component fields is a weighted
// [0,100] term by construction, so a value outside that range indicates
// corrupted data or a formula/version mismatch, not a formula change here.
const RANGE_RULES = {
    city_velocity_index: [0, 100],
    hotel_compression_score: [0, 100],
    event_impact_score: [0, 100],
    demand_momentum: [0, 100],
    flight_score: [0, 100],
    weather_score: [0, 100],
    private_jet_index_normalized: [0, 100],
    flight_arrivals_total: [0, null],
    private_jet_count: [0, null],
};

// Not a hard bound -- LookupVegas has no authoritative source for what a
// truly impossible daily arrival count is. This is a heuristic worth
// investigating, not an assertion that a value above it is wrong.
const OUTLIER_CEILINGS = { flight_arrivals_total: 2000 };

export function validateRanges(doc) {
    const issues = [];
    const outliers = [];

    for (const [field, [min, max]] of Object.entries(RANGE_RULES)) {
        const value = doc[field];
        if (value === undefined || value === null) continue; // schema check already reports absence

        if (typeof value !== 'number' || Number.isNaN(value)) {
            issues.push({ field, problem: `not a number: ${JSON.stringify(value)}` });
            continue;
        }
        if (!Number.isFinite(value)) {
            issues.push({ field, problem: `overflow or non-finite value: ${value}` });
            continue;
        }
        if (min !== null && value < min) {
            issues.push({ field, problem: `${value} is below the theoretical minimum of ${min}` });
        }
        if (max !== null && value > max) {
            issues.push({ field, problem: `${value} is above the theoretical maximum of ${max}` });
        }
    }

    for (const [field, ceiling] of Object.entries(OUTLIER_CEILINGS)) {
        const value = doc[field];
        if (typeof value === 'number' && Number.isFinite(value) && value > ceiling) {
            outliers.push({ field, value, note: `exceeds heuristic outlier ceiling of ${ceiling} -- worth investigating, not necessarily wrong` });
        }
    }

    return { valid: issues.length === 0, issues, outliers };
}

const EXPECTED_SOURCES = ['aviation', 'openSky', 'hotels', 'adsb', 'weather'];

export function validateSourceFreshness(doc) {
    const freshness = doc.source_freshness || {};
    const missing = EXPECTED_SOURCES.filter(s => freshness[s] === undefined);
    const stale = EXPECTED_SOURCES.filter(s => freshness[s] === 'fallback');
    return { allFresh: missing.length === 0 && stale.length === 0, missing, stale };
}

// The honest implementation of "CVI reproducibility": recomputes the
// weighted sum from the document's own persisted component fields and
// compares it to the stored city_velocity_index. This verifies the
// ARITHMETIC only -- it cannot and does not claim to reproduce the true
// historical upstream conditions for a past date (see docs/LV-004 for why
// that is a different, much harder, and largely unattainable claim given
// upstream APIs that only ever serve current data).
export function verifyCviArithmetic(doc, tolerance = 0.05) {
    const requiredFields = [
        'flight_score',
        'demand_momentum',
        'event_impact_score',
        'weather_score',
        'private_jet_index_normalized',
        'city_velocity_index',
    ];
    const missing = requiredFields.filter(f => doc[f] === undefined || doc[f] === null);

    if (missing.length > 0) {
        return {
            verifiable: false,
            reason: `document is missing component field(s) required to recompute CVI: ${missing.join(', ')}`,
            match: null,
        };
    }

    const recomputed = (doc.flight_score * 0.35)
        + (doc.demand_momentum * 0.25)
        + (doc.event_impact_score * 0.20)
        + (doc.weather_score * 0.10)
        + (doc.private_jet_index_normalized * 0.10);

    const diff = Math.abs(recomputed - doc.city_velocity_index);

    return {
        verifiable: true,
        recomputed,
        stored: doc.city_velocity_index,
        diff,
        match: diff <= tolerance,
    };
}

function addOneDay(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    date.setUTCDate(date.getUTCDate() + 1);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Scans the whole archive for: duplicate business dates, gaps in the date
// range, a document whose ID disagrees with its own internal `date` field,
// and schema drift per-document (via validateDocumentSchema). Accepts
// plain objects with an `id` (the Firestore document ID) and the document
// data merged in -- no Firestore dependency, so this is fully unit
// testable and reusable from an ops script that reads the real collection.
export function auditArchive(docs) {
    const findings = {
        duplicateDates: [],
        missingDates: [],
        idMismatches: [],
        schemaDrift: [],
        dateFormatIssues: [],
    };

    if (docs.length === 0) {
        return { ok: true, documentCount: 0, dateRange: null, findings };
    }

    const dateCounts = new Map();

    for (const doc of docs) {
        if (typeof doc.date !== 'string' || !DATE_FORMAT.test(doc.date)) {
            findings.dateFormatIssues.push({ id: doc.id, date: doc.date });
            continue;
        }

        dateCounts.set(doc.date, (dateCounts.get(doc.date) || 0) + 1);

        if (doc.id !== doc.date) {
            findings.idMismatches.push({ id: doc.id, internalDate: doc.date });
        }

        const schemaResult = validateDocumentSchema(doc);
        if (!schemaResult.valid) {
            findings.schemaDrift.push({ id: doc.id, issues: schemaResult.issues });
        }
    }

    for (const [date, count] of dateCounts.entries()) {
        if (count > 1) {
            findings.duplicateDates.push({ date, count });
        }
    }

    const validDates = [...dateCounts.keys()].sort();
    if (validDates.length > 0) {
        const minDate = validDates[0];
        const maxDate = validDates[validDates.length - 1];
        let cursor = minDate;
        while (cursor < maxDate) {
            if (!dateCounts.has(cursor)) {
                findings.missingDates.push(cursor);
            }
            cursor = addOneDay(cursor);
        }

        const ok = findings.duplicateDates.length === 0
            && findings.missingDates.length === 0
            && findings.idMismatches.length === 0
            && findings.schemaDrift.length === 0
            && findings.dateFormatIssues.length === 0;

        return { ok, documentCount: docs.length, dateRange: { start: minDate, end: maxDate }, findings };
    }

    // Every document had an unparseable date -- nothing to range-scan.
    return { ok: false, documentCount: docs.length, dateRange: null, findings };
}
