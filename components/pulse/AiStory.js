"use client";

import React from 'react';
import { usePulse } from './PulseContext';

export default function AiStory() {
  const { activeStakeholder } = usePulse();

  const getStory = () => {
    switch (activeStakeholder) {
      case 'casino':
        return "High-roller inbound volume is peaking. Private jet arrivals at LAS have spiked 15% above the 30-day average. Expect intense gaming volume on the Strip tonight.";
      case 'hotel':
        return "Strip compression is severe due to the AWS re:Invent spillover and a sold-out Sphere residency. ADR is holding strong, suggesting minimal last-minute cancellations.";
      case 'restaurant':
        return "Peak dining congestion expected between 6 PM and 8 PM as 40,000 convention attendees exit the Venetian Expo. Demand is strongly concentrated mid-Strip.";
      case 'driver':
        return "Surge pricing likely at Harry Reid Airport between 2 PM and 5 PM. Avoid Tropicana Ave due to heavy inbound convention traffic.";
      case 'str':
        return "Short-term rental demand is pushing outward from the Strip. Properties in Spring Valley and Henderson are seeing unusual weekday bookings.";
      case 'worker':
        return "Traffic will be unusually heavy on the I-15 Northbound starting at 3 PM. It's a busy day in the city—expect high volume if working near the Strip.";
      default:
        return "Demand is accelerating today due to elevated West Coast arrivals, a sold-out Eagles residency at the Sphere, and the arrival of 40,000 AWS re:Invent attendees. Expect peak Strip congestion between 4 PM and 7 PM.";
    }
  };

  return (
    <div className="ai-story glass-panel card" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .ai-story-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #8b5cf6;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.875rem;
        }
        .ai-story-content {
          font-size: 1.25rem;
          line-height: 1.6;
          color: var(--text-primary);
          font-weight: 400;
        }
        .ai-sparkle {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; filter: drop-shadow(0 0 5px #8b5cf6); }
          100% { opacity: 0.5; }
        }
      `}} />
      <div className="ai-story-header">
        <span className="ai-sparkle">✨</span> Today's Market Story
      </div>
      <div className="ai-story-content">
        "{getStory()}"
      </div>
    </div>
  );
}
