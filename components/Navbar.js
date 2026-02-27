import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
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
                    <Link href="/about" className={styles.navLink}>About</Link>
                    <Link href="/methodology" className={styles.navLink}>Methodology</Link>
                    <Link href="/pricing" className={styles.navLink}>Pricing</Link>
                    <Link href="/" className={styles.navCta}>Launch Terminal</Link>
                </div>
            </div>
        </nav>
    );
}
