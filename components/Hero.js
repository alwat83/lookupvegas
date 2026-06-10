import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../app/contexts/AuthContext';
import styles from "./Hero.module.css";

export default function Hero() {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className={styles.heroSection}>
            <div className={styles.telemetryBackground}>
                <div className={styles.radarGrid}></div>
                <div className={styles.ambientSweep}></div>
            </div>

            <div className={`container animate-fade-in ${styles.relativeContent}`}>
                
                <div className={styles.systemStatus}>
                    <div className="live-indicator"></div>
                    <span className={styles.monoText}>SYSTEM ONLINE | LAST PULSE: {currentTime}</span>
                </div>

                <div className={styles.heroContent}>
                    <h1 className={styles.headline}>
                        Predict Las Vegas Demand <br />
                        <span className={styles.highlight}>Before</span> the Market Reacts.
                    </h1>
                    <p className={styles.subtitle}>
                        The ultimate predictive intelligence terminal for STR hosts, event planners, and enterprise hospitality funds.
                    </p>
                    
                    <div className={styles.ctaGroup}>
                        {user ? (
                            <Link href="/terminal" className={styles.primaryBtn}>Access Terminal</Link>
                        ) : (
                            <>
                                <Link href="/signup" className={styles.primaryBtn}>Request Access</Link>
                                <Link href="/pricing" className={styles.secondaryBtn}>Unlock Live Intelligence</Link>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.dataRibbon}>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>Visitor Volume (7-Day)</span>
                        <span className={styles.ribbonValue}>+4.2% <span className="text-emerald">▲</span></span>
                    </div>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>Transit Arrivals (30-day)</span>
                        <span className={styles.ribbonValue}>+1.8% <span className="text-emerald">▲</span></span>
                    </div>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>Hotel Compression</span>
                        <span className={styles.ribbonValue}>88<span className="text-muted">/100</span></span>
                    </div>
                    <div className={styles.ribbonItem}>
                        <span className={styles.ribbonLabel}>City Velocity Index</span>
                        <span className={styles.ribbonValue}>74<span className="text-muted text-xs ml-1">Accelerating</span></span>
                    </div>
                </div>
            </div>
        </section>
    );
}
