"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { day: 'T-7', current: 82, history: 81 },
  { day: 'T-6', current: 84, history: 83 },
  { day: 'T-5', current: 86, history: 85 },
  { day: 'T-4', current: 89, history: 88 },
  { day: 'T-3', current: 93, history: 90 },
  { day: 'T-2', current: 95, history: 92 },
  { day: 'T-1', current: 97, history: 95 },
  { day: 'Day 0', current: null, history: 98 },
  { day: 'Day 1', current: null, history: 99 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#16181D', border: '1px solid #262A33', padding: '0.75rem', borderRadius: '8px', color: '#fff' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label}</p>
        <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.875rem' }}>
          Current Trajectory: {payload[0].value ? `${payload[0].value}% Occ` : 'TBD'}
        </p>
        <p style={{ margin: 0, color: '#8b5cf6', fontSize: '0.875rem' }}>
          Historical Echo: {payload[1].value}% Occ
        </p>
      </div>
    );
  }
  return null;
};

export default function HistoricalEcho() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 className="card-title glow-text" style={{ margin: '0 0 0.25rem 0' }}>Historical Echo Engine™</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Comparing current inbound demand velocity against past anomalies.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Match</span>
          <div style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Super Bowl LVIII Weekend</div>
          <div style={{ color: '#10b981', fontSize: '0.875rem' }}>94% Correlation Score</div>
        </div>
      </div>

      <div style={{ height: '300px', width: '100%', minWidth: 0, minHeight: 0 }}>
        {mounted ? (
          <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262A33" vertical={false} />
              <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="history" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorHistory)" name="Historical Match" />
              <Area type="monotone" dataKey="current" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" name="Current Trajectory" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="live-indicator"></span>
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Echo Insight:</span>
        <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
          Current demand is tracking 2.1% higher than the Super Bowl LVIII build-up at T-1. Prepare for unprecedented mid-Strip congestion tomorrow between 2 PM and 7 PM.
        </span>
      </div>
    </div>
  );
}
