import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.brand}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>N</span>
                        <span className={styles.logoText}>LookupVegas</span>
                    </div>
                    <p className={styles.tagline}>Measure Las Vegas City Velocity in Real Time.</p>
                </div>

                <div className={styles.linksGrid}>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnHeader}>Product</h4>
                        <Link href="/" className={styles.footerLink}>Dashboard</Link>
                        <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
                        <Link href="/methodology" className={styles.footerLink}>Methodology</Link>
                    </div>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnHeader}>Company</h4>
                        <Link href="/about" className={styles.footerLink}>About Us</Link>
                        <Link href="/contact" className={styles.footerLink}>Contact</Link>
                        <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
                    </div>
                </div>
            </div>
            <div className={styles.bottomBar}>
                <p className={styles.copyright}>&copy; {new Date().getFullYear()} LookupVegas. Data signals provided under conceptual license.</p>
            </div>
        </footer>
    );
}
