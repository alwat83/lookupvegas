"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './contexts/AuthContext';
import Hero from '../components/Hero';
import DataLayer from '../components/marketing/DataLayer';
import CustomerProfiles from '../components/marketing/CustomerProfiles';
import IntelligenceEngine from '../components/marketing/IntelligenceEngine';
import FeaturesSection from '../components/marketing/FeaturesSection';
import BlurredGate from '../components/marketing/BlurredGate';
import VelocityChart from '../components/modules/VelocityChart';
import dynamic from 'next/dynamic';
import IntelligencePreview from '../components/modules/IntelligencePreview';

const FlightMap = dynamic(() => import('../components/modules/FlightMap'), {
  ssr: false,
});

import TrustMetrics from '../components/TrustMetrics';

export default function Home() {
  const { user, loading } = useAuth();

  // If loading auth state, show a subtle pulse
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div className="live-indicator"></div>
      </div>
    );
  }

  return (
    <main>
      <Hero />
      <TrustMetrics />
      <DataLayer />
      <CustomerProfiles />
      <IntelligenceEngine />
      <FeaturesSection />
      
      <div className="container" style={{ marginBottom: '6rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem', color: 'var(--text-primary)' }}>
          Preview the <span className="glow-text">Terminal</span>
        </h2>
        
        <div className="grid grid-cols-12">
          {/* Main Chart Column (12 span) */}
          <div className="card glass-panel" style={{ gridColumn: 'span 12', marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
            <BlurredGate 
                title="Historical CVI Data Locked" 
                description="Sign up to view 30-day historical compression trends and predictive analytics for Las Vegas."
            >
                <div style={{ padding: '1.5rem' }}>
                    <div className="card-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="card-title glow-text">City Velocity Index — 30 Day Trailing</h3>
                    </div>
                    <VelocityChart />
                </div>
            </BlurredGate>
          </div>

          {/* Main Map Column (12 span) */}
          <div className="card glass-panel" style={{ gridColumn: 'span 12', padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex' }}>
            <BlurredGate 
                title="Live 3D Radar Locked" 
                description="Experience the true volume of inbound flights and VIP arrivals with our real-time 3D airspace terminal."
            >
                <div style={{ flex: 1, height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div className="card-header" style={{ padding: '1.5rem 1.5rem 0' }}>
                        <h3 className="card-title glow-text">Live Vegas Airspace (3D Radar)</h3>
                    </div>
                    <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
                        <IntelligencePreview />
                    </div>
                    <div style={{ flex: 1, minHeight: '600px', pointerEvents: 'none' }}>
                        <FlightMap />
                    </div>
                </div>
            </BlurredGate>
          </div>

        </div>
      </div>
    </main>
  );
}
