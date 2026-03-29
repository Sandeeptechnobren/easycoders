'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import SearchBox from '@/components/SearchBox';

type NavLink = {
  name: string;
  href?: string;
  onClick?: () => void;
};

export default function Navbar() {
  const { role, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [showLogin, setShowLogin] = useState(false); // 👈 login modal state
  const [showRegistration, setShowRegistration] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

const handleLogout = async () => {
  await logout();  

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');

  setIsOpen(false);

  router.push('/');  
};

  useEffect(() => {
    // body scroll lock for mobile menu
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }

    // navbar scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const commonLinks: NavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contactus' },
  ];

  const studentLinks: NavLink[] = [
    { name: 'Home', href: '/student-dashboard' },
    { name: 'My Tasks', href: '/students/tasks' },
    { name: 'Tickets', href: '/students/tickets' },
    { name: 'Logout', onClick: handleLogout },
  ];

  const trainerLinks: NavLink[] = [
    { name: 'Home', href: '/trainer' },
    { name: 'Logout', onClick: handleLogout },
  ];

  

  const hrLinks: NavLink[] = [
    { name: 'Home', href: '/hr' },
    { name: 'Students', href: '/hr/students' },
    { name: 'Admission', href: '/hr/enrollmentRequests' },
    { name: 'Payments', href: '/hr/fee' },//this is for the hr to make the payments for the student . 
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
    { name: 'Login', onClick: () => setShowLogin(true) },  
  ];

  // Convert role to number for comparison, or use null if not available
  const roleNum = role ? parseInt(role, 10) : null;

  const logoRedirect =
  roleNum === 1
    ? '/admin'
    : roleNum === 2
    ? '/hr'
    : roleNum === 3
    ? '/student-dashboard'
    : roleNum === 4
    ? '/trainer'
    : '/';

  const navLinks: NavLink[] =
    roleNum === 1
      ? adminLinks
      : roleNum === 2
      ? hrLinks
      : roleNum === 4
      ? trainerLinks
      : roleNum === 3
      ? studentLinks
      : guestLinks;

  return (
    <>
      <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
        <div className={styles.contactus}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={'20px'}><path d="M160.2 25C152.3 6.1 131.7-3.9 112.1 1.4l-5.5 1.5c-64.6 17.6-119.8 80.2-103.7 156.4 37.1 175 174.8 312.7 349.8 349.8 76.3 16.2 138.8-39.1 156.4-103.7l1.5-5.5c5.4-19.7-4.7-40.3-23.5-48.1l-97.3-40.5c-16.5-6.9-35.6-2.1-47 11.8l-38.6 47.2C233.9 335.4 177.3 277 144.8 205.3L189 169.3c13.9-11.3 18.6-30.4 11.8-47L160.2 25z"/></svg>&nbsp;&nbsp;7523930301
         &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={'20px'}><path d="M256 64C150 64 64 150 64 256s86 192 192 192c17.7 0 32 14.3 32 32s-14.3 32-32 32C114.6 512 0 397.4 0 256S114.6 0 256 0 512 114.6 512 256l0 32c0 53-43 96-96 96-29.3 0-55.6-13.2-73.2-33.9-22.8 21-53.3 33.9-86.8 33.9-70.7 0-128-57.3-128-128s57.3-128 128-128c27.9 0 53.7 8.9 74.7 24.1 5.7-5 13.1-8.1 21.3-8.1 17.7 0 32 14.3 32 32l0 112c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32c0-106-86-192-192-192zm64 192a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"/></svg>&nbsp;&nbsp;hr@technobren.com
        </div>
        <div className={styles.container}>

         
          <div className={styles.logo}>
          <Link href={logoRedirect}>
            <img
              src="/images/logo.svg"
              alt="Easy Coders Logo"
              style={{ height: 63 }}
            />
          </Link>
        </div>

          {/* Desktop Menu */}
          <div className={styles.desktopMenu}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href || '#'}
                onClick={(e) => {
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
                className={`${styles.navLink} ${
                  link.name === 'Logout' ? styles.logoutBtn : ''
                } ${pathname === link.href ? styles.active : ''}`}
              >
                {link.name}
                {link.href && <span className={styles.underline}></span>}
              </Link>
            ))}

            {!role && !isLoading && (
              <SearchBox
                value={navSearch}
                onChange={setNavSearch}
                placeholder="Search courses..."
                className={styles.navSearch}
                inputClassName={styles.navSearchInput}
                onSubmit={(value) => {
                  const q = value.trim();
                  router.push(
                    q ? `/courses?search=${encodeURIComponent(q)}` : '/courses'
                  );
                }}
              />
            )}
          </div>
          <button
            className={styles.menuButton}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '✖' : '☰'}
          </button>
        </div>

        {/* Overlay */}
        <div
          className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
          onClick={() => setIsOpen(false)}
        />

        {/* Mobile Menu */}
        <div className={`${styles.mobileMenu} ${isOpen ? styles.open : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href || '#'}
              onClick={(e) => {
                if (link.onClick) {
                  e.preventDefault();
                  link.onClick();
                }
                setIsOpen(false);
              }}
              className={`${styles.mobileLink} ${
                link.name === 'Logout'
                  ? `${styles.btn} ${styles.btnPrimary}`
                  : ''
              } ${pathname === link.href ? styles.mobileActive : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </nav>

 
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}