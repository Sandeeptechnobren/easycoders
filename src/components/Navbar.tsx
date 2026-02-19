'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';
import Registration from './Registration';

type NavLink = {
  name: string;
  href?: string;
  onClick?: () => void;
};

export default function Navbar() {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
const [showRegistration, setShowRegistration] = useState(false);

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
      <div className='upperNav'
        style={{
          // marginLeft:'40px',
          borderBottom:'1px Solid black',
          color:'red',
          fontWeight:'700',
          display:'flex',
          // alignContent:'center',
          justifyContent:'center',
          // gap:
          // flexDirection:'row',
          alignContent:'center',
          alignItems:'center',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-telephone" viewBox="0 0 16 16">
          <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
        </svg>
        &nbsp;

        +91 7523930301
        &nbsp;
        &nbsp;
        &nbsp;
        &nbsp;
        &nbsp;
        &nbsp;
        &nbsp;
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-envelope-at-fill" viewBox="0 0 16 16">
          <path d="M2 2A2 2 0 0 0 .05 3.555L8 8.414l7.95-4.859A2 2 0 0 0 14 2zm-2 9.8V4.698l5.803 3.546zm6.761-2.97-6.57 4.026A2 2 0 0 0 2 14h6.256A4.5 4.5 0 0 1 8 12.5a4.49 4.49 0 0 1 1.606-3.446l-.367-.225L8 9.586zM16 9.671V4.697l-5.803 3.546.338.208A4.5 4.5 0 0 1 12.5 8c1.414 0 2.675.652 3.5 1.671"/>
          <path d="M15.834 12.244c0 1.168-.577 2.025-1.587 2.025-.503 0-1.002-.228-1.12-.648h-.043c-.118.416-.543.643-1.015.643-.77 0-1.259-.542-1.259-1.434v-.529c0-.844.481-1.4 1.26-1.4.585 0 .87.333.953.63h.03v-.568h.905v2.19c0 .272.18.42.411.42.315 0 .639-.415.639-1.39v-.118c0-1.277-.95-2.326-2.484-2.326h-.04c-1.582 0-2.64 1.067-2.64 2.724v.157c0 1.867 1.237 2.654 2.57 2.654h.045c.507 0 .935-.07 1.18-.18v.731c-.219.1-.643.175-1.237.175h-.044C10.438 16 9 14.82 9 12.646v-.214C9 10.36 10.421 9 12.485 9h.035c2.12 0 3.314 1.43 3.314 3.034zm-4.04.21v.227c0 .586.227.8.581.8.31 0 .564-.17.564-.743v-.367c0-.516-.275-.708-.572-.708-.346 0-.573.245-.573.791"/>
        </svg>
        &nbsp;
      hr@technobren.com
      </div>
      <div className={styles.container}>
        <div className={styles.logo} style={{ display: 'flex', alignItems: 'center'}}>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
  <img
    src="/images/fullnobackground.png"
    alt="Easy Coders Logo"
    style={{ height: 45, margin:'0px' }}
  />

    <span style={{ fontSize: 11, color: '#666', marginTop: '-10px' }}>
      An Initiative by <b style={{color:'#8e0000'}}>Technobren InfoTech Pvt. Ltd.</b>
    </span>

  </div>

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
      <button
      className={styles.menuButton}
      onClick={() => setIsOpen(!isOpen)}
      >
      {isOpen ? '✖' : '☰'}
      </button>
      </div>
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
