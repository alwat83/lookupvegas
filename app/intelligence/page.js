import HistoricalChart from '../../components/modules/HistoricalChart';
import EventModeler from '../../components/modules/EventModeler';
import styles from './Intelligence.module.css';

export const metadata = {
    title: 'LookupVegas | Intelligence Dashboard',
    description: 'Pro-tier quantitative dashboard for Las Vegas movement velocity, advanced tracking, and historical deltas.',
};

export default function IntelligenceDashboard() {
    return (
        <main className={styles.dashboardContainer}>
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

            <div className={`container ${styles.gridContainer}`}>
                {/* Top Row: Charting & Export */}
                <div className={styles.topRow}>
                    <HistoricalChart />
                </div>

                {/* Second Row: Upcoming Compressors */}
                <div className={styles.bottomRow}>
                    <EventModeler />
                </div>
            </div>
        </main>
    );
}
