
import TerminalTabs from './TerminalTabs';
import styles from './Terminal.module.css';

export const metadata = {
    title: 'LookupVegas | Live Terminal',
    description: 'Expanded real-time flight telemetry and demand patterns for Las Vegas.',
};

export default function TerminalPage() {
    return (
        <main className={styles.terminalContainer}>
            <div className={styles.terminalHeader}>
                <div className="container">
                    <h1 className={styles.title}>Live Flight Telemetry</h1>
                    <p className={styles.subtitle}>
                        Monitoring inbound and outbound velocity metrics across the Harry Reid International Airport airspace.
                    </p>
                </div>
            </div>

            <div className={`container ${styles.boardSection}`}>
                <div className="card" style={{ padding: '0' }}>
                    <TerminalTabs />
                </div>
            </div>
        </main>
    );
}
