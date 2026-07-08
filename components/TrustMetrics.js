"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TrustMetrics() {
    const [snap, setSnap] = useState(null);

    useEffect(() => {
        fetch('/api/aviation/snapshot').then(r => r.json()).then(d => {
            if(d.currentSnapshot) setSnap(d.currentSnapshot);
        }).catch(e => console.error(e));
    }, []);

    const totalActive = snap ? snap.inboundFlights + snap.outboundFlights : '--';
    const arrRate = snap ? snap.arrivalRatePerHour : '--';
    const dailyPax = snap ? snap.estimatedDailyPax.toLocaleString() : '--';

    return (
        <section style={{ padding: '6rem 2rem', background: '#0a0a0c', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'monospace' }}>REAL-TIME INTELLIGENCE METRICS</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Built on an immutable foundation of raw telemetry. Our data is sourced directly from live ADS-B tracking, ensuring you never miss a market movement.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>{totalActive}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Flights Tracked</div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.1}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>5<span style={{fontSize: '2rem', color: 'var(--text-secondary)'}}>YRS</span></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historical Data Depth</div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>{arrRate}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arrivals Per Hour</div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.3}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--accent-growth)', lineHeight: 1 }}>{dailyPax}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Daily Passengers</div>
                    </motion.div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href="/methodology" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 'bold', transition: 'all 0.2s' }}>
                        View Methodology
                    </Link>
                    <Link href="/methodology#algorithm" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'transparent', color: 'var(--primary-color)', textDecoration: 'none', borderRadius: '4px', border: '1px solid var(--primary-color)', fontWeight: 'bold', transition: 'all 0.2s' }}>
                        How Forecasts Are Calculated
                    </Link>
                </div>
            </div>
        </section>
    );
}
