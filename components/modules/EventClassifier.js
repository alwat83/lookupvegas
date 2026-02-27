"use client";

import { useEffect, useState } from 'react';
import styles from './EventClassifier.module.css';

export default function EventClassifier() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMock, setIsMock] = useState(false);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events');
                const json = await res.json();
                if (json.data) {
                    setEvents(json.data);
                    setIsMock(json.mock);
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
                {isMock && (
                    <span className="badge badge-warning" title="Add TICKETMASTER_API_KEY to .env.local">Demo Mode</span>
                )}
            </div>

            <div className={styles.eventList}>
                {events.map((evt, index) => (
                    <div key={evt.id} className={styles.eventItem}>
                        <div className={styles.eventInfo}>
                            <h4 className={styles.eventName}>{evt.name}</h4>
                            <div className={styles.eventMeta}>
                                <span>{new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
