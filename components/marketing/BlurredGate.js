import styles from './BlurredGate.module.css';
import Link from 'next/link';
import { useAuth } from '../../app/contexts/AuthContext';

export default function BlurredGate({ children, title, description, ctaText }) {
    const { user, loading } = useAuth();

    // If the user is authenticated, we return the children directly
    // without any blurs or lock overlays. This allows them to see the landing page
    // but with full, unlocked access to the interactive components.
    if (!loading && user) {
        return <div className={styles.unlockedContent}>{children}</div>;
    }

    return (
        <div className={styles.blurWrapper}>
            <div className={styles.blurredContent}>
                {children}
            </div>
            
            <div className={styles.mockOverlayTopLeft}>
                <div className={styles.mockChart}></div>
                <span className={styles.mockLabel}>ADR PROJECTION [LOCKED]</span>
            </div>
            
            <div className={styles.mockOverlayBottomRight}>
                <span className={styles.mockLabel}>GEO-CLUSTER ANOMALY DETECTED</span>
                <div className={styles.mockSparkline}></div>
            </div>

            <div className={styles.overlay}>
                <div className={styles.lockCard}>
                    <div className={styles.scanline}></div>
                    <div className={styles.lockIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                    <h3 className={styles.title}>{title || "Proprietary Telemetry"}</h3>
                    <p className={styles.description}>
                        {description || "Request access to unlock institutional-grade data feeds and predictive compression models."}
                    </p>
                    <div className={styles.statusLine}>
                        <span className={styles.blinkDot}></span> Scanning Authorization...
                    </div>
                    <Link href="/signup" className={styles.ctaBtn}>
                        {ctaText || "Request Access"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
