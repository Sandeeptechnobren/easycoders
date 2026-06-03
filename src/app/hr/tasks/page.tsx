'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import styles from './hrTasks.module.css';

/* /hr/tasks — HR marks students' tasks as completed (roster view + bulk mark). */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const fmtStatus = (s: string) => s.replace(/_/g, ' ');

type Batch = { id: number; name: string };
type Category = { id: number; name: string };
type Task = {
  id: number; title: string; description?: string;
  category?: { id: number; name: string } | null;
  batches?: Batch[]; submissions_count?: number;
};
type RosterStudent = { id: number; name: string; email: string; status: string; notes?: string | null; approved_at?: string | null };

export default function HrTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [task, setTask] = useState<Task | null>(null);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('completed');
  const [statusFilter, setStatusFilter] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([fetchWithAuth(`${BASE}/tasks`), fetchWithAuth(`${BASE}/getTaskCategories`)]);
      setTasks(asArray<Task>(t));
      setCategories(asArray<Category>(c));
    } catch { setTasks([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(t =>
      (!catFilter || String(t.category?.id ?? '') === catFilter) &&
      (!q || t.title.toLowerCase().includes(q) || (t.category?.name || '').toLowerCase().includes(q))
    );
  }, [tasks, query, catFilter]);

  const loadRoster = useCallback(async (taskId: number) => {
    setRosterLoading(true);
    try {
      const r = await fetchWithAuth(`${BASE}/tasks/${taskId}/roster`);
      setRoster((r?.data?.roster ?? []) as RosterStudent[]);
    } catch { setRoster([]); } finally { setRosterLoading(false); }
  }, []);

  const openTask = async (t: Task) => {
    setTask(t); setRoster([]); setSelected(new Set()); setMsg(''); setOk(false); setStatusFilter(''); setBulkStatus('completed');
    loadRoster(t.id);
  };
  const closeTask = () => { setTask(null); load(); };

  const visibleRoster = useMemo(
    () => (statusFilter ? roster.filter(r => r.status === statusFilter) : roster),
    [roster, statusFilter],
  );

  const toggle = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    const ids = visibleRoster.map(r => r.id);
    const allOn = ids.every(id => selected.has(id));
    setSelected(s => { const n = new Set(s); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };

  const markOne = async (studentId: number, status: string) => {
    if (!task) return;
    setBusy(true); setMsg('');
    try {
      await fetchWithAuth(`${BASE}/tasks/${task.id}/students/${studentId}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      setOk(true); setMsg(`Marked as ${status}.`);
      await loadRoster(task.id);
    } catch (e: unknown) { setOk(false); setMsg(e instanceof Error ? e.message : 'Failed.'); } finally { setBusy(false); }
  };

  const markBulk = async (ids: number[]) => {
    if (!task || ids.length === 0) return;
    setBusy(true); setMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/tasks/${task.id}/mark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ student_ids: ids, status: bulkStatus }),
      });
      setOk(true); setMsg((r as { message?: string })?.message || `Marked ${ids.length}.`);
      setSelected(new Set());
      await loadRoster(task.id);
    } catch (e: unknown) { setOk(false); setMsg(e instanceof Error ? e.message : 'Failed.'); } finally { setBusy(false); }
  };

  const done = roster.filter(r => r.status === 'completed' || r.status === 'approved').length;

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.eyebrow}>Easy Coders · HR</div>
            <div className={styles.title}>Mark Tasks</div>
            <div className={styles.sub}>Open a task to see every student it&apos;s assigned to, and mark their work complete — individually or for the whole batch at once.</div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.search}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchIn} placeholder="Search tasks…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className={styles.sel} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading ? (
            <div className={styles.state}>Loading tasks…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.state}><div className={styles.stateTitle}>No tasks found</div>{tasks.length === 0 ? 'No tasks have been created yet.' : 'Try clearing the search or category filter.'}</div>
          ) : (
            <div className={styles.panel}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Task</th><th>Category</th><th>Batches</th><th>Marked</th><th /></tr></thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id}>
                        <td><div className={styles.tName}>{t.title}</div>{t.description && <div className={styles.tDesc}>{t.description}</div>}</td>
                        <td>{t.category?.name ? <span className={styles.catPill}>{t.category.name}</span> : <span className={styles.muted}>—</span>}</td>
                        <td>{(t.batches || []).length ? t.batches!.map(b => <span key={b.id} className={styles.batchChip}>{b.name}</span>) : <span className={styles.muted}>—</span>}</td>
                        <td className={styles.count}>{t.submissions_count ?? 0}</td>
                        <td><button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} onClick={() => openTask(t)}>Grade</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roster / grading modal */}
      {task && (
        <div className={styles.backdrop} onClick={closeTask}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <div>
                <h3 className={styles.mTitle}>{task.title}</h3>
                <div className={styles.mSub}>{task.category?.name ? `${task.category.name} · ` : ''}{done}/{roster.length} marked done</div>
              </div>
              <button className={styles.mClose} onClick={closeTask}>×</button>
            </div>

            <div className={styles.mBar}>
              <label className={styles.uName} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                <input type="checkbox" className={styles.chk}
                  checked={visibleRoster.length > 0 && visibleRoster.every(r => selected.has(r.id))}
                  onChange={toggleAll} /> Select all
              </label>
              <select className={styles.sel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All ({roster.length})</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className={styles.spacer} />
              <select className={styles.sel} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} disabled={busy || selected.size === 0} onClick={() => markBulk(Array.from(selected))}>Mark selected ({selected.size})</button>
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} disabled={busy || roster.length === 0} onClick={() => markBulk(roster.map(r => r.id))}>Mark all</button>
            </div>

            <div className={styles.mBody}>
              {msg && <div className={`${styles.alert} ${ok ? styles.alertOk : styles.alertErr}`}>{msg}</div>}
              {rosterLoading ? (
                <div className={styles.muted} style={{ padding: '16px 0' }}>Loading roster…</div>
              ) : roster.length === 0 ? (
                <div className={styles.muted} style={{ padding: '16px 0' }}>No students are assigned this task yet (assign its category or batch first).</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th /><th>Student</th><th>Status</th><th>Mark as</th></tr></thead>
                    <tbody>
                      {visibleRoster.map(r => (
                        <tr key={r.id}>
                          <td><input type="checkbox" className={styles.chk} checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>
                          <td><div className={styles.uName}>{r.name}</div><div className={styles.uMail}>{r.email}</div></td>
                          <td><span className={`${styles.badge} ${styles[`st_${r.status}`] || styles.st_pending}`}>{fmtStatus(r.status)}</span></td>
                          <td>
                            <select className={`${styles.sel} ${styles.btnSm}`} value="" disabled={busy} onChange={e => { if (e.target.value) markOne(r.id, e.target.value); }}>
                              <option value="">Mark…</option>
                              <option value="completed">Completed</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
