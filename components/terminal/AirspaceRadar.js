"use client";

import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ScatterplotLayer } from '@deck.gl/layers';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Users } from 'lucide-react';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
    longitude: -115.1537,
    latitude: 36.0840,
    zoom: 8,
    pitch: 45,
    bearing: 0
};

const VEGAS_COORDS = [-115.1537, 36.0840];

export default function AirspaceRadar() {
    const [flights, setFlights] = useState([]);
    const [cvi, setCvi] = useState(62.4);
    const [landedAlert, setLandedAlert] = useState(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [stats, setStats] = useState({ inbound: 0, outbound: 0, arrivalRate: 0 });

    useEffect(() => {
        const fetchCVI = async () => {
            try {
                const res = await fetch('/api/historical');
                if (res.ok) {
                    const data = await res.json();
                    if (data.history && data.history.length > 0) {
                        setCvi(data.history[data.history.length - 1].cvi);
                    }
                }
            } catch (e) {}
        };
        fetchCVI();
    }, []);

    useEffect(() => {
        const fetchRadar = async () => {
            try {
                const res = await fetch('/api/radar');
                if (res.ok) {
                    const json = await res.json();
                    const data = json.data || [];
                    
                    setFlights(prev => {
                        const prevIds = new Set(prev.map(f => f.hex));
                        const newFlights = data.filter(f => !prevIds.has(f.hex));
                        
                        if (newFlights.length > 0) {
                            const f = newFlights[0];
                            setLandedAlert({
                                id: f.hex,
                                airline: f.callsign || 'Unknown',
                                passengers: f.estimatedPassengers || 0,
                                cviImpact: ((f.estimatedPassengers || 0) / 1000).toFixed(2)
                            });
                            setTimeout(() => setLandedAlert(null), 3000);
                        }
                        return data;
                    });
                }
                
                const snapRes = await fetch('/api/aviation/snapshot');
                if (snapRes.ok) {
                    const snap = await snapRes.json();
                    if (snap.currentSnapshot) {
                        setStats({
                            inbound: snap.currentSnapshot.inboundFlights,
                            outbound: snap.currentSnapshot.outboundFlights,
                            arrivalRate: snap.currentSnapshot.arrivalRatePerHour
                        });
                    }
                }

            } catch(e) {
                console.error(e);
            }
        };

        fetchRadar();
        const interval = setInterval(fetchRadar, 15000);
        return () => clearInterval(interval);
    }, []);

    const getColor = (category) => {
        switch (category) {
            case 'Commercial': return [0, 242, 254];
            case 'Private': return [251, 191, 36];
            case 'Cargo': return [156, 163, 175];
            default: return [255, 255, 255];
        }
    };

    const layers = [
        new ScatterplotLayer({
            id: 'vegas-target',
            data: [{ position: VEGAS_COORDS }],
            getPosition: d => d.position,
            getFillColor: [0, 242, 254],
            getRadius: 50000,
            opacity: 0.1,
            stroked: true,
            getLineColor: [0, 242, 254, 100],
            lineWidthMinPixels: 2
        }),
        new ScatterplotLayer({
            id: 'flight-points',
            data: flights,
            getPosition: d => [d.lon, d.lat],
            getFillColor: d => getColor(d.category),
            getRadius: d => Math.max(1000, (d.estimatedPassengers || 10) * 50),
            opacity: 1,
            pickable: true,
            onHover: info => setHoverInfo(info.object ? info : null)
        })
    ];

    return (
        <div style={{ position: 'relative', width: '100%', height: '700px', background: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                layers={layers}
            >
                <Map mapStyle={MAP_STYLE} />
            </DeckGL>

            {/* Top Left Indicators */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(4px)', alignSelf: 'flex-start' }}>
                    <div className="pulse-anim" style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>
                    <style dangerouslySetInnerHTML={{__html: `@keyframes pulseLive { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } } .pulse-anim { animation: pulseLive 2s infinite; }`}} />
                    <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '1px' }}>LIVE ADS-B</span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.7)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={14} color="var(--primary-color)" /> City Velocity Index
                    </div>
                    <motion.div 
                        key={cvi}
                        initial={{ scale: 1.2, color: 'var(--primary-color)' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        transition={{ duration: 0.5 }}
                        style={{ fontSize: '3.5rem', fontWeight: 'bold', fontFamily: 'monospace', lineHeight: 1 }}
                    >
                        {cvi ? cvi.toFixed(1) : '--'}
                    </motion.div>
                </div>
            </div>

            {/* Tooltip */}
            {hoverInfo && hoverInfo.object && (
                <div style={{
                    position: 'absolute',
                    zIndex: 1,
                    pointerEvents: 'none',
                    left: hoverInfo.x,
                    top: hoverInfo.y,
                    transform: 'translate(-50%, -120%)',
                    background: 'rgba(0,0,0,0.85)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(4px)',
                    minWidth: '200px'
                }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'monospace', color: '#fff' }}>{hoverInfo.object.callsign}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Type:</span> <span style={{ color: '#fff' }}>{hoverInfo.object.type}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Category:</span> <span style={{ color: `rgb(${getColor(hoverInfo.object.category).join(',')})`, fontWeight: 'bold' }}>{hoverInfo.object.category}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Altitude:</span> <span>{hoverInfo.object.alt} ft</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Est. Pax:</span> <span style={{ color: 'var(--primary-color)' }}>{hoverInfo.object.estimatedPassengers}</span>
                    </div>
                </div>
            )}

            {/* Landed Alert Pulse */}
            <AnimatePresence>
                {landedAlert && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            zIndex: 10,
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid var(--accent-growth)',
                            padding: '1rem',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            minWidth: '220px'
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-growth)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertTriangle size={12} /> Target Detected
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' }}>{landedAlert.airline}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span><Users size={12} style={{ display: 'inline', marginRight: '4px' }}/>{landedAlert.passengers} Pax</span>
                            <span style={{ color: 'var(--primary-color)' }}>+{landedAlert.cviImpact} CVI</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Radar Dashboard Bottom Bar */}
            <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: 'rgba(0,0,0,0.7)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Inbound Flights (Live)</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{stats.inbound}</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Outbound Flights (Live)</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.outbound}</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Arrival Rate</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-growth)' }}>{stats.arrivalRate}/hr</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
