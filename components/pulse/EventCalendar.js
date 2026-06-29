"use client";

import React from 'react';

export default function EventCalendar() {
  const events = [
    { name: "AWS re:Invent 2026", type: "Convention", impact: "High", attendees: "65,000", venue: "Venetian / Mandalay Bay" },
    { name: "Eagles Residency", type: "Concert", impact: "Medium", attendees: "18,000", venue: "Sphere" },
    { name: "Raiders vs. Chiefs", type: "Sports", impact: "Very High", attendees: "65,000", venue: "Allegiant Stadium" }
  ];

  return (
    <div className="card glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Event Impact Tracker</h3>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Historical Echo: <strong style={{ color: '#8b5cf6' }}>Similar to Super Bowl LVIII Weekend</strong>
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {events.map((e, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            borderLeft: e.impact === 'Very High' ? '4px solid #ef4444' : e.impact === 'High' ? '4px solid #f59e0b' : '4px solid #3b82f6'
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.125rem' }}>{e.name}</h4>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{e.venue} • {e.type}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{e.attendees} Pax</div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: e.impact === 'Very High' ? '#ef4444' : e.impact === 'High' ? '#f59e0b' : '#3b82f6' 
              }}>
                {e.impact} Impact
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
