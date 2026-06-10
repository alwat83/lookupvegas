import styles from './IntelligenceEngine.module.css';

export default function IntelligenceEngine() {
    return (
        <section className={styles.engineContainer}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>Predictive Intelligence Architecture</h2>
                    <p className={styles.subtitle}>
                        LookupVegas operates as a proprietary intelligence engine, ingesting raw urban telemetry to output actionable market forecasting.
                    </p>
                </div>

                <div className={styles.pipeline}>
                    
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>01</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Continuous Telemetry Ingestion</h3>
                            <p className={styles.stepDesc}>
                                The platform connects to institutional APIs—including FAA Open-Sky networks, private aviation transponders, and TSA throughput sensors—aggregating over 2.4 million flight movements into a centralized data lake.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>02</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Hospitality Compression Modeling</h3>
                            <p className={styles.stepDesc}>
                                Inbound transit volumes are algorithmically cross-referenced against Strip hotel inventory, event calendars, and STR availability grids to map macro-demand constraints in real time.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>03</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>AI Volatility Scoring</h3>
                            <p className={styles.stepDesc}>
                                Machine learning models assess historical baseline deviations to assign a City Velocity Index (CVI) and localized volatility scores, detecting anomalies weeks before pricing shifts occur.
                            </p>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>04</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Predictive Signal Generation</h3>
                            <p className={styles.stepDesc}>
                                The terminal synthesizes the telemetry into actionable directives, alerting operators when to execute rate increases, restrict inventory, or deploy luxury transport assets to capture maximum yield.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
