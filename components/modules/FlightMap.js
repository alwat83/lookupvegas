"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues with Next.js
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Dynamically import the map components so they don't break SSR
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
    ssr: false,
});

export default function FlightMap() {
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);

    // KLAS Airport approximate coordinates
    const klasPosition = [36.084, -115.153];

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
        // Poll every 60 seconds to respect API limits
        const interval = setInterval(fetchRadar, 60000);
        return () => clearInterval(interval);
    }, []);

    // Custom Icon structure loading natively using L inline to avoid ssr window ref errors
    // A simple plain dot or triangle is best for the Bloomerg terminal look
    let aircraftIcon = null;
    if (typeof window !== "undefined") {
        const L = require("leaflet");
        aircraftIcon = new L.DivIcon({
            className: "radar-blip",
            html: `<div style="width: 12px; height: 12px; background-color: var(--accent-growth); border-radius: 50%; border: 2px solid var(--bg-primary); box-shadow: 0 0 8px var(--accent-growth);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    }

    return (
        <div style={{ height: "400px", width: "100%", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color)", position: 'relative' }}>
            {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-card)' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>Initializing Radar Sweep...</span>
                </div>
            )}

            {!loading && typeof window !== "undefined" && (
                <MapContainer
                    center={klasPosition}
                    zoom={10}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%", backgroundColor: "#0F1115" }}
                    zoomControl={false}
                >
                    {/* Use CARTO Dark Matter for the "Terminal" aesthetic */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {flights.map((flight) => (
                        <Marker
                            key={flight.icao}
                            position={[flight.latitude, flight.longitude]}
                            icon={aircraftIcon}
                        >
                            <Popup className="premium-popup">
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--bg-primary)" }}>
                                    <div><strong>{flight.callsign}</strong></div>
                                    <div>ALT: {Math.round(flight.altitude * 3.28084).toLocaleString()} ft</div>
                                    <div>SPD: {Math.round(flight.velocity * 1.94384)} kts</div>
                                    <div>HDG: {Math.round(flight.heading)}°</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            )}

            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 999, backgroundColor: 'rgba(26, 29, 36, 0.8)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backdropFilter: 'blur(4px)' }}>
                <span style={{ color: 'var(--accent-growth)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>● LIVE TARGETS: {flights.length}</span>
            </div>
        </div>
    );
}
