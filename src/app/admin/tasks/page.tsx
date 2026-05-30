'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from './tasks.module.css';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/tasks — create tasks and assign them to one or more batches.
 *
 * A task assigned to batches is visible to every student in those batches
 * (GET /student/tasks → scoped via the task_batches pivot). Admin can also
 * drill into a task's submissions and mark/grade them.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null);
const isOverdue = (d?: string | null) => !!d && new Date(d).getTime() < Date.now() - 86400000;

type Batch = { id: number; name: string };
type Category = { id: number; name: string };
type Task = {
  id: number;
  title: string;
  description: string;
  task_type: string;
  difficulty: string;
  priority: string;
  due_date?: string | null;
  expected_output?: string | null;
  category?: { id: number; name: string } | null;
  category_id?: number | null;
  batches?: Batch[];
  submissions_count?: number;
};
type Submission = { id: number; status: string; notes?: string; student?: { id: number; name: string; email: string } };

const TYPES = ['foundation', 'practice', 'evaluation', 'pdp'];
const DIFFS = ['easy', 'medium', 'hard'];
const PRIOS = ['low', 'medium', 'high'];

const EMPTY = { title: '', description: '', category_id: '', task_type: 'practice', difficulty: 'easy', priority: 'medium', due_date: '', expected_output: '', batch_ids: [] as number[] };

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [subTask, setSubTask] = useState<Task | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([fetchWithAuth(`${BASE}/tasks`), fetchWithAuth(`${BASE}/getTaskCategories`)]);
      setTasks(asArray<Task>(t));
      setCategories(asArray<Category>(c));
    } catch { /* surfaced by empty state */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    fetchWithAuth(`${BASE}/batches`).then(r => setBatches(asArray<Batch>(r))).catch(() => setBatches([]));
  }, [load]);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setMsg(''); setShowModal(true); };
  const openEdit = (t: Task) => {
    setEditId(t.id);
    setForm({
      title: t.title, description: t.description,
      category_id: t.category?.id ? String(t.category.id) : (t.category_id ? String(t.category_id) : ''),
      task_type: t.task_type || 'practice', difficulty: t.difficulty || 'easy', priority: t.priority || 'medium',
      due_date: t.due_date ? String(t.due_date).slice(0, 10) : '',
      expected_output: t.expected_output || '',
      batch_ids: (t.batches || []).map(b => b.id),
    });
    setMsg(''); setShowModal(true);
  };
  const toggleBatch = (id: number) =>
    setForm(f => ({ ...f, batch_ids: f.batch_ids.includes(id) ? f.batch_ids.filter(b => b !== id) : [...f.batch_ids, id] }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_ids.length) { setMsg('Assign the task to at least one batch.'); return; }
    setSaving(true); setMsg('');
    try {
      const payload = {
        title: form.title, description: form.description,
        category_id: form.category_id ? Number(form.category_id) : null,
        task_type: form.task_type, difficulty: form.difficulty, priority: form.priority,
        due_date: form.due_date || null, expected_output: form.expected_output || null,
        batch_ids: form.batch_ids,
      };
      await fetchWithAuth(`${BASE}/tasks${editId ? `/${editId}` : ''}`, {
        method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      setShowModal(false);
      load();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed to save task.'); } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this task? It will disappear from all assigned batches.')) return;
    try { await fetchWithAuth(`${BASE}/tasks/${id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
  };

  const openSubs = async (t: Task) => {
    setSubTask(t); setSubs([]); setSubsLoading(true);
    try { const r = await fetchWithAuth(`${BASE}/tasks/${t.id}/submissions`); setSubs(asArray<Submission>(r)); }
    catch { setSubs([]); } finally { setSubsLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(t =>
      (!typeFilter || t.task_type === typeFilter) &&
      (!q || t.title.toLowerCase().includes(q) || (t.category?.name || '').toLowerCase().includes(q))
    );
  }, [tasks, query, typeFilter]);

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Operations"
        title="Tasks"
        description="Create tasks and assign them to one or more batches. Assigned tasks show up for every student in those batches."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Tasks' },
        ]}
      >
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchIn} placeholder="Search by title or category…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className={styles.filterSel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
          <div className={styles.spacer} />
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>+ New Task</button>
        </div>

        {loading ? (
          <div className={styles.state}>Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateTitle}>{tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}</div>
            {tasks.length === 0 ? 'Create a task and assign it to batches to get started.' : 'Try clearing the search or type filter.'}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(t => {
              const due = fmtDate(t.due_date);
              return (
                <div key={t.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <h3 className={styles.title}>{t.title}</h3>
                    <span className={styles.subCount} title="Submissions">{t.submissions_count ?? 0}</span>
                  </div>
                  {t.category?.name && <div className={styles.cat}>{t.category.name}</div>}
                  <div className={styles.desc}>{t.description}</div>
                  <div className={styles.tags}>
                    <span className={`${styles.badge} ${styles.bType}`}>{t.task_type}</span>
                    <span className={`${styles.badge} ${styles[`bDiff_${t.difficulty}`] || ''}`}>{t.difficulty}</span>
                    <span className={`${styles.badge} ${styles.bPrio}`}>{t.priority} priority</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Batches:</span>
                    {(t.batches || []).length
                      ? <span className={styles.batchChips}>{t.batches!.map(b => <span key={b.id} className={styles.batchChip}>{b.name}</span>)}</span>
                      : <span style={{ color: '#94A3B8' }}>none</span>}
                  </div>
                  {due && <div className={`${styles.due} ${isOverdue(t.due_date) ? styles.overdue : ''}`}>Due {due}{isOverdue(t.due_date) ? ' · overdue' : ''}</div>}
                  <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => openSubs(t)}>Submissions ({t.submissions_count ?? 0})</button>
                    <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => openEdit(t)}>Edit</button>
                    <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => remove(t.id)}>Delete</button>
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
              <h2 className={styles.mTitle}>{editId ? 'Edit Task' : 'New Task'}</h2>
              <button className={styles.mClose} onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={save}>
              <div className={styles.mBody}>
                {msg && <div className={`${styles.alert} ${styles.alertErr}`}>{msg}</div>}
                <div className={styles.fGrid}>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Title<span className={styles.req}> *</span></label>
                    <input className={styles.fIn} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Build a REST API for the blog module" />
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Description<span className={styles.req}> *</span></label>
                    <textarea className={styles.fIn} required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What should the student build / submit?" />
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Category</label>
                    <select className={styles.fIn} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                      <option value="">— None —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Type<span className={styles.req}> *</span></label>
                    <select className={styles.fIn} value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                      {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Difficulty</label>
                    <select className={styles.fIn} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                      {DIFFS.map(d => <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Priority</label>
                    <select className={styles.fIn} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      {PRIOS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                    </select>
                  </div>
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Due date</label>
                    <input type="date" className={styles.fIn} value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Expected output</label>
                    <textarea className={styles.fIn} rows={2} value={form.expected_output} onChange={e => setForm(f => ({ ...f, expected_output: e.target.value }))} placeholder="Optional — what a correct submission looks like" />
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Assign to batches<span className={styles.req}> *</span></label>
                    <div className={styles.chips}>
                      {batches.map(b => (
                        <button type="button" key={b.id} className={`${styles.chip} ${form.batch_ids.includes(b.id) ? styles.on : ''}`} onClick={() => toggleBatch(b.id)}>
                          {form.batch_ids.includes(b.id) ? '✓ ' : ''}{b.name}
                        </button>
                      ))}
                      {batches.length === 0 && <span style={{ color: '#94A3B8', fontSize: 13 }}>No batches yet — create one first.</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.mFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>{saving ? 'Saving…' : editId ? 'Save changes' : 'Create task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submissions modal ── */}
      {subTask && (
        <div className={styles.backdrop} onClick={() => setSubTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>Submissions · {subTask.title}</h2>
              <button className={styles.mClose} onClick={() => setSubTask(null)} aria-label="Close">✕</button>
            </div>
            <div className={styles.mBody}>
              {subsLoading ? (
                <div style={{ color: '#94A3B8', fontSize: 13, padding: '12px 0' }}>Loading submissions…</div>
              ) : subs.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, padding: '12px 0' }}>No submissions yet. Trainers mark completion from the Trainer → Tasks screen.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.subTable}>
                    <thead><tr><th>Student</th><th>Status</th><th>Notes</th></tr></thead>
                    <tbody>
                      {subs.map(s => (
                        <tr key={s.id}>
                          <td><div className={styles.uName}>{s.student?.name || '—'}</div><div className={styles.uMail}>{s.student?.email}</div></td>
                          <td><span className={`${styles.badge} ${styles[`enr_${s.status}`] || ''}`}>{s.status}</span></td>
                          <td style={{ color: '#4A5568' }}>{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={styles.mFooter}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSubTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
