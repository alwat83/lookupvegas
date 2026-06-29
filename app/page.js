"use client";

import { useAuth } from './contexts/AuthContext';
import { PulseProvider } from '../components/pulse/PulseContext';
import StakeholderToggle from '../components/pulse/StakeholderToggle';
import WeatherWidget from '../components/pulse/WeatherWidget';
import AiStory from '../components/pulse/AiStory';
import DashboardGrid from '../components/pulse/DashboardGrid';

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

        {/* Dashboard Grid (Dynamic logic lives inside here) */}
        <DashboardGrid />

      </main>
    </PulseProvider>
  );
}
