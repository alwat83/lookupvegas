import styles from './Methodology.module.css';

export const metadata = {
    title: 'Methodology | LookupVegas',
    description: 'How the Las Vegas City Velocity Index is calculated.',
};

export default function MethodologyPage() {
    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <h1 className={styles.title}>The Methodology.</h1>
                <p className={styles.subtitle}>Transparency is the prerequisite to trust. Here is exactly how we calculate the City Velocity Index.</p>
            </div>

            <section className={styles.section}>
                <h2 className={styles.sectionHeading}>I. Raw Data Ingestion</h2>
                <div className={styles.apiGrid}>
                    <div className={styles.apiCard}>
                        <div className={styles.apiHeader}>
                            <h3 className={styles.apiName}>OpenSky Network API</h3>
                            <span className={styles.apiType}>Aviation Telemetry</span>
                        </div>
                        <p className={styles.apiDesc}>We securely interface with the OpenSky Network's live state vectors using OAuth2 to track real-time inbound flight coordinates, velocity, and altitude heading toward KLAS.</p>
                    </div>
                    <div className={styles.apiCard}>
                        <div className={styles.apiHeader}>
                            <h3 className={styles.apiName}>Amadeus API</h3>
                            <span className={styles.apiType}>Hospitality Supply</span>
                        </div>
                        <p className={styles.apiDesc}>To measure compression, we query Amadeus Hotel Search APIs across a standard basket of Las Vegas zip codes, calculating the average room rate vs. theoretical maximums.</p>
                    </div>
                    <div className={styles.apiCard}>
                        <div className={styles.apiHeader}>
                            <h3 className={styles.apiName}>Ticketmaster API</h3>
                            <span className={styles.apiType}>Event Catalysts</span>
                        </div>
                        <p className={styles.apiDesc}>Discovery endpoints scan upcoming calendar dates to weigh the volume impact of conferences, sports, and entertainment events based on venue capacity.</p>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionHeading}>II. The Calculation (CVI)</h2>
                <div className={styles.calcBox}>
                    <p className={styles.paragraph}>
                        The <strong>City Velocity Index (CVI)</strong> is our proprietary 0-100 S&P500-style composite metric. It is not a measurement of total volume, but rather a measurement of <em>kinetic momentum.</em>
                    </p>
                    <div className={styles.formula}>
                        <code>CVI = (Flight Velocity * 0.60) + (Compression Score * 0.40)</code>
                    </div>
                    <ul className={styles.calcList}>
                        <li><strong style={{ color: 'var(--accent-growth)' }}>0-30: Contraction.</strong> Below baseline movement. Highly unconstrained supply.</li>
                        <li><strong style={{ color: 'var(--text-secondary)' }}>31-60: Neutral.</strong> Standard operating capacity. Normal seasonal flow.</li>
                        <li><strong style={{ color: 'var(--accent-compression)' }}>61-85: Accelerating.</strong> High event correlation. Constrained supply and spiking ingress.</li>
                        <li><strong style={{ color: 'var(--accent-compression)' }}>86-100: Saturation.</strong> The city is operating at structural maximum capacity (e.g. F1 Weekend).</li>
                    </ul>
                </div>
            </section>
        </main>
    )
}
