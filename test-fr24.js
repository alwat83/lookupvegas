const https = require('https');

const options = {
    hostname: 'api.flightradar24.com',
    path: '/common/v1/airport.json?code=las&plugin[]=&plugin-setting[schedule][mode]=&plugin-setting[schedule][timestamp]=&page=1&limit=100',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Status code:', res.statusCode);
            if (json.result && json.result.response && json.result.response.airport) {
                const arrivals = json.result.response.airport.pluginData.schedule.arrivals.data;
                const departures = json.result.response.airport.pluginData.schedule.departures.data;
                console.log(`Success! Found ${arrivals.length} arrivals and ${departures.length} departures.`);
                console.log('Sample arrival:', arrivals[0].flight.identification.callsign);
            } else {
                console.log('Unexpected JSON structure:', Object.keys(json));
            }
        } catch (e) {
            console.log('Parse Error:', e.message);
            console.log('Raw data snippet:', data.substring(0, 200));
        }
    });
});

req.on('error', error => {
    console.error('Request Error:', error);
});

req.end();
