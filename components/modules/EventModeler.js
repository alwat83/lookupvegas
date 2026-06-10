"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './EventModeler.module.css';

export default function EventModeler() {
    const { user } = useAuth();
    const router = useRouter();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const headers = {};
                if (user) {
                    const token = await user.getIdToken();
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/events', { headers });
                const json = await res.json();

                if (json.locked) {
                    setIsLocked(true);
                    setUpcomingEvents([]);
                    return;
                }

                if (json.data && json.data.length > 0) {
                    const mappedEvents = json.data.map(evt => {
                        // Translate impactScore back into our UI's multiplier notation
                        let multiplier = 1.0;
                        let statusClass = "low";

                        if (evt.impactScore >= 95) { multiplier = 2.8; statusClass = "critical"; }
                        else if (evt.impactScore >= 75) { multiplier = 2.0; statusClass = "high"; }
                        else if (evt.impactScore >= 50) { multiplier = 1.5; statusClass = "moderate"; }
                        else { multiplier = 1.1; statusClass = "low"; }

                        return {
                            id: evt.id,
                            name: evt.name,
                            date: evt.date, // YYYY-MM-DD
                            tier: evt.impact,
                            multiplier: multiplier,
                            description: `Venue: ${evt.venue}`,
                            status: statusClass
                        };
                    });

                    setUpcomingEvents(mappedEvents);
                }
            } catch (error) {
                console.error("Event API error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [user]);
    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Event Impact Modeler</h3>
                <p className={styles.cardSubtitle}>Forecasted demand multipliers based on venue capacity and historical draw.</p>
            </div>

            {isLocked ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', margin: '1rem 0' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Premium Intelligence Required</h4>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                        Unlock predictive modeling for F1, CES, and major residencies to anticipate pricing compression before it hits the curve.
                    </p>
                    <button 
                        onClick={() => router.push('/pricing')}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                    >
                        Upgrade to Intelligence
                    </button>
                </div>
            ) : (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Event Catalyst</th>
                                    <th>Impact Tier</th>
                                    <th className={styles.alignRight}>Multiplier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Syncing with Discovery APIs...
                                        </td>
                                    </tr>
                                ) : upcomingEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No major pulse events detected in tracking window.
                                        </td>
                                    </tr>
                                ) : (
                                    upcomingEvents.map((event) => (
                                        <tr key={event.id}>
                                            <td className={styles.monoCell}>{event.date}</td>
                                            <td>
                                                <div className={styles.eventName}>{event.name}</div>
                                                <div className={styles.eventDesc}>{event.description}</div>
                                            </td>
                                            <td>
                                                <span className={`${styles.tierBadge} ${styles[event.status]}`}>
                                                    {event.tier}
                                                </span>
                                            </td>
                                            <td className={`${styles.monoCell} ${styles.alignRight}`}>
                                                {event.multiplier.toFixed(1)}x
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.modelerFooter}>
                        <span className={styles.footerNote}>* Events are programmatically scraped via Ticketmaster Discovery API.</span>
                        <button className={styles.integrationBtn}>Configure Integrations →</button>
                    </div>
                </>
            )}
        </div>
    );
}
