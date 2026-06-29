"use client";

import React from 'react';

export default function OriginMarkets() {
  const markets = [
    { city: "Los Angeles", seats: "42,500", yoy: "+8.4%", fare: "$184", trend: "up", fill: 85 },
    { city: "Dallas", seats: "28,200", yoy: "+12.1%", fare: "$245", trend: "up", fill: 95 },
    { city: "Chicago", seats: "24,800", yoy: "-2.3%", fare: "$210", trend: "down", fill: 35 },
    { city: "New York", seats: "18,400", yoy: "+5.6%", fare: "$315", trend: "up", fill: 65 },
    { city: "Seattle", seats: "15,200", yoy: "+1.2%", fare: "$195", trend: "up", fill: 55 }
  ];

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Origin Market Pulse</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Live Capacity</span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 0' }}>Market</th>
              <th style={{ padding: '0.75rem 0' }}>Seats</th>
              <th style={{ padding: '0.75rem 0' }}>Fare</th>
              <th style={{ padding: '0.75rem 0', width: '80px' }}>Trajectory</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0', fontWeight: '500', color: 'var(--text-primary)' }}>{m.city}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{m.seats}</td>
                <td style={{ padding: '1rem 0', color: 'var(--text-secondary)' }}>{m.fare}</td>
                <td style={{ padding: '1rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${m.fill}%`, 
                        height: '100%', 
                        background: m.trend === 'up' ? '#10b981' : '#ef4444' 
                      }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: m.trend === 'up' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                      {m.yoy}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
