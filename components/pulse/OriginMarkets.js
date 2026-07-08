"use client";

import React, { useState, useEffect } from 'react';

const AIRLINE_NAMES = {
  'SWA': 'Southwest', 'AAL': 'American', 'DAL': 'Delta', 'UAL': 'United',
  'JBU': 'JetBlue', 'NKS': 'Spirit', 'FFT': 'Frontier', 'ASA': 'Alaska',
  'AAY': 'Allegiant', 'SKW': 'SkyWest', 'BAW': 'British Airways',
  'VIR': 'Virgin Atlantic', 'ACA': 'Air Canada', 'KAL': 'Korean Air'
};

export default function OriginMarkets() {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/flights/arrivals');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const grouped = {};
            json.data.forEach(flight => {
              const callsign = flight.callsign || '';
              let prefix = '';
              for (const p of Object.keys(AIRLINE_NAMES)) {
                if (callsign.startsWith(p)) {
                  prefix = p;
                  break;
                }
              }
              if (!prefix) prefix = 'OTHER';

              if (!grouped[prefix]) {
                grouped[prefix] = {
                  code: prefix,
                  name: AIRLINE_NAMES[prefix] || 'Other/Private',
                  count: 0,
                  pax: 0,
                  types: {}
                };
              }
              grouped[prefix].count += 1;
              grouped[prefix].pax += flight.estimatedPassengers || 0;
              
              if (flight.type) {
                grouped[prefix].types[flight.type] = (grouped[prefix].types[flight.type] || 0) + 1;
              }
            });

            const result = Object.values(grouped).map(g => {
              const topType = Object.keys(g.types).sort((a, b) => g.types[b] - g.types[a])[0] || 'VARIOUS';
              return { ...g, topType };
            });

            result.sort((a, b) => b.pax - a.pax);
            setAirlines(result.slice(0, 5)); // top 5
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Live Airline Activity</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>📡 Live ADS-B</span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 0' }}>Airline</th>
              <th style={{ padding: '0.75rem 0' }}>Active Flights</th>
              <th style={{ padding: '0.75rem 0' }}>Est. Pax</th>
              <th style={{ padding: '0.75rem 0' }}>Top Aircraft</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading live data...</td></tr>
            ) : airlines.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No flights currently detected</td></tr>
            ) : (
              airlines.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: '500', color: 'var(--text-primary)' }}>{a.name}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{a.count}</td>
                  <td style={{ padding: '1rem 0', color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>{a.pax.toLocaleString()}</td>
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{a.topType}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
        Data source: ADSB.lol ADS-B telemetry. Passenger counts are estimates based on aircraft type × 85% load factor.
      </div>
    </div>
  );
}
