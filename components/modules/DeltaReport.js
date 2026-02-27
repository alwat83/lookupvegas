import styles from './DeltaReport.module.css';

// Mock data tracking velocity shifts
const deltaMetrics = [
    { id: 'cvi', label: 'City Velocity Index', value: '74.2', d24: 1.2, d7: 4.5, d30: -2.1 },
    { id: 'vol', label: 'Transit Arrival Volume', value: '142,450', d24: 0.8, d7: 2.1, d30: 8.4 },
    { id: 'adr', label: 'Base Room Yield (ADR)', value: '$284', d24: -1.5, d7: 12.4, d30: 24.5 },
    { id: 'occ', label: 'Strip Occupancy Est.', value: '88%', d24: 0.2, d7: 1.1, d30: 5.6 },
    { id: 'rad', label: 'Active Radar Count', value: '412', d24: 5.4, d7: -2.3, d30: 1.2 },
];

const renderDelta = (val) => {
    if (val > 0) return <span className={styles.positive}>+{val.toFixed(1)}%</span>;
    if (val < 0) return <span className={styles.negative}>{val.toFixed(1)}%</span>;
    return <span className={styles.neutral}>0.0%</span>;
};

export default function DeltaReport() {
    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Velocity Delta Report</h3>
                <p className={styles.cardSubtitle}>Trailing percentage shifts across core movement indicators.</p>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th className={styles.alignRight}>Current Value</th>
                            <th className={styles.alignRight}>24H Δ</th>
                            <th className={styles.alignRight}>7D Δ</th>
                            <th className={styles.alignRight}>30D Δ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deltaMetrics.map((metric) => (
                            <tr key={metric.id}>
                                <td>
                                    <span className={styles.metricLabel}>{metric.label}</span>
                                </td>
                                <td className={`${styles.monoCell} ${styles.alignRight} ${styles.currentValue}`}>
                                    {metric.value}
                                </td>
                                <td className={`${styles.monoCell} ${styles.alignRight}`}>
                                    {renderDelta(metric.d24)}
                                </td>
                                <td className={`${styles.monoCell} ${styles.alignRight}`}>
                                    {renderDelta(metric.d7)}
                                </td>
                                <td className={`${styles.monoCell} ${styles.alignRight}`}>
                                    {renderDelta(metric.d30)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.footerNote}>
                * Deltas calculate the trailing moving average against the previous equivalent period.
            </div>
        </div>
    );
}
