import { db } from '../../../lib/firebaseAdmin';
import { getUserProfile } from '../../../lib/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { tier, isPremium } = await getUserProfile(req);

        // Fetch up to 40 days to account for delays
        const snapshot = await db.collection('daily_metrics')
            .orderBy('date', 'desc')
            .limit(isPremium ? 30 : 10)
            .get();

        let data = [];
        snapshot.forEach(doc => {
            const row = doc.data();
            const d = new Date(`${row.date}T12:00:00Z`);
            
            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                velocity: parseFloat(row.city_velocity_index || 0).toFixed(1),
                events: row.hotel_compression_score > 90 ? 1 : 0
            });
        });

        if (!isPremium) {
            // Drop the first 3 days (72 hours delay)
            data = data.slice(3, 10);
        } else {
            // Take exactly 30 days
            data = data.slice(0, 30);
        }

        // Recharts expects chronological order for left-to-right plotting
        data.reverse();

        // Provide a graceful initialization state if the database is newly created and empty
        if (data.length === 0) {
            const today = new Date();
            if (!isPremium) {
                today.setDate(today.getDate() - 3); // 72h delay mock
            }
            data.push({
                date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                velocity: 50.0,
                events: 0
            });
        }

        return Response.json({
            data: data,
            delayed: !isPremium
        });

    } catch (error) {
        console.error("Historical API Error:", error);
        
        // Fallback for UI resilience if Firebase is misconfigured during local dev
        return Response.json({
            data: [{ date: 'Pending DB', velocity: 0 }],
            error: "Failed to fetch historic data from DB"
        }, { status: 200 });
    }
}
