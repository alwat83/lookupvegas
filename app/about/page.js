import styles from './About.module.css';
import Link from 'next/link';

export const metadata = {
    title: 'About | LookupVegas',
    description: 'The mission behind the Las Vegas City Velocity Index.',
};

export default function AboutPage() {
    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Signal Over Noise.</h1>
                <p className={styles.subtitle}>In high-density markets, historical data is outpaced by real-time movement.</p>
            </div>

            <section className={styles.section}>
                <div className={styles.contentGrid}>
                    <div className={styles.textContent}>
                        <h2 className={styles.sectionHeading}>Why Movement Data Matters</h2>
                        <p className={styles.paragraph}>
                            Las Vegas is the world's most dynamic hospitality ecosystem. Relying solely on lagging metrics—like quarterly earnings or delayed tourism reports—leaves you operating in the past.
                        </p>
                        <p className={styles.paragraph}>
                            LookupVegas was engineered to aggregate and structure fragmented signals—from live aviation telemetry to real-time occupancy compression—into a single, clear velocity index. We filter the noise so you can optimize timing, anticipate demand, and allocate resources with absolute precision.
                        </p>
                    </div>
                    <div className={styles.statBox}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>Real-Time</span>
                            <span className={styles.statLabel}>Telemetry Updates</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>100%</span>
                            <span className={styles.statLabel}>Live API Driven</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionHeading}>Built For Strategists</h2>
                <div className={styles.personaGrid}>
                    <div className={styles.personaCard}>
                        <h3 className={styles.personaTitle}>Hospitality Professionals</h3>
                        <p className={styles.personaDesc}>Monitor incoming flight volumes and competitive compression to adjust daily rate strategies and staffing models.</p>
                    </div>
                    <div className={styles.personaCard}>
                        <h3 className={styles.personaTitle}>Event Planners</h3>
                        <p className={styles.personaDesc}>Avoid peak friction zones. Assess exactly when the city hits saturation to optimize your event's logistical footprint.</p>
                    </div>
                    <div className={styles.personaCard}>
                        <h3 className={styles.personaTitle}>Market Investors</h3>
                        <p className={styles.personaDesc}>Track macro velocity trends weeks before quarterly reports are public. React to actual ingress signals, not sentiment.</p>
                    </div>
                </div>
            </section>

            <section className={styles.ctaSection}>
                <h2 className={styles.ctaHeading}>Ready to access the terminal?</h2>
                <Link href="/" className={styles.btnPrimary}>Launch Dashboard</Link>
            </section>
        </main>
    )
}
