'use client';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
         <footer className={styles.footer}>
            <div className={styles.footerContent}>
                © {new Date().getFullYear()}{" "}
                <a href="https://easycoders.in/" target="_blank" rel="noopener noreferrer">
                    Easy Coders
                </a>. All rights reserved.
            </div>
        </footer>
    );
}
