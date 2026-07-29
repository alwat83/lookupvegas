// LV-009: a small, functions-local date helper. Deliberately duplicated
// (not imported) from the single-day-math already tested in
// lib/businessDate.js, for the exact same reason functions/structuredLog.js
// duplicates lib/structuredLog.js -- Firebase Functions deploys only this
// directory's own contents, with no access to ../lib/ at runtime.
// weeklyBusinessDateRange is new; it does not exist in lib/businessDate.js.

function businessDateString(date, timeZone) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

// Pure calendar arithmetic on an already-local YYYY-MM-DD string -- not
// another timezone conversion. Anchoring at UTC noon and using JS's own
// Gregorian rollover (month/year boundaries, leap years) keeps this
// correct without ever touching a timezone a second time, and without
// fixed-offset math that DST would silently break.
function addDays(dateString, delta) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    date.setUTCDate(date.getUTCDate() + delta);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// The 7-day, inclusive Las Vegas business-date range ending on the
// business date of referenceInstant. Preserves the prior implicit
// "last 7 documents" convention (the report's own "past 7 days" copy)
// but expresses it as an explicit, auditable date range rather than an
// implicit "however many documents happen to exist" -- see
// docs/LV-009-weekly-brief-timezone.md for why this differs from the old
// behavior specifically when the archive has a gap.
function weeklyBusinessDateRange(referenceInstant, timeZone) {
    const end = businessDateString(referenceInstant, timeZone);
    const start = addDays(end, -6);
    return { start, end };
}

module.exports = { businessDateString, addDays, weeklyBusinessDateRange };
