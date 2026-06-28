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

        const apiKey = process.env.TICKETMASTER_API_KEY;
        
        const fallbackData = [
            { id: 'fail-1', name: 'Las Vegas Grand Prix (F1)', date: 'Upcoming Weekend', venue: 'Las Vegas Strip Circuit', impact: 'Tier 1: High Impact', impactScore: 98 },
            { id: 'fail-2', name: 'Adele Weekends', date: 'Upcoming Weekend', venue: 'Caesars Palace', impact: 'Tier 2: Med Impact', impactScore: 80 },
            { id: 'fail-3', name: 'Vegas Golden Knights vs Oilers', date: 'Tonight', venue: 'T-Mobile Arena', impact: 'Tier 2: Med Impact', impactScore: 75 },
            { id: 'fail-4', name: 'Cirque du Soleil - O', date: 'Tonight', venue: 'Bellagio', impact: 'Tier 3: Baseline', impactScore: 40 },
            { id: 'fail-5', name: 'Consumer Electronics Show (CES)', date: 'Upcoming', venue: 'LVCC', impact: 'Tier 1: High Impact', impactScore: 100 }
        ];

        // Sort fallback data by highest impact
        fallbackData.sort((a, b) => b.impactScore - a.impactScore);

        if (!apiKey) {
            return Response.json({
                data: fallbackData.slice(0, 5),
                requiresAuth: false,
                source: 'fallback'
            });
        }

        // Fetch from Ticketmaster
        const now = new Date().toISOString().split('.')[0] + "Z";
        const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=Las%20Vegas&apikey=${apiKey}&size=5&sort=date,asc&startDateTime=${now}`;
        
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Ticketmaster API error: ${response.status}`);
        }

        const json = await response.json();
        
        if (!json._embedded || !json._embedded.events || json._embedded.events.length === 0) {
            throw new Error("No events found from Ticketmaster");
        }

        const events = json._embedded.events.map((event, index) => {
            let impactScore = 95 - (index * 10);
            
            let impactTier = 'Tier 3: Baseline';
            if (impactScore >= 80) impactTier = 'Tier 1: High Impact';
            else if (impactScore >= 50) impactTier = 'Tier 2: Med Impact';

            return {
                id: `tm-${event.id}`,
                name: event.name,
                date: event.dates?.start?.localDate || 'Upcoming',
                venue: event._embedded?.venues?.[0]?.name || 'Las Vegas',
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
            source: 'ticketmaster'
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
