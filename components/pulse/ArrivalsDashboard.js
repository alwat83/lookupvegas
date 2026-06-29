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
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>142,500</span>
          <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>+ 12% YoY</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next 2 Hours</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>3,420</span>
          <span style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 'bold' }}>Heavy Volume</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Next 24 Hours</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>31,820</span>
          <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 'bold' }}>+ 4% vs Yday</span>
        </div>

      </div>

      {/* Arrival Rate Banner */}
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 1.5rem', borderTop: '1px solid rgba(59, 130, 246, 0.2)', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#3b82f6', fontWeight: '600' }}>Arrival Rate</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.125rem' }}>1 plane every 2.8 mins</span>
      </div>

    </div>
  );
}
