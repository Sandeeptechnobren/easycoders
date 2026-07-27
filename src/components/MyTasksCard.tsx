'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';

/* Student-facing "My Tasks" card for the dashboard. Fetches the student's
   batch tasks (GET /student/tasks) and shows the latest few with due dates +
   status, plus a pending count. Renders nothing if the student has no tasks.
   View-only — grading happens on the trainer side. */

const BASE = 'https://api.easycoders.in/api';

type Submission = { status: string } | null;
type Task = {
  id: number;
  title: string;
  due_date?: string | null;
  category?: { id: number; name: string } | null;
  my_submission?: Submission;
};

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : null);
const isOverdue = (d?: string | null) => !!d && new Date(d).getTime() < Date.now() - 86400000;
const isDone = (s?: Submission) => !!s && (s.status === 'completed' || s.status === 'approved');

export default function MyTasksCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${BASE}/student/tasks`)
      .then(r => setTasks(asArray<Task>(r)))
      .catch(() => setTasks([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || tasks.length === 0) return null;

  const pending = tasks.filter(t => !isDone(t.my_submission)).length;
  const latest = tasks.slice(0, 4);

  const statusChip = (t: Task) => {
    const s = t.my_submission?.status;
    if (s === 'approved' || s === 'completed') return { label: 'Done', bg: '#ECFDF5', fg: '#166534' };
    if (s === 'rejected') return { label: 'Redo', bg: '#FEF2F2', fg: '#991B1B' };
    if (s === 'pending') return { label: 'Submitted', bg: '#EFF6FF', fg: '#1D4ED8' };
    return { label: 'Pending', bg: '#FEF6E7', fg: '#92660D' };
  };

  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E9F2', borderRadius: 18, padding: '20px 22px',
      margin: '0 0 22px', fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 16 }}>📝</span>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#0B1B3A' }}>My Tasks</span>
          {pending > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: '#FEF6E7', color: '#92660D', padding: '2px 9px', borderRadius: 100 }}>
              {pending} pending
            </span>
          )}
        </div>
        <Link href="/students/tasks" style={{ fontSize: 12.5, fontWeight: 600, color: '#B97A0F', textDecoration: 'none' }}>View all →</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {latest.map(t => {
          const chip = statusChip(t);
          const due = fmtDate(t.due_date);
          const overdue = isOverdue(t.due_date) && !isDone(t.my_submission);
          return (
            <Link key={t.id} href="/students/tasks" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '11px 13px', borderRadius: 12, border: '1px solid #EEF1F7', textDecoration: 'none',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1B3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                <div style={{ fontSize: 12, color: overdue ? '#B91C1C' : '#94A3B8', marginTop: 2 }}>
                  {t.category?.name ? `${t.category.name}` : ''}{t.category?.name && due ? ' · ' : ''}{due ? `Due ${due}${overdue ? ' · overdue' : ''}` : (t.category?.name ? '' : 'No due date')}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, background: chip.bg, color: chip.fg, padding: '3px 10px', borderRadius: 100, flexShrink: 0 }}>{chip.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
