// 'use client';
// import RoleGuard from '@/components/RoleGuard';
// import { useEffect, useState } from 'react';
// import api from '@/lib/axios';
// import { useRouter } from 'next/navigation';
// import './adminDashboard.css';
// import {
//   LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
//   PieChart, Pie, Cell
// } from 'recharts';

// const enrollmentData = [
//   { day: 'Mon', value: 12 },
//   { day: 'Tue', value: 19 },
//   { day: 'Wed', value: 8 },
//   { day: 'Thu', value: 24 },
//   { day: 'Fri', value: 18 },
//   { day: 'Sat', value: 30 },
//   { day: 'Sun', value: 22 },
// ];

// const categoryData = [
//   { name: 'Web Dev', value: 45 },
//   { name: 'AI/ML', value: 25 },
//   { name: 'Java', value: 15 },
//   { name: 'Python', value: 15 },
// ];

// const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// export default function AdminDashboard() {
//   const [categories, setCategories] = useState<any[]>([]);
//   const router = useRouter();

//   useEffect(() => {
//     api.get('/categories').then(res => setCategories(res.data));
//   }, []);

//   return (
//     <RoleGuard allowedRoles={[1]}>
//     <div className="adminWrapper">
//       <div className="adminGrid">
//         <div className="adminSidebar">
//           <h3>Admin Panel</h3>
//           <div className="adminMenu">
//             <div className="adminMenuItem" onClick={() => router.push('/admin')}>
//               Dashboard
//             </div>
//             <div className="adminMenuItem" onClick={() => router.push('/admin/addCourse')}>
//               Add Course
//             </div>
//             <div className="adminMenuItem" onClick={() => router.push('/admin/studentManagement')}>
//               Students
//             </div>
//           </div>
//         </div>
//         <div className="adminMain">
//           <div className="adminHero">
//             <div>
//               <h1>Welcome Admin 👋</h1>
//               <p>Here’s what’s happening on EasyCoders today</p>
//             </div>
//           </div>
//           <div className="adminCards">
//             <div className="adminCard">
//               <h3>Total Students</h3>
//               <div className="adminStat">1,240</div>
//             </div>
//             <div className="adminCard">
//               <h3>Total Courses</h3>
//               <div className="adminStat">28</div>
//             </div>
//             <div className="adminCard">
//               <h3>New Enrollments</h3>
//               <div className="adminStat">+76</div>
//             </div>
//             <div className="adminCard">
//               <h3>Active Today</h3>
//               <div className="adminStat">312</div>
//             </div>
//           </div>

//           {/* LINE CHART */}
//           <div className="adminCard">
//             <h3>Enrollments This Week</h3>
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={enrollmentData}>
//                 <XAxis dataKey="day" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           {/* PIE + ACTIVITY */}
//           <div className="adminCards">

//             <div className="adminCard">
//               <h3>Students by Category</h3>
//               <ResponsiveContainer width="100%" height={220}>
//                 <PieChart>
//                   <Pie data={categoryData} dataKey="value" innerRadius={60} outerRadius={90}>
//                     {categoryData.map((_, i) => (
//                       <Cell key={i} fill={COLORS[i]} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="adminCard">
//               <h3>Recent Activity</h3>
//               <ul style={{ marginTop: 10, fontSize: 14 }}>
//                 <li>🟢 Rahul enrolled in Web Dev</li>
//                 <li>🟣 New course added: AI Bootcamp</li>
//                 <li>🔵 5 students completed Java</li>
//                 <li>🟡 Priya submitted assignment</li>
//               </ul>
//             </div>

//           </div>

//         </div>
//       </div>
//     </div>
//     </RoleGuard>
//   );
// }
'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './admin-home.module.css';
import { fetchWithAuth } from '@/lib/api';
import { computeInterestStats, normalizeInterestLabel, interestClass } from '@/lib/interest';

type StudentRow = {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status: number | string;
  course?: string;
  created_at?: string;
  interest?: {
    id: number;
    assessment_user_id: number;
    interest_status?: { id: number; interest: string };
    call_response?: string | null;
  } | null;
};

type College = { id: number | string; college_name: string };

