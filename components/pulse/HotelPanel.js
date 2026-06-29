"use client";

import React from 'react';

export default function HotelPanel() {
  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title glow-text" style={{ margin: 0 }}>Revenue & Compression Heatmap</h3>
        <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 'bold' }}>
          CITYWIDE SELLOUT LIKELY
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        
        {/* Compression Grid */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Sub-Market Compression</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>Center Strip</span>
              <span style={{ padding: '2px 8px', background: '#ef4444', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>98% OCC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>South Strip</span>
              <span style={{ padding: '2px 8px', background: '#f59e0b', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>91% OCC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>Downtown (FSE)</span>
              <span style={{ padding: '2px 8px', background: '#3b82f6', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>82% OCC</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-primary)' }}>Off-Strip Resort</span>
              <span style={{ padding: '2px 8px', background: '#10b981', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>76% OCC</span>
            </div>
          </div>
        </div>

        {/* Real-time RevPAR */}
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Live RevPAR Trajectory</h4>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>$264</span>
            <span style={{ color: '#10b981', fontWeight: '600' }}>+18% YoY</span>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
            Strong inbound flight volume implies last-minute bookings will close at premium rates. Do not yield remaining inventory.
          </p>
        </div>

      </div>
    </div>
  );
}
