"use client";

import Hero from '../components/Hero';
import FlightSignals from '../components/modules/FlightSignals';
import CompressionZones from '../components/modules/CompressionZones';
import EventClassifier from '../components/modules/EventClassifier';
import VelocityChart from '../components/modules/VelocityChart';
import dynamic from 'next/dynamic';

const FlightMap = dynamic(() => import('../components/modules/FlightMap'), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <Hero />
      <div className="container">
        <div className="grid grid-cols-12">

          {/* Main Chart Column (12 span) */}
          <div className="card" style={{ gridColumn: 'span 12', marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <h3 className="card-title">City Velocity Index — 30 Day Trailing</h3>
              <span className="badge badge-growth">Live Telemetry</span>
            </div>
            <VelocityChart />
          </div>

          {/* Main Chart/Map Column (8 span) */}
          <div className="card" style={{ gridColumn: 'span 8', padding: '1rem' }}>
            <div className="card-header" style={{ marginBottom: '0.75rem', padding: '0 0.5rem' }}>
              <h3 className="card-title">Live Vegas Airspace (Radar)</h3>
              <span className="badge badge-growth">Live Telemetry</span>
            </div>
            <FlightMap />
          </div>

          {/* Right Sidebar (4 span) */}
          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <FlightSignals />
            <CompressionZones />
            <EventClassifier />
          </div>

        </div>
      </div>
    </main>
  );
}
