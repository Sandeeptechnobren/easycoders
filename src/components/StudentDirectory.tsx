'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './studentDirectory.module.css';
import { fetchWithAuth } from '@/lib/api';

/* ──────────────────────────────────────────────────────────────────────────
 * <StudentDirectory> — enrolled-students roster (users.role=3).
 *
 * Shared by the admin and HR Students pages. Calls GET /admin/students and
 * renders real students with a fee summary. (Assessment-takers + their
 * interest/lead status live under Easy Assess → Assessment Users now.)
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Crumb = { label: string; href?: string };

type Student = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  status: number | string;
  enrolment_id?: string | null;
  batch?: string | null;
  total_fee?: number;
  paid_amount?: number;
  due_amount?: number;
  enrollment_status?: string | null;
  created_at?: string;
};

type College = { id: string | number; college_name: string };

function isActive(s: Student['status']): boolean {
  return s === 1 || s === '1' || String(s ?? '').toLowerCase() === 'active';
}

const inr = (n: number | undefined | null) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

type Props = {
  crumbs: Crumb[];
  /** Detail links go to `${detailBase}/${id}`. */
  detailBase: string;
  /** Show the "+ Admit a Student" action (admin only). */
  showAdmit?: boolean;
};

export default function StudentDirectory({ crumbs, detailBase, showAdmit = false }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const loading = loadingStudents || loadingColleges;

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
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
        const res = await fetch(`${BASE}/collegeList`);
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
        const url = `${BASE}/admin/students` +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');
        const json = await fetchWithAuth(url);
        setStudents(json.data || []);
      } catch (e: unknown) {
        setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load students');
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
      const matchQuery = !q || [s.name, s.email, s.phone, s.enrolment_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
      const active = isActive(s.status);
      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && active) ||
        (statusFilter === 'Inactive' && !active);
      return matchQuery && matchStatus;
    });
  }, [students, query, statusFilter]);

  const kpis = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => isActive(s.status)).length;
    const withDues = students.filter((s) => Number(s.due_amount ?? 0) > 0).length;
    const fullyPaid = students.filter((s) => Number(s.total_fee ?? 0) > 0 && Number(s.due_amount ?? 0) <= 0).length;
    return [
      { label: 'Total', value: total, hint: 'Enrolled students', accent: '#185fa5' },
      { label: 'Active', value: active, hint: 'Currently active', accent: '#639922' },
      { label: 'Inactive', value: total - active, hint: 'Not active', accent: '#888780' },
      { label: 'With Dues', value: withDues, hint: 'Fees outstanding', accent: '#E24B4A' },
      { label: 'Fully Paid', value: fullyPaid, hint: 'Cleared in full', accent: '#EF9F27' },
    ];
  }, [students]);

  return (
    <div className={styles.wrap}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <nav className={styles.crumbs}>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <span key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {c.href && !last
                    ? <Link href={c.href} className={styles.crumbLink}>{c.label}</Link>
                    : <span className={styles.crumbNow}>{c.label}</span>}
                  {!last && <span className={styles.crumbSep}>/</span>}
                </span>
              );
            })}
          </nav>
          <h1 className={styles.pageTitle}>Student Directory</h1>
          <p className={styles.pageSub}>Enrolled students — fees, attendance and login credentials</p>
        </div>
        {showAdmit && <Link href="/admin/admissions" className={styles.refreshBtn}>+ Admit a Student</Link>}
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
            placeholder="Search by name, email, phone, enrolment ID..."
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {(selectedCollegeID || statusFilter !== 'All') && (
          <button
            className={styles.clearBtn}
            type="button"
            onClick={() => {
              setSelectedCollegeID('');
              setStatusFilter('All');
              localStorage.removeItem('college_id');
            }}
          >
            Clear filters
          </button>
        )}
      </section>

      {/* ── Table Card ── */}
      <section className={styles.card}>

        {loading && (
          <div className={styles.skeletonWrap}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.skRow} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠</div>
            <div className={styles.emptyTitle}>Could not load students</div>
            <div className={styles.emptyText}>{error}</div>
            <Link href="/login" className={styles.emptyAction}>Go to Login →</Link>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>◎</div>
            <div className={styles.emptyTitle}>No enrolled students yet</div>
            <div className={styles.emptyText}>Admit a student to add them to the roster.</div>
            {showAdmit && <Link href="/admin/admissions" className={styles.emptyAction}>Admit a Student →</Link>}
          </div>
        )}

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
                {statusFilter !== 'All' && <span className={styles.activeTag}>{statusFilter}</span>}
              </span>
            </div>

            {/* Desktop table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Enrolment ID</th>
                    <th>Batch</th>
                    <th>Fees Due</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const active = isActive(s.status);
                    const due = Number(s.due_amount ?? 0);
                    const initials = s.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S';
                    return (
                      <tr key={String(s.id)}>
                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>{initials}</div>
                            <div>
                              <div className={styles.studentName}>{s.name}</div>
                              <div className={styles.studentSub}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.tdMuted}>
                          <span style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{s.enrolment_id || '—'}</span>
                        </td>
                        <td className={styles.tdMuted}>
                          {s.batch ? <span className={`${styles.pill} ${styles.neutral}`}>{s.batch}</span> : '—'}
                        </td>
                        <td className={styles.tdMuted}>
                          {due > 0
                            ? <span style={{ color: '#791f1f', fontWeight: 600 }}>{inr(due)}</span>
                            : <span style={{ color: '#27500a', fontWeight: 600 }}>Paid</span>}
                        </td>
                        <td>
                          <span className={`${styles.pill} ${active ? styles.interested : styles.notInterested}`}>
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link className={styles.actionBtn} href={`${detailBase}/${s.id}`}>View →</Link>
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
                const active = isActive(s.status);
                const due = Number(s.due_amount ?? 0);
                const initials = s.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S';
                return (
                  <Link key={String(s.id)} href={`${detailBase}/${s.id}`} className={styles.mCard}>
                    <div className={styles.mTop}>
                      <div className={styles.mLeft}>
                        <div className={styles.avatar}>{initials}</div>
                        <div>
                          <div className={styles.studentName}>{s.name}</div>
                          <div className={styles.studentSub}>{s.email}</div>
                        </div>
                      </div>
                      <span className={`${styles.pill} ${active ? styles.interested : styles.notInterested}`}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className={styles.mGrid}>
                      <div><span className={styles.mKey}>Enrolment</span><span className={styles.mVal}>{s.enrolment_id || '—'}</span></div>
                      <div><span className={styles.mKey}>Batch</span><span className={styles.mVal}>{s.batch || '—'}</span></div>
                      <div><span className={styles.mKey}>Fees Due</span><span className={styles.mVal}>{due > 0 ? inr(due) : 'Paid'}</span></div>
                      <div><span className={styles.mKey}>Phone</span><span className={styles.mVal}>{s.phone || '—'}</span></div>
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
  );
}
