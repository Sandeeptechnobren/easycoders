'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';

/* /admin/reviews — moderate student testimonials.
 *
 * Students submit reviews (photo + 1-5 stars) from their dashboard; they land
 * here as `pending`. Admin publishes / rejects / unpublishes / deletes and can
 * mark Featured + set a display order. Only `published` rows reach the public
 * carousel (ordered featured → order_no → newest). Mirrors /admin/ads:
 * hardcoded BASE, fetchWithAuth, AdminSection chrome. */

const BASE = 'https://api.easycoders.in/api';

type Review = {
  id: number;
  name: string;
  headline: string | null;
  body: string;
  rating: number;
  image_url: string | null;
  status: 'pending' | 'published' | 'rejected';
  featured: boolean;
  order_no: number | null;
  created_at: string | null;
  user?: { id: number; name: string; email: string } | null;
};

const TABS = ['pending', 'published', 'rejected', 'all'] as const;
type Tab = (typeof TABS)[number];

const STATUS_BADGE: Record<Review['status'], { label: string; bg: string; color: string }> = {
  pending:   { label: 'Pending',   bg: '#fffbeb', color: '#b45309' },
  published: { label: 'Published', bg: '#f0fdf4', color: '#15803d' },
  rejected:  { label: 'Rejected',  bg: '#fef2f2', color: '#b91c1c' },
};

