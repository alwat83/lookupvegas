import styles from './Pricing.module.css';

export const metadata = {
    title: 'Pricing | LookupVegas',
    description: 'SaaS monetization tiers for movement intelligence.',
};

export default function PricingPage() {
    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Intelligence Tiers.</h1>
                <p className={styles.subtitle}>Choose your level of access to the Las Vegas mobility environment.</p>
            </div>

            <div className={styles.pricingGrid}>
                {/* Free Tier */}
                <div className={styles.pricingCard}>
                    <div className={styles.tierHeader}>
                        <h2 className={styles.tierName}>Signal</h2>
                        <div className={styles.tierPrice}>$0<span className={styles.priceSub}>/month</span></div>
                        <p className={styles.tierDesc}>For casual observers tracking macro shifts.</p>
                    </div>
                    <div className={styles.tierBody}>
                        <ul className={styles.featureList}>
                            <li>Delayed 72-Hour Data Snapshots</li>
                            <li>Current City Velocity Index</li>
                            <li>Ad-Supported Environment</li>
                            <li className={styles.disabled}>Historical Pattern Comparisons</li>
                            <li className={styles.disabled}>Event Impact Forecasting</li>
                        </ul>
                    </div>
                    <div className={styles.tierFooter}>
                        <button className={styles.btnSecondary}>Access Basic Dashboard</button>
                    </div>
                </div>

                {/* Premium Tier */}
                <div className={`${styles.pricingCard} ${styles.premiumCard}`}>
                    <div className={styles.tierHeader}>
                        <h2 className={styles.tierName}>Intelligence</h2>
                        <div className={styles.tierPrice}>$49<span className={styles.priceSub}>/month</span></div>
                        <p className={styles.tierDesc}>For operators optimizing high-stakes timing.</p>
                    </div>
                    <div className={styles.tierBody}>
                        <ul className={styles.featureList}>
                            <li><strong style={{ color: '#fff' }}>Real-Time</strong> Movement Data</li>
                            <li><strong style={{ color: '#fff' }}>Live</strong> City Velocity Index Deltas</li>
                            <li>100% Ad-Free Environment</li>
                            <li>Historical Pattern Charting</li>
                            <li>Weekly 'Vegas Movement Brief'</li>
                        </ul>
                    </div>
                    <div className={styles.tierFooter}>
                        <button className={styles.btnPrimary}>Subscribe to Intelligence</button>
                    </div>
                </div>

                {/* Enterprise Tier */}
                <div className={styles.pricingCard}>
                    <div className={styles.tierHeader}>
                        <h2 className={styles.tierName}>Infrastructure</h2>
                        <div className={styles.tierPrice}>Custom</div>
                        <p className={styles.tierDesc}>Direct API access for revenue command centers.</p>
                    </div>
                    <div className={styles.tierBody}>
                        <ul className={styles.featureList}>
                            <li>Direct REST API Access to CVI</li>
                            <li>Raw Data Stream Export (CSV/JSON)</li>
                            <li>Dedicated Support SLA</li>
                            <li>Custom Data Integrations</li>
                            <li>Volume-Based Query Allowances</li>
                        </ul>
                    </div>
                    <div className={styles.tierFooter}>
                        <button className={styles.btnSecondary}>Contact Engineering</button>
                    </div>
                </div>
            </div>

            <div className={styles.disclaimer}>
                <p>* Currently in Beta. Monetization locked for testing phase.</p>
            </div>
        </main>
    )
}
