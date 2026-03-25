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

          {/* Mobile Button */}
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