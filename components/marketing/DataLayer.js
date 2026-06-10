import styles from './DataLayer.module.css';

export default function DataLayer() {
    return (
        <section className={styles.dataLayer}>
            <div className={styles.container}>
                
                <div className={styles.metricsRow}>
                    <div className={styles.metric}>
                        <span className={styles.metricValue}>2.4M+</span>
                        <span className={styles.metricLabel}>Flight Movements Analyzed</span>
                    </div>
                    <div className={styles.divider}></div>
                    <div className={styles.metric}>
                        <span className={styles.metricValue}>5 Years</span>
                        <span className={styles.metricLabel}>Las Vegas Telemetry History</span>
                    </div>
                    <div className={styles.divider}></div>
                    <div className={styles.metric}>
                        <span className={styles.metricValue}>15ms</span>
                        <span className={styles.metricLabel}>Terminal Refresh Interval</span>
                    </div>
                    <div className={styles.divider}></div>
                    <div className={styles.metric}>
                        <span className={styles.metricValue}>94.2%</span>
                        <span className={styles.metricLabel}>Compression Forecast Confidence</span>
                    </div>
                </div>

                <div className={styles.sourcesRow}>
                    <span className={styles.sourceLabel}>INTELLIGENCE PIPELINES:</span>
                    <div className={styles.sourceLogos}>
                        <span className={styles.sourceLogo}>FAA OPEN-SKY</span>
                        <span className={styles.sourceLogo}>TSA THROUGHPUT</span>
                        <span className={styles.sourceLogo}>AIRBNB/VRBO SCRAPERS</span>
                        <span className={styles.sourceLogo}>STRIPE NETWORK</span>
                        <span className={styles.sourceLogo}>TICKETMASTER DATA</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
