"use client";

import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import { MapView } from "@deck.gl/core";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

export default function FlightMap() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLabels, setShowLabels] = useState(false);

    const [viewState, setViewState] = useState({
        longitude: -115.153,
        latitude: 36.084,
        zoom: 9.5,
        pitch: 45, // 3D Pitch
        bearing: 0
    });

    useEffect(() => {
        async function fetchRadar() {
            try {
                const res = await fetch("/api/radar");
                const json = await res.json();
                if (json.data) {
                    setFlights(json.data);
                }
            } catch (err) {
                console.error("Radar sweep failed", err);
            } finally {
                setLoading(false);
            }
        }

        fetchRadar();
        const interval = setInterval(fetchRadar, 60000);
        return () => clearInterval(interval);
    }, []);

    const tileLayer = new TileLayer({
        data: 'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        renderSubLayers: props => {
            const { bbox: { west, south, east, north } } = props.tile;
            return new BitmapLayer(props, {
                data: null,
                image: props.data,
                bounds: [west, south, east, north]
            });
        }
    });

    const scatterLayer = new ScatterplotLayer({
        id: 'flights-layer',
        data: flights,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 10,
        radiusMinPixels: 4,
        radiusMaxPixels: 20,
        lineWidthMinPixels: 2,
        getPosition: d => [d.longitude || 0, d.latitude || 0, (d.altitude || 0) * 0.3048], // Altitude in meters
        getFillColor: d => {
            if (d.category === 'Private') return [234, 179, 8]; // Gold
            if (d.category === 'Commercial') return [16, 185, 129]; // Green
            return [156, 163, 175]; // Gray for Other
        },
        getLineColor: [15, 17, 21], // --bg-primary
        updateTriggers: {
            getPosition: [flights],
            getFillColor: [flights]
        }
    });

    const textLayer = new TextLayer({
        id: 'flight-labels',
        data: showLabels ? flights : [],
        pickable: false,
        getPosition: d => [d.longitude || 0, d.latitude || 0, ((d.altitude || 0) * 0.3048) + 200], // Slightly above
        getText: d => d.callsign || 'UNK',
        getSize: 12,
        getColor: d => {
            if (d.category === 'Private') return [234, 179, 8];
            if (d.category === 'Commercial') return [16, 185, 129];
            return [249, 250, 251]; // White
        },
        getAngle: 0,
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        pixelOffset: [15, 0],
        background: true,
        getBackgroundColor: [26, 29, 36, 200],
        updateTriggers: {
            getColor: [flights]
        }
    });

    // Custom tooltip
    const getTooltip = ({ object }) => {
        if (!object) return null;
        
        let colorHex = '#9CA3AF'; // Gray
        if (object.category === 'Private') colorHex = '#eab308'; // Gold
        if (object.category === 'Commercial') colorHex = '#10B981'; // Green

        return {
            html: `
            <div style="font-family: monospace; font-size: 12px; background: rgba(15,17,21,0.9); border: 1px solid #262A33; padding: 10px; border-radius: 4px; color: #F9FAFB; backdrop-filter: blur(4px);">
                <div style="color: ${colorHex}; font-weight: bold; margin-bottom: 4px;">${object.callsign} <span style="font-size: 0.65rem; padding: 2px 4px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-left: 4px;">${object.category || 'Other'}</span></div>
                ${object.type || object.registration ? `<div style="color: #9CA3AF; margin-bottom: 4px;">Type: ${object.type || 'UNK'} | Reg: ${object.registration || 'UNK'}</div>` : ''}
                <div>ALT: ${Math.round(object.altitude).toLocaleString()} ft</div>
                <div>SPD: ${Math.round(object.velocity)} kts</div>
                <div>HDG: ${Math.round(object.heading)}°</div>
            </div>
            `,
            style: {
                backgroundColor: 'transparent',
                boxShadow: 'none',
                padding: 0
            }
        };
    };

    return (
        <div style={{ height: "500px", width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.08)", position: 'relative' }} className="glass-panel">
            {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-card)' }}>
                    <div className="live-indicator" style={{ marginRight: '8px' }}></div>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>Initializing 3D Radar Sweep...</span>
                </div>
            )}

            {!loading && typeof window !== "undefined" && (
                <DeckGL
                    views={new MapView({ repeat: true })}
                    initialViewState={viewState}
                    onViewStateChange={({ viewState }) => setViewState(viewState)}
                    controller={true}
                    layers={[tileLayer, scatterLayer, textLayer]}
                    getTooltip={getTooltip}
                />
            )}

            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 999, backgroundColor: 'rgba(26, 29, 36, 0.85)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center' }}>
                <div className="live-indicator" style={{ marginRight: '8px' }}></div>
                <span className="glow-text" style={{ color: 'var(--accent-growth)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>LIVE TARGETS: {flights.length}</span>
            </div>

            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 999 }}>
                <button
                    onClick={() => setShowLabels(!showLabels)}
                    style={{
                        backgroundColor: showLabels ? 'var(--accent-growth)' : 'rgba(26, 29, 36, 0.9)',
                        color: showLabels ? 'var(--bg-primary)' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        transition: 'all 0.2s ease',
                        fontWeight: 600,
                        boxShadow: showLabels ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
                    }}
                >
                    {showLabels ? 'HIDE LABELS' : 'SHOW LABELS'}
                </button>
            </div>
        </div>
    );
}
