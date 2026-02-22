'use client';
import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './hr-home.module.css';
type Student = {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  status: 'Active' | 'Inactive' | string | number;
  score?: number;
  joinedAt?: string;
  created_at?: string;
};
type College = {
  id: string | number;
  college_name: string;
  address?: string;
};
function normalizeStatus(s: Student['status']): 'Active' | 'Inactive' {
  if (s === 'Active' || s === 1 || s === '1') return 'Active';
  return 'Inactive';
}
function getJoinedDate(s: Student): string {
  return s.joinedAt || (s as any).created_at || '';
}
export default function HrHomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>();
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);
  useEffect(()=>{
    setUserData(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
  })
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
      } catch (e) {
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
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Unauthorized');
        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID
            ? `?college_id=${encodeURIComponent(selectedCollegeID)}`
            : '');
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
        const json = await res.json();
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
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => normalizeStatus(s.status) === 'Active').length;
    const inactive = total - active;
    const scores = students.map((s) => Number(s.score ?? 0)).filter((n) => Number.isFinite(n));
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    return { total, active, inactive, avgScore };
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
  const greeting = (() => {
      const h = new Date().getHours(); // user local time
      if (h < 12) return 'Good morning';
      if (h < 17) return 'Good afternoon';
      return 'Good evening';
    })();
  return (
    <RoleGuard allowedRoles={[2]}>
      <div className={styles.wrap}>
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
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Total Students</div>
                <div className={styles.kpiValue}>{stats.total}</div>
                <div className={styles.kpiHint}>All enrolled students</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Active</div>
                <div className={styles.kpiValue}>{stats.active}</div>
                <div className={styles.kpiHint}>Currently learning</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Inactive</div>
                <div className={styles.kpiValue}>{stats.inactive}</div>
                <div className={styles.kpiHint}>Needs follow-up</div>
              </div>
              <div className={styles.kpi}>
                <div className={styles.kpiLabel}>Avg Score</div>
                <div className={styles.kpiValue}>{stats.avgScore}</div>
                <div className={styles.kpiHint}>Across available scores</div>
              </div>
            </section>
            <section className={styles.grid}>
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
                        <Link key={String(s.id)} href={`/hr/students/${s.id}`} className={styles.row}>
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