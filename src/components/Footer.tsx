'use client';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer} >
            <div className="container ">
                <div className="row">
                    <div className="col-4 col-md-4">
                        <h2 className={styles.logo}>Easy Coders</h2>
                        <p className={styles.tagline}>
                            Empowering learners with modern, industry-ready skills.
                        </p>
                    </div>
                    <div className="col-4 col-md-4">
                        <h3 className={styles.title}>Quick Links</h3>
                        <ul className={`list-unstyled ${styles.links}`}>
                            <li><Link href="/" className={styles.link}>Home</Link></li>
                            <li><Link href="/courses" className={styles.link}>Courses</Link></li>
                            <li><Link href="/about" className={styles.link}>About Us</Link></li>
                            <li><Link href="/login" className={styles.link}>Login</Link></li>
                        </ul>
                    </div>
                    <div className="col-4 col-md-4">
                        <h3 className={styles.title}>Connect</h3>
                        <div className={`d-flex gap-3 ${styles.social}`}>
                            <a href="#" className={styles.socialIcon}>🌐</a>
                            <a href="#" className={styles.socialIcon}>📘</a>
                            <a href="#" className={styles.socialIcon}>📸</a>
                            <a href="#" className={styles.socialIcon}>▶️</a>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.bottom}>
                © {new Date().getFullYear()} <a href="https://easycoders.in/">Easy Coders</a>. All rights reserved.
            </div>
        </footer>
    );
}
