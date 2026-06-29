"use client";

import React from 'react';
import { usePulse } from './PulseContext';

export default function WeatherWidget() {
  const { activeStakeholder } = usePulse();

  // Mock data for the demonstration
  const cviScore = 84;
  const weatherStatus = "Strong Demand";
  const weatherIcon = "☀️";
  const arrivalsToday = "142,500";
  const arrivalsTrend = "+12% WoW";
  const occupancy = "92%";
  const adr = "$289";

  return (
    <div className="card glass-panel weather-widget" style={{ marginBottom: '2rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .weather-hero {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .weather-icon-container {
          font-size: 5rem;
          line-height: 1;
          filter: drop-shadow(0 0 20px rgba(255, 200, 0, 0.4));
        }
        .weather-status h1 {
          font-size: 3rem;
          margin: 0;
          color: var(--text-primary);
          letter-spacing: -1px;
        }
        .weather-status p {
          color: var(--text-secondary);
          font-size: 1.25rem;
          margin: 0.5rem 0 0 0;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
        }
        
        .pulse-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          border-top: 1px solid var(--border-color);
          padding-top: 2rem;
        }
        .metric-box {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .metric-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .metric-trend {
          font-size: 0.875rem;
          color: #10b981; /* green */
          font-weight: 500;
        }
        
        .cvi-gauge {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 0.5rem;
        }
        .cvi-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #ef4444);
          width: ${cviScore}%;
        }

        @media (max-width: 768px) {
          .weather-hero {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }
          .weather-status h1 {
            font-size: 2.25rem;
          }
        }
      `}} />

      <div className="weather-hero">
        <div className="weather-icon-container">
          {weatherIcon}
        </div>
        <div className="weather-status">
          <h1>{weatherStatus}</h1>
          <p>The Daily Pulse of Las Vegas</p>
        </div>
      </div>

      <div className="pulse-metrics">
        <div className="metric-box">
          <span className="metric-label">City Velocity Index (CVI)</span>
          <span className="metric-value">{cviScore}/100</span>
          <div className="cvi-gauge"><div className="cvi-fill"></div></div>
        </div>

        <div className="metric-box">
          <span className="metric-label">Airport Arrivals Today</span>
          <span className="metric-value">{arrivalsToday}</span>
          <span className="metric-trend">↑ {arrivalsTrend}</span>
        </div>

        {(activeStakeholder === 'all' || activeStakeholder === 'hotel' || activeStakeholder === 'investor' || activeStakeholder === 'str') && (
          <div className="metric-box">
            <span className="metric-label">Strip Occupancy (Est)</span>
            <span className="metric-value">{occupancy}</span>
            <span className="metric-trend">High Compression</span>
          </div>
        )}

        {(activeStakeholder === 'all' || activeStakeholder === 'hotel' || activeStakeholder === 'casino' || activeStakeholder === 'str') && (
          <div className="metric-box">
            <span className="metric-label">Average Strip ADR</span>
            <span className="metric-value">{adr}</span>
            <span className="metric-trend">+$42 vs Last Week</span>
          </div>
        )}
      </div>
    </div>
  );
}
