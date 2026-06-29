"use client";

import React from 'react';

export default function WinnersWidget() {
  const winners = [
    { industry: "Casinos", icon: "🎰", status: "High Demand", color: "#10b981" },
    { industry: "Ride Share", icon: "🚕", status: "Surge Likely", color: "#f59e0b" },
    { industry: "Restaurants", icon: "🍽️", status: "Peak Dinner", color: "#ef4444" },
    { industry: "Hotels", icon: "🏨", status: "Compression Event", color: "#8b5cf6" },
    { industry: "Entertainment", icon: "🎭", status: "High Traffic", color: "#3b82f6" }
  ];

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Biggest Winners Today</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Beneficiaries</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {winners.map((winner, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(0,0,0,0.2)', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{winner.icon}</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{winner.industry}</span>
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 'bold', 
              color: winner.color,
              background: `rgba(${winner.color === '#ef4444' ? '239, 68, 68' : winner.color === '#f59e0b' ? '245, 158, 11' : winner.color === '#8b5cf6' ? '139, 92, 246' : winner.color === '#3b82f6' ? '59, 130, 246' : '16, 185, 129'}, 0.1)`,
              padding: '0.25rem 0.75rem',
              borderRadius: '12px'
            }}>
              {winner.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
