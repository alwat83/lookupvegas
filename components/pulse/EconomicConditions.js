"use client";

import React from 'react';

export default function EconomicConditions() {
  const areas = [
    { name: "Airport (LAS)", status: "Busy", color: "#10b981", dot: "🟢" },
    { name: "Center Strip", status: "Packed", color: "#ef4444", dot: "🔴" },
    { name: "Convention Center", status: "Active", color: "#f59e0b", dot: "🟡" },
    { name: "Downtown (Fremont)", status: "Moderate", color: "#10b981", dot: "🟢" },
    { name: "West Side", status: "Quiet", color: "#10b981", dot: "🟢" }
  ];

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Economic Conditions</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Live Traffic</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {areas.map((area, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: i !== areas.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{area.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem' }}>{area.dot}</span>
              <span style={{ color: area.color, fontSize: '0.875rem', fontWeight: 'bold' }}>{area.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
