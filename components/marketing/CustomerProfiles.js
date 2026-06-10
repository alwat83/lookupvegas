import styles from './CustomerProfiles.module.css';

export default function CustomerProfiles() {
    return (
        <section className={styles.profilesContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>Predictive Advantage for <span className="glow-text">Institutional Operations</span></h2>
                <p className={styles.subtitle}>
                    LookupVegas provides an unfair operational advantage by transforming raw city telemetry into actionable predictive compression.
                </p>
            </div>

            <div className={styles.grid}>
                
                <div className={styles.card}>
                    <span className={styles.role}>STR Operators</span>
                    <p className={styles.description}>
                        Stop reacting to Airbnb dynamic pricing algorithms. See exactly when F1-style event compression is building before the market notices.
                    </p>
                    <div className={styles.advantage}>
                        <span className={styles.advantageLabel}>Operational Advantage</span>
                        <span className={styles.advantageText}>Raise nightly rates 14-45 days ahead of standard hosts.</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <span className={styles.role}>Hospitality Funds</span>
                    <p className={styles.description}>
                        Deploy capital and manage yields based on true macro-demand indicators, cross-referencing flight volume with hotel compression mapping.
                    </p>
                    <div className={styles.advantage}>
                        <span className={styles.advantageLabel}>Operational Advantage</span>
                        <span className={styles.advantageText}>Forecast Strip occupancy pressure with 94% confidence.</span>
                    </div>
                </div>

                <div className={styles.card}>
                    <span className={styles.role}>Luxury Transport</span>
                    <p className={styles.description}>
                        Monitor exclusive VIP and whale arrivals at KLAS and private terminals. Position black cars and concierges exactly when high-net-worth volume spikes.
                    </p>
                    <div className={styles.advantage}>
                        <span className={styles.advantageLabel}>Operational Advantage</span>
                        <span className={styles.advantageText}>Track inbound VIP jets before ADR shifts hit the Strip.</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
