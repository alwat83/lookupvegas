"use client";

import React from 'react';

export default function OriginMarkets() {
  const markets = [
    { city: "Los Angeles", seats: "42,500", yoy: "+8.4%", fare: "$184", trend: "up" },
    { city: "Dallas", seats: "28,200", yoy: "+12.1%", fare: "$245", trend: "up" },
    { city: "Chicago", seats: "24,800", yoy: "-2.3%", fare: "$210", trend: "down" },
    { city: "New York", seats: "18,400", yoy: "+5.6%", fare: "$315", trend: "up" },
    { city: "Seattle", seats: "15,200", yoy: "+1.2%", fare: "$195", trend: "up" }
  ];

  return (
    <div className="card glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <h3 className="card-title glow-text" style={{ marginBottom: '1.5rem' }}>Top Origin Markets (Today)</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem 0' }}>Market</th>
              <th style={{ padding: '1rem 0' }}>Scheduled Seats</th>
              <th style={{ padding: '1rem 0' }}>Avg Fare</th>
              <th style={{ padding: '1rem 0', textAlign: 'right' }}>YoY Growth</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0', fontWeight: '500', color: 'var(--text-primary)' }}>{m.city}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{m.seats}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{m.fare}</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', color: m.trend === 'up' ? '#10b981' : '#ef4444' }}>
                  {m.yoy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
