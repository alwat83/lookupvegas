"use client";

import React from 'react';

export default function DriverPanel() {
  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Driver Operations Pulse</h3>
        <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 'bold' }}>
          SURGE PREDICTED
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Terminal Split */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Harry Reid Arrivals (Next 2 Hrs)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Terminal 1</span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>3,420 pax</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                <div style={{ width: '65%', height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Terminal 3</span>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>1,850 pax</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                <div style={{ width: '35%', height: '100%', background: '#ef4444', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Convention Exits */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Convention Exit Surges</h4>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', minWidth: '60px' }}>5:00 PM</div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>AWS re:Invent</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Venetian Expo (High Demand)</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ color: '#10b981', fontWeight: 'bold', minWidth: '60px' }}>6:30 PM</div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>ISSA Show</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Mandalay Bay (Med Demand)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
