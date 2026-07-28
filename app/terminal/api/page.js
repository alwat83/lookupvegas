"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import styles from "../Terminal.module.css";

export default function ApiGatewayPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const [keys, setKeys] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!loading && (!user || userProfile?.tier !== 'Enterprise')) {
            router.push('/terminal');
        } else if (user && userProfile?.tier === 'Enterprise') {
            fetchKeys();
        }
    }, [user, userProfile, loading, router]);

    const fetchKeys = async () => {
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/unkey/keys", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setKeys(data.keys || []);
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to fetch keys");
        }
    };

    const handleGenerateKey = async () => {
        setIsGenerating(true);
        setError("");
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/unkey/keys", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: "LookupVegas Enterprise Key" })
            });
            const data = await res.json();
            if (res.ok) {
                // Prepend to keys for immediate UI update, though Unkey API won't return full key secret in list endpoint later
                setKeys([{ id: data.keyId, name: "LookupVegas Enterprise Key", key: data.key, createdAt: Date.now() }, ...keys]);
                // Show an alert to user since the key is only shown once
                alert(`IMPORTANT: Copy your API Key now. It will not be shown again.\n\n${data.key}`);
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to generate key");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevokeKey = async (keyId) => {
        setIsRevoking(true);
        setError("");
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/unkey/keys?keyId=${keyId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== keyId));
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch (e) {
            setError("Failed to revoke key");
        } finally {
            setIsRevoking(false);
        }
    };

    if (loading || !user || userProfile?.tier !== 'Enterprise') {
        return <div className={styles.loadingState}>Verifying clearance...</div>;
    }

    return (
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '6rem' }}>
            <div className={styles.header}>
                <h1 className={styles.title}>Enterprise API Gateway</h1>
                <p className={styles.subtitle}>Programmatic access to raw telemetry and predictive modeling endpoints.</p>
            </div>

            {error && <div style={{ color: 'var(--accent-warning)', marginBottom: '1rem' }}>{error}</div>}

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="card-title">Active API Keys</h3>
                    <button 
                        className={styles.tabBtn} 
                        style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none' }}
                        onClick={handleGenerateKey}
                        disabled={isGenerating}
                    >
                        {isGenerating ? "Generating..." : "+ Generate New Key"}
                    </button>
                </div>
                
                <table className={styles.ledgerTable} style={{ marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th>Key Name</th>
                            <th>Key ID / Prefix</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map((k, idx) => (
                            <tr key={idx}>
                                <td>{k.name}</td>
                                <td>{k.key ? k.key : k.id}</td>
                                <td>{new Date(k.createdAt).toLocaleDateString()}</td>
                                <td><span className={styles.statusBadge} style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Active</span></td>
                                <td>
                                    <button 
                                        onClick={() => handleRevokeKey(k.id)}
                                        disabled={isRevoking}
                                        style={{ background: 'transparent', border: '1px solid var(--accent-warning)', color: 'var(--accent-warning)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Revoke
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {keys.length === 0 && (
                            <tr><td colSpan="5" className={styles.emptyState}>No API keys generated.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="card glass-panel">
                <div className="card-header">
                    <h3 className="card-title">Implementation Snippets</h3>
                </div>
                <div style={{ padding: '1.5rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', color: 'var(--text-muted)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>// Fetch Live Las Vegas Radar Telemetry (No Delay)</p>
                    <p style={{ color: '#fff', marginTop: '0.5rem' }}>
                        curl -X GET "https://lookupvegas.com/api/radar" \<br/>
                        &nbsp;&nbsp;&nbsp;&nbsp;-H "Authorization: Bearer lkv_YOUR_API_KEY"
                    </p>
                </div>
            </div>
        </div>
    );
}
