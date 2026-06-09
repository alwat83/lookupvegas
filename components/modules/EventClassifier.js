"use client";

import { useEffect, useState } from 'react';
import styles from './EventClassifier.module.css';

export default function EventClassifier() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [needsAuth, setNeedsAuth] = useState(false);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events');
                const json = await res.json();
                
                if (json.requiresAuth) {
                    setNeedsAuth(true);
                }
                
                if (json.data) {
                    setEvents(json.data);
                }
            } catch (err) {
                console.error("Failed to load events", err);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Event Impact Classifier</h3>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Scanning Event Matrix...
                </div>
            </div>
        )
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Event Impact Classifier</h3>
                {needsAuth ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }} title="Add SEATGEEK_CLIENT_ID to .env.local">Missing API Key</span>
                ) : (
                    <span className="badge badge-compression">Live API</span>
                )}
            </div>

            <div className={styles.eventList}>
                {events.map((evt, index) => (
                    <div key={evt.id} className={styles.eventItem}>
                        <div className={styles.eventInfo}>
                            <h4 className={styles.eventName}>{evt.name}</h4>
                            <div className={styles.eventMeta}>
                                <span>
                                    {isNaN(new Date(evt.date)) 
                                        ? evt.date 
                                        : new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className={styles.separator}>•</span>
                                <span>{evt.venue}</span>
                            </div>
                        </div>

                        <div className={styles.impactContainer}>
                            <div className={styles.impactBarContainer}>
                                <div
                                    className={styles.impactBarFill}
                                    style={{
                                        width: `${evt.impactScore}%`,
                                        backgroundColor: evt.impactScore > 85 ? 'var(--accent-compression)' : 'var(--accent-growth)'
                                    }}
                                ></div>
                            </div>
                            <span className={styles.impactLabel}>{evt.impact}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
