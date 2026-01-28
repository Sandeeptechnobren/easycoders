// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import './assessmentApp.css';

// export default function AssessmentAppLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const [theme, setTheme] = useState<'light' | 'dark'>('light');

  
//   useEffect(() => {
//     const user = localStorage.getItem('assessment_user');
//     if (!user) {
//       router.replace('/');
//     }
//   }, [router]);

//   const handleLogout = () => {
//     localStorage.removeItem('assessment_user');
//     router.replace('/self-assessment/login');
//   };

//   return (
//     <div className="assessmentApp" data-theme={theme}>
//       {/* SIDEBAR */}
//       <aside className="sidebar">
//         <div>
//           <div className="sidebarLogo">
//             <img
//               src="/images/ec_logo.png"
//               alt="Easy Coders"
//               height={50}
//             />
//           </div>

//           <div className="navItem active">Assessments</div>

//           <div
//             className="navItem"
//             onClick={() =>
//               setTheme(theme === 'light' ? 'dark' : 'light')
//             }
//           >
//             Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
//           </div>
//         </div>

//         {/* ✅ LOGOUT FIXED AT BOTTOM */}
//         <div className="sidebarFooter">
//           <button
//             className="logoutBtn"
//             onClick={handleLogout}
//           >
//             Logout
//           </button>
//         </div>
//       </aside>

//       {/* MAIN CONTENT */}
//       <main className="main">
//         {children}
//       </main>
//     </div>
//   );
// }
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

  useEffect(() => {
    const user = localStorage.getItem('assessment_user');
    if (!user) {
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('assessment_user');
    router.replace('/self-assessment/login');
  };

  return (
    <div
      className={`assessmentApp ${collapsed ? 'collapsed' : ''}`}
      data-theme={theme}
    >
      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* TOP */}
        <div className="sidebarTop">
          <div className="sidebarLogo">
            <img src="/images/ec_logo.png" alt="Easy Coders" />
          </div>

          <div className="navItem active">
            <span className="navIcon">📊</span>
            {!collapsed && <span>Assessments</span>}
          </div>
        </div>

        {/* FOOTER */}
        <div className="sidebarFooter">
          {/* THEME TOGGLE */}
          <div
            className="themeToggle"
            onClick={() =>
              setTheme(theme === 'light' ? 'dark' : 'light')
            }
          >
            <span>{theme === 'light' ? '☀️' : '🌙'}</span>
            {/* <div className={`toggleTrack ${theme}`}>
              <div className="toggleThumb" />
            </div> */}
          </div>

          {/* SIDEBAR TOGGLE */}
          <button
            className="collapseBtn"
            onClick={() => setCollapsed(!collapsed)}
          >
            ☰ {!collapsed && 'Collapse'}
          </button>

          {/* LOGOUT */}
          <button className="logoutBtn" onClick={handleLogout}>
            ⎋ {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">{children}</main>
    </div>
  );
}
