import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const checkIn = searchParams.get('checkIn') || new Date().toISOString().split('T')[0];
        const checkOut = searchParams.get('checkOut');

        let eventsText = [];
        let numEvents = 0;
        let hasMassiveEvent = false;

        // 1. Scrape lasvegasweekly
        try {
            const response = await fetch('https://lasvegasweekly.com/events/', {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                next: { revalidate: 3600 }
            });
            if (response.ok) {
                const html = await response.text();
                const $ = cheerio.load(html);
                $('.event-item, .list-item, article.event').slice(0, 10).each((i, el) => {
                    eventsText.push($(el).text().toLowerCase());
                    numEvents++;
                });
            }
        } catch (e) {
            console.warn("Could not scrape events", e);
        }

        // 2. Ticketmaster API
        if (process.env.TICKETMASTER_API_KEY) {
            try {
                let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&city=Las Vegas&size=20`;
                if (checkIn) tmUrl += `&startDateTime=${checkIn}T00:00:00Z`;
                if (checkOut) tmUrl += `&endDateTime=${checkOut}T23:59:59Z`;

                const tmRes = await fetch(tmUrl);
                if (tmRes.ok) {
                    const tmData = await tmRes.json();
                    if (tmData._embedded && tmData._embedded.events) {
                        numEvents += tmData._embedded.events.length;
                        tmData._embedded.events.forEach(e => {
                            eventsText.push(e.name.toLowerCase());
                            const venue = e._embedded?.venues?.[0]?.name?.toLowerCase() || '';
                            eventsText.push(venue);
                            if (venue.includes('stadium') || venue.includes('sphere') || venue.includes('colosseum')) {
                                hasMassiveEvent = true;
                            }
                        });
                    }
                }
            } catch(e) {
                console.warn("Ticketmaster API failed", e);
            }
        }

        const combinedText = eventsText.join(" ");

        let compressionScore = 40; // Base
        compressionScore += Math.min(30, numEvents * 2); // +2 per event up to 30

        if (hasMassiveEvent) {
            compressionScore += 15;
        }

        const checkInDate = new Date(checkIn);
        const dayOfWeek = checkInDate.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat
        if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
            compressionScore += 10;
        }

        const tier1Keywords = ['f1', 'ces', 'super bowl', 'grand prix'];
        tier1Keywords.forEach(kw => {
            if (combinedText.includes(kw)) compressionScore += 5;
        });

        const tier2Keywords = ['stadium', 'raiders', 'festival', 'sphere', 'nfl'];
        tier2Keywords.forEach(kw => {
            if (combinedText.includes(kw)) compressionScore += 3;
        });

        compressionScore = Math.min(100, compressionScore);

        // Average price: 189 + (compressionScore - 40) * 8
        const averagePrice = 189 + (compressionScore - 40) * 8;

        let status = "Neutral Growth";
        if (compressionScore > 85) status = "Peak Saturation / Sold Out";
        else if (compressionScore > 60) status = "High Compression";
        else if (compressionScore < 30) status = "Contraction";

        return Response.json({
            data: {
                averagePrice,
                compressionScore,
                status
            },
            source: 'event-heuristic-v2',
            methodology: 'Compression score derived from Ticketmaster event density + weekly event listings'
        });

    } catch (error) {
        console.error("Hotel API Error:", error);
        return Response.json({
            data: {
                averagePrice: 489,
                compressionScore: 88,
                status: "High Compression"
            },
            source: 'fallback'
        }, { status: 200 });
    }
}
