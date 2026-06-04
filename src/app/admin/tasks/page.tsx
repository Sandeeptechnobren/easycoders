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
  expected_output_image?: string | null;
  output_type?: string | null;
  order_no?: number | null;
  category?: { id: number; name: string } | null;
  category_id?: number | null;
  batches?: Batch[];
  submissions_count?: number;
};
type Submission = { id: number; status: string; notes?: string; student?: { id: number; name: string; email: string } };

const TYPES = ['foundation', 'practice', 'evaluation', 'pdp'];
const DIFFS = ['easy', 'medium', 'hard'];
const PRIOS = ['low', 'medium', 'high'];
const OUTPUTS = ['none', 'preview', 'text', 'image'];
const OUTPUT_HINT: Record<string, string> = {
  none: 'No expected-output reference shown to the student.',
  preview: 'Expected output is HTML/CSS/JS — rendered live for the student. Put the reference code below.',
  text: 'Expected output is console / result text — shown in a monospaced block. Put it below.',
  image: 'Upload a screenshot of the expected result.',
};

const EMPTY = { title: '', description: '', category_id: '', task_type: 'practice', difficulty: 'easy', priority: 'medium', due_date: '', expected_output: '', expected_output_image: '', output_type: 'none', order_no: '', batch_ids: [] as number[] };

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

  const [catFilter, setCatFilter] = useState('');
  const [uploading, setUploading] = useState(false);

  // Assign-category-to-batch modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignCat, setAssignCat] = useState('');
  const [assignBatch, setAssignBatch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [assignOk, setAssignOk] = useState(false);

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
    fetchWithAuth(`${BASE}/batches?per_page=200`).then(r => setBatches(asArray<Batch>(r))).catch(() => setBatches([]));
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
      expected_output_image: t.expected_output_image || '',
      output_type: t.output_type || 'none',
      order_no: t.order_no != null ? String(t.order_no) : '',
      batch_ids: (t.batches || []).map(b => b.id),
    });
    setMsg(''); setShowModal(true);
  };
  const toggleBatch = (id: number) =>
    setForm(f => ({ ...f, batch_ids: f.batch_ids.includes(id) ? f.batch_ids.filter(b => b !== id) : [...f.batch_ids, id] }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = {
        title: form.title, description: form.description,
        category_id: form.category_id ? Number(form.category_id) : null,
        task_type: form.task_type, difficulty: form.difficulty, priority: form.priority,
        due_date: form.due_date || null, expected_output: form.expected_output || null,
        expected_output_image: form.expected_output_image || null,
        output_type: form.output_type || 'none',
        order_no: form.order_no === '' ? null : Number(form.order_no),
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

  const uploadImage = async (file: File) => {
    setUploading(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/tasks/upload-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Upload failed.');
      setForm(f => ({ ...f, expected_output_image: json?.data?.url || '', output_type: 'image' }));
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Image upload failed.'); }
    finally { setUploading(false); }
  };

  const openAssign = () => { setAssignCat(''); setAssignBatch(''); setAssignMsg(''); setAssignOk(false); setShowAssign(true); };
  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCat || !assignBatch) { setAssignMsg('Pick a category and a batch.'); setAssignOk(false); return; }
    setAssigning(true); setAssignMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/admin/batches/${assignBatch}/subscribe-category`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_id: Number(assignCat) }),
      });
      setAssignOk(true);
      setAssignMsg((r as { message?: string })?.message || 'Category assigned to the batch.');
    } catch (e: unknown) { setAssignOk(false); setAssignMsg(e instanceof Error ? e.message : 'Could not assign.'); }
    finally { setAssigning(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(t =>
      (!typeFilter || t.task_type === typeFilter) &&
      (!catFilter || String(t.category?.id ?? t.category_id ?? '') === catFilter) &&
      (!q || t.title.toLowerCase().includes(q) || (t.category?.name || '').toLowerCase().includes(q))
    );
  }, [tasks, query, typeFilter, catFilter]);

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
          <select className={styles.filterSel} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className={styles.filterSel} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
          <div className={styles.spacer} />
          <a className={`${styles.btn} ${styles.btnGhost}`} href="/admin/grade-tasks">Grade student tasks →</a>
          <button className={`${styles.btn} ${styles.btnGold}`} onClick={openAssign}>Assign category → Batch</button>
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
                    <label className={styles.fLbl}>Category<span className={styles.req}> *</span></label>
                    <select className={styles.fIn} required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                      <option value="">— Select category —</option>
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
                  <div className={styles.fld}>
                    <label className={styles.fLbl}>Order (within category)</label>
                    <input type="number" min={0} className={styles.fIn} value={form.order_no} onChange={e => setForm(f => ({ ...f, order_no: e.target.value }))} placeholder="1 = simplest" />
                  </div>
                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Expected output</label>
                    <select className={styles.fIn} value={form.output_type} onChange={e => setForm(f => ({ ...f, output_type: e.target.value }))}>
                      <option value="none">None</option>
                      <option value="preview">Live preview (HTML/CSS/JS)</option>
                      <option value="text">Text / console output</option>
                      <option value="image">Uploaded image</option>
                    </select>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>{OUTPUT_HINT[form.output_type]}</div>
                  </div>

                  {form.output_type === 'image' ? (
                    <div className={`${styles.fld} ${styles.full}`}>
                      <label className={styles.fLbl}>Expected output image</label>
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { const fl = e.target.files?.[0]; if (fl) uploadImage(fl); }} />
                      {uploading && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Uploading…</div>}
                      {form.expected_output_image && <img src={form.expected_output_image} alt="expected output" style={{ marginTop: 10, maxWidth: '100%', borderRadius: 8, border: '1px solid #E5E9F2' }} />}
                    </div>
                  ) : form.output_type !== 'none' ? (
                    <div className={`${styles.fld} ${styles.full}`}>
                      <label className={styles.fLbl}>{form.output_type === 'preview' ? 'Reference code (HTML/CSS/JS)' : 'Expected output text'}</label>
                      <textarea className={styles.fIn} rows={form.output_type === 'preview' ? 6 : 4} value={form.expected_output} onChange={e => setForm(f => ({ ...f, expected_output: e.target.value }))} placeholder={form.output_type === 'preview' ? '<div>…the expected rendered HTML…</div>' : 'The exact console / result output'} style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }} />
                      {form.output_type === 'preview' && form.expected_output.trim() !== '' && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, letterSpacing: '.05em' }}>LIVE PREVIEW</div>
                          <iframe title="preview" sandbox="allow-scripts" srcDoc={form.expected_output} style={{ width: '100%', height: 220, border: '1px solid #E5E9F2', borderRadius: 8, background: '#fff' }} />
                        </div>
                      )}
                      {form.output_type === 'text' && form.expected_output.trim() !== '' && (
                        <pre style={{ marginTop: 10, background: '#0B1B3A', color: '#E5E9F2', padding: 12, borderRadius: 8, fontSize: 12.5, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{form.expected_output}</pre>
                      )}
                    </div>
                  ) : null}

                  <div className={`${styles.fld} ${styles.full}`}>
                    <label className={styles.fLbl}>Assign to batches <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional — leave empty for a library task)</span></label>
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

      {/* ── Assign category → batch ── */}
      {showAssign && (
        <div className={styles.backdrop} onClick={() => setShowAssign(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>Assign a category to a batch</h2>
              <button className={styles.mClose} onClick={() => setShowAssign(false)} aria-label="Close">✕</button>
            </div>
            <form onSubmit={submitAssign}>
              <div className={styles.mBody}>
                {assignMsg && <div className={`${styles.alert} ${assignOk ? styles.alertOk || '' : styles.alertErr}`}>{assignMsg}</div>}
                <p style={{ fontSize: 13, color: '#4A5568', marginBottom: 14 }}>
                  Every task in the chosen category becomes visible to that batch&apos;s students, and any new task you later add to the category appears for them automatically. Students are notified.
                </p>
                <div className={styles.fld}>
                  <label className={styles.fLbl}>Category<span className={styles.req}> *</span></label>
                  <select className={styles.fIn} value={assignCat} onChange={e => setAssignCat(e.target.value)}>
                    <option value="">— Select category —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.fld} style={{ marginTop: 12 }}>
                  <label className={styles.fLbl}>Batch<span className={styles.req}> *</span></label>
                  <select className={styles.fIn} value={assignBatch} onChange={e => setAssignBatch(e.target.value)}>
                    <option value="">— Select batch —</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.mFooter}>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowAssign(false)}>Close</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={assigning}>{assigning ? 'Assigning…' : 'Assign to batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
