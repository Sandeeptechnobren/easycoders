'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';

type NavLink = {
  name: string;
  href?: string;
  onClick?: () => void;
};

export default function Navbar() {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    setIsOpen(false);
    router.replace('/');
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
    { name: 'Student Management', href: '/admin/studentManagement' },
    { name: 'Logout', onClick: handleLogout },
  ];
  const guestLinks: NavLink[] = [
    ...commonLinks,
    { name: 'Login', href: '/login' },
  ];

  const navLinks: NavLink[] =
    role === 1
      ? adminLinks
      : role === 4
      ? trainerLinks
      : role === 3
      ? studentLinks
      : guestLinks;

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img src="/images/fullnobackground.png" alt="Easy Coders Logo" />
        </div>
        <div className={styles.desktopMenu}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href || '#'}
              onClick={link.onClick}
              className={`${styles.navLink} ${
                link.name === 'Logout' ? styles.logoutBtn : ''
              } ${pathname === link.href ? styles.active : ''}`}
            >
              {link.name}
              {link.href && <span className={styles.underline}></span>}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '✖' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href || '#'}
            onClick={() => {
              link.onClick?.();
              setIsOpen(false);
            }}
            className={`${styles.mobileLink} ${
              link.name === 'Logout' ? styles.logoutBtnMobile : ''
            } ${pathname === link.href ? styles.mobileActive : ''}`}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
