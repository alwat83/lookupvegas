const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();

// Ensure RESEND_API_KEY is set in Firebase functions environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const CRON_SECRET = defineSecret("CRON_SECRET");

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
    if (!secretValue) {
        console.error("dailySnapshot: CRON_SECRET is not available. Refusing to invoke the snapshot endpoint.");
        throw new Error("CRON_SECRET not configured");
    }
    if (!targetUrl) {
        console.error("dailySnapshot: CRON_TARGET_URL is not configured. Cannot reach the snapshot endpoint.");
        throw new Error("CRON_TARGET_URL not configured");
    }

    const res = await fetchImpl(targetUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${secretValue}` },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
        console.error(`dailySnapshot: snapshot endpoint returned ${res.status}`, body);
        throw new Error(`Snapshot endpoint failed with status ${res.status}`);
    }

    if (body.status === "failed") {
        console.error("dailySnapshot: snapshot endpoint reported a failed run", body);
        throw new Error("Snapshot run reported a failed status");
    }

    if (body.status === "partial") {
        console.warn(`dailySnapshot: ${body.date} completed with stale/fallback sources`, body.sourceFreshness);
    } else {
        console.log(`dailySnapshot: ${body.date} completed with status ${body.status}`);
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
    },
    async () => {
        await runDailySnapshot(CRON_SECRET.value(), process.env.CRON_TARGET_URL);
    }
);

exports.weeklyMovementBrief = onSchedule("every monday 08:00", async (event) => {
    console.log("Starting weekly movement brief generation...");

    try {
        // 1. Fetch latest daily metrics for the brief content
        const metricsSnapshot = await db.collection("daily_metrics")
            .orderBy("date", "desc")
            .limit(7)
            .get();

        if (metricsSnapshot.empty) {
            console.log("No daily metrics found to generate report.");
            return;
        }

        const metricsData = [];
        metricsSnapshot.forEach(doc => metricsData.push(doc.data()));
        
        // Calculate average CVI for the week
        const avgCvi = metricsData.reduce((acc, curr) => acc + (parseFloat(curr.city_velocity_index) || 0), 0) / metricsData.length;

        // 2. Query all premium users (Intelligence & Enterprise)
        const usersRef = db.collection("users");
        const intelligenceUsers = await usersRef.where("tier", "==", "Intelligence").get();
        const enterpriseUsers = await usersRef.where("tier", "==", "Enterprise").get();

        const recipients = [];
        intelligenceUsers.forEach(doc => recipients.push(doc.data().email));
        enterpriseUsers.forEach(doc => recipients.push(doc.data().email));

        if (recipients.length === 0) {
            console.log("No premium users found.");
            return;
        }

        console.log(`Sending brief to ${recipients.length} users.`);

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
            await resend.emails.send({
                from: 'intelligence@lookupvegas.com', // MUST verify this domain in Resend
                to: 'brief@lookupvegas.com', // Placeholder to address
                bcc: batch,
                subject: 'Your Weekly Movement Brief - LookupVegas',
                html: htmlContent
            });
        }

        console.log("Weekly brief successfully sent.");

    } catch (error) {
        console.error("Error generating weekly brief:", error);
    }
});
