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
