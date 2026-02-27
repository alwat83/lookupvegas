"use client";

import { useEffect, useState } from "react";
import styles from "./FlightSignals.module.css"; // Reuse existing styles for consistency

export default function CompressionZones() {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);

    // For this POC, we'll auto-calculate the upcoming weekend (Friday-Sunday)
    // To avoid constant re-calculation in useEffect, we move it inside or use a ref.

    useEffect(() => {
        async function fetchCompression() {
            try {
                setLoading(true);
                // Calculate next Friday and Sunday
                const today = new Date();
                const nextFriday = new Date();
                nextFriday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7 || 7));

                const nextSunday = new Date(nextFriday);
                nextSunday.setDate(nextFriday.getDate() + 2);

                const checkIn = nextFriday.toISOString().split('T')[0];
                const checkOut = nextSunday.toISOString().split('T')[0];

                // Format dates for display
                const displayDate = `${nextFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${nextSunday.toLocaleDateString('en-US', { day: 'numeric' })}`;

                const res = await fetch(`/api/hotels?checkIn=${checkIn}&checkOut=${checkOut}`);
                const json = await res.json();

                if (json.requiresAuth) {
                    setNeedsAuth(true);
                    // Hydrate with the mock data provided by the API so it still renders nicely
                    setData({ [displayDate]: json.data });
                } else if (json.data) {
                    setData({ [displayDate]: json.data });
                }
            } catch (err) {
                console.error("Failed to fetch hotel compression", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCompression();
    }, []);

    return (
        <div className={`card animate-fade-in ${styles.flightCard}`}>
            <div className="card-header">
                <h3 className="card-title">Compression Zones</h3>
                {needsAuth ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Missing API Key</span>
                ) : (
                    <span className="badge badge-compression">Live API</span>
                )}
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loadingPulse}>Querying hospitality grids...</div>
                ) : (
                    <div className={styles.metricsGrid}>
                        {Object.entries(data).map(([dateRange, metrics]) => (
                            <div key={dateRange} style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                                    <strong className="text-secondary">{dateRange}</strong>
                                    <div className="text-2xl font-mono font-semibold" style={{ color: 'var(--accent-compression)' }}>
                                        {metrics.compressionScore}<span className="text-muted text-sm">/100</span>
                                    </div>
                                </div>

                                <div className="text-sm" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-muted">{metrics.status}</span>
                                    <span className="text-muted">Avg Rate: ${metrics.averagePrice}</span>
                                </div>

                                {/* Visual Meter Bar */}
                                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-primary)', borderRadius: '2px', marginTop: '0.75rem', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${metrics.compressionScore}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--accent-compression)',
                                        opacity: metrics.compressionScore > 80 ? 1 : 0.6
                                    }} />
                                </div>
                            </div>
                        ))}

                        {needsAuth && (
                            <div className="text-xs text-muted" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <strong>Setup Required:</strong> Add `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` to `.env.local` to enable real-time Amadeus queries. Currently showing mock fallback.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
