import styles from "./Hero.module.css";

export default function Hero() {
    return (
        <section className={styles.heroSection}>
            <div className="container animate-fade-in">
                <div className={styles.heroContent}>
                    <h1 className={styles.headline}>
                        Measure Las Vegas City<br />
                        <span className={styles.highlight}>Velocity</span> in Real Time.
                    </h1>
                    <p className={styles.subtitle}>
                        Structured movement data and demand signals for professionals optimizing timing, investment, and hospitality decisions in Las Vegas.
                    </p>
                    <div className={styles.ctaGroup}>
                        <button className={styles.primaryBtn}>Explore Dashboard</button>
                        <button className={styles.secondaryBtn}>View Methodology</button>
                    </div>
                </div>

                <div className={styles.dataRibbon}>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>Visitor Volume (7-Day)</span>
                        <span className={styles.ribbonValue}>+4.2% <span className="text-emerald">▲</span></span>
                    </div>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>Transit Arrivals (30-day)</span>
                        <span className={styles.ribbonValue}>+1.8% <span className="text-emerald">▲</span></span>
                    </div>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>Hotel Compression</span>
                        <span className={styles.ribbonValue}>88<span className="text-muted">/100</span></span>
                    </div>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>City Velocity Index</span>
                        <span className={styles.ribbonValue}>74<span className="text-muted text-xs ml-1">Accelerating</span></span>
                    </div>
                </div>
            </div>
        </section>
    );
}
