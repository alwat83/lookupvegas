import styles from './Privacy.module.css';

export const metadata = {
    title: 'Privacy Policy | LookupVegas',
    description: 'Privacy Policy and Data Handling terms for LookupVegas.',
};

export default function PrivacyPage() {
    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Privacy Policy.</h1>
                <p className={styles.subtitle}>Last Updated: February 2026</p>
            </div>

            <article className={styles.document}>
                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>1. Information We Collect</h2>
                    <p className={styles.paragraph}>
                        LookupVegas ("we", "us", "our") is committed to protecting your privacy. We collect bare-minimum information necessary to provide our intelligence services. This includes account registration data (email address) and anonymized usage analytics.
                    </p>
                    <p className={styles.paragraph}>
                        Our primary data sources—such as aviation telemetry and hotel pricing—are aggregated from public or licensed third-party APIs and do not contain Personally Identifiable Information (PII) of consumers or travelers.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>2. How We Use Your Data</h2>
                    <p className={styles.paragraph}>
                        We use the information we collect to operate, maintain, and provide the features of the LookupVegas dashboard. This includes:
                    </p>
                    <ul className={styles.list}>
                        <li>Authenticating enterprise API access credentials.</li>
                        <li>Delivering the weekly "Vegas Movement Brief" newsletter to opted-in subscribers.</li>
                        <li>Monitoring aggregate traffic to improve dashboard performance and charting capabilities.</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>3. Third-Party Integrations</h2>
                    <p className={styles.paragraph}>
                        Our platform interfaces with third-party data providers (e.g., OpenSky Network, Amadeus, Ticketmaster) to calculate the City Velocity Index. These providers operate under their own independent privacy policies. We do not transmit your account information to these infrastructural integrators.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>4. Data Security</h2>
                    <p className={styles.paragraph}>
                        We use commercially reasonable physical, managerial, and technical safeguards to preserve the integrity and security of your personal information. However, no absolute guarantee of security can be provided for data transmission over the Internet.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionHeading}>5. Contact Us</h2>
                    <p className={styles.paragraph}>
                        If you have any questions about this Privacy Policy, please contact our data practices team at <a href="mailto:privacy@lookupvegas.com" className={styles.link}>privacy@lookupvegas.com</a>.
                    </p>
                </section>
            </article>
        </main>
    );
}
