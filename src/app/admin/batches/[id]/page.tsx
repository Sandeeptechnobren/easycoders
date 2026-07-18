'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from '../batches.module.css';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const courseLabel = (c?: { name?: string; title?: string } | null) => c?.title ?? c?.name ?? '';
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

type Trainer = { id: number; name: string; email?: string; phone?: string };
type RosterStudent = { id: number; name: string; email: string; phone?: string; pivot?: { status: string; joined_at?: string } };
type BatchDetail = {
  id: number; name: string; status: string; derived_status?: string;
  course?: { id: number; title?: string; name?: string };
  start_date: string; end_date: string; description?: string;
  max_students?: number | null; students_count?: number;
  trainers?: Trainer[]; students?: RosterStudent[];
};
type Student = { id: number; name: string; email: string };

export default function BatchRosterPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [addQuery, setAddQuery] = useState('');

  const loadBatch = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const res = await fetchWithAuth(`${BASE}/batches/${encodeURIComponent(id)}`);
      setBatch((res?.data ?? null) as BatchDetail | null);
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load batch.');
      setBatch(null);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadBatch();
    fetchWithAuth(`${BASE}/admin/students`).then(r => setAllStudents(asArray<Student>(r))).catch(() => setAllStudents([]));
  }, [id, loadBatch]);

  const students = useMemo(() => batch?.students ?? [], [batch]);
  const enrolledIds = useMemo(() => new Set(students.map(s => s.id)), [students]);
  const count = batch?.students_count ?? students.length;
  const cap = batch?.max_students ?? null;
  const isFull = cap != null && count >= cap;
  const pct = cap ? Math.min(100, Math.round((count / cap) * 100)) : 0;

  const available = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    return allStudents
      .filter(s => !enrolledIds.has(s.id))
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [allStudents, enrolledIds, addQuery]);

  const addStudent = async (sid: number) => {
    setBusy(true);
    try {
      await fetchWithAuth(`${BASE}/batches/${id}/students`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_ids: [sid] }),
      });
      await loadBatch();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not add student.'); } finally { setBusy(false); }
  };

  const setStatus = async (sid: number, status: string) => {
    setBusy(true);
    try {
      await fetchWithAuth(`${BASE}/batches/${id}/students/${sid}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      await loadBatch();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not update enrolment.'); } finally { setBusy(false); }
  };

  // Mark the whole batch complete: completes every active enrolment and generates
  // a course-completion certificate for each (grade blank, edited per student later).
  const completeBatch = async () => {
    if (!batch) return;
    const n = students.filter(s => (s.pivot?.status || 'active') === 'active').length;
    const ok = confirm(
      `Mark "${batch.name}" as Completed?\n\n` +
      `This marks ${n} active student${n !== 1 ? 's' : ''} as completed and generates a course-completion certificate for each ` +
      `(grade left blank — set it on each student's profile before sharing).\n\nContinue?`
    );
    if (!ok) return;
    setCompleting(true);
    try {
      const res = await fetchWithAuth(`${BASE}/batches/${id}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      const d = (res?.data ?? {}) as { certificates_created?: number; skipped_existing?: number };
      await loadBatch();
      alert(
        `Batch marked complete. ${d.certificates_created ?? 0} certificate${(d.certificates_created ?? 0) !== 1 ? 's' : ''} created` +
        (d.skipped_existing ? `, ${d.skipped_existing} already had one` : '') + '.'
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not complete the batch.');
    } finally { setCompleting(false); }
  };

  const removeStudent = async (sid: number) => {
    if (!confirm('Remove this student from the batch?')) return;
    setBusy(true);
    try {
      await fetchWithAuth(`${BASE}/batches/${id}/students/${sid}`, { method: 'DELETE' });
      await loadBatch();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not remove student.'); } finally { setBusy(false); }
  };

  const showHint = batch && batch.derived_status && batch.derived_status !== batch.status && batch.status !== 'cancelled';

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <AdminSection
        eyebrow="Easy Coders · Operations"
        title={batch?.name || 'Batch roster'}
        description="Manage trainers and the student roster for this batch — enrol, drop, complete or remove students within capacity."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Batches', href: '/admin/batches' },
          { label: 'Roster' },
        ]}
      >
        {loading ? (
          <div className={styles.state}>Loading batch…</div>
        ) : error || !batch ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>Could not load batch</div>
            <div>{error || 'Not found.'}</div>
            <div style={{ marginTop: 14 }}><Link className={styles.backLink} href="/admin/batches">← Back to batches</Link></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.detailHead}>
              <div className={styles.detailTopRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className={`${styles.badge} ${styles[`st_${batch.status}`] || ''}`}>{batch.status}</span>
                  {showHint && (
                    <span className={styles.derivedHint}>ⓘ by dates: <strong style={{ margin: '0 3px' }}>{batch.derived_status}</strong></span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {batch.status !== 'completed' && batch.status !== 'cancelled' && (
                    <button
                      className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`}
                      disabled={completing || busy}
                      onClick={completeBatch}
                    >
                      {completing ? 'Completing…' : '✓ Mark batch as Completed'}
                    </button>
                  )}
                  <Link className={styles.backLink} href="/admin/batches">← All batches</Link>
                </div>
              </div>
              <div className={styles.detailGrid}>
                <div className={styles.dField}><div className={styles.dKey}>Course</div><div className={styles.dVal}>{courseLabel(batch.course) || '—'}</div></div>
                <div className={styles.dField}><div className={styles.dKey}>Starts</div><div className={styles.dVal}>{fmtDate(batch.start_date)}</div></div>
                <div className={styles.dField}><div className={styles.dKey}>Ends</div><div className={styles.dVal}>{fmtDate(batch.end_date)}</div></div>
                <div className={styles.dField}>
                  <div className={styles.dKey}>Enrolment</div>
                  <div className={styles.dVal}>{count}{cap ? ` / ${cap}` : ' (no cap)'}</div>
                </div>
              </div>
              {cap != null && (
                <div className={styles.capBar}><div className={`${styles.capFill} ${isFull ? styles.full : ''}`} style={{ width: `${pct}%` }} /></div>
              )}
              <div>
                <span className={styles.dKey}>Trainers: </span>
                <span className={styles.dVal} style={{ fontSize: 13 }}>
                  {(batch.trainers || []).length ? batch.trainers!.map(t => t.name).join(', ') : <span style={{ color: '#94A3B8' }}>Unassigned — assign from the Edit dialog.</span>}
                </span>
              </div>
              {batch.description && <p style={{ fontSize: 13, color: '#4A5568', margin: 0 }}>{batch.description}</p>}
            </div>

            {/* Roster */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Enrolled students</h2>
                <span className={styles.panelSub}>{students.length} on roster</span>
              </div>
              {students.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, padding: '8px 0' }}>No students enrolled yet. Add some below.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.table}>
                    <thead><tr><th>Student</th><th>Joined</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                    <tbody>
                      {students.map(s => {
                        const st = s.pivot?.status || 'active';
                        return (
                          <tr key={s.id}>
                            <td><div className={styles.uName}>{s.name}</div><div className={styles.uMail}>{s.email}</div></td>
                            <td>{fmtDate(s.pivot?.joined_at)}</td>
                            <td><span className={`${styles.badge} ${styles[`enr_${st}`] || ''}`}>{st}</span></td>
                            <td>
                              <div className={styles.rowActions}>
                                <Link className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} href={`/admin/students/${s.id}`}>Profile</Link>
                                {st !== 'active' && <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={busy} onClick={() => setStatus(s.id, 'active')}>Reactivate</button>}
                                {st === 'active' && <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={busy} onClick={() => setStatus(s.id, 'completed')}>Complete</button>}
                                {st === 'active' && <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={busy} onClick={() => setStatus(s.id, 'dropped')}>Drop</button>}
                                <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} disabled={busy} onClick={() => removeStudent(s.id)}>Remove</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add students */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>Add students</h2>
                <span className={styles.panelSub}>{isFull ? 'Batch is full' : cap ? `${cap - count} seat(s) left` : 'No capacity limit'}</span>
              </div>
              {isFull ? (
                <div style={{ color: '#991B1B', fontSize: 13 }}>This batch has reached its capacity of {cap}. Increase the capacity (Edit batch) or drop/remove a student to free a seat.</div>
              ) : (
                <>
                  <div className={styles.search} style={{ marginBottom: 12, maxWidth: 360 }}>
                    <span className={styles.searchIcon}>⌕</span>
                    <input className={styles.searchIn} placeholder="Search enrolled students…" value={addQuery} onChange={e => setAddQuery(e.target.value)} />
                  </div>
                  {available.length === 0 ? (
                    <div style={{ color: '#94A3B8', fontSize: 13 }}>{addQuery ? 'No matching students.' : 'All students are already in this batch.'}</div>
                  ) : (
                    <div className={styles.addList}>
                      {available.slice(0, 30).map(s => (
                        <div key={s.id} className={styles.addRow}>
                          <div><div className={styles.uName}>{s.name}</div><div className={styles.uMail}>{s.email}</div></div>
                          <button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} disabled={busy} onClick={() => addStudent(s.id)}>+ Add</button>
                        </div>
                      ))}
                      {available.length > 30 && <div style={{ color: '#94A3B8', fontSize: 12, padding: '4px 2px' }}>Showing first 30 — refine your search to find others.</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </AdminSection>
    </RoleGuard>
  );
}
