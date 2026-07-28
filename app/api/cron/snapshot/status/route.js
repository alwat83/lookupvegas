import { db } from '../../../../../lib/firebaseAdmin';
import { businessDateString, BUSINESS_TIMEZONE } from '../../../../../lib/businessDate';

// The snapshot is scheduled for 00:05 America/Los_Angeles (see
// functions/index.js). Cloud Scheduler's own retryCount/minBackoffSeconds
// can push a genuine completion a few minutes later; 30 minutes is a
// generous window that still catches a truly stuck or missing run without
// false-alarming on a normal retry.
const EXPECTED_WINDOW_MINUTES = 30;

function minutesSinceMidnightPacific(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);
    const hour = Number(parts.find(p => p.type === 'hour').value);
    const minute = Number(parts.find(p => p.type === 'minute').value);
    return hour * 60 + minute;
}

// A lightweight, read-only mechanism to verify the daily snapshot pipeline
// is actually healthy -- without requiring anyone to open the Firebase
// console. Answers exactly four questions: does today's Las Vegas snapshot
// exist, did it complete successfully, was it degraded, and did it finish
// within the expected execution window. Gated behind CRON_SECRET (reused,
// not a new secret) since it surfaces internal operational detail --
// which upstream sources are currently failing -- that has no reason to
// be public.
export async function GET(request) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return Response.json({ error: 'Cron is not configured' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = businessDateString();
    const now = new Date();
    const windowExpired = minutesSinceMidnightPacific(now) >= EXPECTED_WINDOW_MINUTES;

    let doc;
    try {
        doc = await db.collection('daily_metrics').doc(today).get();
    } catch (e) {
        return Response.json({ error: 'Failed to read snapshot state', detail: e.message }, { status: 500 });
    }

    const data = doc.exists ? doc.data() : null;
    const exists = doc.exists;
    const status = data?.status ?? null;

    // Did the run that produced this record actually finish inside the
    // expected window -- not merely "does a record exist by the time
    // someone happens to check." A record that landed very late (e.g. a
    // final Cloud Scheduler retry) should not read as healthy here.
    let withinExpectedWindow = null;
    if (exists && data?.timestamp) {
        withinExpectedWindow = minutesSinceMidnightPacific(new Date(data.timestamp)) <= EXPECTED_WINDOW_MINUTES;
    } else if (windowExpired) {
        withinExpectedWindow = false;
    }

    let healthy;
    let reason;
    if (!exists) {
        healthy = windowExpired ? false : null;
        reason = windowExpired ? 'missing' : 'pending';
    } else if (status === 'failed') {
        healthy = false;
        reason = 'failed';
    } else if (withinExpectedWindow === false) {
        healthy = false;
        reason = 'late';
    } else if (status === 'partial') {
        healthy = true;
        reason = 'partial';
    } else {
        healthy = true;
        reason = 'success';
    }

    return Response.json({
        date: today,
        exists,
        status,
        healthy,
        reason,
        isPartial: status === 'partial',
        withinExpectedWindow,
        expectedWindowMinutes: EXPECTED_WINDOW_MINUTES,
        executedAt: data?.timestamp ?? null,
        executionDurationMs: data?.execution_duration_ms ?? null,
        cviVersion: data?.cvi_version ?? null,
        sourceFreshness: data?.source_freshness ?? null,
        errorSummary: data?.error_summary ?? [],
    }, { status: 200 });
}
