'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

/* Student-facing "My Batch" card for the student dashboard. Fetches the
   logged-in student's active batch (GET /student/my-batch) and shows the
   cohort, trainer(s), schedule and their enrolment status. Renders nothing
   if the student isn't in a batch. Self-contained (own fetch + styles). */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Trainer = { id: number; name: string };
type MyBatch = {
  id: number;
  name: string;
  status: string;
  start_date?: string;
  end_date?: string;
  course?: { id: number; title?: string; name?: string };
  trainers?: Trainer[];
  my_enrollment?: { status: string; joined_at?: string } | null;
};

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function MyBatchCard() {
  const [batch, setBatch] = useState<MyBatch | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${BASE}/student/my-batch`)
      .then(r => setBatch((r?.data ?? null) as MyBatch | null))
      .catch(() => setBatch(null))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !batch) return null; // nothing to show until/unless enrolled

  const course = batch.course?.title ?? batch.course?.name ?? '';
  const trainers = (batch.trainers || []).map(t => t.name).join(', ');

  return (
    <div style={{
      background: 'linear-gradient(135deg,#0B1B3A 0%,#152D5A 100%)',
      borderRadius: 18, padding: '22px 24px', margin: '0 0 22px',
      color: '#fff', boxShadow: '0 12px 30px rgba(11,27,58,0.18)',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#F5C356' }}>● My Batch</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'capitalize', padding: '3px 11px', borderRadius: 100,
          background: 'rgba(232,160,32,0.18)', color: '#F5C356', border: '1px solid rgba(232,160,32,0.4)',
        }}>{batch.status}</span>
      </div>

      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
        {batch.name}
      </div>
      {course && <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>{course}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 14, marginTop: 18 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Schedule</div>
          <div style={{ fontSize: 13.5, marginTop: 3 }}>{fmt(batch.start_date)} → {fmt(batch.end_date)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Trainer{(batch.trainers || []).length > 1 ? 's' : ''}</div>
          <div style={{ fontSize: 13.5, marginTop: 3 }}>{trainers || '—'}</div>
        </div>
        {batch.my_enrollment?.status && (
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Your status</div>
            <div style={{ fontSize: 13.5, marginTop: 3, textTransform: 'capitalize' }}>{batch.my_enrollment.status}</div>
          </div>
        )}
      </div>
    </div>
  );
}
