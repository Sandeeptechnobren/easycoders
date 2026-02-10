'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import './assessment/[id]/assessmentApp.css';
import './layout.css'
export default function AssessmentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const user = localStorage.getItem('assessment_user');
    if (!user) {
      router.replace('/self-assessment/login');
    }
  }, [router]);
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setCollapsed(isMobile);
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('assessment_user');
    localStorage.removeItem('assessment_token');
    router.replace('/');
  };
  const isActive = (path: string) => pathname === path;
  return (
    <div
      className={`assessmentApp ${collapsed ? 'collapsed' : ''}`}
      data-theme={theme}
      style={{
      }}
    >
      <aside className="sidebar">
        <div className="sidebarTop">
          <div
            className="sidebarLogo"
            style={{
              width: collapsed ? 45 : 160,
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}
          >
            <img
              src={collapsed ? '/images/eclogo.png' : '/images/ec_logo.png'}
              alt="Easy Coders"
              style={{
                width: collapsed ? 36 : 140,
                transition: 'all 0.3s ease',
              }}
            />
          </div>
          <Link 
            href="/self-assessment/app" 
            className={`navItem ${isActive('/self-assessment/app') ? 'active' : ''}`}
          >
            <span className="navIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="25" fill="currentColor" className="bi bi-clipboard2-data" viewBox="0 0 16 16">
                <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z"/>
                <path d="M3 2.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1H12a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"/>
                <path d="M10 7a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm-6 4a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm4-3a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1"/>
              </svg>
            </span>
            {!collapsed && <span>Assessments</span>}
          </Link>
          <Link 
            href="/self-assessment/app/leaderBoard" 
            className={`navItem ${isActive('/self-assessment/app/leaderBoard') ? 'active' : ''}`}
          >
            <span className="navIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="25" fill="currentColor" className="bi bi-bookmark-star" viewBox="0 0 16 16">
                <path d="M7.84 4.1a.178.178 0 0 1 .32 0l.634 1.285a.18.18 0 0 0 .134.098l1.42.206c.145.021.204.2.098.303L9.42 6.993a.18.18 0 0 0-.051.158l.242 1.414a.178.178 0 0 1-.258.187l-1.27-.668a.18.18 0 0 0-.165 0l-1.27.668a.178.178 0 0 1-.257-.187l.242-1.414a.18.18 0 0 0-.05-.158l-1.03-1.001a.178.178 0 0 1 .098-.303l1.42-.206a.18.18 0 0 0 .134-.098z"/>
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
              </svg>
            </span>
            {!collapsed && <span>Leader Board</span>}
          </Link>
          {/* <Link 
              href="/self-assessment/app/practice" 
              className={`navItem ${isActive('/self-assessment/app/practice') ? 'active' : ''}`}
            >
              <span className="navIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
                </svg>
              </span>
              {!collapsed && <span>Code Practice</span>}
          </Link> */}
          <Link 
            href="/self-assessment/app/typing-game" 
            className={`navItem ${isActive('/self-assessment/app/typing-game') ? 'active' : ''}`}
          >
            <span className="navIcon">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="25" fill="currentColor" className="bi bi-clipboard2-data" viewBox="0 0 16 16">
                <path d="M9.5 0a.5.5 0 0 1 .5.5.5.5 0 0 0 .5.5.5.5 0 0 1 .5.5V2a.5.5 0 0 1-.5.5h-5A.5.5 0 0 1 5 2v-.5a.5.5 0 0 1 .5-.5.5.5 0 0 0 .5-.5.5.5 0 0 1 .5-.5z"/>
                <path d="M3 2.5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 0 0-1h-.5A1.5 1.5 0 0 0 2 2.5v12A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 12.5 1H12a.5.5 0 0 0 0 1h.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5z"/>
                <path d="M10 7a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm-6 4a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm4-3a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1"/>
              </svg>
            </span>
            {!collapsed && <span>Typing Game</span>}
          </Link>
        </div>
        <div className="sidebarFooter">
          <button
            className="navItem ghost"
            onClick={() => setCollapsed(!collapsed)}
          >
            <span>☰</span>
            {!collapsed && <span>Hide</span>}
          </button>
          <button className="logoutBtn" onClick={handleLogout}>
            ⎋ {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}