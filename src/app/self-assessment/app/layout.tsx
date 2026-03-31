'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AssessmentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('assessment_user');
    if (!user) router.replace('/self-assessment/login');
  }, [router]);

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('assessment_user');
    localStorage.removeItem('assessment_token');
    localStorage.removeItem('logged_in_user');
    router.replace('/');
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    {
      href: '/self-assessment/app',
      label: 'Assessments',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="2"/>
          <path d="M9 12h6M9 16h4"/>
        </svg>
      ),
    },
    {
      href: '/self-assessment/app/leaderBoard',
      label: 'Leader Board',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
        </svg>
      ),
    },
    {
      href: '/self-assessment/app/typing-game',
      label: 'Typing Game',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .aa-layout {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          display: flex;
          height: 100vh;
          background: #f1f5f9;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .aa-sidebar {
          width: 220px;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width 0.28s cubic-bezier(.4,0,.2,1);
          position: relative;
          z-index: 100;
          overflow: hidden;
        }
        .aa-sidebar.collapsed { width: 68px; }

        /* Top orange glow */
        .aa-sidebar::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 180px;
          background: radial-gradient(ellipse 140% 100% at 50% 0%, rgba(249,115,22,0.13) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* Logo area */
        .aa-logo-wrap {
          padding: 0 16px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .aa-logo-wrap img {
          transition: all 0.28s ease;
          display: block;
          object-fit: contain;
        }

        /* Nav */
        .aa-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px 10px 8px;
          position: relative;
          z-index: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .aa-nav-section {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          padding: 6px 10px 8px;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 0.2s;
        }
        .aa-sidebar.collapsed .aa-nav-section { opacity: 0; }

        .aa-nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 11px;
          border-radius: 10px;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
          transition: color 0.18s, background 0.18s;
          position: relative;
        }
        .aa-nav-item:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
          text-decoration: none;
        }
        .aa-nav-item.active {
          color: #fff;
          background: rgba(249,115,22,0.13);
          border: 0.5px solid rgba(249,115,22,0.28);
        }
        .aa-nav-item.active .aa-nav-icon { color: #f97316; }

        .aa-nav-icon {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.18s;
        }
        .aa-nav-item:hover .aa-nav-icon,
        .aa-nav-item.active .aa-nav-icon { background: rgba(255,255,255,0.09); }

        .aa-nav-label {
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.2s, max-width 0.28s;
          max-width: 160px;
        }
        .aa-sidebar.collapsed .aa-nav-label { opacity: 0; max-width: 0; }

        /* Active dot */
        .aa-nav-item.active::after {
          content: '';
          position: absolute;
          right: 10px;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #f97316;
        }
        .aa-sidebar.collapsed .aa-nav-item.active::after { display: none; }

        /* ── SIDEBAR FOOTER ── */
        .aa-sidebar-footer {
          padding: 12px 10px 16px;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        /* ── COLLAPSE BUTTON — refined pill style ── */
        .aa-collapse-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          height: 40px;
          border-radius: 10px;
          border: 0.5px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: color 0.18s, background 0.18s, border-color 0.18s;
          width: 100%;
          text-align: left;
        }
        .aa-collapse-btn:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.18);
        }

        /* Arrow icon container */
        .aa-collapse-ico {
          width: 22px; height: 22px;
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.18s, transform 0.28s;
        }
        .aa-collapse-btn:hover .aa-collapse-ico { background: rgba(255,255,255,0.16); }
        .aa-sidebar.collapsed .aa-collapse-ico { transform: rotate(180deg); }

        .aa-collapse-label {
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.2s, max-width 0.28s;
          max-width: 160px;
          letter-spacing: 0.01em;
        }
        .aa-sidebar.collapsed .aa-collapse-label { opacity: 0; max-width: 0; }

        /* ── LOGOUT BUTTON — solid danger style ── */
        .aa-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          height: 40px;
          border-radius: 10px;
          border: 0.5px solid rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.08);
          color: rgba(239,68,68,0.75);
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: color 0.18s, background 0.18s, border-color 0.18s;
          width: 100%;
          text-align: left;
        }
        .aa-logout-btn:hover {
          color: #ef4444;
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.45);
        }

        .aa-logout-ico {
          width: 22px; height: 22px;
          border-radius: 6px;
          background: rgba(239,68,68,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.18s;
        }
        .aa-logout-btn:hover .aa-logout-ico { background: rgba(239,68,68,0.25); }

        .aa-logout-label {
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.2s, max-width 0.28s;
          max-width: 160px;
          letter-spacing: 0.01em;
        }
        .aa-sidebar.collapsed .aa-logout-label { opacity: 0; max-width: 0; }

        /* ── TOOLTIP for collapsed ── */
        .aa-sidebar.collapsed .aa-nav-item:hover::before,
        .aa-sidebar.collapsed .aa-collapse-btn:hover::before,
        .aa-sidebar.collapsed .aa-logout-btn:hover::before {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #1e293b;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          white-space: nowrap;
          border: 0.5px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          z-index: 200;
          pointer-events: none;
        }

        /* ── MAIN ── */
        .aa-main {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          background: #f1f5f9;
          min-width: 0;
        }

        @media (max-width: 768px) {
          .aa-sidebar { position: fixed; top: 0; left: 0; height: 100vh; }
          .aa-main { margin-left: 68px; }
        }
      `}</style>

      <div className="aa-layout">

        {/* SIDEBAR */}
        <aside className={`aa-sidebar ${collapsed ? 'collapsed' : ''}`}>

          {/* Logo */}
          <div className="aa-logo-wrap">
            <img
              src={collapsed ? '/images/eclogo.png' : '/images/ec_logo.png'}
              alt="Easy Coders"
              style={{ width: collapsed ? 32 : 130, height: collapsed ? 32 : 'auto' }}
            />
          </div>

          {/* Nav links */}
          <nav className="aa-nav">
            <div className="aa-nav-section">Menu</div>
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`aa-nav-item ${isActive(item.href) ? 'active' : ''}`}
                data-tooltip={item.label}
              >
                <span className="aa-nav-icon">{item.icon}</span>
                <span className="aa-nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer buttons */}
          <div className="aa-sidebar-footer">

            {/* Collapse / Expand */}
            <button
              className="aa-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
              data-tooltip={collapsed ? 'Expand' : ''}
            >
              <span className="aa-collapse-ico">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </span>
              <span className="aa-collapse-label">Collapse</span>
            </button>

            {/* Logout */}
            <button
              className="aa-logout-btn"
              onClick={handleLogout}
              data-tooltip="Logout"
            >
              <span className="aa-logout-ico">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </span>
              <span className="aa-logout-label">Logout</span>
            </button>

          </div>
        </aside>

        {/* MAIN */}
        <main className="aa-main">
          {children}
        </main>

      </div>
    </>
  );
}