"use client";

import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import styles from './HistoricalChart.module.css';

// Remove local mock generator, we will fetch from API

// Custom tooltip for styling
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className={styles.tooltip}>
                <p className={styles.tooltipLabel}>{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className={styles.tooltipItem}>
                        <span style={{ color: entry.color }}>●</span>
                        <span className={styles.tooltipName}>{entry.name}:</span>
                        <span className={styles.tooltipValue}>
                            {entry.name === 'Arrival Volume'
                                ? entry.value.toLocaleString()
                                : entry.value.toFixed(1)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function HistoricalChart() {
    const [data, setData] = useState([]);
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        const fetchData = async () => {
            try {
                const res = await fetch('/api/historical');
                if (!res.ok) throw new Error("API error");
                const json = await res.json();

                // Map the /api/historical "velocity" base into the detailed metrics the chart expects
                // In a production scenario, the DB would return these exact columns.
                const mappedData = (json.data || []).map(row => {
                    const baseV = row.velocity; // 1-100 scale

                    return {
                        date: row.date,
                        fullDate: new Date(row.date + ' 2026').toISOString(),
                        volume: Math.floor(baseV * 500) + 15000, // project 1-100 to 15k-65k scale
                        compression: baseV,
                        cvi: Math.min(100, baseV * 0.9 + 10)
                    };
                });
                setData(mappedData);
            } catch (error) {
                console.error("HistoricalChart fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const exportToCSV = () => {
        if (!data || data.length === 0) return;

        const headers = ["Date", "Arrival Volume", "Compression Index", "CVI Score"];
        const rows = data.map(row =>
            [row.fullDate, row.volume, row.compression, row.cvi.toFixed(2)].join(",")
        );

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `lookupvegas_cvi_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isMounted) return <div className={styles.moduleCard} style={{ height: '400px' }} />;

    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h3 className={styles.cardTitle}>30-Day Historical Velocity</h3>
                    <p className={styles.cardSubtitle}>Arrival volume vs Hotel Compression Index.</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className={styles.exportBtn}
                    aria-label="Export Data to CSV"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export CSV
                </button>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCompression" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--ring)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--ring)" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            dx={-10}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation='right'
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={10}
                            domain={[0, 100]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }} />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="volume"
                            name="Arrival Volume"
                            stroke="var(--text-primary)"
                            fillOpacity={1}
                            fill="url(#colorVolume)"
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="compression"
                            name="Compression Index"
                            stroke="var(--ring)"
                            fillOpacity={1}
                            fill="url(#colorCompression)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
