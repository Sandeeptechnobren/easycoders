// 'use client';

// import { useEffect, useState } from 'react';
// import RoleGuard from '@/components/RoleGuard';
// import api from '@/lib/axios';
// import { useRouter } from 'next/navigation';
// import PunchInButton from '@/components/PunchInButton';

// export default function TrainerDashboard() {
//     const [tasks, setTasks] = useState<any[]>([]);
//     const [tickets, setTickets] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);
//     const router = useRouter();

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const [tasksRes, ticketsRes] = await Promise.all([
//                     api.get('/tasks'),
//                     api.get('/tickets'),
//                 ]);

//                 setTasks(tasksRes.data);
//                 setTickets(ticketsRes.data);
//             } catch (error) {
//                 console.error('Failed to fetch trainer data:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchData();
//     }, []);

//     const handleLogout = async () => {
//         await api.post('/logout');
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         router.push('/login');
//     };

//     if (loading)
//         return (
//             <div
//                 className="d-flex justify-content-center align-items-center min-vh-100"
//                 style={{ background: "#050505", color: "white" }}
//             >
//                 Loading...
//             </div>
//         );

//     return (
//         <RoleGuard allowedRoles={[4]}>
//         <div
//             className="min-vh-100 py-5"
//             style={{ background: "#050505", color: "white" }}
//         >
//             <div className="container">

//                 {/* HEADER */}
//                 <div className="d-flex justify-content-between align-items-center mb-5">
//                     <h1
//                         className="fw-bold"
//                         style={{
//                             color: "#00c2ff",
//                             textShadow: "0 0 12px rgba(0,194,255,0.5)",
//                         }}
//                     >
//                         Trainer Dashboard
//                     </h1>

//                     <button
//                         onClick={handleLogout}
//                         className="btn fw-bold px-4 py-2"
//                         style={{
//                             background: "#ff3b3b",
//                             color: "#fff",
//                             borderRadius: "8px",
//                             boxShadow: "0 0 12px rgba(255,0,0,0.4)",
//                         }}
//                     >
//                         Logout
//                     </button>
//                 </div>

//                 {/* PUNCH-IN BUTTON */}
//                 <div className="mb-4">
//                     <PunchInButton />
//                 </div>

//                 <div className="row g-4">

//                     {/* TASKS PANEL */}
//                     <div className="col-md-6">
//                         <div
//                             className="p-4 rounded-4 h-100"
//                             style={{
//                                 background: "rgba(15,15,15,0.85)",
//                                 border: "1px solid rgba(0,194,255,0.25)",
//                                 boxShadow: "0 0 20px rgba(0,194,255,0.15)",
//                                 backdropFilter: "blur(6px)",
//                             }}
//                         >
//                             <div className="d-flex justify-content-between align-items-center mb-3">
//                                 <h3
//                                     className="fw-bold"
//                                     style={{ color: "#14f4ff" }}
//                                 >
//                                     Assigned Tasks
//                                 </h3>

//                                 <button
//                                     className="btn fw-bold"
//                                     style={{
//                                         background: "#00c2ff",
//                                         color: "#000",
//                                         borderRadius: "10px",
//                                         boxShadow: "0 0 12px rgba(0,194,255,0.45)",
//                                     }}
//                                 >
//                                     Assign New Task
//                                 </button>
//                             </div>

//                             <ul className="list-unstyled">
//                                 {tasks.map((task) => (
//                                     <li
//                                         key={task.id}
//                                         className="py-3 border-bottom border-secondary"
//                                     >
//                                         <h5 className="fw-bold text-white">{task.title}</h5>
//                                         <small className="text-muted">
//                                             Student: {task.student?.name}
//                                         </small>
//                                         <br />
//                                         <span
//                                             className="badge mt-2"
//                                             style={{
//                                                 background: "#333",
//                                                 color: "#14f4ff",
//                                                 border: "1px solid rgba(0,194,255,0.3)",
//                                             }}
//                                         >
//                                             {task.status}
//                                         </span>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     </div>

//                     {/* TICKETS PANEL */}
//                     <div className="col-md-6">
//                         <div
//                             className="p-4 rounded-4 h-100"
//                             style={{
//                                 background: "rgba(15,15,15,0.85)",
//                                 border: "1px solid rgba(0,255,157,0.25)",
//                                 boxShadow: "0 0 20px rgba(0,255,157,0.15)",
//                                 backdropFilter: "blur(6px)",
//                             }}
//                         >
//                             <h3
//                                 className="fw-bold mb-3"
//                                 style={{ color: "#00ff9d" }}
//                             >
//                                 Help Desk Tickets
//                             </h3>

//                             <ul className="list-unstyled">
//                                 {tickets.map((ticket) => (
//                                     <li
//                                         key={ticket.id}
//                                         className="py-3 border-bottom border-secondary"
//                                     >
//                                         <div className="d-flex justify-content-between">
//                                             <div>
//                                                 <h5 className="fw-bold text-white">{ticket.title}</h5>
//                                                 <small className="text-muted">
//                                                     Student: {ticket.student?.name}
//                                                 </small>

//                                                 <p className="text-light mt-2">{ticket.description}</p>
//                                             </div>

//                                             {/* STATUS BADGE */}
//                                             <span
//                                                 className="badge"
//                                                 style={{
//                                                     background: ticket.status === 'open'
//                                                         ? "rgba(255,193,7,0.2)"
//                                                         : "rgba(0,255,157,0.2)",
//                                                     color: ticket.status === 'open'
//                                                         ? "#ffc107"
//                                                         : "#00ff9d",
//                                                     border: "1px solid rgba(255,255,255,0.2)",
//                                                     padding: "6px 10px",
//                                                     height: "fit-content",
//                                                 }}
//                                             >
//                                                 {ticket.status}
//                                             </span>
//                                         </div>

//                                         {/* REPLY FORM */}
//                                         {ticket.status === 'open' && (
//                                             <form
//                                                 onSubmit={(e) => {
//                                                     e.preventDefault();
//                                                     const formData = new FormData(e.currentTarget);
//                                                     api.put(`/tickets/${ticket.id}`, {
//                                                         trainer_reply: formData.get('reply'),
//                                                         status: 'closed',
//                                                     }).then(() => window.location.reload());
//                                                 }}
//                                                 className="d-flex gap-2 mt-3"
//                                             >
//                                                 <input
//                                                     name="reply"
//                                                     placeholder="Write a reply..."
//                                                     className="form-control bg-dark text-white border-secondary"
//                                                     required
//                                                     style={{ borderRadius: "8px" }}
//                                                 />
//                                                 <button
//                                                     type="submit"
//                                                     className="btn fw-bold"
//                                                     style={{
//                                                         background: "#00ff9d",
//                                                         color: "#000",
//                                                         borderRadius: "10px",
//                                                         boxShadow: "0 0 12px rgba(0,255,157,0.45)",
//                                                     }}
//                                                 >
//                                                     Reply & Close
//                                                 </button>
//                                             </form>
//                                         )}

//                                         {/* TRAINER REPLY */}
//                                         {ticket.trainer_reply && (
//                                             <div
//                                                 className="mt-3 p-2 rounded"
//                                                 style={{
//                                                     background: "rgba(255,255,255,0.05)",
//                                                     borderLeft: "3px solid #00ff9d",
//                                                 }}
//                                             >
//                                                 <strong>Reply:</strong> {ticket.trainer_reply}
//                                             </div>
//                                         )}
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </div>
//         </RoleGuard>
//     );
// }
'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './trainer-home.module.css';
import { fetchWithAuth } from '@/lib/api';

type Student = {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status: number | string;
  interest?: null | {
    id: number;
    interest_status?: { id: number; interest: string } | null;
    call_response?: string | null;
  };
  created_at?: string;
};

function interestLabel(s: Student): string {
  const v = s?.interest?.interest_status?.interest;
  return v ? v : 'Not Set';
}

function interestKey(label: string) {
  const k = label.trim().toLowerCase();
  if (k === 'interested') return 'Interested';
  if (k === 'not interest' || k === 'not interested') return 'Not Interested';
  if (k === 'call back later') return 'Call Back Later';
  if (k === 'not reachable') return 'Not Reachable';
  if (k === 'not set') return 'Not Set';
  return 'Other';
}

function pillClass(label: string) {
  const k = interestKey(label);
  if (k === 'Interested') return styles.pillInterested;
  if (k === 'Not Interested') return styles.pillNotInterested;
  if (k === 'Call Back Later') return styles.pillCallBack;
  if (k === 'Not Reachable') return styles.pillNotReachable;
  if (k === 'Not Set') return styles.pillNotSet;
  return styles.pillOther;
}

export default function TrainerHomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // avoid SSR localStorage
    try {
      const u = localStorage.getItem('user');
      setUserData(u ? JSON.parse(u) : null);
    } catch {
      setUserData(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const json = await fetchWithAuth(
          'https://api.easycoders.in/projects/backend/public/api/student/studentslist'
        );
        setStudents(json.data || []);
      } catch (e: any) {
        setStudents([]);
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const interestStats = useMemo(() => {
    const base = {
      total: students.length,
      Interested: 0,
      'Not Interested': 0,
      'Call Back Later': 0,
      'Not Reachable': 0,
      'Not Set': 0,
      Other: 0,
    };
    for (const s of students) {
      const k = interestKey(interestLabel(s));
      (base as any)[k] = ((base as any)[k] || 0) + 1;
    }
    return base;
  }, [students]);

  const recent = useMemo(() => {
    return [...students].slice(0, 6);
  }, [students]);

  return (
    <RoleGuard allowedRoles={[4]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/trainer" className={styles.crumbLink}>Trainer</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Dashboard</span>
            </div>
            <h1 className={styles.title}>
              Hi {userData?.name || 'User'}, {greeting}
            </h1>
            <p className={styles.subtitle}>Trainer overview & student pipeline</p>
          </div>

          <div className={styles.right}>
            <Link href="/trainer/students" className={`${styles.btn} ${styles.primary}`}>
              Students Directory
            </Link>
          </div>
        </header>

        {loading && (
          <section className={styles.card}>
            <div className={styles.state}>Loading dashboard…</div>
          </section>
        )}

        {!loading && error && (
          <section className={styles.card}>
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load dashboard</div>
              <div className={styles.stateText}>{error}</div>
              <div className={styles.stateActions}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>Go to Login →</Link>
                <Link href="/trainer/students" className={`${styles.btn} ${styles.small}`}>Open Students</Link>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && (
          <>
            {/* KPI */}
            <section className={styles.kpis}>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Total Students</div>
                <div className={styles.kpiValue}>{interestStats.total}</div>
                <div className={styles.kpiHint}>All records</div>
              </div>

              <div className={`${styles.kpi} ${styles.kpiInterested}`}>
                <div className={styles.kpiLabel}>Interested</div>
                <div className={styles.kpiValue}>{interestStats.Interested}</div>
                <div className={styles.kpiHint}>Ready to join</div>
              </div>

              <div className={`${styles.kpi} ${styles.kpiNotInterested}`}>
                <div className={styles.kpiLabel}>Not Interested</div>
                <div className={styles.kpiValue}>{interestStats['Not Interested']}</div>
                <div className={styles.kpiHint}>No follow-up needed</div>
              </div>

              <div className={`${styles.kpi} ${styles.kpiCallBack}`}>
                <div className={styles.kpiLabel}>Call Back Later</div>
                <div className={styles.kpiValue}>{interestStats['Call Back Later']}</div>
                <div className={styles.kpiHint}>Follow-up pending</div>
              </div>

              <div className={`${styles.kpi} ${styles.kpiNotReachable}`}>
                <div className={styles.kpiLabel}>Not Reachable</div>
                <div className={styles.kpiValue}>{interestStats['Not Reachable']}</div>
                <div className={styles.kpiHint}>Try again later</div>
              </div>

              <div className={`${styles.kpi} ${styles.kpiNotSet}`}>
                <div className={styles.kpiLabel}>Not Set</div>
                <div className={styles.kpiValue}>{interestStats['Not Set']}</div>
                <div className={styles.kpiHint}>Needs first call</div>
              </div>

              {interestStats.Other > 0 && (
                <div className={`${styles.kpi} ${styles.kpiOther}`}>
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
                    <div className={styles.cardSub}>Daily trainer workflow</div>
                  </div>
                </div>

                <div className={styles.quickGrid}>
                  <Link href="/trainer/students" className={styles.quick}>
                    <div className={styles.quickIcon}>👥</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>View Students</div>
                      <div className={styles.quickSub}>Open profile, update interest, attendance</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </Link>

                  <button className={styles.quick} type="button" onClick={() => alert('Add trainer reports later')}>
                    <div className={styles.quickIcon}>📊</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>Reports</div>
                      <div className={styles.quickSub}>Export weekly performance</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </button>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Recent Students</div>
                    <div className={styles.cardSub}>Latest records</div>
                  </div>
                  <Link className={styles.link} href="/trainer/students">View all</Link>
                </div>

                <div className={styles.list}>
                  {recent.map((s) => {
                    const lbl = interestLabel(s);
                    return (
                      <Link key={String(s.id)} href={`/trainer/students/${s.id}`} className={styles.row}>
                        <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                        <div className={styles.rowMid}>
                          <div className={styles.rowTitle}>{s.name}</div>
                          <div className={styles.rowSub}>{s.email}</div>
                        </div>
                        <span className={`${styles.pill} ${pillClass(lbl)}`}>{lbl}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}