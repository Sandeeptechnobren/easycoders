'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import styles from './students.module.css';
import { useEffect, useMemo, useState } from 'react';

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
  phone: string;
  status: number | string;
  assessments_attempts?: AssessmentAttempt[];
  interest: Interest | null;
};

type College = {
  id: string | number;
  college_name: string;
  address: string;
};

type StudentsListApiResponse = {
  status: string;
  data: Student[];
};

function normalizeStudentStatus(s: Student['status']): 'Active' | 'Inactive' {
  if (s === 1 || s === '1' || s === 'Active') return 'Active';
  return 'Inactive';
}

function normalizeInterestLabel(interest: Student['interest']): string {
  const label = interest?.interest_status?.interest?.trim();
  if (!label) return 'Not Set';
  const l = label.toLowerCase();
  if (l === 'interested') return 'Interested';
  if (l === 'not interest' || l === 'not interested') return 'Not Interested';
  if (l === 'call back later') return 'Call Back Later';
  if (l === 'not reachable') return 'Not Reachable';
  return label;
}

function interestClassName(label: string) {
  switch (label) {
    case 'Interested': return styles.interested;
    case 'Not Interested': return styles.notInterested;
    case 'Call Back Later': return styles.callBackLater;
    case 'Not Reachable': return styles.notReachable;
    default: return styles.notSet;
  }
}

const INTEREST_META: Record<string, { color: string; dot: string }> = {
  'Interested':      { color: '#10b981', dot: '#10b981' },
  'Not Interested':  { color: '#ef4444', dot: '#ef4444' },
  'Call Back Later': { color: '#f59e0b', dot: '#f59e0b' },
  'Not Reachable':   { color: '#6366f1', dot: '#6366f1' },
  'Not Set':         { color: '#94a3b8', dot: '#94a3b8' },
};

