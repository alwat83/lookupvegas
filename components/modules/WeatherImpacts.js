"use client";

import { useEffect, useState } from "react";
import styles from "./FlightSignals.module.css"; // Reuse existing styles

export default function WeatherImpacts() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWeather() {
            try {
                const res = await fetch('/api/weather');
                const json = await res.json();
                if (json.data) {
                    setData(json.data);
                }
            } catch (err) {
                console.error("Failed to fetch weather", err);
            } finally {
                setLoading(false);
            }
        }
        fetchWeather();
    }, []);

    if (loading) {
        return (
            <div className={`card animate-fade-in ${styles.flightCard}`}>
                <div className="card-header">
                    <h3 className="card-title">Weather Impacts</h3>
                </div>
                <div className={styles.content}>
                    <div className={styles.loadingPulse}>Scanning atmosphere...</div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={`card animate-fade-in ${styles.flightCard}`}>
            <div className="card-header">
                <h3 className="card-title">Weather Impacts</h3>
                <span className="badge badge-growth">Live API</span>
            </div>

            <div className={styles.content}>
                <div className={styles.metricsGrid}>
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                            <strong className="text-secondary">{data.conditions}</strong>
                            <div className="text-2xl font-mono font-semibold" style={{ color: data.impactScore > 50 ? 'var(--accent-compression)' : 'var(--accent-growth)' }}>
                                {data.impactScore}<span className="text-muted text-sm">/100</span>
                            </div>
                        </div>

                        <div className="text-sm" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="text-muted">{data.temp}°F</span>
                            <span className="text-muted">{data.wind} mph wind</span>
                        </div>

                        {/* Visual Impact Bar */}
                        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${Math.max(2, data.impactScore)}%`,
                                height: '100%',
                                backgroundColor: data.impactScore > 50 ? 'var(--accent-compression)' : 'var(--accent-growth)',
                                opacity: 0.8
                            }} />
                        </div>
                        
                        <div className="text-xs text-muted" style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                            {data.severity}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
