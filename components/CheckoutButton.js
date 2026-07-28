"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../app/contexts/AuthContext';

export default function CheckoutButton() {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleCheckout = async () => {
        if (!user) {
            router.push('/signup?next=/intelligence');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    successUrl: `${window.location.origin}/intelligence/success`,
                    cancelUrl: `${window.location.origin}/intelligence/cancel`
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Checkout Error:", data.error);
                alert("Checkout is temporarily unavailable. Please try again shortly.");
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
