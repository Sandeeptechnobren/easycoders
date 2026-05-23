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
    (async () => {
      try {
        setLoadingColleges(true);
        const res = await fetch(
          'https://api.easycoders.in/projects/backend/public/api/collegeList',
          { signal: controller.signal }
        );
        const json = await res.json();
        setColleges(json.data || []);
      } catch {}
      finally { setLoadingColleges(false); }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingStudents(true);
        setError('');
        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');
        const json = await fetchWithAuth(url, { signal: controller.signal as any });
        setStudents(json.data || []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setStudents([]);
        setError(
          e?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : 'Failed to load dashboard data'
        );
      } finally { setLoadingStudents(false); }
    })();
    return () => controller.abort();
  }, [selectedCollegeID]);

  const loading = loadingStudents || loadingColleges;
  const interestStats = useMemo(() => computeInterestStats(students), [students]);
  const recent = useMemo(() =>
    [...students]
      .sort((a, b) => ((a.created_at || '') < (b.created_at || '') ? 1 : -1))
      .slice(0, 6),
    [students]
  );

  const kpis = [
    { label: 'Total',         hint: 'All students',      val: interestStats.total,                color: '#0ea5e9' },
    { label: 'Interested',    hint: 'Ready to join',     val: interestStats.Interested,           color: '#22c55e' },
    { label: 'Not Interested',hint: 'No follow-up',      val: interestStats['Not Interested'],    color: '#ef4444' },
    { label: 'Call Back',     hint: 'Pending follow-up', val: interestStats['Call Back Later'],   color: '#f59e0b' },
    { label: 'Not Reachable', hint: 'Try again later',   val: interestStats['Not Reachable'],     color: '#64748b' },
    { label: 'Not Set',       hint: 'Needs first call',  val: interestStats['Not Set'],           color: '#8b5cf6' },
    ...(interestStats.Other > 0
      ? [{ label: 'Other', hint: 'New categories', val: interestStats.Other, color: '#0f172a' }]
      : []),
  ];

  const quickActions = [
    { href: '/hr/admissions',          icon: '🎓', title: 'Admissions',           sub: 'Create admissions, fee installments' },
    { href: '/admin/batches',          icon: '🏫', title: 'Batches',              sub: 'Manage training batches & trainers' },
    { href: '/admin/assessments',      icon: '📋', title: 'Assessments',          sub: 'Create/manage self-assessment tests' },
    { href: '/admin/permissions',      icon: '🔐', title: 'Permissions',          sub: 'Role defaults & per-user overrides' },
    { href: '/admin/attendance',       icon: '📍', title: 'Attendance',           sub: 'Records, manual mark, locations' },
    { href: '/admin/tickets',          icon: '🎫', title: 'Tickets',              sub: 'Assign & resolve student queries' },
    { href: '/admin/studentManagement',icon: '👥', title: 'Student Management',   sub: 'Profiles, fees & marks' },
    { href: '/admin/enrollmentRequests',icon: '📝',title: 'Enrollment Requests',  sub: 'Legacy — convert to student accounts' },
  ];

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className={styles.wrap}>

        {/* ── Top Bar ── */}
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>Admin</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Dashboard</span>
            </div>
            <h1 className={styles.title}>
              Hi {userData?.name || 'User'}, {greeting} 👋
            </h1>
            <p className={styles.subtitle}>Admin operations overview</p>
          </div>
          <div className={styles.right}>
            <Link href="/hr/admissions" className={`${styles.btn} ${styles.primary}`}>
              🎓 Admissions
            </Link>
            <Link href="/admin/batches" className={`${styles.btn} ${styles.primary}`}>
              🏫 Batches
            </Link>
            <Link href="/admin/students" className={styles.btn}>
              👥 Student Management
            </Link>
          </div>
        </header>

        {/* ── Filters ── */}
        <section className={styles.filters}>
          <label className={styles.filterLabel} htmlFor="college-select">College</label>
          <select
            id="college-select"
            className={styles.select}
            value={selectedCollegeID}
            onChange={(e) => {
              setSelectedCollegeID(e.target.value);
              localStorage.setItem('college_id', e.target.value);
            }}
          >
            <option value="">All Colleges</option>
            {colleges.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>{c.college_name}</option>
            ))}
          </select>
          {selectedCollegeID && (
            <button
              className={styles.clearBtn}
              onClick={() => {
                setSelectedCollegeID('');
                localStorage.removeItem('college_id');
              }}
            >
              Clear
            </button>
          )}
        </section>

        {/* ── Loading skeleton ── */}
        {loading && (
          <section className={styles.card}>
            <div className={styles.skeletonWrap}>
              {[1,2,3,4].map(i => <div key={i} className={styles.skRow} />)}
            </div>
          </section>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <section className={styles.card}>
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load dashboard</div>
              <div className={styles.stateText}>{error}</div>
              <div className={styles.stateActions}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>Go to Login →</Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Main Content ── */}
        {!loading && !error && (
          <>
            {/* KPIs */}
            <section className={styles.kpis}>
              {kpis.map((k) => (
                <div key={k.label} className={styles.kpi} style={{ borderLeft: `3px solid ${k.color}` }}>
                  <div className={styles.kpiVal} style={{ color: k.color }}>{k.val}</div>
                  <div className={styles.kpiLabel}>{k.label}</div>
                  <div className={styles.kpiHint}>{k.hint}</div>
                  <div className={styles.kpiBar} style={{ background: k.color }} />
                </div>
              ))}
            </section>

            <section className={styles.grid2}>
              {/* Quick Actions */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Quick Actions</div>
                    <div className={styles.cardSub}>Admin workflows</div>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.quickGrid}>
                    {quickActions.map((q) => (
                      <Link key={q.href} href={q.href} className={styles.quick}>
                        <div className={styles.quickIco}>{q.icon}</div>
                        <div className={styles.quickText}>
                          <div className={styles.quickTitle}>{q.title}</div>
                          <div className={styles.quickSub}>{q.sub}</div>
                        </div>
                        <div className={styles.chev}>→</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Students */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Recent Students</div>
                    <div className={styles.cardSub}>Latest profiles</div>
                  </div>
                  <Link href="/admin/students" className={styles.cardLink}>View all →</Link>
                </div>
                <div className={styles.studentList}>
                  {recent.length ? (
                    recent.map((s) => {
                      const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
                      return (
                        <Link key={String(s.id)} href={`/admin/students/${s.id}`} className={styles.sRow}>
                          <div className={styles.sAv}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                          <div className={styles.sMid}>
                            <div className={styles.sName}>{s.name}</div>
                            <div className={styles.sEmail}>{s.email}</div>
                          </div>
                          <span className={`${styles.pill} ${styles[interestClass(label)]}`}>{label}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.empty}>No students found.</div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}