"use client";

import { useEffect, useState } from "react";
import styles from "./FlightSignals.module.css";

export default function FlightSignals() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/flights");
                const json = await res.json();

                if (json.error && !json.data.totalArrivals) {
                    setError(true);
                } else {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return (
        <div className={`card animate-fade-in ${styles.flightCard}`}>
            <div className="card-header">
                <h3 className="card-title">Transit & Ingress Signals</h3>
                <span className="badge badge-growth">Live API</span>
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loadingPulse}>Querying KLAS Airspace...</div>
                ) : error || !data ? (
                    <div className="text-secondary text-sm">Signal temporarily unavailable.</div>
                ) : (
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricItem}>
                            <span className="text-muted text-xs">Total Daily Arrivals</span>
                            <div className="text-3xl font-mono font-semibold">{data.totalArrivals}</div>
                            <div className="text-xs text-secondary mt-1">Previous 24h</div>
                        </div>

                        <div className={styles.metricSplit}>
                            <div className={styles.metricItemSmall}>
                                <span className="text-muted text-xs">Domestic</span>
                                <div className="text-lg font-mono">{data.domestic}</div>
                            </div>
                            <div className={styles.metricItemSmall}>
                                <span className="text-muted text-xs">Int'l</span>
                                <div className="text-lg font-mono">{data.international}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
