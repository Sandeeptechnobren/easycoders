'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';

/* ✅ Proper Nav type */
type NavLink = {
  name: string;
  href?: string;
  onClick?: () => void;
};

export default function Navbar() {
  const { role, logout } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  /* ✅ Navbar scroll effect */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ✅ Base links */
  const commonLinks: NavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'About Us', href: '/about' },
  ];

  /* ✅ Role-based links */
  const studentLinks: NavLink[] = [
    ...commonLinks,
    { name: 'Logout', onClick: logout },
  ];

  const trainerLinks: NavLink[] = [
    ...commonLinks,
    { name: 'Logout', onClick: logout },
  ];

  const adminLinks: NavLink[] = [
    ...commonLinks,
    { name: 'Logout', onClick: logout },
  ];

  const guestLinks: NavLink[] = [
    ...commonLinks,
    { name: 'Login', href: '/login' },
  ];

  /* ✅ Decide visible links */
  const navLinks: NavLink[] =
    role === 'admin'
      ? adminLinks
      : role === 'trainer'
        ? trainerLinks
        : role === 'student'
          ? studentLinks
          : guestLinks;

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* ✅ Logo */}
        <div className={styles.logo}>
          <img src="/images/eclogo.png" alt="Easy Coders Logo" />
          <span className={styles.brandText}>Easy Coders</span>
        </div>

        {/* ✅ Desktop Menu */}
        <div className={styles.desktopMenu}>
          {navLinks.map((link) =>
            link.onClick ? (
              <button
                key={link.name}
                onClick={link.onClick}
                className={`${styles.navLink} ${styles.logoutButton}`}
              >
                {link.name}
                <span className={styles.underline}></span>
              </button>
            ) : (
              <Link
                key={link.name}
                href={link.href!}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ''
                  }`}
              >
                {link.name}
                <span className={styles.underline}></span>
              </Link>
            )
          )}
        </div>

        {/* ✅ Mobile Toggle */}
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* ✅ Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
        {navLinks.map((link) =>
          link.onClick ? (
            <button
              key={link.name}
              onClick={() => {
                link.onClick?.();
                setIsOpen(false);
              }}
              className={styles.mobileLink}
            >
              {link.name}
            </button>
          ) : (
            <Link
              key={link.name}
              href={link.href!}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.mobileActive : ''
                }`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          )
        )}
      </div>
    </nav>
  );
}
