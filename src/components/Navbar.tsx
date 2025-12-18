'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';
type NavLink =
  | {
    name: string;
    href: string;
    onClick?: undefined;
  }
  | {
    name: string;
    href?: undefined;
    onClick: () => void;
  };

export default function Navbar() {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    localStorage.removeItem('token');
    router.push('/');
  };

  const commonLinks: NavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contactus' },
  ];

  const studentLinks: NavLink[] = [
    { name: 'Home', href: '/student' },
    { name: 'My Tasks', href: '/student/tasks' },
    { name: 'Tickets', href: '/student/tickets' },
    { name: 'Logout', onClick: handleLogout },
  ];

  const trainerLinks: NavLink[] = [
    { name: 'Home', href: '/trainer' },
    { name: 'Logout', onClick: handleLogout },
  ];

  const adminLinks: NavLink[] = [
    { name: 'Home', href: '/admin' },
    { name: 'Tasks', href: '/admin/tasks' },
    { name: 'Contact Inquiries', href: '/admin/contactInquiries' },
    { name: 'Enrollment Requests', href: '/admin/enrollmentRequests' },
    { name: 'Trainer Management', href: '/admin/trainerManagement' },
    { name: 'Logout', onClick: handleLogout },
  ];

  const guestLinks: NavLink[] = [
    ...commonLinks,
    { name: 'Login', href: '/login' },
  ];

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
        <div className={styles.logo}>
          <img src="/images/eclogo.png" alt="Easy Coders Logo" />
          <span className={styles.brandText}>Easy Coders</span>
        </div>

        {/* Desktop Menu */}
        <div className={styles.desktopMenu}>
          {navLinks.map((link) =>
            link.onClick ? (
              <button
                key={link.name}
                onClick={link.onClick}
                className={`${styles.navLink} ${styles.logoutBtn}`}
              >
                {link.name}
              </button>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ''
                  }`}
              >
                {link.name}
                <span className={styles.underline}></span>
              </Link>
            )
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
        {navLinks.map((link) =>
          link.onClick ? (
            <button
              key={link.name}
              onClick={() => {
                link.onClick?.();
                setIsOpen(false);
              }}
              className={`${styles.mobileLink} ${styles.logoutBtnMobile}`}
            >
              {link.name}
            </button>
          ) : (
            <Link
              key={link.name}
              href={link.href}
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
