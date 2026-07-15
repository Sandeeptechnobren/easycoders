'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

/* Student-facing "My Certificates" card for the student dashboard. Lists the
   student's own course-completion certificates (GET /my-course-completions)
   with a per-certificate download. Renders nothing if the student has none.
   Self-contained (own fetch + styles), mirroring MyBatchCard/MyTasksCard. */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

/** Build a certificate download filename: "<Student Name>_<Course>_<Year>.pdf". */
function certFileName(name?: string | null, course?: string | null, dateStr?: string | null): string {
  const clean = (s: string) => s.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim();
  const year = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
  return `${clean(name || '') || 'Student'}_${clean(course || '') || 'Course'}_${year}.pdf`;
}

type Completion = {
  id: number;
  student_name?: string | null;
  program?: string | null;
  tech_field?: string | null;
  duration_value: number;
  duration_unit: string;
  performance_grade: string;
  completed_on: string;
  course?: { id: number; title: string } | null;
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function MyCertificatesCard() {
  const [items, setItems] = useState<Completion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    fetchWithAuth(`${BASE}/my-course-completions`)
      .then(r => setItems(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  const download = async (c: Completion) => {
    setBusy(c.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/course-completions/${c.id}/certificate`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const course = c.program || c.course?.title || c.tech_field || '';
      const fname = certFileName(c.student_name, course, c.completed_on);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download the certificate. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (!loaded || items.length === 0) return null; // nothing to show unless issued

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18,
      padding: '20px 24px', margin: '0 0 22px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>My Certificates</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Download your course-completion certificates</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((c) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
            padding: '12px 14px', border: '1px solid #eef2f7', borderRadius: 12, background: '#f8fafc',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{c.program || c.course?.title || c.tech_field}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {c.duration_value} {c.duration_unit} · Grade {c.performance_grade} · {fmt(c.completed_on)}
              </div>
            </div>
            <button type="button" onClick={() => download(c)} disabled={busy === c.id}
              style={{
                background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10,
                padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: busy === c.id ? 'wait' : 'pointer', whiteSpace: 'nowrap',
              }}>
              {busy === c.id ? 'Preparing…' : 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
