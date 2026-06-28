"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../contexts/AuthContext';
import styles from './Terminal.module.css';

const FlightMap = dynamic(() => import('../../components/modules/FlightMap'), {
    ssr: false,
});

export default function TerminalTabs() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'arrivals', 'departures'
    const [searchQuery, setSearchQuery] = useState('');

    const [radarData, setRadarData] = useState([]);
    const [arrivalsData, setArrivalsData] = useState([]);
    const [departuresData, setDeparturesData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDelayed, setIsDelayed] = useState(false); // UI indicator for 72h delay

    const [arrivalsMetrics, setArrivalsMetrics] = useState(null);

    const fetchData = async (endpoint, setter, metricsSetter = null) => {
        setLoading(true);
        setError(null);
        try {
            const headers = {};
            if (user) {
                const token = await user.getIdToken();
                headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(endpoint, { headers });
            if (!res.ok) throw new Error('API Error');
            const result = await res.json();
            
            setter(result.data || []);
            setIsDelayed(result.delayed || false);
            if (metricsSetter && result.metrics) {
                metricsSetter(result.metrics);
            }
        } catch (err) {
            setError("Pipeline interruption. Retrying...");
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & Tab Switching
    useEffect(() => {
        if (activeTab === 'radar') fetchData('/api/radar', setRadarData);
        if (activeTab === 'arrivals') fetchData('/api/flights/arrivals', setArrivalsData, setArrivalsMetrics);
        if (activeTab === 'departures') fetchData('/api/flights/departures', setDeparturesData);
    }, [activeTab, user]);

    // Format UNIX timestamp to localized Time (HH:MM:SS)
    const formatTime = (unixTimestamp) => {
        if (!unixTimestamp) return '--:--';
        return new Date(unixTimestamp * 1000).toLocaleTimeString([], { hour12: false });
    };

    // Filter Logic
    const filteredRadar = useMemo(() => {
        return radarData.filter(f =>
            f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.country && f.country.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [radarData, searchQuery]);

    const filteredArrivals = useMemo(() => {
        return arrivalsData.filter(f =>
            f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.origin && f.origin.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [arrivalsData, searchQuery]);

    const filteredDepartures = useMemo(() => {
        return departuresData.filter(f =>
            f.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.destination && f.destination.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [departuresData, searchQuery]);


    return (
        <div>
            <div className={styles.tabsHeader}>
                <div className={styles.tabList}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'radar' ? styles.active : ''}`}
                        onClick={() => setActiveTab('radar')}
                    >
                        Live Airspace (Radar)
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'arrivals' ? styles.active : ''}`}
                        onClick={() => setActiveTab('arrivals')}
                    >
                        Live Inbound
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'departures' ? styles.active : ''}`}
                        onClick={() => setActiveTab('departures')}
                    >
                        Live Outbound
                    </button>
                </div>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search Callsign..."
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.loadingState}>Interrogating databases...</div>
                ) : error ? (
                    <div className={styles.emptyState}>{error}</div>
                ) : (
                    <>
                        {isDelayed && (
                            <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', padding: '10px 16px', borderRadius: '6px', marginBottom: '1rem', border: '1px solid rgba(234, 179, 8, 0.2)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.25-11.25v4.69l3.5 2.1-.75 1.22-4.25-2.56v-5.45h1.5z"/>
                                </svg>
                                <strong>Signal Tier:</strong> Viewing 72-hour delayed data. Upgrade to Intelligence for real-time telemetry.
                            </div>
                        )}
                        {/* INTELLIGENCE DASHBOARD */}
                        {arrivalsMetrics && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Est. Inbound Passengers</span>
                                    <span className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent-growth)' }}>
                                        {arrivalsMetrics.totalEstimatedPassengers.toLocaleString()}
                                    </span>
                                </div>
                                <div className="card glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VIP Jets Airborne</span>
                                    <span className="glow-text" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#eab308' }}>
                                        {arrivalsMetrics.totalPrivateJets.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* RADAR TABLE */}
                        {activeTab === 'radar' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ padding: '0 1.5rem', paddingTop: '1.5rem' }}>
                                    <FlightMap />
                                </div>
                                <table className={styles.ledgerTable}>
                                    <thead>
                                        <tr>
                                            <th>Callsign</th>
                                            <th>Category</th>
                                            <th>Origin Country</th>
                                            <th>Altitude</th>
                                            <th>Velocity</th>
                                            <th>Heading</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRadar.map((flight, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{flight.callsign}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                                        backgroundColor: flight.category === 'Private' ? 'rgba(234, 179, 8, 0.1)' : flight.category === 'Commercial' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                        color: flight.category === 'Private' ? '#eab308' : flight.category === 'Commercial' ? '#10B981' : 'var(--text-secondary)'
                                                    }}>{flight.category || 'Other'}</span>
                                                </td>
                                                <td>{flight.country}</td>
                                                <td>{Math.round(flight.altitude || 0).toLocaleString()} ft</td>
                                                <td>{Math.round(flight.velocity || 0)} kts</td>
                                                <td>{Math.round(flight.heading || 0)}°</td>
                                                <td><span className={`${styles.statusBadge} ${styles.statusAirborne}`}>Airborne</span></td>
                                            </tr>
                                        ))}
                                        {filteredRadar.length === 0 && (
                                            <tr><td colSpan="7" className={styles.emptyState}>No targets matching parameters.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ARRIVALS TABLE */}
                        {activeTab === 'arrivals' && (
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Callsign</th>
                                        <th>Category</th>
                                        <th>Origin (ICAO)</th>
                                        <th>Destination</th>
                                        <th>Initial Contact</th>
                                        <th>Touchdown / Last Seen</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredArrivals.map((flight, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{flight.callsign}</td>
                                            <td>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                                    backgroundColor: flight.category === 'Private' ? 'rgba(234, 179, 8, 0.1)' : flight.category === 'Commercial' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    color: flight.category === 'Private' ? '#eab308' : flight.category === 'Commercial' ? '#10B981' : 'var(--text-secondary)'
                                                }}>{flight.category || 'Other'}</span>
                                            </td>
                                            <td>{flight.origin}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{flight.destination}</td>
                                            <td>{formatTime(flight.firstSeen)}</td>
                                            <td>{formatTime(flight.lastSeen)}</td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusArrived}`}>Inbound</span></td>
                                        </tr>
                                    ))}
                                    {filteredArrivals.length === 0 && (
                                        <tr><td colSpan="7" className={styles.emptyState}>No inbound targets matching parameters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* DEPARTURES TABLE */}
                        {activeTab === 'departures' && (
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Callsign</th>
                                        <th>Origin</th>
                                        <th>Destination (ICAO)</th>
                                        <th>Departed At</th>
                                        <th>Last Contact</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartures.map((flight, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{flight.callsign}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{flight.origin}</td>
                                            <td>{flight.destination}</td>
                                            <td>{formatTime(flight.firstSeen)}</td>
                                            <td>{formatTime(flight.lastSeen)}</td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusDeparted}`}>Departing</span></td>
                                        </tr>
                                    ))}
                                    {filteredDepartures.length === 0 && (
                                        <tr><td colSpan="6" className={styles.emptyState}>No outbound targets matching parameters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
