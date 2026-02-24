// 'use client';
// import { useEffect, useState } from 'react';
// import RoleGuard from '@/components/RoleGuard';
// import api from '@/lib/axios';
// import { useRouter } from 'next/navigation';
// import PunchInButton from '@/components/PunchInButton';
// import Loader from "../loader/page";
// export default function StudentDashboard() {
//     const [tasks, setTasks] = useState<any[]>([]);
//     const [tickets, setTickets] = useState<any[]>([]);
//     const [loading, setLoading] = useState(true);

//     const router = useRouter();
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const [tasksRes, ticketsRes] = await Promise.all([
//                     api.get('/tasks'),
//                     api.get('/tickets')
//                 ]);
//                 setTasks(tasksRes.data);
//                 setTickets(ticketsRes.data);
//             } catch (error) {
//                 console.error('Failed to fetch data', error);
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
//     if (loading) return <Loader />;
//     return (
//         <RoleGuard allowedRoles={[3]}>
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
//                             textShadow: "0 0 12px rgba(0,194,255,0.5)"
//                         }}
//                     >
//                         Student Dashboard
//                     </h1>
//                 </div>
//                 <div className="mb-4">
//                     <PunchInButton />
//                 </div>
//                 {/* <div className="row g-4">
//                     <div className="col-md-6">
//                         <div
//                             className="p-4 rounded-4 h-100"
//                             style={{
//                                 background: "rgba(15,15,15,0.85)",
//                                 border: "1px solid rgba(0,194,255,0.25)",
//                                 boxShadow: "0 0 20px rgba(0,194,255,0.15)",
//                                 backdropFilter: "blur(6px)"
//                             }}
//                         >
//                             <h3
//                                 className="fw-bold mb-3"
//                                 style={{ color: "#14f4ff" }}
//                             >
//                                 My Tasks
//                             </h3>
//                             {tasks.length === 0 ? (
//                                 <p className="text-muted">No tasks assigned yet.</p>
//                             ) : (
//                                 <ul className="list-unstyled">
//                                     {tasks.map((task) => (
//                                         <li
//                                             key={task.id}
//                                             className="py-3 border-bottom border-secondary"
//                                         >
//                                             <h5 className="fw-bold text-white">{task.title}</h5>
//                                             <p className="text-muted">{task.description}</p>
//                                             <span
//                                                 className="badge px-3 py-2"
//                                                 style={{
//                                                     background:
//                                                         task.status === "completed"
//                                                             ? "rgba(0,255,157,0.2)"
//                                                             : "rgba(255,193,7,0.2)",
//                                                     color:
//                                                         task.status === "completed"
//                                                             ? "#00ff9d"
//                                                             : "#ffc107",
//                                                     border: "1px solid rgba(255,255,255,0.2)"
//                                                 }}
//                                             >
//                                                 {task.status}
//                                             </span>
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     </div>
//                     <div className="col-md-6">
//                         <div
//                             className="p-4 rounded-4 h-100"
//                             style={{
//                                 background: "rgba(15,15,15,0.85)",
//                                 border: "1px solid rgba(0,255,157,0.25)",
//                                 boxShadow: "0 0 20px rgba(0,255,157,0.15)",
//                                 backdropFilter: "blur(6px)"
//                             }}
//                         >
//                             <h3
//                                 className="fw-bold mb-3"
//                                 style={{ color: "#00ff9d" }}
//                             >
//                                 My Courses
//                             </h3>
//                             <p className="text-muted">
//                                 Enrolled courses will appear here.
//                             </p>
//                         </div>
//                     </div>
//                 </div> */}
//                 {/* <div
//                     className="mt-5 p-4 rounded-4"
//                     style={{
//                         background: "rgba(15,15,15,0.85)",
//                         border: "1px solid rgba(0,194,255,0.25)",
//                         boxShadow: "0 0 20px rgba(0,194,255,0.15)",
//                         backdropFilter: "blur(6px)"
//                     }}
//                 >
//                     <h3
//                         className="fw-bold mb-3"
//                         style={{ color: "#14f4ff" }}
//                     >
//                         Support Tickets
//                     </h3>
//                     <form
//                         onSubmit={(e) => {
//                             e.preventDefault();
//                             const formData = new FormData(e.currentTarget);
//                             api.post('/tickets', {
//                                 title: formData.get('title'),
//                                 description: formData.get('description')
//                             }).then(() => window.location.reload());
//                         }}
//                         className="mb-4"
//                     >
//                         <input
//                             name="title"
//                             placeholder="Issue Title"
//                             required
//                             className="form-control bg-dark text-white border-secondary mb-3"
//                             style={{ borderRadius: "8px" }}
//                         />
//                         <textarea
//                             name="description"
//                             placeholder="Describe your issue..."
//                             required
//                             className="form-control bg-dark text-white border-secondary mb-3"
//                             rows={3}
//                             style={{ borderRadius: "8px" }}
//                         />
//                         <button
//                             type="submit"
//                             className="btn fw-bold"
//                             style={{
//                                 background: "#00c2ff",
//                                 color: "#000",
//                                 borderRadius: "10px",
//                                 boxShadow: "0 0 12px rgba(0,194,255,0.45)"
//                             }}
//                         >
//                             Raise Ticket
//                         </button>
//                     </form>
//                     <h4 className="fw-bold mb-3">My Tickets</h4>
//                     <ul className="list-unstyled">
//                         {tickets.map((ticket) => (
//                             <li
//                                 key={ticket.id}
//                                 className="py-3 border-bottom border-secondary"
//                             >
//                                 <div className="d-flex justify-content-between">
//                                     <strong>{ticket.title}</strong>
//                                     <span
//                                         className="badge px-3 py-2"
//                                         style={{
//                                             background:
//                                                 ticket.status === "open"
//                                                     ? "rgba(255,193,7,0.2)"
//                                                     : "rgba(0,255,157,0.2)",
//                                             color:
//                                                 ticket.status === "open"
//                                                     ? "#ffc107"
//                                                     : "#00ff9d",
//                                             border: "1px solid rgba(255,255,255,0.2)"
//                                         }}
//                                     >
//                                         {ticket.status}
//                                     </span>
//                                 </div>
//                                 <p className="text-muted mt-2">{ticket.description}</p>
//                                 {ticket.trainer_reply && (
//                                     <div
//                                         className="mt-2 p-2 rounded"
//                                         style={{
//                                             background: "rgba(255,255,255,0.05)",
//                                             borderLeft: "3px solid #00ff9d"
//                                         }}
//                                     >
//                                         <strong>Trainer Reply:</strong> {ticket.trainer_reply}
//                                     </div>
//                                 )}
//                             </li>
//                         ))}
//                     </ul>
//                 </div> */}
//             </div>
//         </div>
//         </RoleGuard>
//     );
// }
'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import styles from './students.module.css';
import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { computeInterestStats, normalizeInterestLabel, interestClass } from '@/lib/interest';

type Student = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  status: number | string;
  assessments_attempts?: any[];
  interest?: {
    id: number;
    assessment_user_id: number;
    interest_status?: { id: number; interest: string };
    call_response?: string | null;
  } | null;
};

type College = { id: string | number; college_name: string };

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const loading = loadingStudents || loadingColleges;

  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
  const [colleges, setColleges] = useState<College[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSelectedCollegeID(localStorage.getItem('college_id') || '');
  }, []);

  useEffect(() => {
    const loadColleges = async () => {
      try {
        setLoadingColleges(true);
        const res = await fetch('https://api.easycoders.in/projects/backend/public/api/collegeList');
        const json = await res.json();
        setColleges(json.data || []);
      } catch {
      } finally {
        setLoadingColleges(false);
      }
    };
    loadColleges();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');

        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');

        const json = await fetchWithAuth(url);
        setStudents(json.data || []);
      } catch (e: any) {
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load students');
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [selectedCollegeID]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.email, s.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [students, query]);

  const interestStats = useMemo(() => computeInterestStats(filtered), [filtered]);

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
              <span className={styles.crumbNow}>Students</span>
            </div>

            <h1 className={styles.title}>Student Directory</h1>
            <p className={styles.subtitle}>Search, filter and open a student profile.</p>
          </div>

          <div className={styles.right}>
            <Link href="/admin/students" className={`${styles.btn} ${styles.primary}`}>
              Refresh
            </Link>
          </div>
        </header>

        <section className={styles.kpis}>
          <div className={styles.kpi} style={{ borderLeft: '5px solid #0ea5e9' }}>
            <div className={styles.kpiLabel}>Total</div>
            <div className={styles.kpiValue}>{interestStats.total}</div>
            <div className={styles.kpiHint}>Shown in list</div>
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

        <section className={styles.filters}>
          <input
            className={styles.search}
            placeholder="Search by name, email, phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className={styles.select}
            value={selectedCollegeID}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCollegeID(val);
              localStorage.setItem('college_id', val);
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

        <section className={styles.card}>
          {loading && (
            <div className={styles.skeletonWrap}>
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
            </div>
          )}

          {!loading && error && (
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load students</div>
              <div className={styles.stateText}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>
                  Go to Login →
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.state}>
              <div className={styles.stateTitle}>No results</div>
              <div className={styles.stateText}>Try changing search text or filters.</div>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Interest</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((s) => {
                    const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
                    return (
                      <tr key={String(s.id)}>
                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                            <div className={styles.studentMeta}>
                              <div className={styles.studentName}>{s.name}</div>
                              <div className={styles.studentSub}>{s.email} • {s.phone}</div>
                            </div>
                          </div>
                        </td>

                        <td className={styles.muted}>{s.email}</td>

                        <td>
                          <span className={`${styles.pill} ${styles.neutral}`}>{s.phone}</span>
                        </td>

                        <td>
                          <span className={`${styles.pill} ${styles[interestClass(label)]}`}>{label}</span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <Link className={`${styles.btn} ${styles.small}`} href={`/admin/students/${s.id}`}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className={styles.mobileList}>
                {filtered.map((s) => {
                  const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
                  return (
                    <Link key={String(s.id)} href={`/admin/students/${s.id}`} className={styles.mCard}>
                      <div className={styles.mTop}>
                        <div className={styles.mLeft}>
                          <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                          <div className={styles.mText}>
                            <div className={styles.studentName}>{s.name}</div>
                            <div className={styles.studentSub}>{s.email}</div>
                          </div>
                        </div>

                        <span className={`${styles.pill} ${styles[interestClass(label)]}`}>{label}</span>
                      </div>

                      <div className={styles.mGrid}>
                        <div>
                          <span className={styles.k}>Phone</span>
                          <span className={styles.v}>{s.phone}</span>
                        </div>
                      </div>

                      <div className={styles.mAction}>View Details →</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}