import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');
  const volumeThreshold = searchParams.get('volume') || 1;

  if (!origin || !date_from || !date_to) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // In a real scenario, this would aggregate data from Amadeus/Kiwi + internal DBs.
  // For now, we return highly structured, institutional-grade mock data.
  
  // Calculate date diff in days for dynamic mocking
  const d1 = new Date(date_from);
  const d2 = new Date(date_to);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  
  // Base metrics that scale with days and volume
  const baseFlightsPerDay = 15;
  const seatsPerFlight = 160;
  
  const totalFlights = baseFlightsPerDay * diffDays * (origin.toUpperCase() === 'JFK' ? 1.5 : 1);
  const totalSeats = Math.floor(totalFlights * seatsPerFlight);
  const yoyGrowth = (Math.random() * 15 + 2).toFixed(1); // Random growth between 2-17%
  
  const compressionScore = Math.min(100, Math.floor(65 + (totalSeats / 500) + (Math.random() * 20)));
  const adrPremium = Math.floor(compressionScore * 1.5);
  
  // Mock capacity chart data (daily breakdown)
  const capacityData = [];
  for (let i = 0; i <= diffDays; i++) {
      const currentDate = new Date(d1);
      currentDate.setDate(d1.getDate() + i);
      const dayStr = currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 5 || currentDate.getDay() === 6;
      const dailySeats = Math.floor(totalSeats / diffDays) * (isWeekend ? 1.4 : 0.8);
      
      capacityData.push({
          date: dayStr,
          seats: Math.floor(dailySeats),
          historical: Math.floor(dailySeats * 0.92) // 8% growth assumption
      });
  }

  // Mock underlying telemetry (Raw flights)
  const airlines = [
      { code: "DL", name: "Delta Air Lines", flights: Math.floor(totalFlights * 0.4) },
      { code: "UA", name: "United Airlines", flights: Math.floor(totalFlights * 0.3) },
      { code: "NK", name: "Spirit Airlines", flights: Math.floor(totalFlights * 0.2) },
      { code: "AA", name: "American Airlines", flights: Math.floor(totalFlights * 0.1) }
  ];

  return NextResponse.json({
      meta: {
          origin: origin.toUpperCase(),
          destination: 'LAS',
          dateRange: { start: date_from, end: date_to },
          confidence_score: 94,
          generated_at: new Date().toISOString()
      },
      executive_summary: {
          projected_seats: totalSeats,
          yoy_growth: `+${yoyGrowth}%`,
          compression_index: compressionScore,
          est_adr_premium: `+$${adrPremium}/nt`
      },
      capacity_analysis: capacityData,
      market_signals: [
          { name: "Search Momentum", value: 85, trend: "up" },
          { name: "Booking Velocity", value: 72, trend: "up" },
          { name: "Capacity Delta", value: parseFloat(yoyGrowth), trend: "up" }
      ],
      event_correlation: [
          { name: "Major Convention/Trade Show", date: date_from, estimated_impact: "High" },
          { name: "Headline Residency Concert", date: date_to, estimated_impact: "Medium" }
      ],
      underlying_telemetry: airlines.map(a => ({
          airline: a.name,
          airline_code: a.code,
          scheduled_flights: a.flights,
          est_seats: a.flights * seatsPerFlight,
          avg_fare: Math.floor(150 + Math.random() * 200)
      }))
  });
}
