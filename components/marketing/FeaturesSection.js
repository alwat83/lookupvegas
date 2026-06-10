import styles from './FeaturesSection.module.css';

export default function FeaturesSection() {
    return (
        <section className={styles.featuresContainer}>
            <div className={styles.featuresGrid}>
                
                <div className={styles.featureCard}>
                    <div className={styles.iconWrapper}>📈</div>
                    <h3 className={styles.featureTitle}>Predictive Compression</h3>
                    <p className={styles.featureDesc}>
                        Stop reacting to demand. Our City Velocity Index (CVI) alerts you to incoming compression waves 14-45 days in advance so you can optimize your STR pricing.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.iconWrapper}>🛩️</div>
                    <h3 className={styles.featureTitle}>Private Jet Tracking</h3>
                    <p className={styles.featureDesc}>
                        Monitor exclusive VIP and whale arrivals at KLAS before they hit the Strip. Know exactly when high-net-worth volume is spiking.
                    </p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.iconWrapper}>🤖</div>
                    <h3 className={styles.featureTitle}>Terminal Oracle AI</h3>
                    <p className={styles.featureDesc}>
                        Bypass the raw data and ask the Oracle. Instantly summarize weekend volatility, F1 impact multipliers, and historical baselines with natural language.
                    </p>
                </div>

            </div>
        </section>
    );
}
