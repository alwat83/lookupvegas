"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../app/contexts/AuthContext';
import { Radar, Calendar, ArrowRight, Activity } from 'lucide-react';
import styles from "./Hero.module.css";
import { motion } from 'framer-motion';
import LiveSnapshot from './LiveSnapshot';

function ForwardDemandQuery() {
    const router = useRouter();
    const today = new Date();
    
    // Default to next 7 days
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);

    // Limit max date to 30 days from today
    const maxDateObj = new Date(today);
    maxDateObj.setDate(today.getDate() + 30);

    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const minDateStr = formatDate(today);
    const maxDateStr = formatDate(maxDateObj);

    const [origin, setOrigin] = useState('');
    const [dateFrom, setDateFrom] = useState(formatDate(nextWeek));
    const [dateTo, setDateTo] = useState(formatDate(twoWeeks));
    const [volumeThreshold, setVolumeThreshold] = useState(1);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!origin) return;
        const params = new URLSearchParams({
            origin: origin.toUpperCase(),
            date_from: dateFrom,
            date_to: dateTo,
            volume: volumeThreshold
        });
        router.push(`/reports/demand?${params.toString()}`);
    };

    return (
        <form 
            onSubmit={handleSearch} 
            style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.75rem', 
                marginTop: '3rem',
                background: 'rgba(20, 20, 25, 0.6)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                maxWidth: '750px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={14} color="var(--primary-color)"/> Forward Demand Signal Query
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MAX HORIZON: 30 DAYS</span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Radar size={16} color="var(--text-secondary)" />
                    <input 
                        type="text" 
                        placeholder="Target Origin (e.g. JFK)" 
                        required
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.85rem', width: '100%', outline: 'none', textTransform: 'uppercase', fontSize: '0.95rem' }}
                    />
                </div>
                <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Calendar size={16} color="var(--text-secondary)" />
                    <input 
                        type="date" 
                        required
                        min={minDateStr}
                        max={maxDateStr}
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.85rem', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                    />
                </div>
                <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Calendar size={16} color="var(--text-secondary)" />
                    <input 
                        type="date" 
                        required
                        min={dateFrom}
                        max={maxDateStr}
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.85rem', width: '100%', outline: 'none', fontSize: '0.95rem' }}
                    />
                </div>
                <div style={{ flex: '1 1 100px', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '0 0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Vol/T:</span>
                    <input 
                        type="number" 
                        min="1"
                        max="99"
                        required
                        value={volumeThreshold}
                        onChange={(e) => setVolumeThreshold(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.85rem 0', width: '100%', outline: 'none', fontSize: '0.95rem', textAlign: 'center' }}
                    />
                </div>
                <button 
                    type="submit" 
                    className="hover-glow"
                    style={{
                        background: 'linear-gradient(90deg, var(--primary-color), #00d2ff)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0 1.5rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        flex: '1 1 120px',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Generate Forecast <ArrowRight size={16} />
                </button>
            </div>
        </form>
    );
}

function IntelligenceWidgetsPreview() {
    const [snap, setSnap] = useState(null);
    useEffect(() => {
        fetch('/api/aviation/snapshot').then(r => r.json()).then(d => {
            if(d.currentSnapshot) setSnap(d.currentSnapshot);
        }).catch(e => console.error(e));
    }, []);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '3rem', maxWidth: '800px' }}>
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} style={{ background: 'rgba(20, 20, 25, 0.6)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Live Inbound Flights</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff3b30' }}>{snap ? snap.inboundFlights : '--'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>📡 Live ADS-B</div>
            </motion.div>
            
            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}} style={{ background: 'rgba(20, 20, 25, 0.6)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Est. Arriving Passengers</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-growth)' }}>{snap ? snap.estimatedArrivingPax.toLocaleString() : '--'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>📊 Estimated</div>
            </motion.div>

            <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}} style={{ background: 'rgba(20, 20, 25, 0.6)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Private Jet Index</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{snap ? `${snap.privateJetIndex.toFixed(1)}x` : '--'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>📡 Live ADS-B</div>
            </motion.div>
        </div>
    );
}

function LiveTicker() {
    const [snap, setSnap] = useState(null);
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        fetch('/api/aviation/snapshot').then(r => r.json()).then(d => {
            if(d.currentSnapshot) setSnap(d.currentSnapshot);
            if(d.weather) setWeather(d.weather);
        }).catch(e => console.error(e));
    }, []);

    if (!snap) {
        return <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><style>{`@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style><span style={{marginRight: '3rem'}}>LOADING TELEMETRY...</span></div>;
    }

    return (
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
            <span style={{ marginRight: '3rem' }}><span style={{ color: 'var(--accent-growth)'}}>▲ INBOUND NOW: {snap.inboundFlights}</span></span>
            <span style={{ marginRight: '3rem' }}>EST. PAX ARRIVING: {snap.estimatedArrivingPax.toLocaleString()}</span>
            <span style={{ marginRight: '3rem' }}><span style={{ color: '#ff3b30'}}>▼ DEMAND: {snap.demandPressure}</span></span>
            <span style={{ marginRight: '3rem' }}>WEATHER: {weather ? `${weather.temp}°F ${weather.conditions}` : 'N/A'}</span>
            <span style={{ marginRight: '3rem' }}>NET FLOW: {snap.netFlow.direction}</span>
        </div>
    );
}

export default function Hero() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className={styles.heroSection}>
            <div className={styles.telemetryBackground}>
                <div className={styles.radarGrid}></div>
                <div className={styles.ambientSweep}></div>
            </div>

            <div className={`container animate-fade-in ${styles.relativeContent}`}>
                
                <div className={styles.systemStatus}>
                    <div className="live-indicator"></div>
                    <span className={styles.monoText}>SYSTEM ONLINE | LAST PULSE: {currentTime}</span>
                </div>

                <div className={styles.heroContent}>
                    <h1 className={styles.headline} style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.05 }}>
                        Institutional-Grade Telemetry <br />
                        <span className={styles.highlight}>For Las Vegas.</span>
                    </h1>
                    <p className={styles.subtitle} style={{ fontSize: '1.1rem', maxWidth: '650px' }}>
                        Access real-time flight ingress, hotel compression data, and predictive demand signals. Built for enterprise funds and hospitality strategists to front-run market movements.
                    </p>
                    
                    <div className={styles.ctaGroup}>
                        {user ? (
                            <Link href="/terminal" className={styles.primaryBtn} style={{ background: 'transparent', color: '#fff', border: '1px solid var(--primary-color)', boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)' }}>Access Terminal</Link>
                        ) : (
                            <>
                                <Link href="/signup" className={styles.primaryBtn}>Request Terminal Access</Link>
                                <Link href="/methodology" className={styles.secondaryBtn}>View Methodology</Link>
                            </>
                        )}
                    </div>

                    <LiveSnapshot />
                    
                    <ForwardDemandQuery />
                    <IntelligenceWidgetsPreview />
                </div>
            </div>
            
            {/* Ticker at the bottom of hero */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#000', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0', overflow: 'hidden' }}>
               <LiveTicker />
            </div>
        </section>
    );
}
