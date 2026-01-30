'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import './assessmentApp.css';

export default function AssessmentAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [collapsed, setCollapsed] = useState(false);

  /* 🔐 AUTH GUARD */
  useEffect(() => {
    const user = localStorage.getItem('assessment_user');
    if (!user) {
      router.replace('/self-assessment/login');
    }
  }, [router]);

  /* 📱 COLLAPSE BY DEFAULT ON MOBILE */
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    setCollapsed(isMobile);
  }, []);

  /* 🔁 OPTIONAL: Auto-collapse again on resize */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* 🚪 LOGOUT */
  const handleLogout = () => {
    localStorage.removeItem('assessment_user');
    localStorage.removeItem('assessment_token');
    router.replace('/self-assessment/login');
  };

  return (
    <div
      className={`assessmentApp ${collapsed ? 'collapsed' : ''}`}
      data-theme={theme}
    >
      <aside className="sidebar">
        <div className="sidebarTop">
          {/* <div className="sidebarLogo">
            <img
              src={collapsed ? '/images/eclogo.png' : '/images/ec_logo.png'}
              alt="Easy Coders"
              style={{
                width: collapsed ? 36 : 140,
                transition: 'all 0.3s ease',
              }}
            />
          </div> */}
          <div
            className="sidebarLogo"
            style={{
              width: collapsed ? 45 : 160,
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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

          <div className="navItem active">
            <span className="navIcon">📊</span>
            {!collapsed && <span>Assessments</span>}
          </div>
        </div>
        <div className="sidebarFooter">
          {/* <button
            className="navItem"
            onClick={() =>
              setTheme(theme === 'light' ? 'dark' : 'light')
            }
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
            {!collapsed && (
              <span>
                {theme === 'light'
                  ? 'Dark Mode'
                  : 'Light Mode'}
              </span>
            )}
          </button> */}
          <button
            className="navItem ghost"
            onClick={() => setCollapsed(!collapsed)}
          >
            <span>☰</span>
            {!collapsed && <span>Toggle Menu</span>}
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
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import './assessmentApp.css';

// export default function AssessmentAppLayout({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const [theme, setTheme] = useState<'light' | 'dark'>('light');
//   const [collapsed, setCollapsed] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const user = localStorage.getItem('assessment_user');
//     if (!user) router.replace('/self-assessment/login');
    
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       if (mobile) setCollapsed(true);
//     };

//     handleResize();
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem('assessment_user');
//     localStorage.removeItem('assessment_token');
//     router.replace('/self-assessment/login');
//   };

//   return (
//     <div className={`appContainer ${collapsed ? 'collapsed' : ''}`} data-theme={theme}>
//       {/* Mobile Overlay */}
//       {isMobile && !collapsed && (
//         <div className="sidebarOverlay" onClick={() => setCollapsed(true)} />
//       )}

//       <aside className="sidebar">
//         <div className="sidebarContent">
//           <div className="sidebarLogoContainer">
//             <img
//               src={collapsed ? '/images/eclogo.png' : '/images/ec_logo.png'}
//               alt="Logo"
//               className="logoImg"
//             />
//           </div>

//           <nav className="navSection">
//             <div className="navItem active">
//               <span className="navIcon">📊</span>
//               <span className="navText">Assessments</span>
//             </div>
//           </nav>

//           <div className="sidebarFooter">
//             <button className="navItem ghost" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
//               <span className="navIcon">{theme === 'light' ? '🌙' : '☀️'}</span>
//               <span className="navText">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
//             </button>
            
//             <button className="navItem ghost" onClick={() => setCollapsed(!collapsed)}>
//               <span className="navIcon">☰</span>
//               <span className="navText">Minimize</span>
//             </button>

//             <button className="logoutBtn" onClick={handleLogout}>
//               <span className="navIcon">⎋</span>
//               <span className="navText">Logout</span>
//             </button>
//           </div>
//         </div>
//       </aside>

//       <main className="mainContent">
//         <header className="mobileHeader">
//            <button onClick={() => setCollapsed(false)}>☰</button>
//            <span>Easy Coders</span>
//         </header>
//         <div className="pageContainer">
//           {children}
//         </div>
//       </main>
//     </div>
//   );
// }