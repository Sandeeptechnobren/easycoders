'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Courses', href: '/courses' },
        { name: 'About Us', href: '/about' },
        { name: 'Login', href: '/login' },
    ];

    return (
        <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.container}>

                {/* LOGO */}
                <div className={styles.logo}>
                    <img src="/images/eclogo.png" alt="Easy Coders Logo" />
                    <span className={styles.brandText}>Easy Coders</span>
                </div>

                {/* DESKTOP MENU */}
                <div className={styles.desktopMenu}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`${styles.navLink} ${pathname === link.href ? styles.active : ''
                                }`}
                        >
                            {link.name}
                            <span className={styles.underline}></span>
                        </Link>
                    ))}
                </div>

                {/* MOBILE TOGGLE */}
                <button className={styles.menuButton} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? '✖' : '☰'}
                </button>

            </div>

            {/* MOBILE MENU */}
            <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileActive : ''
                            }`}
                        onClick={() => setIsOpen(false)}
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
        </nav>
    );
}
