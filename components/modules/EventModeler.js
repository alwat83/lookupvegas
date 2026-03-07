"use client";
import { useState, useEffect } from 'react';
import styles from './EventModeler.module.css';

export default function EventModeler() {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events');
                const { data } = await res.json();

                if (data && data.length > 0) {
                    const mappedEvents = data.map(evt => {
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
    }, []);
    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Event Impact Modeler</h3>
                <p className={styles.cardSubtitle}>Forecasted demand multipliers based on venue capacity and historical draw.</p>
            </div>

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
        </div>
    );
}
