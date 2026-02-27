import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import styles from './Pricing.module.css';

export const metadata = {
    title: 'LookupVegas | Pricing & Access',
    description: 'Monetization tiers for the City Velocity Index. Choose between Free Signal, Premium Intelligence, or Enterprise API access.',
};

export default function PricingPage() {
    return (
        <main className={styles.pricingContainer}>
            <Navbar />

            <div className={styles.heroSection}>
                <div className="container">
                    <h1 className={styles.title}>Pricing & Access Tiers</h1>
                    <p className={styles.subtitle}>
                        Structured macro-demand data for hospitality strategists, event planners, and quantitative analysts operating in Las Vegas.
                    </p>
                </div>
            </div>

            <div className={`container ${styles.tiersSection}`}>

                {/* 1. Free Tier (Signal) */}
                <div className={styles.pricingCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.tierName}>Signal</h2>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>$0</span>
                            <span className={styles.period}>/mo</span>
                        </div>
                        <p className={styles.tierDesc}>Basic index visibility for casual observation.</p>
                    </div>
                    <div className={styles.cardFeatures}>
                        <ul className={styles.featureList}>
                            <li>Weekly trend snapshots (72h delayed)</li>
                            <li>Current City Velocity Index score</li>
                            <li>Contextual ad-supported environment</li>
                        </ul>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={`${styles.actionBtn} ${styles.btnOutline}`}>Current Tier</button>
                    </div>
                </div>

                {/* 2. Premium Tier (Intelligence) */}
                <div className={`${styles.pricingCard} ${styles.highlightCard}`}>
                    <div className={styles.popularBadge}>Most Active</div>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.tierName}>Intelligence</h2>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>$49</span>
                            <span className={styles.period}>/mo</span>
                        </div>
                        <p className={styles.tierDesc}>Real-time movement data and live telemetry.</p>
                    </div>
                    <div className={styles.cardFeatures}>
                        <ul className={styles.featureList}>
                            <li>Real-time CVI and live deltas</li>
                            <li>Advanced historical charting access</li>
                            <li>Event impact modeling & forecasts</li>
                            <li>Raw data export (CSV)</li>
                            <li>Weekly "Movement Brief" report</li>
                            <li>100% Ad-free environment</li>
                        </ul>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={`${styles.actionBtn} ${styles.btnPrimary}`}>Subscribe</button>
                    </div>
                </div>

                {/* 3. Enterprise API Tier (Infrastructure) */}
                <div className={styles.pricingCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.tierName}>Infrastructure</h2>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>Custom</span>
                        </div>
                        <p className={styles.tierDesc}>Direct API pipelines for revenue management systems.</p>
                    </div>
                    <div className={styles.cardFeatures}>
                        <ul className={styles.featureList}>
                            <li>Direct REST API access to CVI data</li>
                            <li>Live JSON payloads for internal dashboards</li>
                            <li>Dedicated account manager</li>
                            <li>Custom usage contracts</li>
                        </ul>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={`${styles.actionBtn} ${styles.btnOutline}`}>Contact Sales</button>
                    </div>
                </div>

            </div>

            {/* FAQ Section */}
            <div className={styles.faqSection}>
                <div className="container">
                    <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h4>How current is the Premium data?</h4>
                            <p>Premium users see live data parsing through our engines immediately. The Free tier is artificially delayed by 72 hours to protect the fidelity of the live signal for paying strategists.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>Can I export the City Velocity Index?</h4>
                            <p>Yes. The Intelligence tier allows full CSV exports of our indexed data tables, enabling you to overlay our metrics onto your internal revenue or booking curves.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>How are Enterprise API limits structured?</h4>
                            <p>Enterprise infrastructure plans are negotiated based on your polling frequency requirements. Our internal APIs run on strict caching mechanisms, but we can provision direct high-frequency pipes for hedge funds and large aggregators.</p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
