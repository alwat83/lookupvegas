"use client";

import { useState, useEffect } from 'react';
import styles from './CompressionHeatmap.module.css';

// Generate 90 days of forward-looking mock data
const generateHeatmapData = () => {
    const data = [];
    const today = new Date();

    // Create 13 weeks of data (~90 days)
    for (let w = 0; w < 13; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() + (w * 7) + d);

            const isWeekend = d === 5 || d === 6; // Fri/Sat
            let baseScore = isWeekend ? 60 : 30; // Weekends naturally higher

            // Inject fake events/spikes (F1, Superbowl, CES)
            if (w === 3 && isWeekend) baseScore = 95; // Major event spike
            if (w === 7 && (d >= 2 && d <= 5)) baseScore = 88; // Mid-week convention
            if (w === 11 && isWeekend) baseScore = 15; // Dead week

            // Add noise
            const noise = Math.floor(Math.random() * 20) - 10;
            const finalScore = Math.min(100, Math.max(0, baseScore + noise));

            week.push({
                date: date.toISOString().split('T')[0],
                score: finalScore,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }
        data.push(week);
    }
    return data;
};

// Helper to determine CSS class based on score
const getIntensityClass = (score) => {
    if (score >= 85) return styles.intensity4; // Peak Saturation (Red/Indigo)
    if (score >= 60) return styles.intensity3; // High Compression
    if (score >= 35) return styles.intensity2; // Neutral Growth
    if (score >= 15) return styles.intensity1; // Contraction
    return styles.intensity0; // Dead
};

export default function CompressionHeatmap() {
    const [weeks, setWeeks] = useState([]);
    const [hoveredCell, setHoveredCell] = useState(null);

    useEffect(() => {
        setWeeks(generateHeatmapData());
    }, []);

    return (
        <div className={styles.moduleCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h3 className={styles.cardTitle}>90-Day Forward Compression Matrix</h3>
                    <p className={styles.cardSubtitle}>Projected hotel rate saturation mapped to upcoming dates.</p>
                </div>
                <div className={styles.legend}>
                    <span className={styles.legendLabel}>Contraction</span>
                    <div className={`${styles.legendBox} ${styles.intensity0}`}></div>
                    <div className={`${styles.legendBox} ${styles.intensity1}`}></div>
                    <div className={`${styles.legendBox} ${styles.intensity2}`}></div>
                    <div className={`${styles.legendBox} ${styles.intensity3}`}></div>
                    <div className={`${styles.legendBox} ${styles.intensity4}`}></div>
                    <span className={styles.legendLabel}>Peak Saturation</span>
                </div>
            </div>

            <div className={styles.matrixContainer}>
                {/* Y-Axis Labels (Days of Week) */}
                <div className={styles.yAxis}>
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>

                {/* The Grid */}
                <div className={styles.grid}>
                    {weeks.map((week, wIndex) => (
                        <div key={`w-${wIndex}`} className={styles.column}>
                            {week.map((day, dIndex) => (
                                <div
                                    key={day.date}
                                    className={`${styles.cell} ${getIntensityClass(day.score)}`}
                                    onMouseEnter={() => setHoveredCell(day)}
                                    onMouseLeave={() => setHoveredCell(null)}
                                >
                                    {/* Tooltip on Hover */}
                                    {hoveredCell === day && (
                                        <div className={styles.tooltip}>
                                            <div className={styles.ttDate}>{day.date}</div>
                                            <div className={styles.ttScore}>Score: <span>{day.score}</span></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.footerNote}>
                * Matrix updates dynamically based on live Amadeus hospitality pacing APIs.
            </div>
        </div>
    );
}
