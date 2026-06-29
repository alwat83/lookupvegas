"use client";

import React from 'react';

export default function WeatherForecast() {
  const forecasts = [
    { label: "TODAY", icon: "☀️", text: "Strong Demand", cvi: "84/100", confidence: "98%" },
    { label: "TOMORROW", icon: "🌤️", text: "Healthy Demand", cvi: "76/100", confidence: "92%" },
    { label: "7 DAYS", icon: "⛈️", text: "Demand Surge", cvi: "95/100", confidence: "85%" },
    { label: "30 DAYS", icon: "🌥️", text: "Moderating", cvi: "62/100", confidence: "72%" }
  ];

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <h3 className="card-title glow-text" style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Vegas Economic Weather Forecast</h3>
      
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        overflowX: 'auto', 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <style dangerouslySetInnerHTML={{__html: `
          .forecast-scroll::-webkit-scrollbar { display: none; }
        `}} />
        
        {forecasts.map((f, i) => (
          <div key={i} className="forecast-scroll" style={{ 
            minWidth: '160px', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '12px', 
            padding: '1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{f.label}</div>
            <div style={{ fontSize: '2.5rem', lineHeight: '1', marginBottom: '0.5rem' }}>{f.icon}</div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{f.text}</div>
            
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CVI</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{f.cvi}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Conf</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{f.confidence}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
