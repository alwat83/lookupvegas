import Link from 'next/link';

export default function SuccessPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Subscription Activated</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '2rem' }}>
                Thank you for subscribing to the LookupVegas Pro Tier. You now have full access to the Intelligence Dashboard and advanced movement telemetry.
            </p>
            <Link
                href="/intelligence?unlocked=true"
                style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    border: '1px solid var(--border)'
                }}
            >
                Enter Intelligence Terminal
            </Link>
        </div>
    );
}
