"use client";
import { useState } from 'react';

export default function CheckoutButton() {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkout_sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Checkout Error:", data.error);
                alert("Please configure Stripe Environment Variables.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Network Error:", error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
                padding: '16px 32px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: 'var(--text-primary)', // High contrast
                color: 'var(--background)',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '1.5rem',
                boxShadow: '0 4px 14px 0 rgba(0,0,0,0.39)'
            }}
        >
            {loading ? 'Initializing Secure Checkout...' : 'Unlock Pro Access - $49/mo'}
        </button>
    );
}
