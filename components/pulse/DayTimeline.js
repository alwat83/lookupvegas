"use client";

import React, { useState, useEffect } from 'react';

export default function DayTimeline() {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Update current hour occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeline = [
    { time: "6 AM", hour: 6, label: "Quiet", icon: "🌅" },
    { time: "10 AM", hour: 10, label: "Airport Surge", icon: "🛬" },
    { time: "2 PM", hour: 14, label: "Convention Traffic", icon: "👔" },
    { time: "6 PM", hour: 18, label: "Dinner Rush", icon: "🍽️" },
    { time: "9 PM", hour: 21, label: "Casino Peak", icon: "🎰" },
    { time: "1 AM", hour: 1, label: "Nightlife Peak", icon: "🍾" }
  ];

  // Helper to determine if a block is active or past
  const getStatus = (hour, nextHour) => {
    // Handle the 1 AM wrap-around logic simplified for UI
    let mappedCurrent = currentHour;
    if (mappedCurrent < 6) mappedCurrent += 24; // map 1am-5am to 25-29
    
    let mappedHour = hour;
    if (mappedHour < 6) mappedHour += 24;
    
    let mappedNext = nextHour;
    if (mappedNext === undefined) mappedNext = 30; // 6am next day
    if (mappedNext < 6) mappedNext += 24;

    if (mappedCurrent >= mappedHour && mappedCurrent < mappedNext) return 'active';
    if (mappedCurrent >= mappedNext) return 'past';
    return 'future';
  };

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', overflow: 'hidden' }}>
      <h3 className="card-title glow-text" style={{ margin: '0 0 1.5rem 0' }}>Vegas Through The Day</h3>
      
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'space-between' }}>
        {/* Connecting line */}
        <div style={{ position: 'absolute', top: '20px', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>
        
        {timeline.map((item, i) => {
          const nextHour = i < timeline.length - 1 ? timeline[i+1].hour : undefined;
          const status = getStatus(item.hour, nextHour);
          
          return (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              zIndex: 1,
              width: '100px',
              opacity: status === 'past' ? 0.5 : 1
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: status === 'active' ? '#3b82f6' : 'rgba(0,0,0,0.8)',
                border: `2px solid ${status === 'active' ? '#60a5fa' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                boxShadow: status === 'active' ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none',
                transition: 'all 0.3s'
              }}>
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              </div>
              
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 'bold', 
                color: status === 'active' ? '#60a5fa' : 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                {item.time}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
