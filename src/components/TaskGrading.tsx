'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api';
import styles from './TaskGrading.module.css';

/* Shared task-grading flow for HR + admin:
 *   pick a BATCH → pick a STUDENT in it → see + mark that student's TASKS.
 * The page that renders this wraps it in the appropriate <RoleGuard>. */

const BASE = 'https://api.easycoders.in/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  // /batches returns { data: <paginator> } → the array is at data.data.
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
const fmtStatus = (s: string) => s.replace(/_/g, ' ');
const taskStatus = (t: Task) => t.my_submission?.status ?? 'pending';
const isDone = (t: Task) => ['completed', 'approved'].includes(taskStatus(t));

type Student = { id: number; name: string; email: string };
type Batch = { id: number; name: string; students?: Student[]; students_count?: number };
type Category = { id: number; name: string };
type Task = {
  id: number; title: string; difficulty?: string;
  category?: { id: number; name: string } | null;
  my_submission?: { status: string } | null;
};

export default function TaskGrading({ eyebrow = 'Easy Coders · Grading' }: { eyebrow?: string }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [catFilter, setCatFilter] = useState('');

  const [bSearch, setBSearch] = useState('');
  const [sSearch, setSSearch] = useState('');

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([fetchWithAuth(`${BASE}/batches?per_page=200`), fetchWithAuth(`${BASE}/getTaskCategories`)]);
      setBatches(asArray<Batch>(b));
      setCategories(asArray<Category>(c));
    } catch { setBatches([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadStudentTasks = useCallback(async (studentId: number, cat: string) => {
    setTasksLoading(true); setMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/students/${studentId}/tasks${cat ? `?category_id=${cat}` : ''}`);
      setTasks((r?.data?.tasks ?? []) as Task[]);
    } catch { setTasks([]); } finally { setTasksLoading(false); }
  }, []);

  const pickBatch = (b: Batch) => { setBatch(b); setStudent(null); setTasks([]); setSSearch(''); };
  const pickStudent = (s: Student) => { setStudent(s); setCatFilter(''); loadStudentTasks(s.id, ''); };
  const backToBatches = () => { setBatch(null); setStudent(null); setTasks([]); };
  const backToStudents = () => { setStudent(null); setTasks([]); };

  const onCat = (v: string) => { setCatFilter(v); if (student) loadStudentTasks(student.id, v); };

  const markTask = async (taskId: number, status: string) => {
    if (!student || !status) return;
    setBusy(true); setMsg('');
    try {
      await fetchWithAuth(`${BASE}/tasks/${taskId}/students/${student.id}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      setOk(true); setMsg(`Marked as ${status}.`);
      await loadStudentTasks(student.id, catFilter);
    } catch (e: unknown) { setOk(false); setMsg(e instanceof Error ? e.message : 'Failed.'); } finally { setBusy(false); }
  };

  const markAllComplete = async () => {
    if (!student) return;
    const pending = tasks.filter(t => !isDone(t));
    if (pending.length === 0) return;
    setBusy(true); setMsg('');
    try {
      for (const t of pending) {
        await fetchWithAuth(`${BASE}/tasks/${t.id}/students/${student.id}/complete`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }),
        });
      }
      setOk(true); setMsg(`Marked ${pending.length} task${pending.length === 1 ? '' : 's'} complete.`);
      await loadStudentTasks(student.id, catFilter);
    } catch (e: unknown) { setOk(false); setMsg(e instanceof Error ? e.message : 'Some failed.'); } finally { setBusy(false); }
  };

  const filteredBatches = useMemo(() => {
    const q = bSearch.trim().toLowerCase();
    return q ? batches.filter(b => b.name.toLowerCase().includes(q)) : batches;
  }, [batches, bSearch]);

  const roster = useMemo(() => {
    const list = batch?.students ?? [];
    const q = sSearch.trim().toLowerCase();
    return q ? list.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) : list;
  }, [batch, sSearch]);

  const done = tasks.filter(isDone).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.eyebrow}>{eyebrow}</div>
          <div className={styles.title}>Mark Tasks</div>
          <div className={styles.sub}>Pick a batch, then a student, to review and mark their tasks complete.</div>
        </div>

        {/* Breadcrumb trail */}
        <div className={styles.crumbs}>
          <button className={`${styles.crumb} ${!batch ? styles.crumbActive : ''}`} onClick={backToBatches} disabled={!batch}>Batches</button>
          {batch && <><span className={styles.crumbSep}>→</span>
            <button className={`${styles.crumb} ${!student ? styles.crumbActive : ''}`} onClick={backToStudents} disabled={!student}>{batch.name}</button></>}
          {student && <><span className={styles.crumbSep}>→</span>
            <span className={`${styles.crumb} ${styles.crumbActive}`}>{student.name}</span></>}
        </div>

        {/* STEP 1 — batches */}
        {!batch && (
          loading ? <div className={styles.state}>Loading batches…</div> : (
            <>
              <div className={styles.toolbar}>
                <div className={styles.search}><span className={styles.searchIcon}>⌕</span>
                  <input className={styles.searchIn} placeholder="Search batches…" value={bSearch} onChange={e => setBSearch(e.target.value)} /></div>
              </div>
              {filteredBatches.length === 0 ? (
                <div className={styles.state}><div className={styles.stateTitle}>No batches</div>Create a batch first.</div>
              ) : (
                <div className={styles.grid}>
                  {filteredBatches.map(b => (
                    <button key={b.id} className={styles.card} onClick={() => pickBatch(b)}>
                      <div className={styles.cardName}>{b.name}</div>
                      <div className={styles.cardMeta}>{(b.students?.length ?? b.students_count ?? 0)} student{(b.students?.length ?? b.students_count ?? 0) === 1 ? '' : 's'}</div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )
        )}

        {/* STEP 2 — students of the batch */}
        {batch && !student && (
          <>
            <div className={styles.stepHint}>Select a student from <strong>{batch.name}</strong>.</div>
            <div className={styles.toolbar}>
              <div className={styles.search}><span className={styles.searchIcon}>⌕</span>
                <input className={styles.searchIn} placeholder="Search students…" value={sSearch} onChange={e => setSSearch(e.target.value)} /></div>
            </div>
            {roster.length === 0 ? (
              <div className={styles.state}><div className={styles.stateTitle}>No students in this batch</div>Add students to the batch first.</div>
            ) : (
              <div className={styles.grid}>
                {roster.map(s => (
                  <button key={s.id} className={styles.card} onClick={() => pickStudent(s)}>
                    <div className={styles.cardAvatar}>{initials(s.name)}</div>
                    <div className={styles.cardName}>{s.name}</div>
                    <div className={styles.cardMeta}>{s.email}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 3 — the student's tasks */}
        {batch && student && (
          <>
            <div className={styles.stuStrip}>
              <div className={styles.cardAvatar} style={{ marginBottom: 0 }}>{initials(student.name)}</div>
              <div>
                <div className={styles.stuName}>{student.name}</div>
                <div className={styles.stuMail}>{student.email}</div>
              </div>
              <div className={styles.spacer} />
              <div style={{ textAlign: 'right' }}>
                <div className={styles.prog}>{done}/{tasks.length} done</div>
                <div className={styles.progBar}><div className={styles.progFill} style={{ width: `${pct}%` }} /></div>
              </div>
            </div>

            <div className={styles.toolbar}>
              <select className={styles.sel} value={catFilter} onChange={e => onCat(e.target.value)}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className={styles.spacer} />
              <button className={`${styles.btn} ${styles.btnGold}`} disabled={busy || tasks.every(isDone)} onClick={markAllComplete}>Mark all complete</button>
            </div>

            {msg && <div className={`${styles.alert} ${ok ? styles.alertOk : styles.alertErr}`}>{msg}</div>}

            {tasksLoading ? (
              <div className={styles.state}>Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div className={styles.state}><div className={styles.stateTitle}>No tasks</div>{catFilter ? 'No tasks in this category for the student.' : 'This student has no tasks assigned yet.'}</div>
            ) : (
              <div className={styles.panel}>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead><tr><th>Task</th><th>Category</th><th>Level</th><th>Status</th><th>Mark as</th></tr></thead>
                    <tbody>
                      {tasks.map(t => {
                        const st = taskStatus(t);
                        return (
                          <tr key={t.id}>
                            <td><div className={styles.tName}>{t.title}</div></td>
                            <td>{t.category?.name ? <span className={styles.catPill}>{t.category.name}</span> : <span className={styles.muted}>—</span>}</td>
                            <td>{t.difficulty ? <span className={`${styles.diff} ${styles[`diff_${t.difficulty}`] || ''}`}>{t.difficulty}</span> : <span className={styles.muted}>—</span>}</td>
                            <td><span className={`${styles.badge} ${styles[`st_${st}`] || styles.st_pending}`}>{fmtStatus(st)}</span></td>
                            <td>
                              <select className={`${styles.sel} ${styles.btnSm}`} value="" disabled={busy} onChange={e => { if (e.target.value) markTask(t.id, e.target.value); }}>
                                <option value="">Mark…</option>
                                <option value="completed">Completed</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