export default function AdminHomePage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [error, setError] = useState('');

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // FIX SSR/localStorage issue
    if (typeof window === 'undefined') return;
    const u = localStorage.getItem('user');
    setUserData(u ? JSON.parse(u) : null);

    const savedCollege = localStorage.getItem('college_id') || '';
    setSelectedCollegeID(savedCollege);
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadColleges = async () => {
      try {
        setLoadingColleges(true);
        const res = await fetch('https://api.easycoders.in/projects/backend/public/api/collegeList', {
          signal: controller.signal,
        });
        const json = await res.json();
        setColleges(json.data || []);
      } catch {
      } finally {
        setLoadingColleges(false);
      }
    };
    loadColleges();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');

        // You can use admin endpoint or reuse HR students endpoint
        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');

        const json = await fetchWithAuth(url, { signal: controller.signal as any });
        setStudents(json.data || []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setStudents([]);
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load dashboard data');
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudents();
    return () => controller.abort();
  }, [selectedCollegeID]);

  const loading = loadingStudents || loadingColleges;

  const interestStats = useMemo(() => computeInterestStats(students), [students]);

  const recent = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const da = a.created_at || '';
        const db = b.created_at || '';
        return da < db ? 1 : -1;
      })
      .slice(0, 6);
  }, [students]);

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>
                Admin
              </Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Dashboard</span>
            </div>

            <h1 className={styles.title}>
              Hi {userData?.name || 'User'}, {greeting}
            </h1>
            <p className={styles.subtitle}>Admin operations overview</p>
          </div>

          <div className={styles.right}>
            <Link href="/admin/enrollmentRequests" className={`${styles.btn} ${styles.primary}`}>
              Enrollment Requests
            </Link>
            <Link href="/admin/students" className={styles.btn}>
              Student Management
            </Link>
          </div>
        </header>

        <section className={styles.filters}>
          <label className={styles.filterLabel} htmlFor="college-select">
            College
          </label>
          <select
            id="college-select"
            className={styles.select}
            value={selectedCollegeID}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedCollegeID(v);
              localStorage.setItem('college_id', v);
            }}
          >
            <option value="">All Colleges</option>
            {colleges.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.college_name}
              </option>
            ))}
          </select>

          {selectedCollegeID && (
            <button
              className={styles.clearBtn}
              type="button"
              onClick={() => {
                setSelectedCollegeID('');
                localStorage.removeItem('college_id');
              }}
            >
              Clear
            </button>
          )}
        </section>

        {loading && (
          <section className={styles.card}>
            <div className={styles.skeletonWrap}>
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
            </div>
          </section>
        )}

        {!loading && error && (
          <section className={styles.card}>
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load dashboard</div>
              <div className={styles.stateText}>{error}</div>
              <div className={styles.stateActions}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>
                  Go to Login →
                </Link>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && (
          <>
            {/* KPI with light colors */}
            <section className={styles.kpis}>
              <div className={styles.kpi} style={{ borderLeft: '5px solid #0ea5e9' }}>
                <div className={styles.kpiLabel}>Total Students</div>
                <div className={styles.kpiValue}>{interestStats.total}</div>
                <div className={styles.kpiHint}>All students</div>
              </div>

              <div className={styles.kpi} style={{ borderLeft: '5px solid #22c55e' }}>
                <div className={styles.kpiLabel}>Interested</div>
                <div className={styles.kpiValue}>{interestStats.Interested}</div>
                <div className={styles.kpiHint}>Ready to join</div>
              </div>

              <div className={styles.kpi} style={{ borderLeft: '5px solid #ef4444' }}>
                <div className={styles.kpiLabel}>Not Interested</div>
                <div className={styles.kpiValue}>{interestStats['Not Interested']}</div>
                <div className={styles.kpiHint}>No follow-up</div>
              </div>

              <div className={styles.kpi} style={{ borderLeft: '5px solid #f59e0b' }}>
                <div className={styles.kpiLabel}>Call Back Later</div>
                <div className={styles.kpiValue}>{interestStats['Call Back Later']}</div>
                <div className={styles.kpiHint}>Follow-up pending</div>
              </div>

              <div className={styles.kpi} style={{ borderLeft: '5px solid #64748b' }}>
                <div className={styles.kpiLabel}>Not Reachable</div>
                <div className={styles.kpiValue}>{interestStats['Not Reachable']}</div>
                <div className={styles.kpiHint}>Try again later</div>
              </div>

              <div className={styles.kpi} style={{ borderLeft: '5px solid #8b5cf6' }}>
                <div className={styles.kpiLabel}>Not Set</div>
                <div className={styles.kpiValue}>{interestStats['Not Set']}</div>
                <div className={styles.kpiHint}>Needs first call</div>
              </div>

              {interestStats.Other > 0 && (
                <div className={styles.kpi} style={{ borderLeft: '5px solid #0f172a' }}>
                  <div className={styles.kpiLabel}>Other</div>
                  <div className={styles.kpiValue}>{interestStats.Other}</div>
                  <div className={styles.kpiHint}>New categories</div>
                </div>
              )}
            </section>

            <section className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Quick Actions</div>
                    <div className={styles.cardSub}>Admin workflows</div>
                  </div>
                </div>

                <div className={styles.quickGrid}>
                  <Link href="/admin/enrollmentRequests" className={styles.quick}>
                    <div className={styles.quickIcon}>📝</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>Enrollment Requests</div>
                      <div className={styles.quickSub}>Convert to student accounts</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </Link>

                  <Link href="/admin/students" className={styles.quick}>
                    <div className={styles.quickIcon}>👥</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>Student Management</div>
                      <div className={styles.quickSub}>Fees, payments, attendance & marks</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </Link>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Recent Students</div>
                    <div className={styles.cardSub}>Latest profiles</div>
                  </div>

                  <Link className={styles.link} href="/admin/students">
                    View all
                  </Link>
                </div>

                <div className={styles.list}>
                  {recent.length ? (
                    recent.map((s) => {
                      const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
                      return (
                        <Link key={String(s.id)} href={`/admin/students/${s.id}`} className={styles.row}>
                          <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>

                          <div className={styles.rowMid}>
                            <div className={styles.rowTitle}>{s.name}</div>
                            <div className={styles.rowSub}>{s.email}</div>
                          </div>

                          <span className={`${styles.pill} ${styles[interestClass(label)]}`}>{label}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.empty}>No students found.</div>
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}