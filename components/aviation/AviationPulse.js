"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Users, Zap, Activity } from 'lucide-react';

export default function AviationPulse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/aviation/snapshot');
        if (!res.ok) throw new Error('Failed to fetch aviation data');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>Loading Aviation Pulse...</div>;
  }

  if (error || !data || !data.currentSnapshot) {
    return <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>Error loading data.</div>;
  }

  const { currentSnapshot, weather, dataProvenance } = data;
  const netFlowColor = currentSnapshot.netFlow.direction === 'INBOUND' ? '#10b981' : (currentSnapshot.netFlow.direction === 'OUTBOUND' ? '#ef4444' : 'var(--text-primary)');
  const netFlowPercent = currentSnapshot.outboundFlights + currentSnapshot.inboundFlights > 0 ? (currentSnapshot.inboundFlights / (currentSnapshot.outboundFlights + currentSnapshot.inboundFlights)) * 100 : 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Row 1: Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} style={cardStyle}>
          <div style={labelStyle}><Plane size={14} /> Inbound Flights</div>
          <div style={valueStyle}>{currentSnapshot.inboundFlights}</div>
        </motion.div>
        
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}} style={cardStyle}>
          <div style={labelStyle}><Plane size={14} style={{transform: 'rotate(180deg)'}}/> Outbound Flights</div>
          <div style={valueStyle}>{currentSnapshot.outboundFlights}</div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}} style={cardStyle}>
          <div style={labelStyle}><Users size={14} /> Est. Arrivals</div>
          <div style={valueStyle}>{currentSnapshot.estimatedArrivingPax.toLocaleString()}</div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.3}} style={cardStyle}>
          <div style={labelStyle}><Zap size={14} color="var(--primary-color)"/> Private Jet Index</div>
          <div style={{...valueStyle, color: 'var(--primary-color)'}}>{currentSnapshot.privateJetIndex.toFixed(1)}x</div>
        </motion.div>
      </div>

      {/* Row 2: Net Flow */}
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: 0.4}} style={{...cardStyle, background: `linear-gradient(90deg, rgba(239, 68, 68, 0.05), rgba(16, 185, 129, 0.05))`}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>OUTBOUND</span>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Flow</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: netFlowColor, fontFamily: 'monospace' }}>
              {currentSnapshot.netFlow.value} {currentSnapshot.netFlow.direction}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'inline-block' }}>
              {currentSnapshot.demandPressure}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>INBOUND</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
           <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${netFlowPercent}%`, background: netFlowColor, transition: 'width 1s ease' }}></div>
        </div>
      </motion.div>

      {/* Row 3: Aircraft Mix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.5}} style={{...cardStyle, display: 'flex', alignItems: 'center', gap: '2rem'}}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: `conic-gradient(
              #00f2fe 0% ${currentSnapshot.aircraftMix.commercial}%, 
              #fbbf24 ${currentSnapshot.aircraftMix.commercial}% ${currentSnapshot.aircraftMix.commercial + currentSnapshot.aircraftMix.private}%, 
              #9ca3af ${currentSnapshot.aircraftMix.commercial + currentSnapshot.aircraftMix.private}% ${currentSnapshot.aircraftMix.commercial + currentSnapshot.aircraftMix.private + currentSnapshot.aircraftMix.cargo}%, 
              #4b5563 ${currentSnapshot.aircraftMix.commercial + currentSnapshot.aircraftMix.private + currentSnapshot.aircraftMix.cargo}% 100%
            )`,
            position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', background: '#0f172a', borderRadius: '50%' }}></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#00f2fe'}}>● Commercial</span> <span>{currentSnapshot.aircraftMix.commercial}%</span></div>
            <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#fbbf24'}}>● Private</span> <span>{currentSnapshot.aircraftMix.private}%</span></div>
            <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#9ca3af'}}>● Cargo</span> <span>{currentSnapshot.aircraftMix.cargo}%</span></div>
            <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}><span style={{color: '#4b5563'}}>● Other</span> <span>{currentSnapshot.aircraftMix.other}%</span></div>
          </div>
        </motion.div>

        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.6}} style={{...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Aircraft Mix Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: 1 }}>{currentSnapshot.aircraftMixScore.toFixed(1)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Higher score indicates more widebodies and private jets</div>
        </motion.div>
      </div>

      {/* Row 4: Weather */}
      {weather && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.7}} style={{...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Weather</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{weather.temp}°F</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Wind</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{weather.wind} mph</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Conditions</div>
              <div style={{ fontSize: '1.1rem' }}>{weather.conditions}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: weather.impactScore > 50 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: weather.impactScore > 50 ? '#ef4444' : '#10b981', borderRadius: '4px', fontWeight: 'bold' }}>
              {weather.severity}
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer Provenance */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div className="pulse-anim" style={{width: '6px', height: '6px', borderRadius: '50%', background: '#10b981'}}></div> {dataProvenance?.flights}</div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b'}}></div> {dataProvenance?.passengers}</div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6'}}></div> {dataProvenance?.insights}</div>
         <div style={{ marginLeft: 'auto' }}>Last updated: {new Date(data.timestamp).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '1.25rem',
  backdropFilter: 'blur(10px)'
};

const labelStyle = {
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '0.5rem'
};

const valueStyle = {
  fontSize: '2rem',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  color: 'var(--text-primary)',
  lineHeight: 1
};
