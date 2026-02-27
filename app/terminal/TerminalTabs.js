"use client";

import { useState, useEffect, useMemo } from 'react';
import styles from './Terminal.module.css';

export default function TerminalTabs() {
    const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'arrivals', 'departures'
    const [searchQuery, setSearchQuery] = useState('');

    const [radarData, setRadarData] = useState([]);
    const [arrivalsData, setArrivalsData] = useState([]);
    const [departuresData, setDeparturesData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async (endpoint, setter) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error('API Error');
            const result = await res.json();
            setter(result.data || []);
        } catch (err) {
            setError("Pipeline interruption. Retrying...");
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & Tab Switching
    useEffect(() => {
        if (activeTab === 'radar') fetchData('/api/radar', setRadarData);
        if (activeTab === 'arrivals') fetchData('/api/flights/arrivals', setArrivalsData);
        if (activeTab === 'departures') fetchData('/api/flights/departures', setDeparturesData);
    }, [activeTab]);

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
                        Arrivals (Last 6H)
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'departures' ? styles.active : ''}`}
                        onClick={() => setActiveTab('departures')}
                    >
                        Departures (Last 6H)
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
                        {/* RADAR TABLE */}
                        {activeTab === 'radar' && (
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Callsign</th>
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
                                            <td>{flight.country}</td>
                                            <td>{Math.round(flight.altitude || 0)}m</td>
                                            <td>{Math.round(flight.velocity || 0)} m/s</td>
                                            <td>{Math.round(flight.heading || 0)}°</td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusAirborne}`}>Airborne</span></td>
                                        </tr>
                                    ))}
                                    {filteredRadar.length === 0 && (
                                        <tr><td colSpan="6" className={styles.emptyState}>No targets matching parameters.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* ARRIVALS TABLE */}
                        {activeTab === 'arrivals' && (
                            <table className={styles.ledgerTable}>
                                <thead>
                                    <tr>
                                        <th>Callsign</th>
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
                                            <td>{flight.origin}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{flight.destination}</td>
                                            <td>{formatTime(flight.firstSeen)}</td>
                                            <td>{formatTime(flight.lastSeen)}</td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusArrived}`}>Arrived</span></td>
                                        </tr>
                                    ))}
                                    {filteredArrivals.length === 0 && (
                                        <tr><td colSpan="6" className={styles.emptyState}>No arrivals matching parameters.</td></tr>
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
                                            <td><span className={`${styles.statusBadge} ${styles.statusDeparted}`}>Departed</span></td>
                                        </tr>
                                    ))}
                                    {filteredDepartures.length === 0 && (
                                        <tr><td colSpan="6" className={styles.emptyState}>No departures matching parameters.</td></tr>
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
