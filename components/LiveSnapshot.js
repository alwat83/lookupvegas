"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Users, ShieldCheck, Plane } from 'lucide-react';

export default function LiveSnapshot() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/aviation/snapshot');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const getScore = (pressure) => {
        switch(pressure) {
            case 'SURGING': return '95';
            case 'HIGH': return '75';
            case 'MODERATE': return '55';
            case 'LOW': return '35';
            case 'DECLINING': return '15';
            default: return '--';
        }
    };

    const snap = data?.currentSnapshot;

    return (
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} style={cardStyle('#ff3b30')}>
                <Activity size={18} color="#ff3b30"/>
                <div>
                    <div style={labelStyle}>City Compression {loading ? '⏳' : '📡 LIVE'}</div>
                    <div style={valStyle('#ff3b30')}>
                        {snap ? `${getScore(snap.demandPressure)}/100 (${snap.demandPressure})` : '--/100'}
                    </div>
                    <div style={subStyle}>Live computed index</div>
                </div>
            </motion.div>

            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.1}} style={cardStyle('var(--primary-color)')}>
                <Plane size={18} color="var(--primary-color)"/>
                <div>
                    <div style={labelStyle}>Inbound Traffic {loading ? '⏳' : '📡 LIVE'}</div>
                    <div style={valStyle('var(--primary-color)')}>
                        {snap ? `${snap.arrivalRatePerHour} flights/hr` : '-- flights/hr'}
                    </div>
                    <div style={subStyle}>Live ADS-B</div>
                </div>
            </motion.div>

            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}} style={cardStyle('var(--accent-growth)')}>
                <Users size={18} color="var(--accent-growth)"/>
                <div>
                    <div style={labelStyle}>Net Passenger Flow {loading ? '⏳' : '📡 LIVE'}</div>
                    <div style={valStyle('var(--accent-growth)')}>
                        {snap ? `${snap.netFlow.value} ${snap.netFlow.direction === 'INBOUND' ? '↑' : '↓'} ${snap.netFlow.direction}` : '--'}
                    </div>
                    <div style={subStyle}>Estimated pax delta</div>
                </div>
            </motion.div>

            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3}} style={cardStyle('#fff')}>
                <ShieldCheck size={18} color="#fff"/>
                <div>
                    <div style={labelStyle}>Private Jet Index {loading ? '⏳' : '📡 LIVE'}</div>
                    <div style={valStyle('#fff')}>
                        {snap ? `${snap.privateJetIndex.toFixed(1)}x` : '--x'}
                    </div>
                    <div style={subStyle}>Live ADS-B proxy</div>
                </div>
            </motion.div>
        </div>
    );
}

const cardStyle = (color) => ({
    background: 'rgba(0, 0, 0, 0.4)', 
    padding: '0.75rem 1.25rem', 
    borderRadius: '4px', 
    borderLeft: `2px solid ${color}`, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem', 
    backdropFilter: 'blur(5px)'
});

const labelStyle = { fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' };
const valStyle = (color) => ({ fontSize: '1.1rem', fontWeight: 'bold', color: color, fontFamily: 'monospace' });
const subStyle = { fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' };
