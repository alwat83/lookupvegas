import Link from 'next/link';

export default function CancelPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Subscription Cancelled</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', marginBottom: '2rem' }}>
                Your subscription process was cancelled. You have not been charged.
            </p>
            <Link
                href="/intelligence"
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
                Return to Intelligence
            </Link>
        </div>
    );
}
