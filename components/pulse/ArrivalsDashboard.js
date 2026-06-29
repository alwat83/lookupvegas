"use client";

import React from 'react';

export default function ArrivalsDashboard() {
  return (
    <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 className="card-title glow-text" style={{ margin: '0 0 0.25rem 0' }}>Airport Arrivals</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Harry Reid International (LAS)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
          <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px #ef4444' }} className="pulse-anim"></div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulseLive {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
            .pulse-anim { animation: pulseLive 2s infinite; }
          `}} />
          <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>LIVE</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Today</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>82,400</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>↑ 3%</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>vs seasonal avg</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next 2 Hours</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>3,420</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 'bold' }}>Heavy Volume</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next 24 Hours</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>31,820</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>↑ 4%</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>vs yesterday</span>
          </div>
        </div>

      </div>

      {/* Arrival Rate Banner */}
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 1.5rem', borderTop: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#3b82f6', fontWeight: '600' }}>Arrival Rate</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.125rem' }}>1 plane every 2.8 mins</span>
      </div>

      {/* Contextual Insights */}
      <div style={{ padding: '1.5rem', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Average Day Baseline:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.875rem' }}>~80,000 arrivals</span>
        </div>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', marginTop: '-2px' }}>🏟️</span>
            <div>
              <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '0.25rem' }}>Scale of Today's Influx</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.4', display: 'block' }}>
                Today's arrivals are equivalent to filling <strong>Allegiant Stadium 1.25x</strong>. The population of a small city is moving into Las Vegas today, pushing hotel compression above normal levels.
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
