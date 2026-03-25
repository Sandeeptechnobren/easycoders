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
  status: number | string; // 1/0 or "Active"/"Inactive"
  score?: number;
  joinedAt?: string;
  created_at?: string;
  assessments_attempts?: AssessmentAttempt[];
  interest: Interest | null;
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

function normalizeInterestLabel(interest: Student['interest']): string {
  const label = interest?.interest_status?.interest?.trim();
  if (!label) return 'Not Set';

  const l = label.toLowerCase();
  if (l === 'interested') return 'Interested';
  if (l === 'not interest' || l === 'not interested') return 'Not Interested';
  if (l === 'call back later') return 'Call Back Later';
  if (l === 'not reachable') return 'Not Reachable';

  return label; // fallback if backend adds more
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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

    const fetchColleges = async () => {
      try {
        setLoadingColleges(true);
        const res = await fetch(
          'https://api.easycoders.in/projects/backend/public/api/collegeList',
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Failed to fetch colleges');
        const json = await res.json();
        setColleges(json.data || []);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          // you can set an error here if you want
        }
      } finally {
        setLoadingColleges(false);
      }
    };

    fetchColleges();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) throw new Error('Unauthorized');

        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');

        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to load students');

        const json: StudentsListApiResponse = await res.json();
        setStudents(json.data || []);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;

        setStudents([]);
        setError(
          e?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : 'Failed to load dashboard data.'
        );
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
    return () => controller.abort();
  }, [selectedCollegeID]);

  const loading = loadingStudents || loadingColleges;

  // ✅ UPDATED KPIs: Interest based counts
  const interestStats = useMemo(() => {
    const total = students.length;

    const buckets = {
      Interested: 0,
      'Not Interested': 0,
      'Call Back Later': 0,
      'Not Reachable': 0,
      'Not Set': 0,
      Other: 0,
    };

    for (const s of students) {
      const label = normalizeInterestLabel(s.interest);
      if (label in buckets) (buckets as any)[label] += 1;
      else buckets.Other += 1;
    }

    return { total, ...buckets };
  }, [students]);

  const avgScore = useMemo(() => {
    const scores = students.map((s) => Number(s.score ?? 0)).filter((n) => Number.isFinite(n));
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }, [students]);

  const recent = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const da = getJoinedDate(a);
        const db = getJoinedDate(b);
        if (!da && !db) return 0;
        return da < db ? 1 : -1;
      })
      .slice(0, 6);
  }, [students]);

  const greeting = getGreeting();

  return (
    <RoleGuard allowedRoles={[2]}>
      <div className={styles.wrap}>
        {/* Header */}
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/hr" className={styles.crumbLink}>
                HR
              </Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Dashboard</span>
            </div>

            <h1 className={styles.title}>
              Hi {userData?.name || 'User'}, {greeting}
            </h1>
            <p className={styles.subtitle}>Student & operations overview</p>
          </div>

          <div className={styles.right}>
            <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
              Students Directory
            </Link>
            <Link href="/hr/students" className={styles.btn}>
              Search
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
                <Link href="/hr/students" className={`${styles.btn} ${styles.small}`}>
                  Open Students
                </Link>
              </div>
            </div>
          </section>
        )}

        
        {!loading && !error && (
          <>
            <section className={styles.kpis}>
  <div
    className={styles.kpi}
    style={{ borderLeft: '3px solid #6366f1' }}  
  >
    <div className={styles.kpiValue}>{interestStats.total}</div>
    <div className={styles.kpiLabel}>Total Students</div>
    <div className={styles.kpiHint}>All enrolled students</div>
  </div>

  <div
    className={styles.kpi}
    style={{ borderLeft: '3px solid #10b981' }} // Green
  >
    <div className={styles.kpiValue}>
      {interestStats.Interested}
    </div>
    <div className={styles.kpiLabel}>Interested</div>
    <div className={styles.kpiHint}>Ready to join</div>
  </div>

  <div
    className={styles.kpi}
    style={{ borderLeft: '3px solid #ef4444' }} // Red
  >
    <div className={styles.kpiValue}>
      {interestStats['Not Interested']}
    </div>
    <div className={styles.kpiLabel}>Not Interested</div>
    <div className={styles.kpiHint}>No follow-up needed</div>
  </div>

  <div
    className={styles.kpi}
    style={{ borderLeft: '3px solid #f59e0b' }} // Amber
  >
    <div className={styles.kpiValue}>
      {interestStats['Call Back Later']}
    </div>
    <div className={styles.kpiLabel}>Call Back Later</div>
    <div className={styles.kpiHint}>Follow-up pending</div>
  </div>

  <div
    className={styles.kpi}
    style={{ borderLeft: '3px solid #3b82f6' }} // Blue
  >
    <div className={styles.kpiValue}>
      {interestStats['Not Reachable']}
    </div>
    <div className={styles.kpiLabel}>Not Reachable</div>
    <div className={styles.kpiHint}>Try again later</div>
  </div>

  <div
    className={styles.kpi}
    style={{ borderLeft: '3px solid #6b7280' }} // Gray
  >
    <div className={styles.kpiValue}>
      {interestStats['Not Set']}
    </div>
    <div className={styles.kpiLabel}>Not Set</div>
    
    <div className={styles.kpiHint}>Needs first call</div>
  </div>

  {interestStats.Other > 0 && (
    <div
      className={styles.kpi}
      style={{ borderLeft: '3px solid #8b5cf6' }} // Violet
    >
      <div className={styles.kpiValue}>
        {interestStats.Other}
      </div>
      <div className={styles.kpiLabel}>Other</div>
      
      <div className={styles.kpiHint}>New categories</div>
    </div>
  )}
</section>

            <section className={styles.grid}>
              {/* Quick Actions */}
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Quick Actions</div>
                    <div className={styles.cardSub}>Frequently used HR workflows</div>
                  </div>
                </div>

                <div className={styles.quickGrid}>
                  <Link href="/hr/students" className={styles.quick}>
                    <div className={styles.quickIcon}>👥</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>View Students</div>
                      <div className={styles.quickSub}>Browse, filter and open profiles</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </Link>

                  <button
                    className={styles.quick}
                    type="button"
                    onClick={() => alert('Hook this to Enrollment Requests later')}
                  >
                    <div className={styles.quickIcon}>📝</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>Enrollment Requests</div>
                      <div className={styles.quickSub}>Review new enrollment applications</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </button>

                  <button
                    className={styles.quick}
                    type="button"
                    onClick={() => alert('Hook this to Contact Inquiries later')}
                  >
                    <div className={styles.quickIcon}>📩</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>Contact Inquiries</div>
                      <div className={styles.quickSub}>View messages submitted by users</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </button>

                  <button
                    className={styles.quick}
                    type="button"
                    onClick={() => alert('Hook this to Reports later')}
                  >
                    <div className={styles.quickIcon}>📊</div>
                    <div className={styles.quickText}>
                      <div className={styles.quickTitle}>Reports</div>
                      <div className={styles.quickSub}>Export or view performance summaries</div>
                    </div>
                    <div className={styles.chev}>→</div>
                  </button>
                </div>
              </section>

              {/* Recent Students */}
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Recent Students</div>
                    <div className={styles.cardSub}>Latest joined / updated profiles</div>
                  </div>

                  <Link className={styles.link} href="/hr/students">
                    View all
                  </Link>
                </div>

                <div className={styles.list}>
                  {recent.length ? (
                    recent.map((s) => {
                      const st = normalizeStatus(s.status);
                      return (
                        <Link
                          key={String(s.id)}
                          href={`/hr/students/${s.id}`}
                          className={styles.row}
                        >
                          <div className={styles.avatar}>
                            {(s.name?.[0] || 'S').toUpperCase()}
                          </div>

                          <div className={styles.rowMid}>
                            <div className={styles.rowTitle}>{s.name}</div>
                            <div className={styles.rowSub}>
                              {(s.course || '—')} • {s.email}
                            </div>
                          </div>

                          <span className={`${styles.pill} ${st === 'Active' ? styles.ok : styles.bad}`}>
                            {st}
                          </span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className={styles.empty}>No students found for this college.</div>
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