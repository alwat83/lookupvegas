const cheerio = require('cheerio');

async function testSongkick() {
    try {
        const url = 'https://www.songkick.com/metro-areas/8396-us-las-vegas';
        console.log(`Fetching ${url}...`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const events = [];
        $('.event-listings li').each((i, el) => {
            const title = $(el).find('.primary-detail, p.artists').text().replace(/\s+/g, ' ').trim();
            const venue = $(el).find('.secondary-detail, .venue-name').text().replace(/\s+/g, ' ').trim();
            const date = $(el).attr('title') || $(el).find('.date, time').text().replace(/\s+/g, ' ').trim();
            if (title) {
                events.push({ title, venue, date });
            }
        });
        
        console.log(`Found ${events.length} events from Songkick.`);
        console.log(events.slice(0, 5));
        
    } catch (e) {
        console.log(`Failed to fetch: ${e.message}`);
    }
}

testSongkick();
