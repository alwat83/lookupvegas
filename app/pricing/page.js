"use client";

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './Pricing.module.css';
import RoiCalculator from '../../components/RoiCalculator';

export default function PricingPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();

    const handleSubscribe = async () => {
        // Without Stripe IDs, just route to signup
        router.push('/signup');
    };

    return (
        <main className={styles.pricingContainer}>
            <div className={styles.heroSection}>
                <div className="container">
                    <h1 className={styles.title}>Enterprise Access Tiers</h1>
                    <p className={styles.subtitle} style={{ maxWidth: '800px', margin: '0 auto' }}>
                        Predictive macroeconomic data and early demand signals for hospitality strategists, event planners, and real estate funds operating in Las Vegas.
                    </p>
                </div>
            </div>

            <div className="container" style={{ marginBottom: '4rem' }}>
                <RoiCalculator />
            </div>

            <div className={`container ${styles.tiersSection}`}>

                {/* 1. Professional Tier */}
                <div className={styles.pricingCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.tierName}>Professional</h2>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>$99</span>
                            <span className={styles.period}>/mo</span>
                        </div>
                        <p className={styles.tierDesc}>Basic demand signals for individual analysts and small operators.</p>
                    </div>
                    <div className={styles.cardFeatures}>
                        <ul className={styles.featureList}>
                            <li>30-day forward demand signals</li>
                            <li>Standard Compression Index score</li>
                            <li>Weekly trend snapshots</li>
                            <li>PDF Macro Demand Reports</li>
                        </ul>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleSubscribe}>
                            Subscribe
                        </button>
                    </div>
                </div>

                {/* 2. Operator Tier */}
                <div className={`${styles.pricingCard} ${styles.highlightCard}`}>
                    <div className={styles.popularBadge}>Most Active</div>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.tierName}>Operator</h2>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>$299</span>
                            <span className={styles.period}>/mo</span>
                        </div>
                        <p className={styles.tierDesc}>Actionable intelligence for STR owners and boutique hotels.</p>
                    </div>
                    <div className={styles.cardFeatures}>
                        <ul className={styles.featureList}>
                            <li>90-day forward demand signals</li>
                            <li>Real-time CVI and live deltas</li>
                            <li>Event impact modeling forecasts</li>
                            <li>Daily email alerts for compression events</li>
                            <li>Historical analogues (1 year)</li>
                        </ul>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={`${styles.actionBtn} ${styles.btnPrimary}`} onClick={handleSubscribe}>
                            Subscribe
                        </button>
                    </div>
                </div>

                {/* 3. Enterprise Tier */}
                <div className={styles.pricingCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.tierName}>Enterprise</h2>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>$1,499</span>
                            <span className={styles.period}>/mo</span>
                        </div>
                        <p className={styles.tierDesc}>Full institutional access for REITs, funds, and large aggregators.</p>
                    </div>
                    <div className={styles.cardFeatures}>
                        <ul className={styles.featureList}>
                            <li>365-day forward looking window</li>
                            <li>Interactive Scenario Modeling tools</li>
                            <li>Raw data export (CSV / Excel)</li>
                            <li>5 Years of Historical Telemetry</li>
                            <li>Direct REST API access (Rate limited)</li>
                        </ul>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleSubscribe}>
                            Subscribe
                        </button>
                    </div>
                </div>

            </div>

            {/* FAQ Section */}
            <div className={styles.faqSection}>
                <div className="container">
                    <h3 className={styles.faqTitle}>Frequently Asked Questions</h3>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h4>How current is the data?</h4>
                            <p>Our telemetry updates with a 15ms latency on our end. New flight and search capacity data is ingested daily to constantly recalibrate the City Compression Index.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>Can I export the data for my internal models?</h4>
                            <p>Yes. The Enterprise tier allows full CSV exports of our indexed data tables, enabling you to overlay our metrics onto your internal revenue or booking curves in Excel or Tableau.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h4>How are API limits structured?</h4>
                            <p>Enterprise plans include rate-limited access to the Data API. For unmetered access or direct JSON payloads for high-frequency hedge fund use cases, please contact us for Institutional pricing.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
