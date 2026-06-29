"use client";

import React from 'react';

export default function RiskRadar() {
  const risks = [
    { text: "Center Strip approaching capacity.", severity: "Critical", color: "#ef4444" },
    { text: "Airport arrivals accelerating.", severity: "High", color: "#f59e0b" },
    { text: "Heavy traffic expected after Sphere events.", severity: "High", color: "#f59e0b" },
    { text: "Staffing shortages may impact service levels.", severity: "Medium", color: "#3b82f6" }
  ];

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0, color: '#ef4444' }}>Things To Watch</h3>
        <span style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} className="pulse-anim"></span>
          Pressure Points
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {risks.map((risk, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(0,0,0,0.3)', 
            padding: '1rem', 
            borderRadius: '8px',
            borderLeft: `3px solid ${risk.color}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{risk.text}</span>
            </div>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 'bold', 
              color: risk.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {risk.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
