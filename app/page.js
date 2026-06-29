"use client";

import { useAuth } from './contexts/AuthContext';
import { PulseProvider } from '../components/pulse/PulseContext';
import StakeholderToggle from '../components/pulse/StakeholderToggle';
import WeatherWidget from '../components/pulse/WeatherWidget';
import DailyBriefing from '../components/pulse/DailyBriefing';
import WeatherForecast from '../components/pulse/WeatherForecast';
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

        {/* --- ZONE 1: THE MORNING BRIEF --- */}
        <WeatherWidget />
        <WeatherForecast />
        <DailyBriefing />
        <div style={{ marginBottom: '2rem' }}></div>

        {/* --- ZONE 2 & 3: THE HEARTBEAT & BREAKDOWN --- */}
        {/* Dashboard Grid (Dynamic logic & remaining widgets live inside here) */}
        <DashboardGrid />

      </main>
    </PulseProvider>
  );
}
