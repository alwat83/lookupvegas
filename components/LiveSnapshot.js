"use client";

import { motion } from 'framer-motion';
import { Activity, TrendingUp, Users, ShieldCheck } from 'lucide-react';

export default function LiveSnapshot() {
    return (
        <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem 1.25rem', borderRadius: '4px', borderLeft: '2px solid #ff3b30', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(5px)' }}>
                <Activity size={18} color="#ff3b30"/>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>City Compression</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff3b30', fontFamily: 'monospace' }}>88/100 (HIGH)</div>
                </div>
            </motion.div>

            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.1}} style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem 1.25rem', borderRadius: '4px', borderLeft: '2px solid var(--primary-color)', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(5px)' }}>
                <TrendingUp size={18} color="var(--primary-color)"/>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ADR Forecast (30D)</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)', fontFamily: 'monospace' }}>$245 (+14%)</div>
                </div>
            </motion.div>

            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.2}} style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem 1.25rem', borderRadius: '4px', borderLeft: '2px solid var(--accent-growth)', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(5px)' }}>
                <Users size={18} color="var(--accent-growth)"/>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Inbound Capacity Delta</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-growth)', fontFamily: 'monospace' }}>+12.4% YoY</div>
                </div>
            </motion.div>

            <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} transition={{delay: 0.3}} style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem 1.25rem', borderRadius: '4px', borderLeft: '2px solid #fff', display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(5px)' }}>
                <ShieldCheck size={18} color="#fff"/>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Forecast Confidence</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>94.2%</div>
                </div>
            </motion.div>
        </div>
    );
}
