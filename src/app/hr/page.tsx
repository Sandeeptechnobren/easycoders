'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './hr-home.module.css';

type AssessmentAttempt = {
  id: number;
  user_id: number;
  assessment_id: number;
  score: number;
  status: string;
  certificate_code: string;
  assessment?: { id: number; title: string };
};

type Interest = {
  id: number;
  assessment_user_id: number;
  interest_status: { id: number; interest: string } | null;
  call_response: string | null;
};

type Student = {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  status: number | string;
  score?: number;
  joinedAt?: string;
  created_at?: string;
  total_fee?: number;
  due_amount?: number;
  enrolment_id?: string | null;
  batch?: string | null;
  assessments_attempts?: AssessmentAttempt[];
  interest?: Interest | null;
};

type College = {
  id: string | number;
  college_name: string;
  address?: string;
};

type StudentsListApiResponse = {
  status: string;
  data: Student[];
};

function normalizeStatus(s: Student['status']): 'Active' | 'Inactive' {
  if (s === 'Active' || s === 1 || s === '1') return 'Active';
  return 'Inactive';
}

function getJoinedDate(s: Student): string {
  return s.joinedAt || (s as any).created_at || '';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const KPI_CONFIG = [
  {
    key: 'total',
    label: 'Total Students',
    hint: 'All enrolled',
    accent: '#6366f1',
    bg: 'rgba(99,102,241,0.07)',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
  },
  {
    key: 'active',
    label: 'Active',
    hint: 'Currently active',
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.07)',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'withDues',
    label: 'With Dues',
    hint: 'Fees outstanding',
    accent: '#ef4444',
    bg: 'rgba(239,68,68,0.07)',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
      </svg>
    ),
  },
  {
    key: 'fullyPaid',
    label: 'Fully Paid',
    hint: 'Cleared in full',
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'inactive',
    label: 'Inactive',
    hint: 'Not active',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.07)',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728M9.172 14.828a5 5 0 010-7.072" />
      </svg>
    ),
  },
  {
    key: 'recent',
    label: 'New (30d)',
    hint: 'Joined recently',
    accent: '#94a3b8',
    bg: 'rgba(148,163,184,0.07)',
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const QUICK_ACTIONS = [
  {
    icon: '🎓',
    title: 'Admissions',
    sub: 'Create admissions, manage fee installments',
    href: '/hr/admissions',
    tag: 'Manage',
  },
  {
    icon: '👥',
    title: 'Students Directory',
    sub: 'Browse, filter and manage profiles',
    href: '/hr/students',
    tag: 'View',
  },
  {
    icon: '🏫',
    title: 'Batches',
    sub: 'View and manage training batches',
    href: '/admin/batches',
    tag: 'Manage',
  },
  {
    icon: '📍',
    title: 'Attendance',
    sub: 'View records, mark manually, manage locations',
    href: '/hr/attendance',
    tag: 'Manage',
  },
  {
    icon: '🎫',
    title: 'Tickets / Queries',
    sub: 'Assign and respond to student tickets',
    href: '/hr/tickets',
    tag: 'Support',
  },
  {
    icon: '💳',
    title: 'Fee Payments',
    sub: 'Record and track installment payments',
    href: '/hr/fee',
    tag: 'Finance',
  },
  {
    icon: '📝',
    title: 'Enrollment Requests',
    sub: 'Review legacy enrollment applications',
    href: '/hr/enrollmentRequests',
    tag: 'Review',
  },
  {
    icon: '📩',
    title: 'Contact Inquiries',
    sub: 'View messages submitted by users',
    href: '/admin/contactInquiries',
    tag: 'Inbox',
  },
];

export default function HrHomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      setUserData(raw ? JSON.parse(raw) : null);
      const savedCollege = typeof window !== 'undefined' ? localStorage.getItem('college_id') : '';
      if (savedCollege) setSelectedCollegeID(savedCollege);
    } catch {
      setUserData(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingColleges(true);
        const res = await fetch('https://api.easycoders.in/api/collegeList', { signal: controller.signal });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setColleges(json.data || []);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {}
      } finally {
        setLoadingColleges(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoadingStudents(true);
        setError('');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) throw new Error('Unauthorized');
        const url = 'https://api.easycoders.in/api/admin/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to load students');
        const json: StudentsListApiResponse = await res.json();
        setStudents(json.data || []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setStudents([]);
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load dashboard data.');
      } finally {
        setLoadingStudents(false);
      }
    })();
    return () => controller.abort();
  }, [selectedCollegeID]);

  const loading = loadingStudents || loadingColleges;

  const studentStats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => normalizeStatus(s.status) === 'Active').length;
    const withDues = students.filter(s => Number(s.due_amount ?? 0) > 0).length;
    const fullyPaid = students.filter(s => Number(s.total_fee ?? 0) > 0 && Number(s.due_amount ?? 0) <= 0).length;
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = students.filter(s => {
      const d = getJoinedDate(s);
      const t = d ? new Date(d).getTime() : NaN;
      return !Number.isNaN(t) && t >= cutoff;
    }).length;
    return { total, active, inactive: total - active, withDues, fullyPaid, recent };
  }, [students]);

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <RoleGuard allowedRoles={[2]}>
      <div className={styles.wrap}>

        {/* ── TOPBAR ── */}
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <div className={styles.topLeft}>
              <nav className={styles.crumbs}>
                <Link href="/hr" className={styles.crumbLink}>HR</Link>
                <span className={styles.crumbSep}>/</span>
                <span className={styles.crumbNow}>Dashboard</span>
              </nav>
              <div className={styles.titleRow}>
                <div>
                  <h1 className={styles.title}>
                    {greeting}, <span className={styles.nameAccent}>{userData?.name || 'User'}</span>
                  </h1>
                  <p className={styles.subtitle}>{today} · Student &amp; operations overview</p>
                </div>
              </div>
            </div>

            <div className={styles.topRight}>
              <Link href="/hr/students" className={styles.btnPrimary}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
                Students Directory
              </Link>
              <Link href="/hr/students" className={styles.btnGhost}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </Link>
            </div>
          </div>
        </header>

        {/* ── FILTER BAR ── */}
        <section className={styles.filterBar}>
          <div className={styles.filterBarInner}>
            <div className={styles.filterLeft}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <label className={styles.filterLabel} htmlFor="college-select">Filter by College</label>
            </div>
            <div className={styles.filterRight}>
              <div className={styles.selectWrapper}>
                <select
                  id="college-select"
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
                    <option key={String(c.id)} value={String(c.id)}>{c.college_name}</option>
                  ))}
                </select>
                <svg className={styles.selectChev} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {selectedCollegeID && (
                <button className={styles.clearBtn} type="button" onClick={() => { setSelectedCollegeID(''); localStorage.removeItem('college_id'); }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── LOADING ── */}
        {loading && (
          <div className={styles.loadingSection}>
            <div className={styles.kpiGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skKpi} style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
            <div className={styles.skCard} style={{ animationDelay: '480ms' }} />
          </div>
        )}

        {/* ── ERROR ── */}
        {!loading && error && (
          <div className={styles.errorWrap}>
            <div className={styles.errorIcon}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className={styles.errorTitle}>Could not load dashboard</div>
            <div className={styles.errorText}>{error}</div>
            <div className={styles.errorActions}>
              <Link href="/login" className={styles.btnPrimary}>Go to Login →</Link>
              <Link href="/hr/students" className={styles.btnGhost}>Open Students</Link>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {!loading && !error && (
          <>
            {/* KPIs */}
            <section className={styles.kpiSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Student Overview</span>
                <span className={styles.sectionMeta}>{studentStats.total} students total</span>
              </div>
              <div className={styles.kpiGrid}>
                {KPI_CONFIG.map((cfg) => {
                  const value = cfg.key === 'total'
                    ? studentStats.total
                    : (studentStats as Record<string, number>)[cfg.key] ?? 0;
                  const pct = studentStats.total > 0 ? Math.round((value / studentStats.total) * 100) : 0;
                  return (
                    <div key={cfg.key} className={styles.kpiCard} style={{ '--accent': cfg.accent, '--bg': cfg.bg } as React.CSSProperties}>
                      <div className={styles.kpiTop}>
                        <div className={styles.kpiIconBox} style={{ color: cfg.accent, background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        {cfg.key !== 'total' && (
                          <span className={styles.kpiBadge} style={{ color: cfg.accent, background: cfg.bg }}>
                            {pct}%
                          </span>
                        )}
                      </div>
                      <div className={styles.kpiValue}>{value.toLocaleString()}</div>
                      <div className={styles.kpiLabel}>{cfg.label}</div>
                      <div className={styles.kpiHint}>{cfg.hint}</div>
                      {cfg.key !== 'total' && (
                        <div className={styles.kpiBar}>
                          <div className={styles.kpiBarFill} style={{ width: `${pct}%`, background: cfg.accent }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick Actions */}
            <section className={styles.actionsSection}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Quick Actions</span>
                <span className={styles.sectionMeta}>Frequently used HR workflows</span>
              </div>
              <div className={styles.actionsGrid}>
                {QUICK_ACTIONS.map((a, i) => {
                  const inner = (
                    <>
                      <div className={styles.actionEmoji}>{a.icon}</div>
                      <div className={styles.actionBody}>
                        <div className={styles.actionTitle}>{a.title}</div>
                        <div className={styles.actionSub}>{a.sub}</div>
                      </div>
                      <div className={styles.actionTag}>{a.tag}</div>
                      <svg className={styles.actionArrow} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  );
                  return (
                    <Link key={i} href={a.href!} className={styles.actionCard}>{inner}</Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}