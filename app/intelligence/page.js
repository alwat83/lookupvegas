import HistoricalChart from '../../components/modules/HistoricalChart';
import EventModeler from '../../components/modules/EventModeler';
import DeltaReport from '../../components/modules/DeltaReport';
import OriginTelemetry from '../../components/modules/OriginTelemetry';
import CompressionHeatmap from '../../components/modules/CompressionHeatmap';
import styles from './Intelligence.module.css';
import CheckoutButton from '../../components/CheckoutButton';

export const metadata = {
    title: 'LookupVegas | Intelligence Dashboard',
    description: 'Pro-tier quantitative dashboard for Las Vegas movement velocity, advanced tracking, and historical deltas.',
};

export default async function IntelligenceDashboard({ searchParams }) {
    // Basic paywall simulation for the prototype using searchParams
    const resolvedParams = await searchParams;
    const isUnlocked = resolvedParams?.unlocked === 'true';

    return (
        <main className={styles.dashboardContainer} style={{ position: 'relative' }}>
            <div className={styles.header}>
                <div className="container">
                    <div className={styles.titleSection}>
                        <div className={styles.badgeLabel}>PRO TIER</div>
                        <h1 className={styles.title}>Intelligence Terminal</h1>
                        <p className={styles.subtitle}>
                            Advanced movement telemetry, historical charting, and event impact models.
                        </p>
                    </div>
                </div>
            </div>

            {/* If not unlocked, render the paywall overlay */}
            {!isUnlocked && (
                <div style={{
                    position: 'absolute',
                    top: '250px', // Just below header
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '4rem',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, var(--background) 40%, var(--background) 100%)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        padding: '3rem',
                        backgroundColor: 'var(--background-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Premium Data Access</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Access real-time arrival velocity, forward-looking compression matrices, and geographical origin telemetry with the LookupVegas Intelligence Tier.
                        </p>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Includes:</h3>
                        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 2rem auto', maxWidth: '400px', color: 'var(--text-secondary)' }}>
                            <li style={{ marginBottom: '0.5rem' }}>✓ 30-Day Historical Velocity Mapping</li>
                            <li style={{ marginBottom: '0.5rem' }}>✓ 90-Day Forward Compression Matrix</li>
                            <li style={{ marginBottom: '0.5rem' }}>✓ Live Origin Sector Telemetry</li>
                            <li style={{ marginBottom: '0.5rem' }}>✓ Ticketmaster Event Impact Modeler</li>
                        </ul>
                        <CheckoutButton />
                    </div>
                </div>
            )}

            <div
                className={`container ${styles.gridContainer}`}
                style={{
                    filter: isUnlocked ? 'none' : 'blur(8px) grayscale(50%)',
                    pointerEvents: isUnlocked ? 'auto' : 'none',
                    userSelect: isUnlocked ? 'auto' : 'none',
                    opacity: isUnlocked ? 1 : 0.6
                }}
            >
                {/* Top Row: Charting & Export */}
                <div className={styles.topRow}>
                    <HistoricalChart />
                </div>

                {/* Second Row: Forward Looking Matrix */}
                <div className={styles.fullWidthRow}>
                    <CompressionHeatmap />
                </div>

                {/* Third Row: Tri-split for dense telemetry */}
                <div className={styles.tripleGrid}>
                    <div className={styles.deltaSpan}>
                        <DeltaReport />
                    </div>
                    <div className={styles.originSpan}>
                        <OriginTelemetry />
                    </div>
                </div>

                {/* Fourth Row: Upcoming Compressors */}
                <div className={styles.bottomRow}>
                    <EventModeler />
                </div>
            </div>
        </main>
    );
}
