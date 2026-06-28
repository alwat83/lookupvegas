"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TrustMetrics() {
    return (
        <section style={{ padding: '6rem 2rem', background: '#0a0a0c', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontFamily: 'monospace' }}>INSTITUTIONAL TRUST ENGINE</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Built on an immutable foundation of raw telemetry. Our compression algorithms process millions of forward-looking signals daily to ensure you never miss a market movement.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>2.4M<span style={{color: 'var(--primary-color)'}}>+</span></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flight Movements Analyzed Daily</div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.1}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>5<span style={{fontSize: '2rem', color: 'var(--text-secondary)'}}>YRS</span></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Historical Telemetry Base</div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>15<span style={{fontSize: '2rem', color: 'var(--text-secondary)'}}>ms</span></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query Resolution Time</div>
                    </motion.div>

                    <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.3}} style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--accent-growth)', lineHeight: 1 }}>94.2<span style={{fontSize: '2rem'}}>%</span></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Forecast Confidence</div>
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
