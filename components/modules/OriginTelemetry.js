"use client";

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import styles from './OriginTelemetry.module.css';

// Initial fallback mock data
const initialData = [
    { name: 'West Coast Dom.', value: 45, color: '#6366F1' },
    { name: 'East Coast Dom.', value: 25, color: '#818CF8' },
    { name: 'Midwest / South', value: 15, color: '#A5B4FC' },
    { name: 'International (EU/UK)', value: 10, color: '#10B981' },
    { name: 'Intl (LATAM/Asia)', value: 5, color: '#34D399' }
];

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
    const [originData, setOriginData] = useState(initialData);
    const [totalFlights, setTotalFlights] = useState(100);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFlights() {
            try {
                const res = await fetch('/api/flights/arrivals');
                if (!res.ok) throw new Error("Failed to fetch");
                const { data } = await res.json();

                if (data && data.length > 0) {
                    let west = 0, east = 0, mid = 0, eu = 0, otherIntl = 0;
                    let total = data.length;

                    data.forEach(flight => {
                        const code = flight.origin || '';
                        if (code.startsWith('K')) {
                            // Simple heuristic for US regions based on first letter after K
                            // (Not perfect, but good for prototype)
                            if (['S', 'L', 'P', 'R'].includes(code[1])) west++; // e.g. KSFO, KLAX, KPHX, KRNO
                            else if (['J', 'E', 'B', 'M', 'I'].includes(code[1])) east++; // e.g. KJFK, KEWR, KBOS, KMIA
                            else mid++;
                        } else if (code.startsWith('E') || code.startsWith('L')) {
                            eu++;
                        } else {
                            otherIntl++;
                        }
                    });

                    // Convert to percentages
                    const toPercent = (val) => Math.round((val / total) * 100) || 0;

                    const newData = [
                        { name: 'West Coast Dom.', value: toPercent(west), color: '#6366F1' },
                        { name: 'East Coast Dom.', value: toPercent(east), color: '#818CF8' },
                        { name: 'Midwest / South', value: toPercent(mid), color: '#A5B4FC' },
                        { name: 'International (EU/UK)', value: toPercent(eu), color: '#10B981' },
                        { name: 'Intl (LATAM/Asia)', value: toPercent(otherIntl), color: '#34D399' }
                    ];

                    setOriginData(newData);
                    setTotalFlights(total);
                }
            } catch (err) {
                console.error("OriginTelemetry fetch error:", err);
                // Fallback handles keeping initial Data
            } finally {
                setLoading(false);
            }
        }

        fetchFlights();
    }, []);

    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Origin Sector Telemetry</h3>
                <p className={styles.cardSubtitle}>Geographical breakdown of inbound fuselage volume (24H trailing).</p>
            </div>

            {loading ? (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Scanning Live Airspace...
                </div>
            ) : (
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
                            <div className={styles.centerValue}>{totalFlights}</div>
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
            )}

            <div className={styles.footerNote}>
                * Categorization derived from live OpenSky Network ADS-B departure signatures.
            </div>
        </div>
    );
}
