const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();

// Ensure RESEND_API_KEY is set in Firebase functions environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

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
