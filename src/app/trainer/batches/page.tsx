'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

/* /trainer/batches — read-only view of the batches assigned to the logged-in
   trainer. The backend index() scopes batches to the trainer (role 4), so this
   only ever returns their cohorts. Expand a batch to see its student roster. */

const BASE = 'https://api.easycoders.in/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const courseLabel = (c?: { name?: string; title?: string } | null) => c?.title ?? c?.name ?? '';
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

type Batch = {
  id: number; name: string; status: string;
  course?: { id: number; title?: string; name?: string };
  start_date?: string; end_date?: string; students_count?: number;
};
type RosterStudent = { id: number; name: string; email: string; pivot?: { status: string } };

const STATUS_BG: Record<string, string> = {
  upcoming: '#EFF6FF', active: '#ECFDF5', completed: '#F1F5F9', cancelled: '#FEF2F2',
};
const STATUS_FG: Record<string, string> = {
  upcoming: '#1D4ED8', active: '#166534', completed: '#475569', cancelled: '#991B1B',
};

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [roster, setRoster] = useState<Record<number, RosterStudent[]>>({});
  const [rosterLoading, setRosterLoading] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${BASE}/batches`)
      .then(r => setBatches(asArray<Batch>(r)))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: number) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    if (!roster[id]) {
      setRosterLoading(true);
      try {
        const res = await fetchWithAuth(`${BASE}/batches/${id}`);
        const detail = (res?.data ?? {}) as { students?: RosterStudent[] };
        setRoster(prev => ({ ...prev, [id]: Array.isArray(detail.students) ? detail.students : [] }));
      } catch { setRoster(prev => ({ ...prev, [id]: [] })); } finally { setRosterLoading(false); }
    }
  };

  return (
    <RoleGuard allowedRoles={[4]}>
      <div style={{ minHeight: '100vh', background: '#F4F6FB', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>
          <nav style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
            <Link href="/trainer" style={{ color: '#185fa5', textDecoration: 'none' }}>Trainer</Link>
            <span style={{ margin: '0 6px' }}>/</span>Batches
          </nav>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#0B1B3A', margin: '0 0 4px' }}>My Batches</h1>
          <p style={{ color: '#4A5568', fontSize: 14, margin: '0 0 24px' }}>The cohorts you&apos;re assigned to teach. Expand a batch to see its roster.</p>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '48px 0' }}>Loading your batches…</div>
          ) : batches.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E5E9F2', borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ fontWeight: 600, color: '#4A5568', marginBottom: 4 }}>No batches assigned</div>
              You&apos;re not assigned to any batch yet. An admin assigns trainers when creating a batch.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {batches.map(b => {
                const open = openId === b.id;
                const list = roster[b.id] || [];
                return (
                  <div key={b.id} style={{ background: '#fff', border: '1px solid #E5E9F2', borderRadius: 16, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggle(b.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#0B1B3A' }}>{b.name}</div>
                        <div style={{ fontSize: 12.5, color: '#4A5568', marginTop: 3 }}>
                          {courseLabel(b.course) || '—'} · {fmt(b.start_date)} → {fmt(b.end_date)} · {b.students_count ?? 0} student{(b.students_count ?? 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', padding: '3px 11px', borderRadius: 100, background: STATUS_BG[b.status] || '#F1F5F9', color: STATUS_FG[b.status] || '#475569' }}>{b.status}</span>
                        <span style={{ color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
                      </div>
                    </button>
                    {open && (
                      <div style={{ borderTop: '1px solid #F1F4F9', padding: '14px 22px 20px' }}>
                        {rosterLoading && !roster[b.id] ? (
                          <div style={{ color: '#94A3B8', fontSize: 13 }}>Loading roster…</div>
                        ) : list.length === 0 ? (
                          <div style={{ color: '#94A3B8', fontSize: 13 }}>No students enrolled in this batch yet.</div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead><tr>
                                <th style={{ textAlign: 'left', fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 10px', borderBottom: '1px solid #E5E9F2' }}>Student</th>
                                <th style={{ textAlign: 'left', fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 10px', borderBottom: '1px solid #E5E9F2' }}>Status</th>
                              </tr></thead>
                              <tbody>
                                {list.map(s => (
                                  <tr key={s.id}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #F1F4F9' }}>
                                      <div style={{ fontWeight: 600, color: '#0B1B3A' }}>{s.name}</div>
                                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{s.email}</div>
                                    </td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #F1F4F9', textTransform: 'capitalize', color: '#4A5568' }}>{s.pivot?.status || 'active'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
