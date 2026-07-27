'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from './batches.module.css';

const BASE = 'https://api.easycoders.in/api';

/** Unwrap bare array / {data:[]} / Laravel paginator {data:{data:[]}}. */
function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const courseLabel = (c?: { name?: string; title?: string } | null) => c?.title ?? c?.name ?? '';

type Batch = {
  id: number;
  name: string;
  course?: { id: number; name?: string; title?: string };
  course_id?: number;
  start_date: string;
  end_date: string;
  status: string;
  derived_status?: string;
  description?: string;
  max_students?: number | null;
  trainers?: { id: number; name: string }[];
  students_count?: number;
};
type Course = { id: number; name?: string; title?: string };
type User = { id: number; name: string; email: string; role: string };

const STATUS_OPTS = ['upcoming', 'active', 'completed', 'cancelled'];
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '', course_id: '', start_date: '', end_date: '',
    status: 'upcoming', max_students: '', description: '', trainer_ids: [] as number[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, courseRes] = await Promise.all([
        fetchWithAuth(`${BASE}/batches`),
        fetchWithAuth(`${BASE}/courses`),
      ]);
      setBatches(asArray<Batch>(batchRes));   // /batches is paginated → .data.data
      setCourses(asArray<Course>(courseRes));
    } catch { /* surfaced by empty state */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const ensureTrainers = async () => {
    if (trainers.length) return;
    const res = await fetchWithAuth(`${BASE}/commanAPIs/users?role=trainer`).catch(() => ({ data: [] }));
    setTrainers(asArray<User>(res));
  };

  const openCreate = async () => {
    setEditBatch(null);
    setForm({ name: '', course_id: '', start_date: '', end_date: '', status: 'upcoming', max_students: '', description: '', trainer_ids: [] });
    setMsg('');
    await ensureTrainers();
    setShowModal(true);
  };

  const openEdit = async (b: Batch) => {
    setEditBatch(b);
    setForm({
      name: b.name,
      course_id: String(b.course?.id || b.course_id || ''),
      start_date: b.start_date?.slice(0, 10) || '',
      end_date: b.end_date?.slice(0, 10) || '',
      status: b.status,
      max_students: b.max_students != null ? String(b.max_students) : '',
      description: b.description || '',
      trainer_ids: (b.trainers || []).map(t => t.id),
    });
    setMsg('');
    await ensureTrainers();
    setShowModal(true);
  };

  const toggleTrainer = (id: number) =>
    setForm(f => ({ ...f, trainer_ids: f.trainer_ids.includes(id) ? f.trainer_ids.filter(t => t !== id) : [...f.trainer_ids, id] }));

  const saveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = {
        name: form.name,
        course_id: form.course_id ? Number(form.course_id) : undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        status: form.status,
        max_students: form.max_students ? Number(form.max_students) : null,
        description: form.description || null,
        trainer_ids: form.trainer_ids,
      };
      await fetchWithAuth(`${BASE}/batches${editBatch ? `/${editBatch.id}` : ''}`, {
        method: editBatch ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      load();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed to save batch.'); } finally { setSaving(false); }
  };

  const deleteBatch = async (id: number) => {
    if (!confirm('Delete this batch? Enrolled students will be unlinked.')) return;
    try { await fetchWithAuth(`${BASE}/batches/${id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  const applyDerived = async (b: Batch) => {
    try {
      await fetchWithAuth(`${BASE}/batches/${b.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: b.derived_status }),
      });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not update status.'); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return batches.filter(b =>
      (!statusFilter || b.status === statusFilter) &&
      (!q || b.name.toLowerCase().includes(q) || courseLabel(b.course).toLowerCase().includes(q))
    );
  }, [batches, query, statusFilter]);

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <AdminSection
        eyebrow="Easy Coders · Operations"
        title="Batches"
        description="Create training batches, assign trainers, manage capacity and enrol students into cohorts."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Batches' },
        ]}
      >
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchIn} placeholder="Search by batch or course…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className={styles.filterSel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
          <div className={styles.spacer} />
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>+ New Batch</button>
        </div>

        {loading ? (
          <div className={styles.state}>Loading batches…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>{batches.length === 0 ? 'No batches yet' : 'No batches match your filters'}</div>
            <div>{batches.length === 0 ? 'Create your first batch to start enrolling students.' : 'Try clearing the search or status filter.'}</div>
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(b => {
              const cap = b.max_students ?? null;
              const count = b.students_count ?? 0;
              const pct = cap ? Math.min(100, Math.round((count / cap) * 100)) : 0;
              const showHint = b.derived_status && b.derived_status !== b.status && b.status !== 'cancelled';
              return (
                <div key={b.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <h3 className={styles.batchName}>{b.name}</h3>
                    <span className={`${styles.badge} ${styles[`st_${b.status}`] || ''}`}>{b.status}</span>
                  </div>
                  {showHint && (
                    <div className={styles.derivedHint}>
                      ⓘ By dates this is <strong style={{ marginLeft: 3, marginRight: 3 }}>{b.derived_status}</strong>
                      <button className={styles.derivedApply} onClick={() => applyDerived(b)}>set {b.derived_status}</button>
                    </div>
                  )}
                  <div className={styles.meta}>
                    <div className={styles.metaRow}><span className={styles.metaKey}>Course</span> {courseLabel(b.course) || '—'}</div>
                    <div className={styles.metaRow}><span className={styles.metaKey}>Dates</span> {fmtDate(b.start_date)} → {fmtDate(b.end_date)}</div>
                  </div>
                  <div className={styles.cap}>
                    <div className={styles.capLabel}>
                      <span>Enrolment</span>
                      <span><strong>{count}</strong>{cap ? ` / ${cap}` : ' (no cap)'}</span>
                    </div>
                    {cap != null && (
                      <div className={styles.capBar}><div className={`${styles.capFill} ${count >= cap ? styles.full : ''}`} style={{ width: `${pct}%` }} /></div>
                    )}
                  </div>
                  <div className={styles.trainers}>
                    <span className={styles.metaKey} style={{ fontSize: 12, marginRight: 6 }}>Trainers</span>
                    {(b.trainers || []).length ? b.trainers!.map(t => t.name).join(', ') : <span className="none">Unassigned</span>}
                  </div>
                  <div className={styles.actions}>
                    <Link className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} href={`/admin/batches/${b.id}`}>Manage roster →</Link>
                    <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => openEdit(b)}>Edit</button>
                    <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => deleteBatch(b.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminSection>

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div className={styles.backdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>{editBatch ? 'Edit Batch' : 'Create Batch'}</h2>
              <button className={styles.mClose} onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={saveBatch}>
              <div className={styles.mBody}>
                {msg && <div className={`${styles.alert} ${styles.alertErr}`}>{msg}</div>}
                <div className={styles.fGrid}>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Batch name<span className={styles.req}> *</span></label>
                    <input className={styles.fIn} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Full-Stack Cohort — Jun 2026" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Course<span className={styles.req}> *</span></label>
                    <select className={styles.fIn} required value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}>
                      <option value="">— Select course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{courseLabel(c)}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Status</label>
                    <select className={styles.fIn} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUS_OPTS.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Start date<span className={styles.req}> *</span></label>
                    <input type="date" className={styles.fIn} required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>End date<span className={styles.req}> *</span></label>
                    <input type="date" className={styles.fIn} required value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Capacity (max students)</label>
                    <input type="number" min={1} className={styles.fIn} value={form.max_students} placeholder="Leave blank for no cap" onChange={e => setForm(f => ({ ...f, max_students: e.target.value }))} />
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Trainers</label>
                    <div className={styles.chips}>
                      {trainers.map(t => (
                        <button type="button" key={t.id} className={`${styles.chip} ${form.trainer_ids.includes(t.id) ? styles.on : ''}`} onClick={() => toggleTrainer(t.id)}>
                          {form.trainer_ids.includes(t.id) ? '✓ ' : ''}{t.name}
                        </button>
                      ))}
                      {trainers.length === 0 && <span style={{ color: '#94A3B8', fontSize: 13 }}>No trainers found.</span>}
                    </div>
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Description</label>
                    <textarea className={styles.fIn} rows={2} value={form.description} placeholder="Optional notes about this batch" onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className={styles.mFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{saving ? 'Saving…' : editBatch ? 'Save changes' : 'Create batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
