"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Key, TrendingUp } from 'lucide-react';

export default function RoiCalculator() {
    const [keys, setKeys] = useState(50);
    const [adr, setAdr] = useState(250);

    // Assume capturing just 5 major compression events a year.
    // Assume we can lift ADR by 15% on those dates due to early signals.
    const compressionEvents = 5;
    const adrLiftPercent = 0.15;
    
    // Revenue lift = (Keys * (ADR * lift)) * Compression Events
    const revenueLift = Math.floor(keys * (adr * adrLiftPercent) * compressionEvents);

    return (
        <div style={{ background: 'rgba(20, 20, 25, 0.6)', padding: '2rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '600px', margin: '0 auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Calculator color="var(--primary-color)" />
                <h3 style={{ fontSize: '1.25rem', margin: 0, fontFamily: 'monospace' }}>ROI PROJECTION ENGINE</h3>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Calculate the projected annual revenue lift by leveraging early demand signals to optimize pricing ahead of the market.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={14}/> Keys Under Management</span>
                        <span style={{ fontFamily: 'monospace', color: '#fff' }}>{keys}</span>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="500" 
                        value={keys} 
                        onChange={(e) => setKeys(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary-color)' }} 
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={14}/> Baseline ADR</span>
                        <span style={{ fontFamily: 'monospace', color: '#fff' }}>${adr}</span>
                    </div>
                    <input 
                        type="range" 
                        min="50" 
                        max="800" 
                        step="10"
                        value={adr} 
                        onChange={(e) => setAdr(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary-color)' }} 
                    />
                </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={14} color="var(--accent-growth)"/> Projected Annual Revenue Lift
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-growth)', fontFamily: 'monospace' }}>
                    ${revenueLift.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    *Based on capturing 5 unpriced compression events annually.
                </div>
            </div>
        </div>
    );
}
