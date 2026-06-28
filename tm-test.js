const fetch = require('node-fetch');

async function testTM() {
    const apikey = "0zD76zQzkzntQ1ckJp9SAigfDwGglZSw";
    // Get current date in ISO format, round to seconds, append Z
    const now = new Date().toISOString().split('.')[0] + "Z";
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=Las%20Vegas&apikey=${apikey}&size=5&sort=date,asc&startDateTime=${now}`;
    
    console.log("Fetching:", url);
    const res = await fetch(url);
    const data = await res.json();
    
    if (data._embedded && data._embedded.events) {
        data._embedded.events.forEach(e => {
            console.log(e.name, e.dates.start.localDate, e._embedded?.venues?.[0]?.name);
        });
    } else {
        console.log("No events found or error:", data);
    }
}
testTM();
