// Las Vegas observes Pacific time; there is no distinct IANA zone for it,
// so America/Los_Angeles is the correct, explicit business timezone.
export const BUSINESS_TIMEZONE = 'America/Los_Angeles';

// Formats a Date as the business-day string (YYYY-MM-DD) in the Las Vegas
// timezone, explicitly -- not the server/UTC date. "Every day at 00:05"
// with no timezone quietly archives the wrong business date near midnight;
// this is the one place that decision gets made, deliberately, and it is
// shared (not duplicated) by every route in this app that needs to agree
// on what "today" means.
export function businessDateString(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: BUSINESS_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

// Calendar arithmetic on an already-Vegas-local YYYY-MM-DD string -- not
// another timezone conversion. Subtracting 24 hours from "now" and
// re-formatting (the pattern used before this existed) computes the wrong
// day whenever "now" isn't close to midnight, and is meaningless entirely
// when the reference date is a backfilled historical date rather than
// today. Anchoring at UTC noon and using JS's own Gregorian rollover
// (month/year boundaries, leap years) keeps this correct without ever
// touching a timezone a second time.
export function previousBusinessDateString(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    date.setUTCDate(date.getUTCDate() - 1);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function isValidBusinessDateString(dateString) {
    if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return false;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
}
