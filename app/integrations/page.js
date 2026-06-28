"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Integrations.module.css';

const INTEGRATIONS_CONFIG = [
    {
        id: 'ticketmaster',
        name: 'Ticketmaster Discovery API',
        description: 'Global event discovery and venue catalog. Used to power the Event Impact Modeler and forward-looking compression metrics.',
        envKey: 'TICKETMASTER_API_KEY',
    },
    {
        id: 'seatgeek',
        name: 'SeatGeek Platform API',
        description: 'Secondary market ticket velocity and popularity scores. Used as a secondary verification source for demand spikes.',
        envKey: 'SEATGEEK_CLIENT_ID',
    },
    {
        id: 'eventbrite',
        name: 'Eventbrite API v3',
        description: 'Local and grassroots event aggregation. Useful for tracking thousands of smaller conventions mapping to overall city capacity.',
        envKey: 'EVENTBRITE_API_KEY',
    },
    {
        id: 'flightradar24',
        name: 'FlightRadar24 Business API',
        description: 'Live aircraft telemetry and incoming capacity tracking for McCarran International (LAS).',
        envKey: 'FR24_API_KEY',
    }
];

export default function IntegrationsPage() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mockKeys, setMockKeys] = useState({});

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await fetch('/api/integrations/status');
                const json = await res.json();
                if (json.data) {
                    setStatus(json.data);
                }
            } catch (err) {
                console.error("Failed to load integrations status", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    const handleSave = (id) => {
        // Mock save functionality for the prototype
        setStatus(prev => ({
            ...prev,
            [id]: true
        }));
    };

    const handleInputChange = (id, value) => {
        setMockKeys(prev => ({
            ...prev,
            [id]: value
        }));
    };

    return (
        <div className={styles.pageContainer}>
            <Link href="/intelligence?unlocked=true" className={styles.backBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Intelligence
            </Link>

            <div className={`container ${styles.header}`}>
                <h1 className={styles.title}>Data Integrations</h1>
                <p className={styles.subtitle}>
                    Manage the external APIs that power LookupVegas predictive models, live telemetry, and historical mapping.
                </p>
            </div>

            <div className={`container ${styles.grid}`}>
                {INTEGRATIONS_CONFIG.map(integration => {
                    const isConnected = status ? status[integration.id] : false;
                    
                    return (
                        <div key={integration.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.providerName}>{integration.name}</h3>
                                    <p className={styles.providerDesc}>{integration.description}</p>
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                {loading ? (
                                    <span className={styles.statusBadge} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                        Scanning...
                                    </span>
                                ) : isConnected ? (
                                    <span className={`${styles.statusBadge} ${styles.statusConnected}`}>
                                        <div className={`${styles.dot} ${styles.dotConnected}`}></div>
                                        Connected
                                    </span>
                                ) : (
                                    <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                                        <div className={`${styles.dot} ${styles.dotPending}`}></div>
                                        Action Required
                                    </span>
                                )}
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>{integration.envKey}</label>
                                <div className={styles.inputWrapper}>
                                    <input 
                                        type="password"
                                        className={styles.inputField}
                                        placeholder={isConnected ? "••••••••••••••••••••" : "Paste API Key here"}
                                        value={mockKeys[integration.id] || ''}
                                        onChange={(e) => handleInputChange(integration.id, e.target.value)}
                                        disabled={isConnected}
                                    />
                                    {!isConnected && (
                                        <button 
                                            className={styles.saveBtn}
                                            onClick={() => handleSave(integration.id)}
                                            disabled={!mockKeys[integration.id]}
                                        >
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
