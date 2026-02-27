export async function GET() {
    try {
        // Simulated DB fetch for trailing 30 days
        // In production, this would be: SELECT * FROM daily_metrics ORDER BY date ASC LIMIT 30;

        // Generate 30 days of realistic synthetic data for the Proof of Concept
        const data = [];
        const today = new Date();

        // Baseline metrics
        let currentVelocity = 62.0;

        for (let i = 30; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);

            // Add some realistic noise, maybe a weekly sine wave plus random walk
            const dayOfWeek = d.getDay();
            const weekendSpike = (dayOfWeek === 5 || dayOfWeek === 6) ? 15 : 0; // Friday/Sat spike
            const randomNoise = (Math.random() - 0.5) * 8; // +/- 4

            // Gentle upward trend
            const trend = (30 - i) * 0.2;

            let score = currentVelocity + weekendSpike + randomNoise + trend;

            // Clamp to 1-100
            score = Math.max(1, Math.min(100, score));

            data.push({
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                velocity: parseFloat(score.toFixed(1)),
                events: (dayOfWeek === 5 && Math.random() > 0.5) ? 1 : 0 // randomly flag a Friday as a major event
            });
        }

        return Response.json({
            data: data
        });

    } catch (error) {
        console.error("Historical API Error:", error);
        return Response.json({ error: "Failed to fetch historic data" }, { status: 500 });
    }
}
