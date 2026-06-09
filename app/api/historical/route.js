import { db } from '../../../lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await db.collection('daily_metrics')
            .orderBy('date', 'desc')
            .limit(30)
            .get();

        const data = [];
        snapshot.forEach(doc => {
            const row = doc.data();
            // date is assumed to be "YYYY-MM-DD"
            // We use UTC to avoid off-by-one errors from local timezone shifts
            const d = new Date(`${row.date}T12:00:00Z`);
            
            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                velocity: parseFloat(row.city_velocity_index || 0).toFixed(1),
                events: row.hotel_compression_score > 90 ? 1 : 0
            });
        });

        // Recharts expects chronological order for left-to-right plotting
        data.reverse();

        // Provide a graceful initialization state if the database is newly created and empty
        if (data.length === 0) {
            const today = new Date();
            data.push({
                date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                velocity: 50.0,
                events: 0
            });
        }

        return Response.json({
            data: data
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
