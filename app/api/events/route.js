export async function GET() {
    try {
        const apiKey = process.env.TICKETMASTER_API_KEY;

        if (!apiKey) {
            // Fallback Demo Data if no API key is present
            return Response.json({
                data: [
                    {
                        id: 'demo-1',
                        name: 'Formula 1 Heineken Silver Las Vegas Grand Prix',
                        date: '2026-11-21',
                        venue: 'Las Vegas Strip Circuit',
                        impact: 'Tier 1: High Impact',
                        impactScore: 98
                    },
                    {
                        id: 'demo-2',
                        name: 'U2: UV Achtung Baby Live',
                        date: '2026-03-15',
                        venue: 'Sphere at The Venetian Resort',
                        impact: 'Tier 2: Med Impact',
                        impactScore: 75
                    },
                    {
                        id: 'demo-3',
                        name: 'CES 2027 (Consumer Electronics Show)',
                        date: '2027-01-05',
                        venue: 'Las Vegas Convention Center',
                        impact: 'Tier 1: High Impact',
                        impactScore: 100
                    },
                    {
                        id: 'demo-4',
                        name: 'Cirque du Soleil - O',
                        date: '2026-03-10',
                        venue: 'Bellagio Hotel & Casino',
                        impact: 'Tier 3: Baseline',
                        impactScore: 40
                    }
                ],
                mock: true
            });
        }

        // Live Request Setup
        const now = new Date();
        const startDateTime = now.toISOString().split('.')[0] + 'Z';

        const tmRes = await fetch(
            `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=Las Vegas&sort=date,asc&startDateTime=${startDateTime}&size=10`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!tmRes.ok) {
            return Response.json({ error: "Upstream Events API error" }, { status: 502 });
        }

        const rawData = await tmRes.json();
        const events = rawData?._embedded?.events || [];

        // Parse into our structured classifier format
        const parsedEvents = events.map(evt => {
            const venueName = evt._embedded?.venues?.[0]?.name || 'Unknown Venue';

            // Simple Heuristic: If it's a massive venue, it's high impact.
            let impactScore = 50;
            let impactTier = 'Tier 2: Med Impact';

            const nameLower = (evt.name + venueName).toLowerCase();

            if (nameLower.includes('allegiant') || nameLower.includes('sphere') || nameLower.includes('grand prix') || nameLower.includes('festival')) {
                impactScore = 95;
                impactTier = 'Tier 1: High Impact';
            } else if (nameLower.includes('mgm grand garden') || nameLower.includes('t-mobile')) {
                impactScore = 75;
                impactTier = 'Tier 2: Med Impact';
            } else {
                impactScore = 30;
                impactTier = 'Tier 3: Baseline';
            }

            return {
                id: evt.id,
                name: evt.name,
                date: evt.dates?.start?.localDate,
                venue: venueName,
                impact: impactTier,
                impactScore: impactScore
            }
        });

        // Sort by highest impact first, then by date to show major pulse events
        parsedEvents.sort((a, b) => b.impactScore - a.impactScore);

        return Response.json({
            data: parsedEvents.slice(0, 5), // Top 5
            mock: false
        });

    } catch (error) {
        console.error("Events API Error:", error);
        return Response.json({ error: "Failed to fetch event data" }, { status: 500 });
    }
}
