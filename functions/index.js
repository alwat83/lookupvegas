const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");
const { logEvent } = require("./structuredLog");
const { weeklyBusinessDateRange } = require("./businessDate");

// LV-009: the single authoritative timezone for every Las Vegas business
// date this file computes -- the daily snapshot pipeline (app/api/cron/
// snapshot/route.js) already uses this same IANA zone; this constant is
// what keeps weeklyMovementBrief from silently disagreeing with it.
const BUSINESS_TIMEZONE = "America/Los_Angeles";

admin.initializeApp();
const db = admin.firestore();

// Ensure RESEND_API_KEY is set in Firebase functions environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const CRON_SECRET = defineSecret("CRON_SECRET");

// A soft timeout on the HTTP call itself, comfortably under the Cloud
// Function's own hard timeoutSeconds (120s, set below). This exists so a
// hanging upstream call produces our own attributable, structured log
// entry -- rather than the function simply being killed by the platform
// with no application-level context at all.
const REQUEST_TIMEOUT_MS = 90_000;

// Invokes the Next.js app's own /api/cron/snapshot route over an
// authenticated HTTPS call. This deliberately does not reimplement the CVI
// calculation -- that logic lives in exactly one place (the route itself),
// on the App Hosting side of the deployment. This function's only job is
// to trigger it, on schedule, and fail loudly if it doesn't succeed.
//
// Exported separately from the scheduled trigger below so it can be unit
// tested directly (with a mocked fetchImpl) without needing the Firebase
// emulator or the onSchedule wiring.
async function runDailySnapshot(secretValue, targetUrl, fetchImpl = fetch) {
    const startedAt = Date.now();

    if (!secretValue) {
        logEvent({
            severity: "ERROR",
            event: "dailySnapshot_misconfigured",
            message: "CRON_SECRET is not available. Refusing to invoke the snapshot endpoint.",
        });
        throw new Error("CRON_SECRET not configured");
    }
    if (!targetUrl) {
        logEvent({
            severity: "ERROR",
            event: "dailySnapshot_misconfigured",
            message: "CRON_TARGET_URL is not configured. Cannot reach the snapshot endpoint.",
        });
        throw new Error("CRON_TARGET_URL not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res;
    try {
        res = await fetchImpl(targetUrl, {
            method: "GET",
            headers: { Authorization: `Bearer ${secretValue}` },
            signal: controller.signal,
        });
    } catch (e) {
        const durationMs = Date.now() - startedAt;
        if (e.name === "AbortError") {
            logEvent({
                severity: "ERROR",
                event: "dailySnapshot_timeout",
                message: `Snapshot endpoint did not respond within ${REQUEST_TIMEOUT_MS}ms.`,
                error: e.message,
                durationMs,
            });
            throw new Error("Snapshot endpoint request timed out");
        }
        logEvent({
            severity: "ERROR",
            event: "dailySnapshot_invocation_failed",
            message: "Network failure invoking the snapshot endpoint.",
            error: e.message,
            durationMs,
        });
        throw e;
    } finally {
        clearTimeout(timeout);
    }

    const body = await res.json().catch(() => ({}));
    const durationMs = Date.now() - startedAt;

    if (!res.ok) {
        logEvent({
            severity: "ERROR",
            event: "dailySnapshot_invocation_failed",
            message: `Snapshot endpoint returned HTTP ${res.status}.`,
            snapshotDate: body.date ?? null,
            error: body.error ?? `HTTP ${res.status}`,
            durationMs,
        });
        throw new Error(`Snapshot endpoint failed with status ${res.status}`);
    }

    if (body.status === "failed") {
        logEvent({
            severity: "ERROR",
            event: "dailySnapshot_invocation_failed",
            message: "Snapshot endpoint reported a failed run.",
            snapshotDate: body.date ?? null,
            status: "failed",
            durationMs,
        });
        throw new Error("Snapshot run reported a failed status");
    }

    if (body.status === "partial") {
        logEvent({
            severity: "WARNING",
            event: "dailySnapshot_run_complete",
            message: `Snapshot for ${body.date} completed with stale/fallback sources.`,
            snapshotDate: body.date ?? null,
            status: "partial",
            durationMs,
        });
    } else {
        logEvent({
            severity: "INFO",
            event: "dailySnapshot_run_complete",
            message: `Snapshot for ${body.date} completed with status ${body.status}.`,
            snapshotDate: body.date ?? null,
            status: body.status ?? null,
            durationMs,
        });
    }

    return body;
}

exports.runDailySnapshot = runDailySnapshot;

// Runs daily at 00:05 in the business's own timezone (Las Vegas observes
// Pacific time). This is stated explicitly -- onSchedule defaults to UTC
// when no timeZone is given, which would silently archive the wrong
// business date every night. retryCount gives Cloud Scheduler two extra
// attempts on failure; this is safe specifically because the snapshot
// route itself is idempotent by business date, so a retry after a
// genuine failure re-attempts cleanly, and a retry after a success would
// be recognized as already-completed and skipped.
exports.dailySnapshot = onSchedule(
    {
        schedule: "5 0 * * *",
        timeZone: "America/Los_Angeles",
        retryCount: 2,
        minBackoffSeconds: 60,
        secrets: [CRON_SECRET],
        // A hard ceiling above REQUEST_TIMEOUT_MS's 90s soft timeout, so an
        // unexpected hang still gets caught by our own AbortController and
        // logged with context, rather than the platform silently killing
        // the invocation first.
        timeoutSeconds: 120,
    },
    async () => {
        await runDailySnapshot(CRON_SECRET.value(), process.env.CRON_TARGET_URL);
    }
);

// Exported separately from the scheduled trigger below, mirroring
// runDailySnapshot, so it can be unit tested with injected Firestore/Resend
// clients and a controlled referenceInstant -- deterministic, and
// independent of both the test machine's local timezone and real wall-clock
// time. dbClient/resendClient are dependency-injected rather than closing
// over the module-level db/resend so tests never touch real Firestore.
async function runWeeklyMovementBrief(dbClient, resendClient, referenceInstant = new Date()) {
    // LV-009: the reporting window is now an explicit, auditable Las Vegas
    // business-date range instead of an implicit "last 7 documents,
    // whatever they are." In the gap-free case this selects the identical
    // 7 documents as before (the existing week-start convention -- 7
    // calendar days ending on the day the brief runs -- is preserved, not
    // changed). If the archive has a gap, this now correctly reflects
    // fewer than 7 real business days rather than silently reaching back
    // past a full calendar week to pad the count -- see
    // docs/LV-009-weekly-brief-timezone.md.
    const { start, end } = weeklyBusinessDateRange(referenceInstant, BUSINESS_TIMEZONE);

    logEvent({
        severity: "INFO",
        event: "weeklyBrief_started",
        message: `weeklyMovementBrief executing at ${referenceInstant.toISOString()} `
            + `(${BUSINESS_TIMEZONE} business date ${end}); reporting window ${start} to ${end}, inclusive.`,
        snapshotDate: end,
    });

    try {
        // 1. Fetch daily metrics for the brief content -- date-string range
        // query against the existing business-date field, not a manufactured
        // UTC timestamp boundary. limit(7) remains as a defensive cap; the
        // where() range is what actually defines the window now.
        const metricsSnapshot = await dbClient.collection("daily_metrics")
            .where("date", ">=", start)
            .where("date", "<=", end)
            .orderBy("date", "desc")
            .limit(7)
            .get();

        if (metricsSnapshot.empty) {
            logEvent({
                severity: "INFO",
                event: "weeklyBrief_no_data",
                message: `No daily metrics found for ${start} to ${end}; no report generated.`,
                snapshotDate: end,
                status: "skipped",
            });
            return;
        }

        const metricsData = [];
        metricsSnapshot.forEach(doc => metricsData.push(doc.data()));

        // Calculate average CVI for the week
        const avgCvi = metricsData.reduce((acc, curr) => acc + (parseFloat(curr.city_velocity_index) || 0), 0) / metricsData.length;

        // 2. Query all premium users (Intelligence & Enterprise)
        const usersRef = dbClient.collection("users");
        const intelligenceUsers = await usersRef.where("tier", "==", "Intelligence").get();
        const enterpriseUsers = await usersRef.where("tier", "==", "Enterprise").get();

        const recipients = [];
        intelligenceUsers.forEach(doc => recipients.push(doc.data().email));
        enterpriseUsers.forEach(doc => recipients.push(doc.data().email));

        if (recipients.length === 0) {
            logEvent({
                severity: "INFO",
                event: "weeklyBrief_no_recipients",
                message: "No premium users found; no report sent.",
                snapshotDate: end,
                status: "skipped",
            });
            return;
        }

        // 3. Construct HTML email
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #111;">LookupVegas Weekly Movement Brief</h1>
                <p>Here is your premium telemetry summary for the past 7 days.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0;">Weekly Averages</h2>
                    <p><strong>City Velocity Index (CVI):</strong> ${avgCvi.toFixed(1)} / 100</p>
                </div>

                <h3>Daily Breakdown</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #e5e7eb; text-align: left;">
                            <th style="padding: 10px; border: 1px solid #d1d5db;">Date</th>
                            <th style="padding: 10px; border: 1px solid #d1d5db;">CVI</th>
                            <th style="padding: 10px; border: 1px solid #d1d5db;">Hotel Compression</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metricsData.map(day => `
                            <tr>
                                <td style="padding: 10px; border: 1px solid #d1d5db;">${day.date}</td>
                                <td style="padding: 10px; border: 1px solid #d1d5db;">${parseFloat(day.city_velocity_index || 0).toFixed(1)}</td>
                                <td style="padding: 10px; border: 1px solid #d1d5db;">${day.hotel_compression_score || 0}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="font-size: 12px; color: #6b7280; margin-top: 30px;">
                    You are receiving this email because you are subscribed to the Intelligence or Enterprise tier on LookupVegas.
                </p>
            </div>
        `;

        // 4. Send email via Resend
        // Resend recommends batching or sending individually if the list is large. 
        // We use BCC for a simple broadcast here, or multiple calls if limits apply.
        
        const BATCH_SIZE = 50;
        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
            const batch = recipients.slice(i, i + BATCH_SIZE);
            await resendClient.emails.send({
                from: 'intelligence@lookupvegas.com', // MUST verify this domain in Resend
                to: 'brief@lookupvegas.com', // Placeholder to address
                bcc: batch,
                subject: 'Your Weekly Movement Brief - LookupVegas',
                html: htmlContent
            });
        }

        // Recipient count only -- never the recipient list or report
        // contents themselves.
        logEvent({
            severity: "INFO",
            event: "weeklyBrief_complete",
            message: `weeklyMovementBrief completed: ${metricsData.length} document(s) selected for window `
                + `${start} to ${end}, brief sent to ${recipients.length} recipient(s).`,
            snapshotDate: end,
            status: "success",
        });

    } catch (error) {
        logEvent({
            severity: "ERROR",
            event: "weeklyBrief_failed",
            message: `weeklyMovementBrief failed for reporting window ${start} to ${end}.`,
            snapshotDate: end,
            status: "failed",
            error: error.message,
        });
    }
}

exports.runWeeklyMovementBrief = runWeeklyMovementBrief;

// LV-009: explicit America/Los_Angeles timezone. Previously this used the
// plain-string onSchedule form, which -- confirmed against the installed
// firebase-functions v6.6.0 source -- never sets a timeZone on the deployed
// endpoint at all; Cloud Scheduler then defaults to UTC. "every monday
// 08:00" was therefore actually executing at 08:00 UTC (00:00 PST / 01:00
// PDT), not the evidently-intended Monday-morning Las Vegas business report
// the schedule string reads as. The schedule expression itself is
// unchanged -- only the timezone it's interpreted in is now explicit,
// which changes the effective UTC execution instant but preserves the
// intended local day and clock time.
exports.weeklyMovementBrief = onSchedule(
    {
        schedule: "every monday 08:00",
        timeZone: BUSINESS_TIMEZONE,
    },
    async () => {
        await runWeeklyMovementBrief(db, resend);
    }
);
