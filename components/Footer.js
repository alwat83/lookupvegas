import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footerContainer}>
            <div className="container">
                <div className={styles.linksGrid}>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnHeader}>Terminal</h4>
                        <Link href="/terminal" className={styles.footerLink}>Dashboard</Link>
                        <Link href="/pricing" className={styles.footerLink}>Pricing</Link>
                        <Link href="/signup" className={styles.footerLink}>Request Access</Link>
                    </div>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnHeader}>Intelligence</h4>
                        <Link href="/methodology" className={styles.footerLink}>Methodology</Link>
                        <Link href="/api" className={styles.footerLink}>API Gateway</Link>
                        <Link href="/status" className={styles.footerLink}>System Status</Link>
                    </div>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnHeader}>Legal</h4>
                        <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
                        <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
                        <Link href="/data-policy" className={styles.footerLink}>Data Processing</Link>
                    </div>
                    <div className={styles.linkColumn}>
                        <h4 className={styles.columnHeader}>Company</h4>
                        <Link href="/about" className={styles.footerLink}>About Us</Link>
                        <Link href="/contact" className={styles.footerLink}>Contact</Link>
                        <a href="https://twitter.com/lookupvegas" target="_blank" rel="noreferrer" className={styles.footerLink}>X (Twitter)</a>
                        <a href="https://linkedin.com/company/lookupvegas" target="_blank" rel="noreferrer" className={styles.footerLink}>LinkedIn</a>
                    </div>
                </div>
                
                <div className={styles.footerBottom}>
                    <div className={styles.logo}>LookupVegas</div>
                    <p className={styles.copyright}>
                        &copy; {new Date().getFullYear()} LookupVegas Intelligence. All rights reserved.<br/>
                        Proprietary predictive modeling and data telemetry for Las Vegas hospitality.
                    </p>
                </div>
            </div>
        </footer>
    );
}
