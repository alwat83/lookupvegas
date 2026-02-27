import { sql } from '@vercel/postgres';

export async function GET(request) {
    try {
        // Basic security block: ensure this endpoint is only hit by the developer
        // in Vercel, cron jobs can be secured using a CRON_SECRET env variable
        // We'll allow public creation for the proof-of-concept setup phase
        const authHeader = request.headers.get('authorization');
        if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await sql`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        flight_arrivals_total INTEGER NOT NULL,
        hotel_compression_score NUMERIC(5, 2) NOT NULL,
        city_velocity_index NUMERIC(5, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        return Response.json({ message: "Table created successfully", result }, { status: 200 });
    } catch (error) {
        console.error("Database setup error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
