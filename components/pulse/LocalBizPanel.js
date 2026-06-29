"use client";

import React from 'react';

export default function LocalBizPanel() {
  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Local Business & STR Pulse</h3>
        <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 'bold' }}>
          HIGH SPILLOVER
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Foot Traffic Predictor */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Off-Strip Foot Traffic Scores</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>Arts District</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>Chinatown (Spring Mtn)</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>Summerlin / Tivoli</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
                <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dining & STR Insights */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Demand Timing</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.25rem' }}>Peak Dining Rush</div>
            <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: 'bold' }}>6:45 PM - 8:30 PM</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Driven by convention exits.</div>
          </div>

          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.25rem' }}>STR Booking Velocity</div>
            <div style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>+24% (Spring Valley)</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Spillover from Strip sellouts.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