const fmtDate = (s?: string | null) =>
  s ? new Date(s.includes('T') ? s : s.replace(' ', 'T')).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function AdminReviewsPage() {
  const [all, setAll]       = useState<Review[]>([]);
  const [tab, setTab]       = useState<Tab>('pending');
  const [loading, setLoad]  = useState(true);
  const [busy, setBusy]     = useState<number | null>(null);
  const [edit, setEdit]     = useState<Review | null>(null);

  const load = useCallback(() => {
    setLoad(true);
    fetchWithAuth(`${BASE}/admin/reviews`)
      .then(r => setAll(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setAll([]))
      .finally(() => setLoad(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    pending:   all.filter(r => r.status === 'pending').length,
    published: all.filter(r => r.status === 'published').length,
    rejected:  all.filter(r => r.status === 'rejected').length,
    all:       all.length,
  }), [all]);

  const shown = tab === 'all' ? all : all.filter(r => r.status === tab);

  const patch = async (r: Review, payload: Record<string, unknown>) => {
    setBusy(r.id);
    try {
      await fetchWithAuth(`${BASE}/admin/reviews/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed.'); }
    finally { setBusy(null); }
  };

  const remove = async (r: Review) => {
    if (!confirm(`Delete the review by ${r.name}? This cannot be undone.`)) return;
    setBusy(r.id);
    try { await fetchWithAuth(`${BASE}/admin/reviews/${r.id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
    finally { setBusy(null); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Community"
        title="Student Reviews"
        description="Moderate the testimonials students submit. Publish the best ones to feature them on the homepage carousel."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Student Reviews' },
        ]}
      >
        <div className="rv">
          {/* Tabs */}
          <div className="rv-tabs">
            {TABS.map(tb => (
              <button key={tb} className={`rv-tab ${tab === tb ? 'active' : ''}`} onClick={() => setTab(tb)}>
                {tb.charAt(0).toUpperCase() + tb.slice(1)}
                <span className="rv-count">{counts[tb]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rv-empty">Loading reviews…</div>
          ) : shown.length === 0 ? (
            <div className="rv-empty">No {tab === 'all' ? '' : tab} reviews yet.</div>
          ) : (
            <div className="rv-list">
              {shown.map(r => (
                <article key={r.id} className="rv-card">
                  <div className="rv-photo-wrap">
                    {r.image_url
                      ? <img className="rv-photo" src={r.image_url} alt={r.name} />
                      : <div className="rv-photo rv-photo-ph">{(r.name || '?').slice(0, 1).toUpperCase()}</div>}
                    {r.featured && <span className="rv-feat-flag" title="Featured">★</span>}
                  </div>

                  <div className="rv-main">
                    <div className="rv-stars">{'★'.repeat(r.rating)}<span className="rv-stars-dim">{'☆'.repeat(5 - r.rating)}</span></div>
                    <p className="rv-body">&ldquo;{r.body}&rdquo;</p>
                    <div className="rv-meta">
                      <strong>{r.name}</strong>{r.headline ? ` · ${r.headline}` : ''}
                    </div>
                    <div className="rv-sub">
                      {r.user?.email ? `${r.user.email} · ` : ''}submitted {fmtDate(r.created_at)}
                    </div>
                  </div>

                  <div className="rv-actions">
                    <span className="rv-badge" style={{ background: STATUS_BADGE[r.status].bg, color: STATUS_BADGE[r.status].color }}>
                      {STATUS_BADGE[r.status].label}
                    </span>

                    <div className="rv-btn-row">
                      {r.status !== 'published' && (
                        <button className="rv-btn pub" disabled={busy === r.id} onClick={() => patch(r, { status: 'published' })}>Publish</button>
                      )}
                      {r.status === 'published' && (
                        <button className="rv-btn ghost" disabled={busy === r.id} onClick={() => patch(r, { status: 'pending' })}>Unpublish</button>
                      )}
                      {r.status !== 'rejected' && (
                        <button className="rv-btn rej" disabled={busy === r.id} onClick={() => patch(r, { status: 'rejected' })}>Reject</button>
                      )}
                      <button className="rv-btn ghost" disabled={busy === r.id} onClick={() => setEdit(r)}>Edit</button>
                      <button className="rv-btn del" disabled={busy === r.id} onClick={() => remove(r)}>Delete</button>
                    </div>

                    {r.status === 'published' && (
                      <div className="rv-curate">
                        <label className="rv-feat">
                          <input type="checkbox" checked={r.featured} disabled={busy === r.id} onChange={() => patch(r, { featured: !r.featured })} />
                          Featured
                        </label>
                        <label className="rv-order">
                          Order
                          <input
                            type="number"
                            defaultValue={r.order_no ?? ''}
                            disabled={busy === r.id}
                            onBlur={e => {
                              const v = e.target.value === '' ? null : Number(e.target.value);
                              if (v !== (r.order_no ?? null)) patch(r, { order_no: v });
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Edit modal */}
        {edit && (
          <EditModal
            review={edit}
            onClose={() => setEdit(null)}
            onSave={async (payload) => { await patch(edit, payload); setEdit(null); }}
          />
        )}

        <style jsx>{`
          .rv { font-family: 'DM Sans', system-ui, sans-serif; }
          .rv-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
          .rv-tab {
            display: inline-flex; align-items: center; gap: 8px;
            background: #fff; border: 1px solid #e5e9f2; color: #4a5568;
            border-radius: 100px; padding: 8px 16px; font-size: 13px; font-weight: 600;
            cursor: pointer; font-family: inherit; transition: all .18s ease;
          }
          .rv-tab:hover { border-color: #E8A020; color: #0B1B3A; }
          .rv-tab.active { background: #0B1B3A; border-color: #0B1B3A; color: #fff; }
          .rv-count { font-size: 11px; background: rgba(0,0,0,0.08); border-radius: 100px; padding: 1px 8px; }
          .rv-tab.active .rv-count { background: rgba(255,255,255,0.2); }

          .rv-empty { padding: 48px; text-align: center; color: #94a3b8; font-size: 14px; }
          .rv-list { display: flex; flex-direction: column; gap: 14px; }
          .rv-card {
            display: grid; grid-template-columns: 72px 1fr auto; gap: 18px;
            background: #fff; border: 1px solid #e5e9f2; border-radius: 16px; padding: 18px;
          }
          @media (max-width: 720px) { .rv-card { grid-template-columns: 1fr; } }

          .rv-photo-wrap { position: relative; width: 72px; height: 72px; }
          .rv-photo { width: 72px; height: 72px; border-radius: 14px; object-fit: cover; border: 1px solid #e5e9f2; display: block; }
          .rv-photo-ph { background: #0B1B3A; color: #F5C356; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; }
          .rv-feat-flag { position: absolute; top: -6px; right: -6px; background: #E8A020; color: #0B1B3A; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid #fff; }

          .rv-main { min-width: 0; }
          .rv-stars { color: #E8A020; font-size: 14px; letter-spacing: 2px; margin-bottom: 6px; }
          .rv-stars-dim { opacity: .28; }
          .rv-body { font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 8px; font-style: italic; }
          .rv-meta { font-size: 13px; color: #0B1B3A; }
          .rv-meta strong { font-weight: 700; }
          .rv-sub { font-size: 12px; color: #94a3b8; margin-top: 3px; }

          .rv-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; min-width: 200px; }
          @media (max-width: 720px) { .rv-actions { align-items: flex-start; } }
          .rv-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
          .rv-btn-row { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          .rv-btn { border: 1px solid #e5e9f2; background: #fff; color: #4a5568; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s ease; }
          .rv-btn:disabled { opacity: .5; cursor: not-allowed; }
          .rv-btn.pub { background: #16a34a; border-color: #16a34a; color: #fff; }
          .rv-btn.pub:hover:not(:disabled) { background: #15803d; }
          .rv-btn.rej:hover:not(:disabled) { border-color: #f59e0b; color: #b45309; }
          .rv-btn.del:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }
          .rv-btn.ghost:hover:not(:disabled) { border-color: #0B1B3A; color: #0B1B3A; }

          .rv-curate { display: flex; gap: 14px; align-items: center; }
          .rv-feat { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #4a5568; cursor: pointer; }
          .rv-feat input { accent-color: #E8A020; }
          .rv-order { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #4a5568; }
          .rv-order input { width: 58px; border: 1px solid #e5e9f2; border-radius: 8px; padding: 5px 8px; font-size: 12.5px; font-family: inherit; }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}

/* ─── Edit modal (fix name / headline / body / rating) ─── */
function EditModal({ review, onClose, onSave }: {
  review: Review;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName]         = useState(review.name);
  const [headline, setHeadline] = useState(review.headline ?? '');
  const [body, setBody]         = useState(review.body);
  const [rating, setRating]     = useState(review.rating);
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave({ name, headline, body, rating });
    setSaving(false);
  };

  // Portal to <body> so the fixed overlay escapes any transformed ancestor.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="rvm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rvm">
        <h3 className="rvm-title">Edit review</h3>

        <label className="rvm-label">Rating</label>
        <div className="rvm-stars">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => setRating(n)}>{n <= rating ? '★' : '☆'}</button>
          ))}
        </div>

        <label className="rvm-label">Name</label>
        <input className="rvm-input" value={name} onChange={e => setName(e.target.value)} />

        <label className="rvm-label">Headline</label>
        <input className="rvm-input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="e.g. Full-Stack Developer" />

        <label className="rvm-label">Review text</label>
        <textarea className="rvm-input rvm-textarea" value={body} onChange={e => setBody(e.target.value)} maxLength={2000} />

        <div className="rvm-actions">
          <button className="rvm-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="rvm-btn save" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>

        <style jsx>{`
          /* :global() — portal-root element (styled-jsx skips the outermost node of a createPortal arg). */
          :global(.rvm-overlay) { position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; overflow-y: auto; }
          .rvm { background: #fff; border-radius: 18px; padding: 26px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 28px 70px rgba(0,0,0,0.4); }
          .rvm-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0 0 16px; }
          .rvm-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
          .rvm-stars { display: flex; gap: 4px; }
          .rvm-stars button { background: none; border: none; cursor: pointer; font-size: 26px; color: #E8A020; padding: 0; }
          .rvm-input { width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 10px 13px; font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; }
          .rvm-input:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .rvm-textarea { min-height: 96px; resize: vertical; line-height: 1.55; }
          .rvm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
          .rvm-btn { border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .rvm-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .rvm-btn.save { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .rvm-btn:disabled { opacity: .6; cursor: not-allowed; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
