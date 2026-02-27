"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from './OriginTelemetry.module.css';

// Mock data representing the geographical breakdown of inbound flights over the last 24h
const originData = [
    { name: 'West Coast Dom.', value: 45, color: '#6366F1' }, // Indigo
    { name: 'East Coast Dom.', value: 25, color: '#818CF8' }, // Lighter Indigo
    { name: 'Midwest / South', value: 15, color: '#A5B4FC' }, // Lightest Indigo
    { name: 'International (EU/UK)', value: 10, color: '#10B981' }, // Emerald (High Value)
    { name: 'Intl (LATAM/Asia)', value: 5, color: '#34D399' }  // Lighter Emerald
];

const totalFlights = originData.reduce((acc, curr) => acc + curr.value, 0);

// Custom tooltip for the Pie Chart
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className={styles.tooltip}>
                <p className={styles.tooltipName}>{data.name}</p>
                <div className={styles.tooltipValue}>
                    <span>{data.value}%</span> of total inbound
                </div>
            </div>
        );
    }
    return null;
};

export default function OriginTelemetry() {
    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Origin Sector Telemetry</h3>
                <p className={styles.cardSubtitle}>Geographical breakdown of inbound fuselage volume (24H trailing).</p>
            </div>

            <div className={styles.contentContainer}>

                {/* The Ring Chart */}
                <div className={styles.chartSection}>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={originData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {originData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Total */}
                    <div className={styles.chartCenterArea}>
                        <div className={styles.centerValue}>{totalFlights}%</div>
                        <div className={styles.centerLabel}>Tracked</div>
                    </div>
                </div>

                {/* The Data Legend / Breakdown */}
                <div className={styles.legendSection}>
                    <ul className={styles.legendList}>
                        {originData.map((item, index) => (
                            <li key={index} className={styles.legendItem}>
                                <div className={styles.itemMeta}>
                                    <span
                                        className={styles.colorDot}
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className={styles.itemName}>{item.name}</span>
                                </div>
                                <span className={styles.itemValue}>{item.value}%</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>

            <div className={styles.footerNote}>
                * Categorization derived from live OpenSky Network ADS-B departure signatures.
            </div>
        </div>
    );
}
