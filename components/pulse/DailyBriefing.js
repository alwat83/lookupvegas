"use client";

import React, { useState, useEffect } from 'react';

export default function DailyBriefing() {
  const [time, setTime] = useState('');
  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  return (
    <div className="card glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(22, 24, 29, 0.9) 0%, rgba(38, 42, 51, 0.9) 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Glow */}
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#3b82f6', filter: 'blur(80px)', opacity: 0.3, zIndex: 0 }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Good Morning, Las Vegas.
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            {time}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>☀️</span>
          <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.125rem' }}>Strong Demand</span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#3b82f6', marginTop: '2px' }}>✈️</span>
            <span style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>Airport arrivals are up <strong>12%</strong> YoY.</span>
          </li>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#ef4444', marginTop: '2px' }}>🏨</span>
            <span style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>Center Strip occupancy has exceeded <strong>95%</strong>.</span>
          </li>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#f59e0b', marginTop: '2px' }}>🚕</span>
            <span style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>Expect significant rideshare demand between 4 PM and 8 PM due to convention exits.</span>
          </li>
          <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#8b5cf6', marginTop: '2px' }}>🕰️</span>
            <span style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>The city is currently tracking similarly to <strong>Super Bowl LVIII weekend</strong>.</span>
          </li>
        </ul>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.4)', 
            color: '#3b82f6', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Share Briefing
          </button>
        </div>
      </div>
    </div>
  );
}
