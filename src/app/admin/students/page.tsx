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
  const [interestFilter, setInterestFilter] = useState('');
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
    return students.filter((s) => {
      const matchQuery = !q || [s.name, s.email, s.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
      const matchInterest = !interestFilter || label === interestFilter;
      return matchQuery && matchInterest;
    });
  }, [students, query, interestFilter]);

  const interestStats = useMemo(() => computeInterestStats(filtered), [filtered]);

  const kpis = [
    { label: 'Total', value: interestStats.total, hint: 'Shown in list', accent: '#378ADD' },
    { label: 'Interested', value: interestStats.Interested, hint: 'Ready to join', accent: '#639922' },
    { label: 'Not Interested', value: interestStats['Not Interested'], hint: 'No follow-up', accent: '#E24B4A' },
    { label: 'Call Back Later', value: interestStats['Call Back Later'], hint: 'Follow-up pending', accent: '#EF9F27' },
    { label: 'Not Reachable', value: interestStats['Not Reachable'], hint: 'Try again later', accent: '#888780' },
    { label: 'Not Set', value: interestStats['Not Set'], hint: 'Needs first call', accent: '#7F77DD' },
  ];

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className={styles.wrap}>

        {/* ── Topbar ── */}
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <nav className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>Admin</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Students</span>
            </nav>
            <h1 className={styles.pageTitle}>Student Directory</h1>
            <p className={styles.pageSub}>Search, filter and open a student profile</p>
          </div>
          <Link href="/admin/students" className={styles.refreshBtn}>↻ Refresh</Link>
        </header>

        {/* ── KPI Cards ── */}
        <section className={styles.kpis}>
          {kpis.map((k) => (
            <div key={k.label} className={styles.kpi}>
              <div className={styles.kpiAccent} style={{ background: k.accent }} />
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={styles.kpiVal}>{k.value}</div>
              <div className={styles.kpiHint}>{k.hint}</div>
            </div>
          ))}
        </section>

        {/* ── Filters ── */}
        <section className={styles.filters}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              placeholder="Search by name, email, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
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

          <select
            className={styles.filterSelect}
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Interested">Interested</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Call Back Later">Call Back Later</option>
            <option value="Not Reachable">Not Reachable</option>
            <option value="Not Set">Not Set</option>
          </select>

          {(selectedCollegeID || interestFilter) && (
            <button
              className={styles.clearBtn}
              type="button"
              onClick={() => {
                setSelectedCollegeID('');
                setInterestFilter('');
                localStorage.removeItem('college_id');
              }}
            >
              Clear filters
            </button>
          )}
        </section>

        {/* ── Table Card ── */}
        <section className={styles.card}>

          {/* Loading skeleton */}
          {loading && (
            <div className={styles.skeletonWrap}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.skRow} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚠</div>
              <div className={styles.emptyTitle}>Could not load students</div>
              <div className={styles.emptyText}>{error}</div>
              <Link href="/login" className={styles.emptyAction}>Go to Login →</Link>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>◎</div>
              <div className={styles.emptyTitle}>No results</div>
              <div className={styles.emptyText}>Try changing search text or filters.</div>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <>
              <div className={styles.resultMeta}>
                <span>Showing <strong>{filtered.length}</strong> student{filtered.length !== 1 ? 's' : ''}</span>
                <span className={styles.metaRight}>
                  {selectedCollegeID && (
                    <span className={styles.activeTag}>
                      {colleges.find(c => String(c.id) === selectedCollegeID)?.college_name ?? 'College'}
                    </span>
                  )}
                  {interestFilter && (
                    <span className={styles.activeTag}>{interestFilter}</span>
                  )}
                </span>
              </div>

              {/* Desktop table */}
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
                      const initials = s.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S';
                      return (
                        <tr key={String(s.id)}>
                          <td>
                            <div className={styles.studentCell}>
                              <div className={`${styles.avatar} ${styles[`avatar${initials[0]}`] || styles.avatarDefault}`}>
                                {initials}
                              </div>
                              <div>
                                <div className={styles.studentName}>{s.name}</div>
                                <div className={styles.studentSub}>{s.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className={styles.tdMuted}>{s.email}</td>
                          <td className={styles.tdMuted}>{s.phone}</td>
                          <td>
                            <span className={`${styles.pill} ${styles[interestClass(label)]}`}>{label}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link className={styles.actionBtn} href={`/admin/students/${s.id}`}>
                              View →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className={styles.mobileList}>
                {filtered.map((s) => {
                  const label = normalizeInterestLabel(s?.interest?.interest_status?.interest);
                  const initials = s.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S';
                  return (
                    <Link key={String(s.id)} href={`/admin/students/${s.id}`} className={styles.mCard}>
                      <div className={styles.mTop}>
                        <div className={styles.mLeft}>
                          <div className={styles.avatar}>{initials}</div>
                          <div>
                            <div className={styles.studentName}>{s.name}</div>
                            <div className={styles.studentSub}>{s.email}</div>
                          </div>
                        </div>
                        <span className={`${styles.pill} ${styles[interestClass(label)]}`}>{label}</span>
                      </div>
                      <div className={styles.mGrid}>
                        <div><span className={styles.mKey}>Phone</span><span className={styles.mVal}>{s.phone}</span></div>
                        <div><span className={styles.mKey}>Email</span><span className={styles.mVal}>{s.email}</span></div>
                      </div>
                      <div className={styles.mAction}>View Details →</div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}