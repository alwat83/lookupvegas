const cheerio = require('cheerio');

async function testSource(url, selectors) {
    try {
        console.log(`\nFetching ${url}...`);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        const $ = cheerio.load(html);
        
        for (const selector of selectors) {
            const count = $(selector).length;
            console.log(`- '${selector}': ${count} elements`);
            if (count > 0 && count < 100) {
                console.log(`  Sample: ${$(selector).first().text().replace(/\s+/g, ' ').trim().substring(0, 100)}`);
            }
        }
    } catch (e) {
        console.log(`Failed to fetch ${url}: ${e.message}`);
    }
}

async function run() {
    await testSource('https://www.vegas.com/shows/', ['.info-container', '.show-title', 'h3', '.st-title']);
    await testSource('https://lasvegasweekly.com/events/', ['.calendar-event', '.listing', 'article', 'h3', '.title']);
    await testSource('https://www.eventbrite.com/d/nv--las-vegas/events/', ['h3', '.event-card__title']);
}

run();
