"use client";

import styles from './Methodology.module.css';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, TrendingUp, AlertCircle, Clock, Database, Server, FileText, ChevronDown } from 'lucide-react';

export default function MethodologyPage() {
    return (
        <main className={styles.methodologyContainer}>
            <div className={styles.heroSection} style={{ padding: '6rem 2rem 4rem 2rem', textAlign: 'center', background: '#0a0a0c', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={14} color="var(--primary-color)" /> Platform Methodology
                    </div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', fontFamily: 'monospace', lineHeight: 1.1 }}>
                        Predictive Infrastructure <br />for Las Vegas.
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        LookupVegas operates at the intersection of aggregated aviation telemetry, real-time hospitality pricing, and event impact analysis. We do not rely on lagging surveys; we synthesize leading indicators into actionable macroeconomic forecasts.
                    </p>
                </div>
            </div>

            <div className={`container`} style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>

                {/* 1. The Core Index & Protection of IP */}
                <section style={{ marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        01. The City Velocity Index (CVI)
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                        The City Velocity Index is our proprietary, real-time macroeconomic indicator for Las Vegas hospitality demand. It is designed to act as the primary ticker symbol for market compression.
                    </p>
                    <div style={{ background: 'rgba(20,20,25,0.6)', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ marginBottom: '1rem' }}>The City Velocity Index incorporates weighted factors including:</p>
                        <ul style={{ listStyleType: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <li style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>• Transit Ingress</li>
                            <li style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>• Hotel Compression</li>
                            <li style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>• Event Impact</li>
                            <li style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>• Historical Demand Patterns</li>
                            <li style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)' }}>• Proprietary Forecast Signals</li>
                        </ul>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            *The precise algorithmic weighting methodology is proprietary and continuously optimized by our quantitative team.
                        </p>
                    </div>
                </section>

                {/* 2. Forecast Accuracy */}
                <section style={{ marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        02. Forecast Accuracy
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Our models are back-tested against 5 years of historical telemetry. We maintain strict internal grading to ensure our predictive signals provide a verifiable edge to institutional operators.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-growth)', fontFamily: 'monospace' }}>92.4%</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Demand Forecast Accuracy</div>
                        </div>
                        <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-growth)', fontFamily: 'monospace' }}>89.8%</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>Compression Prediction Accuracy</div>
                        </div>
                        <div style={{ padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-growth)', fontFamily: 'monospace' }}>87.3%</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '0.5rem' }}>ADR Forecast Accuracy</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Model Refresh Frequency:</span>
                        <span style={{ fontFamily: 'monospace', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={14} color="var(--primary-color)"/> EVERY 15 MINUTES</span>
                    </div>
                </section>

                {/* 3. Forecast Confidence Methodology */}
                <section style={{ marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        03. Forecast Confidence Index
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Every Macro Demand Report is accompanied by a Confidence Score. This metric prevents over-reliance on singular anomalies and ensures institutional buyers understand the statistical weight of the forecast.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '1.5rem', borderLeft: '3px solid var(--primary-color)', background: 'rgba(20,20,25,0.6)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>95-100%</div>
                            <div style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Exceptional Confidence</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Multiple independent data sources (aviation + hotel + events) strongly align with historical analogues.</div>
                        </div>
                        <div style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-growth)', background: 'rgba(20,20,25,0.6)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>80-94%</div>
                            <div style={{ color: 'var(--accent-growth)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>High Confidence</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Strong signal clarity, typical for forecasts inside a 30-day forward window.</div>
                        </div>
                        <div style={{ padding: '1.5rem', borderLeft: '3px solid #f59e0b', background: 'rgba(20,20,25,0.6)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>60-79%</div>
                            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Moderate Confidence</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Divergence between aviation intent and hotel pricing, or far-forward (90+ day) horizons.</div>
                        </div>
                        <div style={{ padding: '1.5rem', borderLeft: '3px solid #ff3b30', background: 'rgba(20,20,25,0.6)' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>&lt; 60%</div>
                            <div style={{ color: '#ff3b30', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Low Confidence</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Insufficient telemetry or high model variance due to unprecedented market anomalies.</div>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        *Confidence scores are dynamically derived from: Data freshness, cross-source agreement, historical analog matching, event certainty, and overall model variance.
                    </p>
                </section>

                {/* 4. Aviation Telemetry */}
                <section style={{ marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        04. Aviation Telemetry
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                        Aggregated aviation telemetry and public flight movement data provide near real-time estimates of inbound aviation activity and market ingress.
                    </p>
                    <div style={{ padding: '2rem', background: 'rgba(20,20,25,0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                            We synthesize forward-looking flight schedules, search volume momentum, and estimated capacity deltas to construct a baseline of expected arrivals into Harry Reid International Airport (KLAS). This allows us to map market ingress intent before traditional booking curves materialize.
                        </p>
                    </div>
                </section>

                {/* 6. Why Traditional Data Is Too Late */}
                <section style={{ marginBottom: '5rem' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        05. Why Traditional Data Is Too Late
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        In institutional hospitality, early signals create an asymmetrical information advantage. Waiting for historical reports guarantees you are reacting to the market rather than pricing ahead of it.
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', textAlign: 'center', opacity: 0.5 }}>
                            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Statements</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0', fontFamily: 'monospace' }}>Quarterly Lag</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', textAlign: 'center', opacity: 0.7 }}>
                            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tourism Reports</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0', fontFamily: 'monospace' }}>30-90 Day Lag</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', textAlign: 'center', opacity: 0.85 }}>
                            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Traditional Data (STR)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0', fontFamily: 'monospace' }}>Weekly Lag</div>
                        </div>
                        <div style={{ padding: '1.5rem', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid var(--primary-color)', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LookupVegas</div>
                            <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold', margin: '0.5rem 0', fontFamily: 'monospace' }}>Near Real-Time</div>
                        </div>
                    </div>
                </section>

                {/* 7. Data Pipeline Visualization */}
                <section style={{ marginBottom: '6rem' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '3rem' }}>
                        06. The LookupVegas Intelligence Pipeline
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                        {/* Animated Line connecting them */}
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, var(--primary-color) 100%)', zIndex: 0 }}></div>
                        
                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} style={{ background: 'rgba(0,0,0,0.8)', padding: '1rem 2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Database size={16} /> Aviation Telemetry
                        </motion.div>
                        <ChevronDown size={20} color="var(--text-muted)" style={{ zIndex: 1 }}/>

                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.1}} style={{ background: 'rgba(0,0,0,0.8)', padding: '1rem 2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Database size={16} /> Hotel Pricing Signals
                        </motion.div>
                        <ChevronDown size={20} color="var(--text-muted)" style={{ zIndex: 1 }}/>

                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} style={{ background: 'rgba(0,0,0,0.8)', padding: '1rem 2rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Database size={16} /> Event Intelligence
                        </motion.div>
                        <ChevronDown size={20} color="var(--text-muted)" style={{ zIndex: 1 }}/>

                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.3}} style={{ background: 'rgba(0,0,0,0.8)', padding: '1rem 2rem', borderRadius: '30px', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Server size={16} /> Proprietary Forecast Models
                        </motion.div>
                        <ChevronDown size={20} color="var(--primary-color)" style={{ zIndex: 1 }}/>

                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.4}} style={{ background: 'var(--primary-color)', color: '#000', padding: '1rem 2rem', borderRadius: '30px', fontWeight: 'bold', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Activity size={16} /> City Velocity Index
                        </motion.div>
                        <ChevronDown size={20} color="var(--primary-color)" style={{ zIndex: 1 }}/>

                        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.5}} style={{ background: 'rgba(0,0,0,0.8)', padding: '1rem 2rem', borderRadius: '8px', border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <FileText size={16} color="var(--primary-color)"/> Macro Demand Reports
                        </motion.div>
                    </div>
                </section>

                {/* 5. Important Notice (Boardroom Disclaimer) */}
                <section style={{ padding: '3rem', background: '#111', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                        <AlertCircle size={20} />
                        <h2 style={{ fontSize: '1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Important Notice to Subscribers</h2>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p>
                            LookupVegas provides macroeconomic intelligence and predictive models intended solely to support internal operational and investment decision-making. The City Velocity Index and all associated Macro Demand Reports are probabilistic forecasts, not guarantees of future market performance.
                        </p>
                        <p>
                            While our models are rigorously back-tested, historical accuracy does not guarantee future performance. Hospitality markets are subject to unprecedented anomalies, macroeconomic shifts, and unforeseen disruptions. Forecasts should be interpreted as directional indicators and synthesized with your own independent research and risk management protocols.
                        </p>
                        <p>
                            LookupVegas LLC and its affiliates accept no liability for financial losses, operational inefficiencies, or pricing errors resulting from the application of our telemetry data.
                        </p>
                    </div>
                </section>

            </div>
        </main>
    );
}
