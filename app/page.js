"use client";

import { useAuth } from './contexts/AuthContext';
import dynamic from 'next/dynamic';
import { PulseProvider } from '../components/pulse/PulseContext';
import StakeholderToggle from '../components/pulse/StakeholderToggle';
import WeatherWidget from '../components/pulse/WeatherWidget';
import AiStory from '../components/pulse/AiStory';
import OriginMarkets from '../components/pulse/OriginMarkets';
import ForecastModule from '../components/pulse/ForecastModule';
import EventCalendar from '../components/pulse/EventCalendar';

const FlightMap = dynamic(() => import('../components/modules/FlightMap'), {
  ssr: false,
});

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="live-indicator"></div>
      </div>
    );
  }

  return (
    <PulseProvider>
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '6rem' }}>
        
        {/* Global Context Switcher */}
        <StakeholderToggle />

        {/* The Core Pulse */}
        <WeatherWidget />

        {/* Dynamic Commentary */}
        <AiStory />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-12" style={{ gap: '2rem' }}>
          
          {/* Main Airspace Radar (Takes up 12 cols on mobile, 8 on desktop) */}
          <div className="card glass-panel col-span-12 lg:col-span-8" style={{ padding: 0, overflow: 'hidden', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
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

          {/* Side panel for markets & calendar */}
          <div className="col-span-12 lg:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <OriginMarkets />
            <EventCalendar />
          </div>

          {/* Full width forecast at the bottom */}
          <div className="col-span-12">
            <ForecastModule />
          </div>

        </div>
      </main>
    </PulseProvider>
  );
}
