"use client";

import React from 'react';

export default function ForecastModule() {
  const forecasts = [
    { period: "Tomorrow", occupancy: "94%", adr: "$310", risk: "High", outlook: "Peak convention exit overlap with weekend arrivals.", confidence: "98%" },
    { period: "Next 7 Days", occupancy: "88%", adr: "$265", risk: "Medium", outlook: "Slight dip mid-week before another strong weekend.", confidence: "85%" },
    { period: "Next 30 Days", occupancy: "85%", adr: "$240", risk: "Low", outlook: "Normalizing demand after CES/re:Invent seasonality.", confidence: "72%" }
  ];

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Vegas Demand Forecast</h3>
        <span style={{ fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold' }}>Driven by AI Echo Engine</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {forecasts.map((f, i) => (
          <div key={i} style={{ 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px', 
            padding: '1rem',
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Confidence: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{f.confidence}</span>
            </div>
            
            <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', fontSize: '1.125rem' }}>{f.period}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Projected Occ:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{f.occupancy}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>ADR Forecast:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{f.adr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Compression:</span>
              <span style={{ 
                fontWeight: 'bold', 
                color: f.risk === 'High' ? '#ef4444' : f.risk === 'Medium' ? '#f59e0b' : '#10b981' 
              }}>
                {f.risk} Risk
              </span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {f.outlook}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
