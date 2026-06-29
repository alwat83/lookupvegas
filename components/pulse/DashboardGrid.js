"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { usePulse } from './PulseContext';
import OriginMarkets from './OriginMarkets';
import ForecastModule from './ForecastModule';
import EventCalendar from './EventCalendar';
import DriverPanel from './DriverPanel';
import HotelPanel from './HotelPanel';
import LocalBizPanel from './LocalBizPanel';
import HistoricalEcho from './HistoricalEcho';

// Phase 4 New Widgets
import ArrivalsDashboard from './ArrivalsDashboard';
import EconomicConditions from './EconomicConditions';
import WinnersWidget from './WinnersWidget';
import RiskRadar from './RiskRadar';
import DayTimeline from './DayTimeline';

const FlightMap = dynamic(() => import('../modules/FlightMap'), {
  ssr: false,
});

export default function DashboardGrid() {
  const { activeStakeholder } = usePulse();

  return (
    <div className="dashboard-grid">
      <style dangerouslySetInnerHTML={{__html: `
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 2rem;
        }
        .grid-radar {
          grid-column: span 12;
          min-width: 0;
          min-height: 0;
        }
        .grid-side {
          grid-column: span 12;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          min-width: 0;
          min-height: 0;
        }
        .grid-full {
          grid-column: span 12;
          min-width: 0;
          min-height: 0;
        }
        .grid-half {
          grid-column: span 12;
          min-width: 0;
          min-height: 0;
        }
        
        @media (min-width: 1024px) {
          .grid-radar {
            grid-column: span 7;
          }
          .grid-side {
            grid-column: span 5;
          }
          .grid-half {
            grid-column: span 6;
          }
        }
      `}} />

      {/* Dynamic Stakeholder Panels */}
      {(activeStakeholder === 'driver') && (
        <div className="grid-full">
          <DriverPanel />
        </div>
      )}
      {(activeStakeholder === 'hotel' || activeStakeholder === 'casino') && (
        <div className="grid-full">
          <HotelPanel />
        </div>
      )}
      {(activeStakeholder === 'restaurant' || activeStakeholder === 'str') && (
        <div className="grid-full">
          <LocalBizPanel />
        </div>
      )}

      {/* --- ZONE 2: THE HEARTBEAT --- */}
      {/* Side panel for Arrivals (Huge focal point) */}
      <div className="grid-side">
        <ArrivalsDashboard />
        <OriginMarkets />
      </div>

      {/* Main Airspace Radar (Takes up 12 cols on mobile, 7 on desktop) */}
      <div className="card glass-panel grid-radar" style={{ padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header" style={{ padding: '1.5rem 1.5rem 0' }}>
          <h3 className="card-title glow-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-indicator"></span> Live Vegas Airspace (3D Radar)
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Tracking inbound commercial and private aviation.
          </p>
        </div>
        <div style={{ flex: 1, minHeight: '500px' }}>
          <FlightMap />
        </div>
      </div>

      {/* --- ZONE 3: THE BREAKDOWN --- */}
      <div className="grid-full">
        <DayTimeline />
      </div>

      <div className="grid-side">
        <EconomicConditions />
        <EventCalendar />
      </div>

      <div className="grid-radar">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <WinnersWidget />
          <RiskRadar />
        </div>
      </div>

      {/* Deep Forecast */}
      <div className="grid-full" style={{ marginTop: '2rem' }}>
        <HistoricalEcho />
        <ForecastModule />
      </div>

    </div>
  );
}
