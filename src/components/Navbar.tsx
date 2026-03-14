'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '@/context/AuthContext';
import Registration from './Registration';
import {} from 'react-icons/fa';
import { useEffect } from 'react';
import SearchBox from '@/components/SearchBox';

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
  const [navSearch, setNavSearch] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setIsOpen(false);
    router.replace('/');
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
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
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
    { name: 'Home', href: '/student' },
    { name: 'My Tasks', href: '/student/tasks' },
    { name: 'Tickets', href: '/student/tickets' },
    { name: 'Logout', onClick: handleLogout },
  ];
  const trainerLinks: NavLink[] = [
    { name: 'Home', href: '/trainer' },
    // { name: 'Enrollment', href: '/admin/enrollmentRequests' },
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
    { name: 'Login', href: '/login' },
  ];

  const navLinks: NavLink[] =
    role === 1
      ? adminLinks
      : role === 2
      ? hrLinks
      : role === 4
      ? trainerLinks
      : role === 3
      ? studentLinks
      : guestLinks;

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ''}`}>
      <div
  className="upperNav"
  
> 
 
</div>
      <div className={styles.container}>
        <div className={styles.logo} style={{ display: 'flex', alignItems: 'center'}}>
  <div style={{ display: 'flex', flexDirection: 'column' }}>
  <Link href="/">
  <img
    src="/images/logo.svg"
    alt="Easy Coders Logo"
    style={{ height: 63, margin: "0px" }}
  />
</Link>

 
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
      <SearchBox
        value={navSearch}
        onChange={setNavSearch}
        placeholder="Search courses..."
        className={styles.navSearch}
        inputClassName={styles.navSearchInput}
        onSubmit={(value) => {
          const q = value.trim();
          router.push(q ? `/courses?search=${encodeURIComponent(q)}` : '/courses');
        }}
      />
      </div>
      <button className={styles.menuButton} onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? '✖' : '☰'}
      </button>
      </div>
      <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={() => setIsOpen(false)}/>
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
