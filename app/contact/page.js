import styles from './Contact.module.css';

export const metadata = {
    title: 'Contact | LookupVegas',
    description: 'Get in touch with the LookupVegas intelligence team.',
};

export default function ContactPage() {
    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <h1 className={styles.title}>Contact Us.</h1>
                <p className={styles.subtitle}>Have questions about the City Velocity Index or our Enterprise API? We're here to help.</p>
            </div>

            <div className={styles.contactGrid}>
                {/* Contact Information */}
                <div className={styles.infoSection}>
                    <h2 className={styles.sectionHeading}>Get in Touch</h2>
                    <p className={styles.infoText}>
                        Whether you need technical support, custom API integration assistance, or have a press inquiry, our team is ready to provide the intelligence you need.
                    </p>

                    <div className={styles.contactMethods}>
                        <div className={styles.method}>
                            <h3 className={styles.methodTitle}>General Inquiries</h3>
                            <a href="mailto:hello@lookupvegas.com" className={styles.methodLink}>hello@lookupvegas.com</a>
                        </div>
                        <div className={styles.method}>
                            <h3 className={styles.methodTitle}>Enterprise Support</h3>
                            <a href="mailto:api@lookupvegas.com" className={styles.methodLink}>api@lookupvegas.com</a>
                        </div>
                        <div className={styles.method}>
                            <h3 className={styles.methodTitle}>Press</h3>
                            <a href="mailto:media@lookupvegas.com" className={styles.methodLink}>media@lookupvegas.com</a>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className={styles.formSection}>
                    <div className={styles.formBox}>
                        <h2 className={styles.formHeading}>Send a Message</h2>
                        <form className={styles.form} aria-label="Contact form">
                            <div className={styles.formGroup}>
                                <label htmlFor="name" className={styles.label}>Name</label>
                                <input type="text" id="name" name="name" className={styles.input} placeholder="Jane Doe" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.label}>Work Email</label>
                                <input type="email" id="email" name="email" className={styles.input} placeholder="jane@company.com" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="inquiry" className={styles.label}>Inquiry Type</label>
                                <select id="inquiry" name="inquiry" className={styles.select}>
                                    <option value="general">General Question</option>
                                    <option value="enterprise">Enterprise API Access</option>
                                    <option value="support">Technical Support</option>
                                    <option value="press">Press / Media</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="message" className={styles.label}>Message</label>
                                <textarea id="message" name="message" className={styles.textarea} rows="5" placeholder="How can we help?" required></textarea>
                            </div>

                            <button type="button" className={styles.submitBtn}>
                                Submit Inquiry
                            </button>
                            <p className={styles.formMeta}>*This form is currently in simulation mode.</p>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
