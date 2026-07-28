// LV-006: a value || fallback expression only corrupts data when fallback
// could differ from a legitimate zero for that field -- this helper exists
// for exactly those cases, where 0 is a real, meaningful reading and must
// not be treated the same as missing, invalid, or malformed data.
//
// Numeric strings are rejected (fall back), not parsed. Neither of this
// ticket's two use sites legitimately produces a string -- Firestore
// preserves the JS number type it was written with, and Array.length is
// never a string by language definition -- so silently parsing one here
// would mask a real upstream contract violation rather than surface it.
export function selectFiniteNumber(value, fallback, { allowNegative = false } = {}) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    if (!allowNegative && value < 0) {
        return fallback;
    }
    return value;
}
