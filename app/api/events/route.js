import * as cheerio from 'cheerio';
import { getUserProfile } from '../../../lib/authMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { isPremium } = await getUserProfile(req);

        if (!isPremium) {
            return Response.json({
                data: [],
                requiresAuth: true,
                locked: true,
                message: 'Event impact modeling is a Premium Intelligence tier feature.'
            });
        }

        const clientId = process.env.SEATGEEK_CLIENT_ID;
        
        const fallbackData = [
            { id: 'fail-1', name: 'Las Vegas Grand Prix (F1)', date: 'Upcoming Weekend', venue: 'Las Vegas Strip Circuit', impact: 'Tier 1: High Impact', impactScore: 98 },
            { id: 'fail-2', name: 'Adele Weekends', date: 'Upcoming Weekend', venue: 'Caesars Palace', impact: 'Tier 2: Med Impact', impactScore: 80 },
            { id: 'fail-3', name: 'Vegas Golden Knights vs Oilers', date: 'Tonight', venue: 'T-Mobile Arena', impact: 'Tier 2: Med Impact', impactScore: 75 },
            { id: 'fail-4', name: 'Cirque du Soleil - O', date: 'Tonight', venue: 'Bellagio', impact: 'Tier 3: Baseline', impactScore: 40 },
            { id: 'fail-5', name: 'Consumer Electronics Show (CES)', date: 'Upcoming', venue: 'LVCC', impact: 'Tier 1: High Impact', impactScore: 100 }
        ];

        // Sort fallback data by highest impact
        fallbackData.sort((a, b) => b.impactScore - a.impactScore);

        if (!clientId) {
            return Response.json({
                data: fallbackData.slice(0, 5),
                requiresAuth: false,
                source: 'fallback'
            });
        }

        // Fetch from SeatGeek
        // Get events in Las Vegas from today onwards, sorted by SeatGeek's popularity score
        const today = new Date().toISOString().split('T')[0];
        const url = `https://api.seatgeek.com/2/events?venue.city=las%20vegas&datetime_utc.gte=${today}&sort=score.desc&per_page=10&client_id=${clientId}`;
        
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`SeatGeek API error: ${response.status}`);
        }

        const json = await response.json();
        
        if (!json.events || json.events.length === 0) {
            throw new Error("No events found from SeatGeek");
        }

        const events = json.events.map(event => {
            // SeatGeek score is between 0.0 and 1.0 (sometimes higher if trending, but typically 0-1)
            let rawScore = event.score || 0;
            let impactScore = Math.min(100, Math.round(rawScore * 100));
            
            // Boost scores slightly for Vegas scale
            if (impactScore > 0) {
                impactScore = Math.min(100, impactScore + 15);
            }

            let impactTier = 'Tier 3: Baseline';
            if (impactScore >= 80) impactTier = 'Tier 1: High Impact';
            else if (impactScore >= 50) impactTier = 'Tier 2: Med Impact';

            return {
                id: `sg-${event.id}`,
                name: event.short_title || event.title,
                date: event.datetime_local,
                venue: event.venue?.name || 'Las Vegas',
                impact: impactTier,
                impactScore: impactScore
            };
        });

        // Ensure we always have top 5
        let finalEvents = events.slice(0, 5);
        if (finalEvents.length === 0) {
            finalEvents = fallbackData.slice(0, 5);
        }

        return Response.json({
            data: finalEvents,
            requiresAuth: false,
            source: 'seatgeek'
        });

    } catch (error) {
        console.error("Events API Error:", error);
        
        // Graceful degradation fallback
        return Response.json({
            data: [
                { id: 'fail-1', name: 'Las Vegas Grand Prix (F1)', date: 'Upcoming Weekend', venue: 'Las Vegas Strip Circuit', impact: 'Tier 1: High Impact', impactScore: 98 },
                { id: 'fail-2', name: 'Adele Weekends', date: 'Upcoming Weekend', venue: 'Caesars Palace', impact: 'Tier 2: Med Impact', impactScore: 80 },
                { id: 'fail-3', name: 'Vegas Golden Knights vs Oilers', date: 'Tonight', venue: 'T-Mobile Arena', impact: 'Tier 2: Med Impact', impactScore: 75 }
            ],
            requiresAuth: false,
            source: 'fallback'
        }, { status: 200 });
    }
}
