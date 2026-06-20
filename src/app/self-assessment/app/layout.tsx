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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Auth guard */
  useEffect(() => {
    const user = localStorage.getItem('assessment_user');
    if (!user) router.replace('/self-assessment/login');
  }, [router]);

  /* Track mobile breakpoint */
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Close mobile overlay on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
      href: '/self-assessment/app/playground',
      label: 'Code Playground',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
    },
    {
      href: '/self-assessment/app/leaderBoard',
      label: 'Leader Board',
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .aa-layout { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; display: flex; height: 100vh; background: #f1f5f9; overflow: hidden; position: relative; }

        .aa-backdrop { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(3px); z-index: 90; animation: aa-fadein 0.22s ease; }
        .aa-backdrop.visible { display: block; }
        @keyframes aa-fadein { from { opacity: 0; } to { opacity: 1; } }

        /* ── SIDEBAR ── */
        .aa-sidebar { width: 224px; background: #0f172a; display: flex; flex-direction: column; flex-shrink: 0; transition: width 0.26s cubic-bezier(0.4,0,0.2,1); position: relative; z-index: 100; overflow: hidden; }
        .aa-sidebar.collapsed { width: 72px; }
        @media (max-width: 768px) {
          .aa-sidebar { position: fixed; top: 0; left: 0; height: 100vh; width: 248px !important; transform: translateX(-100%); transition: transform 0.28s cubic-bezier(0.4,0,0.2,1); z-index: 100; }
          .aa-sidebar.mobile-open { transform: translateX(0); }
        }
        .aa-sidebar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 220px; background: radial-gradient(ellipse 140% 100% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%); pointer-events: none; z-index: 0; }

        /* ── LOGO ── */
        .aa-logo-wrap { padding: 16px 14px 6px; position: relative; z-index: 1; flex-shrink: 0; }
        .aa-logo-card { background: #fff; border-radius: 13px; padding: 11px 13px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.25); }
        .aa-sidebar.collapsed .aa-logo-card { padding: 8px; }

        /* ── NAV ── */
        .aa-nav { flex: 1; display: flex; flex-direction: column; gap: 3px; padding: 16px 10px 8px; position: relative; z-index: 1; overflow-y: auto; overflow-x: hidden; }
        .aa-nav-section { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.22); padding: 4px 10px 10px; white-space: nowrap; overflow: hidden; transition: opacity 0.2s; }
        .aa-sidebar.collapsed .aa-nav-section { opacity: 0; }

        .aa-nav-item { display: flex; align-items: center; gap: 11px; padding: 10px 11px; border-radius: 11px; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 13.5px; font-weight: 500; white-space: nowrap; transition: color 0.18s, background 0.18s, transform 0.18s; position: relative; }
        .aa-nav-item:hover { color: rgba(255,255,255,0.95); background: rgba(255,255,255,0.06); text-decoration: none; }
        .aa-nav-item.active { color: #fff; background: rgba(99,102,241,0.22); border: 0.5px solid rgba(129,140,248,0.4); box-shadow: 0 4px 16px rgba(79,70,229,0.18); }

        .aa-nav-icon { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.18s, color 0.18s, transform 0.18s; }
        .aa-nav-item:hover .aa-nav-icon { background: rgba(255,255,255,0.1); transform: translateY(-1px) scale(1.06); }
        .aa-nav-item.active .aa-nav-icon { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; box-shadow: 0 4px 12px rgba(79,70,229,0.5); }

        .aa-nav-label { overflow: hidden; white-space: nowrap; transition: opacity 0.2s, max-width 0.26s; max-width: 160px; }
        .aa-sidebar.collapsed .aa-nav-label { opacity: 0; max-width: 0; }

        .aa-nav-item.active::after { content: ''; position: absolute; right: 11px; width: 6px; height: 6px; border-radius: 50%; background: #818cf8; box-shadow: 0 0 8px rgba(129,140,248,0.9); }
        .aa-sidebar.collapsed .aa-nav-item.active::after { display: none; }

        /* ── FOOTER ── */
        .aa-sidebar-footer { padding: 12px 10px 16px; border-top: 1px solid rgba(255,255,255,0.07); display: flex; flex-direction: column; gap: 6px; position: relative; z-index: 1; flex-shrink: 0; }

        .aa-collapse-btn { display: flex; align-items: center; gap: 10px; padding: 0 13px; height: 40px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; transition: color 0.18s, background 0.18s, border-color 0.18s; width: 100%; text-align: left; }
        .aa-collapse-btn:hover { color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.18); }
        .aa-collapse-ico { width: 22px; height: 22px; border-radius: 6px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.18s, transform 0.26s; }
        .aa-collapse-btn:hover .aa-collapse-ico { background: rgba(255,255,255,0.14); }
        .aa-sidebar.collapsed .aa-collapse-ico { transform: rotate(180deg); }
        .aa-collapse-label { overflow: hidden; white-space: nowrap; transition: opacity 0.2s, max-width 0.26s; max-width: 160px; }
        .aa-sidebar.collapsed .aa-collapse-label { opacity: 0; max-width: 0; }

        .aa-logout-btn { display: flex; align-items: center; gap: 10px; padding: 0 13px; height: 40px; border-radius: 10px; border: 0.5px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.07); color: rgba(239,68,68,0.75); cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; white-space: nowrap; transition: color 0.18s, background 0.18s, border-color 0.18s; width: 100%; text-align: left; }
        .aa-logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.13); border-color: rgba(239,68,68,0.4); }
        .aa-logout-ico { width: 22px; height: 22px; border-radius: 6px; background: rgba(239,68,68,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .aa-logout-btn:hover .aa-logout-ico { background: rgba(239,68,68,0.22); }
        .aa-logout-label { overflow: hidden; white-space: nowrap; transition: opacity 0.2s, max-width 0.26s; max-width: 160px; }
        .aa-sidebar.collapsed .aa-logout-label { opacity: 0; max-width: 0; }

        /* Tooltip on collapsed */
        .aa-sidebar.collapsed .aa-nav-item:hover::before,
        .aa-sidebar.collapsed .aa-collapse-btn:hover::before,
        .aa-sidebar.collapsed .aa-logout-btn:hover::before {
          content: attr(data-tooltip); position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
          background: #1e293b; color: #fff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px;
          white-space: nowrap; border: 0.5px solid rgba(255,255,255,0.1); box-shadow: 0 4px 14px rgba(0,0,0,0.3); z-index: 200; pointer-events: none;
        }

        /* ── MOBILE TOP BAR ── */
        .aa-mobile-bar { display: none; position: fixed; top: 0; left: 0; right: 0; height: 56px; background: #0f172a; border-bottom: 1px solid rgba(255,255,255,0.07); align-items: center; justify-content: space-between; padding: 0 16px; z-index: 80; }
        @media (max-width: 768px) { .aa-mobile-bar { display: flex; } }
        .aa-hamburger { width: 36px; height: 36px; border-radius: 9px; border: 0.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.7); transition: background 0.2s; flex-shrink: 0; }
        .aa-hamburger:hover { background: rgba(255,255,255,0.1); }
        .aa-mobile-logo { background: #fff; border-radius: 9px; padding: 5px 9px; display: flex; align-items: center; }

        /* ── MAIN ── */
        .aa-main { flex: 1; overflow-y: auto; overflow-x: hidden; background: #f1f5f9; min-width: 0; }
        @media (max-width: 768px) { .aa-main { margin-left: 0 !important; padding-top: 56px; } }
      `}</style>

      <div className="aa-layout">
        {isMobile && mobileOpen && <div className="aa-backdrop visible" onClick={() => setMobileOpen(false)} />}

        {/* Mobile top bar */}
        <div className="aa-mobile-bar">
          <button className="aa-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
            {mobileOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>}
          </button>
          <span className="aa-mobile-logo"><img src="/images/easyassess-wordmark.png" alt="EasyAssess" style={{ height: 22, width: 'auto' }} /></span>
          <button className="aa-hamburger" onClick={handleLogout} title="Logout">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>

        {/* SIDEBAR */}
        <aside className={['aa-sidebar', !isMobile && collapsed ? 'collapsed' : '', isMobile && mobileOpen ? 'mobile-open' : ''].filter(Boolean).join(' ')}>
          {/* Logo */}
          <div className="aa-logo-wrap">
            <div className="aa-logo-card">
              <img
                src={(!isMobile && collapsed) ? '/images/easyassess-mark.png' : '/images/easyassess-wordmark.png'}
                alt="EasyAssess"
                style={{ height: (!isMobile && collapsed) ? 32 : 40, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="aa-nav">
            <div className="aa-nav-section">Menu</div>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className={`aa-nav-item ${isActive(item.href) ? 'active' : ''}`} data-tooltip={item.label}>
                <span className="aa-nav-icon">{item.icon}</span>
                <span className="aa-nav-label">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="aa-sidebar-footer">
            {!isMobile && (
              <button className="aa-collapse-btn" onClick={() => setCollapsed(c => !c)} data-tooltip={collapsed ? 'Expand' : ''}>
                <span className="aa-collapse-ico">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </span>
                <span className="aa-collapse-label">Collapse</span>
              </button>
            )}
            <button className="aa-logout-btn" onClick={handleLogout} data-tooltip="Logout">
              <span className="aa-logout-ico">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              <span className="aa-logout-label">Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="aa-main">{children}</main>
      </div>
    </>
  );
}
