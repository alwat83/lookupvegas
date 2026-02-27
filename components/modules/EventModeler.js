import styles from './EventModeler.module.css';

// Mock event data representing the Ticketmaster/Convention API integration
const upcomingEvents = [
    {
        id: 1,
        name: "Formula 1 Las Vegas Grand Prix",
        date: "Nov 21-23",
        tier: "Tier 1: Maximum Impact",
        multiplier: 2.8,
        description: "City-wide road closures. Peak international ingress.",
        status: "critical"
    },
    {
        id: 2,
        name: "CES (Consumer Electronics Show)",
        date: "Jan 9-12",
        tier: "Tier 1: High Impact",
        multiplier: 2.2,
        description: "Convention center saturation. Mid-week corporate ingress.",
        status: "high"
    },
    {
        id: 3,
        name: "EDC (Electric Daisy Carnival)",
        date: "May 17-19",
        tier: "Tier 2: Moderate Impact",
        multiplier: 1.6,
        description: "Young demographic influx. Speedway localized compression.",
        status: "moderate"
    },
    {
        id: 4,
        name: "WSOP Main Event",
        date: "Jul 3-17",
        tier: "Tier 3: Low/Sustained Impact",
        multiplier: 1.1,
        description: "Sustained, low-velocity compression concentrated mid-Strip.",
        status: "low"
    }
];

export default function EventModeler() {
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
                        {upcomingEvents.map((event) => (
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
                        ))}
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
