"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import { ORIGIN_MARKETS, VEGAS_COORDS, generateMockFlights } from '../../lib/mockAirspaceData';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Users, History, Play, Pause } from 'lucide-react';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
    longitude: -105.0,
    latitude: 38.0,
    zoom: 4,
    pitch: 45,
    bearing: 0
};

// Colors based on demand level
const getColor = (demand) => {
    switch (demand) {
        case 'Surging': return [255, 59, 48]; // Red
        case 'High': return [245, 158, 11]; // Orange
        case 'Elevated': return [250, 204, 21]; // Yellow
        case 'Normal': return [16, 185, 129]; // Green
        default: return [255, 255, 255];
    }
};

export default function AirspaceRadar() {
    const [flights, setFlights] = useState([]);
    const [timeState, setTimeState] = useState(0); // For animation
    const [cvi, setCvi] = useState(62.4);
    const [landedAlert, setLandedAlert] = useState(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [isReplay, setIsReplay] = useState(false);

    // Initialize flights
    useEffect(() => {
        setFlights(generateMockFlights(40));
    }, []);

    // Animation Loop
    useEffect(() => {
        if (isReplay) return; // Pause auto-animation during replay

        const animation = setInterval(() => {
            setTimeState((t) => (t + 0.005) % 1);
            
            // Check for landings (progress reaching 1.0)
            setFlights(currentFlights => {
                let anyLanded = false;
                const updated = currentFlights.map(f => {
                    const newProgress = f.progress + 0.002;
                    if (newProgress >= 1.0) {
                        anyLanded = true;
                        // Trigger UI Pulse
                        setCvi(prev => parseFloat((prev + f.cviImpact).toFixed(1)));
                        setLandedAlert({
                            id: f.id,
                            airline: f.airline,
                            passengers: f.passengers,
                            cviImpact: f.cviImpact
                        });
                        
                        // Respawn flight
                        return {
                            ...f,
                            progress: 0,
                            origin: ORIGIN_MARKETS[Math.floor(Math.random() * ORIGIN_MARKETS.length)],
                            passengers: Math.floor(Math.random() * 150) + 50,
                            cviImpact: parseFloat((Math.random() * 0.4 + 0.1).toFixed(2))
                        };
                    }
                    return { ...f, progress: newProgress };
                });
                
                if (anyLanded) {
                    setTimeout(() => setLandedAlert(null), 3000);
                }
                
                return updated;
            });
            
        }, 50); // 20fps logic update

        return () => clearInterval(animation);
    }, [isReplay]);

    const layers = [
        // Origin Markets Heatmap Nodes
        new ScatterplotLayer({
            id: 'origin-markets',
            data: ORIGIN_MARKETS,
            getPosition: d => d.coordinates,
            getFillColor: d => getColor(d.demandLevel),
            getRadius: d => d.seats * 5,
            opacity: 0.6,
            stroked: true,
            getLineColor: [255, 255, 255, 100],
            lineWidthMinPixels: 1,
            pickable: true,
            onHover: info => setHoverInfo(info.object ? info : null)
        }),
        
        // Vegas Target Node
        new ScatterplotLayer({
            id: 'vegas-target',
            data: [{ position: VEGAS_COORDS }],
            getPosition: d => d.position,
            getFillColor: [0, 242, 254], // Primary Cyan
            getRadius: 50000,
            opacity: 0.8,
        }),

        // Flight Arcs
        new ArcLayer({
            id: 'flight-arcs',
            data: flights,
            getSourcePosition: d => d.origin.coordinates,
            getTargetPosition: d => d.target,
            getSourceColor: d => getColor(d.origin.demandLevel),
            getTargetColor: [0, 242, 254],
            getWidth: 2,
            // Use progress to calculate a subset of the arc for a "trail" effect
            // In a full production Deck.gl app, we'd use TripsLayer or custom shaders for precise trails.
            // Here, we simulate it by modulating opacity or height if we wrote a custom shader.
            // Since standard ArcLayer renders the full arc, we will just render the arc,
            // and we could add a point that moves along the arc using another ScatterplotLayer.
        }),
        
        // Moving Flight Points (Simulating planes on the arcs)
        new ScatterplotLayer({
            id: 'flight-points',
            data: flights,
            getPosition: d => {
                // Linear interpolation along the straight line path (DeckGL arcs are curved in 3D, but for top down 2D pos this works as a proxy)
                const [lon1, lat1] = d.origin.coordinates;
                const [lon2, lat2] = d.target;
                const p = d.progress;
                return [
                    lon1 + (lon2 - lon1) * p,
                    lat1 + (lat2 - lat1) * p
                ];
            },
            getFillColor: [255, 255, 255],
            getRadius: 8000,
            opacity: 1
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
                    <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'monospace', color: '#fff' }}>{hoverInfo.object.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Demand:</span> <span style={{ color: `rgb(${getColor(hoverInfo.object.demandLevel).join(',')})`, fontWeight: 'bold' }}>{hoverInfo.object.demandLevel}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Scheduled Seats:</span> <span>{hoverInfo.object.seats.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Avg Fare:</span> <span>{hoverInfo.object.fare}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Confidence:</span> <span style={{ color: 'var(--primary-color)' }}>{hoverInfo.object.confidence}%</span>
                    </div>
                </div>
            )}

            {/* Overlays */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
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
                        {cvi.toFixed(1)}
                    </motion.div>
                </div>
            </div>

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
                            <AlertTriangle size={12} /> Flight Arrived
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' }}>{landedAlert.airline}{landedAlert.id}</div>
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
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{flights.length}</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Projected Arrivals (2h)</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-growth)' }}>142</div>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Projected Arrivals (24h)</div>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 'bold' }}>1,845</div>
                    </div>
                </div>

                {/* Historical Replay Mode */}
                <div style={{ width: '300px', background: 'rgba(0,0,0,0.7)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={14}/> Historical Replay</span>
                        <button 
                            onClick={() => setIsReplay(!isReplay)} 
                            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                        >
                            {isReplay ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        defaultValue="100"
                        style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }} 
                        disabled={!isReplay}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {isReplay ? "Viewing: F1 Grand Prix 2023 (T-48h)" : "Live Telemetry"}
                    </div>
                </div>

            </div>

        </div>
    );
}
