'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './studentDirectory.module.css';
import { fetchWithAuth } from '@/lib/api';
import { useFeeVisibility, maskAmount, FeeToggle } from '@/lib/feeMask';

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
  batches?: { id: number; name: string; status?: string | null }[];
  total_fee?: number;
  paid_amount?: number;
  due_amount?: number;
  enrollment_status?: string | null;
  course_id?: number | null;
  course_title?: string | null;
  course_type?: string | null;
  enrollment_year?: number | null;
  created_at?: string;
};

type College = { id: string | number; college_name: string };

function isActive(s: Student['status']): boolean {
  return s === 1 || s === '1' || String(s ?? '').toLowerCase() === 'active';
}

type Props = {
  crumbs: Crumb[];
  /** Detail links go to `${detailBase}/${id}`. */
  detailBase: string;
  /** Show the "+ Admit a Student" action (admin only). */
  showAdmit?: boolean;
  /** Allow removing a student from a batch (admin/HR with manage_batches). */
  canManage?: boolean;
};

export default function StudentDirectory({ crumbs, detailBase, showAdmit = false, canManage = true }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const loading = loadingStudents || loadingColleges;

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [error, setError] = useState('');
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [feesVisible] = useFeeVisibility();
  const inr = (n: number | undefined | null) => maskAmount(n, feesVisible);

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

  const loadStudents = useCallback(async () => {
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
  }, [selectedCollegeID]);
  useEffect(() => { loadStudents(); }, [loadStudents]);

  // Remove a student from one of their batches (key = `${studentId}:${batchId}`).
  const [removing, setRemoving] = useState<string | null>(null);
  const removeFromBatch = async (studentId: number | string, batchId: number, batchName: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from "${batchName}"? They stay enrolled as a student and keep their other batches.`)) return;
    const key = `${studentId}:${batchId}`;
    setRemoving(key);
    try {
      await fetchWithAuth(`${BASE}/batches/${batchId}/students/${studentId}`, { method: 'DELETE' });
      await loadStudents();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not remove the student from the batch.');
    } finally {
      setRemoving(null);
    }
  };

  // Filter options derived from the loaded roster (kept in sync with the data,
  // so an empty category or year never shows up as a dead dropdown entry).
  const yearOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.enrollment_year).filter((y): y is number => !!y)))
      .sort((a, b) => b - a),
    [students],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(students.map((s) => s.course_type).filter((t): t is string => !!t)))
      .sort((a, b) => a.localeCompare(b)),
    [students],
  );

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
      const matchYear = yearFilter === 'All' || String(s.enrollment_year ?? '') === yearFilter;
      const matchType = typeFilter === 'All' || (s.course_type ?? '') === typeFilter;
      return matchQuery && matchStatus && matchYear && matchType;
    });
  }, [students, query, statusFilter, yearFilter, typeFilter]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FeeToggle />
          {showAdmit && <Link href="/admin/admissions" className={styles.refreshBtn}>+ Admit a Student</Link>}
        </div>
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Course Types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="All">All Years</option>
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
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

        {(selectedCollegeID || statusFilter !== 'All' || typeFilter !== 'All' || yearFilter !== 'All') && (
          <button
            className={styles.clearBtn}
            type="button"
            onClick={() => {
              setSelectedCollegeID('');
              setStatusFilter('All');
              setTypeFilter('All');
              setYearFilter('All');
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
                {typeFilter !== 'All' && <span className={styles.activeTag}>{typeFilter}</span>}
                {yearFilter !== 'All' && <span className={styles.activeTag}>{yearFilter}</span>}
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
                    <th>Type</th>
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
                          {s.course_type
                            ? <span className={styles.typePill} title={s.course_title || undefined}>{s.course_type}</span>
                            : '—'}
                        </td>
                        <td className={styles.tdMuted}>
                          {(s.batches && s.batches.length > 0) ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {s.batches.map((b) => (
                                <span key={b.id} className={`${styles.pill} ${styles.neutral}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  {b.name}
                                  {canManage && (
                                    <button
                                      type="button"
                                      title={`Remove from ${b.name}`}
                                      aria-label={`Remove ${s.name} from ${b.name}`}
                                      onClick={() => removeFromBatch(s.id, b.id, b.name, s.name)}
                                      disabled={removing === `${s.id}:${b.id}`}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#b91c1c', fontWeight: 800, lineHeight: 1, padding: '0 0 0 2px', fontSize: 14 }}
                                    >
                                      {removing === `${s.id}:${b.id}` ? '…' : '×'}
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : (s.batch ? <span className={`${styles.pill} ${styles.neutral}`}>{s.batch}</span> : '—')}
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
                      <div><span className={styles.mKey}>Type</span><span className={styles.mVal}>{s.course_type || '—'}</span></div>
                      <div><span className={styles.mKey}>Batch</span><span className={styles.mVal}>{(s.batches && s.batches.length) ? s.batches.map((b) => b.name).join(', ') : (s.batch || '—')}</span></div>
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
