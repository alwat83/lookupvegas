"use client";

import { useState, useEffect } from 'react';

export default function IntelligencePreview() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/flights/arrivals');
                if (res.ok) {
                    const result = await res.json();
                    if (result.metrics) {
                        setMetrics(result.metrics);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch intelligence metrics:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading || !metrics) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', opacity: 0.5 }}>
                <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Inbound Passengers</span>
                    <span className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>...</span>
                </div>
                <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VIP Jets Airborne</span>
                    <span className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Inbound Passengers</span>
                <span className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-growth)' }}>
                    {metrics.totalEstimatedPassengers.toLocaleString()}
                </span>
            </div>
            <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VIP Jets Airborne</span>
                <span className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#eab308' }}>
                    {metrics.totalPrivateJets.toLocaleString()}
                </span>
            </div>
        </div>
    );
}
