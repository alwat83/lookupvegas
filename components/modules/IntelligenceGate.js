"use client";

import { useAuth } from "../../app/contexts/AuthContext";
import CheckoutButton from "../CheckoutButton";

// Gates the Intelligence dashboard on the user's real, Firestore-backed
// tier. Previously this was a searchParams `?unlocked=true` check with no
// server verification at all -- anyone could unlock the page by editing
// the URL. Tier now comes from AuthContext, which reads the verified
// Firestore profile, matching the gating pattern used elsewhere in the app
// (e.g. app/terminal/api/page.js).
export default function IntelligenceGate({ children, className }) {
    const { userProfile, loading } = useAuth();
    const isUnlocked = !loading && (userProfile?.tier === 'Intelligence' || userProfile?.tier === 'Enterprise');

    return (
        <>
            {!isUnlocked && (
                <div style={{
                    position: 'absolute',
                    top: '250px',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: '4rem',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, var(--background) 40%, var(--background) 100%)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        maxWidth: '600px',
                        padding: '3rem',
                        backgroundColor: 'var(--background-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Premium Data Access</h2>
                        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                            Access real-time arrival velocity, forward-looking compression matrices, and geographical origin telemetry with the LookupVegas Intelligence Tier.
                        </p>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Includes:</h3>
                        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 2rem auto', maxWidth: '400px', color: 'var(--text-secondary)' }}>
                            <li style={{ marginBottom: '0.5rem' }}>✓ 30-Day Historical Velocity Mapping</li>
                            <li style={{ marginBottom: '0.5rem' }}>✓ 90-Day Forward Compression Matrix</li>
                            <li style={{ marginBottom: '0.5rem' }}>✓ Live Origin Sector Telemetry</li>
                            <li style={{ marginBottom: '0.5rem' }}>✓ Ticketmaster Event Impact Modeler</li>
                        </ul>
                        <CheckoutButton />
                    </div>
                </div>
            )}

            <div
                className={className}
                style={{
                    filter: isUnlocked ? 'none' : 'blur(8px) grayscale(50%)',
                    pointerEvents: isUnlocked ? 'auto' : 'none',
                    userSelect: isUnlocked ? 'auto' : 'none',
                    opacity: isUnlocked ? 1 : 0.6
                }}
            >
                {children}
            </div>
        </>
    );
}
