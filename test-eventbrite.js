const cheerio = require('cheerio');

async function testEventbrite() {
    try {
        const url = 'https://www.eventbrite.com/d/nv--las-vegas/events/';
        console.log(`Fetching ${url}...`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        
        let events = [];
        
        // Eventbrite often uses structured data (JSON-LD) or specific classes
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                if (Array.isArray(json)) {
                    json.forEach(item => {
                        if (item['@type'] === 'Event') {
                            events.push({
                                name: item.name,
                                date: item.startDate,
                                venue: item.location?.name || 'Las Vegas'
                            });
                        }
                    });
                } else if (json['@type'] === 'Event') {
                    events.push({
                        name: json.name,
                        date: json.startDate,
                        venue: json.location?.name || 'Las Vegas'
                    });
                }
            } catch(e) {}
        });

        console.log(`Found ${events.length} events from JSON-LD.`);
        if (events.length > 0) {
            console.log(events.slice(0, 5));
        } else {
            console.log("No JSON-LD events found. Trying HTML parsing...");
            // Eventbrite uses highly obfuscated classes like '.eds-event-card-content__title'
            // We can search for article or section or simply h3.
            $('h3').slice(0, 5).each((i, el) => {
                const title = $(el).text().trim();
                // We'd have to traverse to find date/venue, which is fragile on Eventbrite.
                console.log("H3:", title);
            });
        }
    } catch (e) {
        console.log(`Failed to fetch: ${e.message}`);
    }
}

testEventbrite();