export default function HrStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const loading = loadingStudents || loadingColleges;
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [interestFilter, setInterestFilter] = useState<string>('All');
  const [error, setError] = useState('');
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
  const [colleges, setColleges] = useState<College[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Unauthorized');
        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        });
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to load students');
        const json: StudentsListApiResponse = await res.json();
        setStudents(json.data || []);
      } catch (e: any) {
        setStudents([]);
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load students');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [selectedCollegeID]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingColleges(true);
        const res = await fetch('https://api.easycoders.in/projects/backend/public/api/collegeList');
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        setColleges(json.data || []);
      } catch {}
      finally { setLoadingColleges(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s: any) => {
      const interestLabel = normalizeInterestLabel(s.interest);
      const studentStatus = normalizeStudentStatus(s.status);
      const matchesQuery = !q || [s.name, s.email, s.phone, studentStatus, interestLabel].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
      const matchesStatus = status === 'All' || studentStatus === status;
      const matchesInterest = interestFilter === 'All' || interestLabel === interestFilter;
      return matchesQuery && matchesStatus && matchesInterest;
    });
  }, [students, query, status, interestFilter]);

  const interestStats = useMemo(() => {
    const total = students.length;
    const buckets: Record<string, number> = { Interested: 0, 'Not Interested': 0, 'Call Back Later': 0, 'Not Reachable': 0, 'Not Set': 0, Other: 0 };
    for (const s of students) {
      const label = normalizeInterestLabel(s.interest);
      if (label in buckets) buckets[label] += 1;
      else buckets.Other += 1;
    }
    return { total, ...buckets };
  }, [students]);

  const STAT_ITEMS = [
    { key: 'total',            label: 'Total',            color: '#6366f1' },
    { key: 'Interested',       label: 'Interested',       color: '#10b981' },
    { key: 'Not Interested',   label: 'Not Interested',   color: '#ef4444' },
    { key: 'Call Back Later',  label: 'Call Back Later',  color: '#f59e0b' },
    { key: 'Not Reachable',    label: 'Not Reachable',    color: '#3b82f6' },
    { key: 'Not Set',          label: 'Not Set',          color: '#94a3b8' },
  ];

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
                <span className={styles.crumbNow}>Students</span>
              </nav>
              <h1 className={styles.title}>Students Directory</h1>
              <p className={styles.subtitle}>Search, filter, and open a student profile to view complete details.</p>
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
              {STAT_ITEMS.map((item) => (
                <div key={item.key} className={styles.statChip} style={{ '--chip-color': item.color } as React.CSSProperties}>
                  <span className={styles.statDot} style={{ background: item.color }} />
                  <span className={styles.statLabel}>{item.label}</span>
                  <span className={styles.statVal} style={{ color: item.color }}>
                    {item.key === 'total' ? interestStats.total : (interestStats as any)[item.key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── TOOLBAR ── */}
        <div className={styles.toolbar}>
          {/* Search */}
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name, email, phone…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.searchClear} onClick={() => setQuery('')} type="button">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className={styles.filterGroup}>
            <div className={styles.selectWrap}>
              <svg className={styles.selectIcon} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <select
                className={styles.select}
                value={selectedCollegeID}
                onChange={(e) => { setSelectedCollegeID(e.target.value); localStorage.setItem('college_id', e.target.value); }}
              >
                <option value="">All Colleges</option>
                {colleges.map((c) => <option key={String(c.id)} value={String(c.id)}>{c.college_name}</option>)}
              </select>
              <svg className={styles.selectChev} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <div className={styles.selectWrap}>
              <svg className={styles.selectIcon} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <select className={styles.select} value={interestFilter} onChange={(e) => setInterestFilter(e.target.value)}>
                <option value="All">All Interest</option>
                <option value="Interested">Interested</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Call Back Later">Call Back Later</option>
                <option value="Not Reachable">Not Reachable</option>
                <option value="Not Set">Not Set</option>
              </select>
              <svg className={styles.selectChev} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Result count */}
          {!loading && !error && (
            <div className={styles.resultCount}>
              <span className={styles.resultNum}>{filtered.length}</span>
              <span className={styles.resultOf}>/ {students.length} students</span>
            </div>
          )}
        </div>

        {/* ── TABLE CARD ── */}
        <section className={styles.card}>

          {/* Loading */}
          {loading && (
            <div className={styles.skeletonWrap}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skRow} style={{ animationDelay: `${i * 70}ms` }} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={styles.stateBox}>
              <div className={styles.stateIcon} style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className={styles.stateTitle}>Could not load students</div>
              <div className={styles.stateText}>{error}</div>
              <Link href="/login" className={styles.btnPrimary} style={{ marginTop: 16 }}>Go to Login →</Link>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className={styles.stateBox}>
              <div className={styles.stateIcon}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className={styles.stateTitle}>No results found</div>
              <div className={styles.stateText}>Try adjusting your search or filters.</div>
            </div>
          )}

          {/* Table */}
          {!loading && !error && filtered.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Contact</th>
                    <th>Interest</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any, idx: number) => {
                    const interestLabel = normalizeInterestLabel(s.interest);
                    const interestCls = interestClassName(interestLabel);
                    const meta = INTEREST_META[interestLabel] ?? INTEREST_META['Not Set'];

                    return (
                      <tr key={String(s.id)}>
                        <td>
                          <span className={styles.rowNum}>{idx + 1}</span>
                        </td>

                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>
                              {(s.name?.[0] || 'S').toUpperCase()}
                            </div>
                            <div className={styles.studentMeta}>
                              <div className={styles.studentName}>{s.name}</div>
                              <div className={styles.studentSub}>{s.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.contactCell}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ opacity: 0.4, flexShrink: 0 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span className={styles.phoneText}>{s.phone || '—'}</span>
                          </div>
                        </td>

                        <td>
                          <div className={styles.interestCell}>
                            <span className={styles.interestDot} style={{ background: meta.dot }} />
                            <span className={`${styles.pill} ${interestCls}`}>{interestLabel}</span>
                          </div>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <Link className={styles.viewBtn} href={`/hr/students/${s.id}`}>
                            View
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Cards */}
              <div className={styles.mobileList}>
                {filtered.map((s: any) => {
                  const interestLabel = normalizeInterestLabel(s.interest);
                  const interestCls = interestClassName(interestLabel);
                  const meta = INTEREST_META[interestLabel] ?? INTEREST_META['Not Set'];
                  return (
                    <Link key={String(s.id)} href={`/hr/students/${s.id}`} className={styles.mCard}>
                      <div className={styles.mTop}>
                        <div className={styles.mLeft}>
                          <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                          <div>
                            <div className={styles.studentName}>{s.name}</div>
                            <div className={styles.studentSub}>{s.email}</div>
                          </div>
                        </div>
                        <div className={styles.interestCell}>
                          <span className={styles.interestDot} style={{ background: meta.dot }} />
                          <span className={`${styles.pill} ${interestCls}`}>{interestLabel}</span>
                        </div>
                      </div>
                      <div className={styles.mGrid}>
                        <div>
                          <span className={styles.k}>Phone</span>
                          <span className={styles.v}>{s.phone || '—'}</span>
                        </div>
                      </div>
                      <div className={styles.mAction}>
                        View Profile
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
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