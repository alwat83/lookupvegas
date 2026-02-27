import styles from './Methodology.module.css';
import Link from 'next/link';

export const metadata = {
    title: 'LookupVegas | Methodology',
    description: 'Data integrity, signal processing, and the calculation model behind the City Velocity Index.',
};

export default function MethodologyPage() {
    return (
        <main className={styles.methodologyContainer}>
            <div className={styles.heroSection}>
                <div className="container">
                    <div className={styles.badgeContainer}>
                        <span className="badge badge-growth">Data Transparency</span>
                    </div>
                    <h1 className={styles.title}>Signal Over Noise: Our Methodology</h1>
                    <p className={styles.subtitle}>
                        We do not rely on historical models, delayed tourism board reports, or anecdotal surveys. The City Velocity Index is derived strictly from real-time, programmatic data feeds capturing the physical movement of capital and people.
                    </p>
                </div>
            </div>

            <div className={`container ${styles.contentSection}`}>

                {/* 1. The Core Index */}
                <div className={styles.methodologyBlock}>
                    <div className={styles.blockHeader}>
                        <div className={styles.blockNumber}>01</div>
                        <h2 className={styles.blockTitle}>The City Velocity Index (CVI)</h2>
                    </div>
                    <div className={styles.blockContent}>
                        <p>
                            The City Velocity Index is a proprietary composite score ranging from 0 to 100. It is designed to act as the primary ticker symbol for Las Vegas macro-demand.
                        </p>
                        <ul className={styles.dataList}>
                            <li><strong>0-30: Contraction.</strong> Volume is significantly below trailing baselines.</li>
                            <li><strong>31-60: Baseline Growth.</strong> Standard operational volume expected for the current season.</li>
                            <li><strong>61-85: High Compression.</strong> Ingress velocity is accelerating, straining city infrastructure and driving up dynamic pricing.</li>
                            <li><strong>86-100: Peak Saturation.</strong> The city is at maximum operational capacity (e.g., F1 Race Weekend, Super Bowl).</li>
                        </ul>
                        <div className={styles.formulaBox}>
                            <code>CVI = (FlightArrival_Δ * 0.40) + (HotelCompressionScore * 0.45) + (EventImpactMultiplier * 0.15)</code>
                        </div>
                    </div>
                </div>

                {/* 2. Transit Ingress */}
                <div className={styles.methodologyBlock}>
                    <div className={styles.blockHeader}>
                        <div className={styles.blockNumber}>02</div>
                        <h2 className={styles.blockTitle}>Transit Ingress & Airspace Telemetry</h2>
                    </div>
                    <div className={styles.blockContent}>
                        <p>
                            Physical arrival volume is the leading indicator of economic velocity. We calculate inbound traffic via direct integration with global aviation databases.
                        </p>
                        <div className={styles.sourceCard}>
                            <div className={styles.sourceMeta}>
                                <strong>Primary Interface:</strong> OpenSky Network Live REST API
                            </div>
                            <p>
                                Utilizing authenticated OAuth2 streams, we ping the <code>/flights/arrival</code> and <code>/states/all</code> vectors to map every commercial and private fuselage entering the Harry Reid International Airport (KLAS) bounding box. This provides a raw, unflinching count of total bodies entering the market before they ever hit a hotel lobby.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Hotel Compression */}
                <div className={styles.methodologyBlock}>
                    <div className={styles.blockHeader}>
                        <div className={styles.blockNumber}>03</div>
                        <h2 className={styles.blockTitle}>Hotel Compression Modeling</h2>
                    </div>
                    <div className={styles.blockContent}>
                        <p>
                            While flight data tells us who is arriving, room rates tell us how desperate they are to stay. We measure the underlying tension in the hospitality market through real-time pricing queries.
                        </p>
                        <div className={styles.sourceCard}>
                            <div className={styles.sourceMeta}>
                                <strong>Primary Interface:</strong> Amadeus Hotel Search API
                            </div>
                            <p>
                                By polling average daily rates (ADR) across a fixed basket of Strip properties for the upcoming 72-hour period, we establish a dynamic Compression Score. When yields spike against our trailing 30-day baseline, the index identifies an impending demand shock.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. Event Impact */}
                <div className={styles.methodologyBlock}>
                    <div className={styles.blockHeader}>
                        <div className={styles.blockNumber}>04</div>
                        <h2 className={styles.blockTitle}>Event Impact Classification</h2>
                    </div>
                    <div className={styles.blockContent}>
                        <p>
                            Las Vegas is an event-driven economy. We programmatically scan global ticketing pipelines to forecast the footprint of upcoming conventions, concerts, and sporting events.
                        </p>
                        <div className={styles.sourceCard}>
                            <div className={styles.sourceMeta}>
                                <strong>Primary Interface:</strong> Ticketmaster Discovery API
                            </div>
                            <p>
                                Events are categorized into Impact Tiers (Tier 1 through Tier 3) based on venue capacity heuristics and historical draw. A Tier 1 event acts as a powerful multiplier on the core City Velocity Index.
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.ctaWrapper}>
                    <Link href="/terminal" className={styles.terminalBtn}>
                        Access the Live Terminal
                    </Link>
                </div>

            </div>
        </main>
    );
}
