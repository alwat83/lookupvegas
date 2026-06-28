"use client";

import Link from 'next/link';
import { useAuth } from '../app/contexts/AuthContext';
import { auth } from '../app/lib/firebase';
import { signOut } from 'firebase/auth';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, userProfile, loading } = useAuth();

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.logoContainer}>
                    <Link href="/" className={styles.logo}>
                        <span className={styles.logoIcon}>N</span>
                        <span className={styles.logoText}>LookupVegas</span>
                    </Link>
                </div>
                <div className={styles.navLinks}>
                    {!loading && user ? (
                        <>
                            <Link href="/about" className={styles.navLink}>About</Link>
                            <Link href="/methodology" className={styles.navLink}>Methodology</Link>
                            <Link href="/terminal" className={styles.navLink}>Terminal</Link>
                            {userProfile?.tier === 'Enterprise' && (
                                <Link href="/terminal/api" className={styles.navLink}>API Gateway</Link>
                            )}
                            <button onClick={handleLogout} className={styles.navCta} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>LOGOUT</button>
                        </>
                    ) : (
                        <>
                            <Link href="/about" className={styles.navLink}>About</Link>
                            <Link href="/methodology" className={styles.navLink}>Methodology</Link>
                            <Link href="/pricing" className={styles.navLink}>Pricing</Link>
                            <Link href="/login" className={styles.navLink}>Sign In</Link>
                            <Link href="/signup" className={styles.navCta}>Request Access</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
