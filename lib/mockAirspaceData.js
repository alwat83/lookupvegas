export const ORIGIN_MARKETS = [
    { name: 'Seattle', coordinates: [-122.3321, 47.6062], demandLevel: 'Surging', seats: 4500, growth: '+12%', fare: '$320', confidence: 92 },
    { name: 'New York', coordinates: [-74.0060, 40.7128], demandLevel: 'High', seats: 8200, growth: '+8%', fare: '$540', confidence: 88 },
    { name: 'Dallas', coordinates: [-96.7970, 32.7767], demandLevel: 'Elevated', seats: 5100, growth: '+4%', fare: '$210', confidence: 95 },
    { name: 'Los Angeles', coordinates: [-118.2437, 34.0522], demandLevel: 'Surging', seats: 12400, growth: '+18%', fare: '$110', confidence: 98 },
    { name: 'Chicago', coordinates: [-87.6298, 41.8781], demandLevel: 'Normal', seats: 6300, growth: '-2%', fare: '$380', confidence: 85 },
    { name: 'Miami', coordinates: [-80.1918, 25.7617], demandLevel: 'High', seats: 3800, growth: '+14%', fare: '$410', confidence: 89 },
    { name: 'Atlanta', coordinates: [-84.3880, 33.7490], demandLevel: 'Elevated', seats: 5900, growth: '+6%', fare: '$290', confidence: 91 }
];

export const VEGAS_COORDS = [-115.1398, 36.1699];

// Generate synthetic flights that are currently in the air
export const generateMockFlights = (count = 20) => {
    const flights = [];
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
        const origin = ORIGIN_MARKETS[Math.floor(Math.random() * ORIGIN_MARKETS.length)];
        
        // Random progress between 0 (just took off) and 1 (landing)
        const progress = Math.random();
        
        flights.push({
            id: `FL-${Math.floor(Math.random() * 9000) + 1000}`,
            airline: ['AA', 'DL', 'WN', 'UA', 'NK'][Math.floor(Math.random() * 5)],
            origin: origin,
            target: VEGAS_COORDS,
            progress: progress, // for animation
            passengers: Math.floor(Math.random() * 150) + 50,
            cviImpact: parseFloat((Math.random() * 0.4 + 0.1).toFixed(2))
        });
    }
    return flights;
};
