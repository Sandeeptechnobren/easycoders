'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';

/* /admin/gallery — manage gallery ALBUMS (collections of photos grouped by
   event). Create an album here, then "Manage photos" opens /admin/gallery/[id]
   to upload photos into it and pick a cover. Only published albums with >=1
   published photo reach the public site. */

const BASE = 'https://api.easycoders.in/api';

export type Album = {
  id: number;
  title: string;
  description: string | null;
  event: string | null;
  event_date: string | null;
  category: string | null;
  cover_url: string | null;
  count: number;
  status: 'published' | 'hidden';
  featured: boolean;
  order_no: number | null;
  cover_item_id: number | null;
  created_at: string | null;
};

const TABS = ['all', 'published', 'hidden'] as const;
type Tab = (typeof TABS)[number];

const fmtDate = (s?: string | null) =>
  s ? new Date(s.includes('T') ? s : s.replace(' ', 'T')).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function AdminGalleryPage() {
  const [all, setAll]      = useState<Album[]>([]);
  const [tab, setTab]      = useState<Tab>('all');
  const [loading, setLoad] = useState(true);
  const [busy, setBusy]    = useState<number | null>(null);
  const [editing, setEditing] = useState<Album | 'new' | null>(null);

  const load = useCallback(() => {
    setLoad(true);
    fetchWithAuth(`${BASE}/admin/gallery/albums`)
      .then(r => setAll(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setAll([]))
      .finally(() => setLoad(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    all: all.length,
    published: all.filter(a => a.status === 'published').length,
    hidden: all.filter(a => a.status === 'hidden').length,
  }), [all]);
  const shown = tab === 'all' ? all : all.filter(a => a.status === tab);

  const patch = async (a: Album, payload: Record<string, unknown>) => {
    setBusy(a.id);
    try {
      await fetchWithAuth(`${BASE}/admin/gallery/albums/${a.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed.'); }
    finally { setBusy(null); }
  };

  const remove = async (a: Album) => {
    if (!confirm(`Delete the album "${a.title}" and its ${a.count} photo${a.count === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setBusy(a.id);
    try { await fetchWithAuth(`${BASE}/admin/gallery/albums/${a.id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
    finally { setBusy(null); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Community"
        title="Photo Gallery — Albums"
        description="Create albums (grouped by event) and manage the photos inside each. Published albums with at least one published photo appear on the public Gallery page."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Gallery' },
        ]}
      >
        <div className="ga">
          <div className="ga-top">
            <div className="ga-tabs">
              {TABS.map(t => (
                <button key={t} className={`ga-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}<span className="ga-count">{counts[t]}</span>
                </button>
              ))}
            </div>
            <button className="ga-add" onClick={() => setEditing('new')}>+ New album</button>
          </div>

          {loading ? (
            <div className="ga-empty">Loading albums…</div>
          ) : shown.length === 0 ? (
            <div className="ga-empty">No {tab === 'all' ? '' : tab} albums yet. Click “New album” to create one.</div>
          ) : (
            <div className="ga-grid">
              {shown.map(a => (
                <div key={a.id} className="ga-card">
                  <Link href={`/admin/gallery/${a.id}`} className="ga-cover" aria-label={`Manage ${a.title}`}>
                    {a.cover_url
                      ? <img src={a.cover_url} alt={a.title} />
                      : <div className="ga-cover-ph">No photos yet</div>}
                    <span className="ga-count-badge">🖼 {a.count}</span>
                    <span className={`ga-status ${a.status}`}>{a.status}</span>
                    {a.featured && <span className="ga-feat" title="Featured">★</span>}
                  </Link>
                  <div className="ga-body">
                    <div className="ga-title">{a.title}</div>
                    <div className="ga-meta">
                      {a.category ? <span className="ga-tag">{a.category}</span> : null}
                      {[a.event && a.event !== a.title ? a.event : null, fmtDate(a.event_date)].filter(Boolean).join(' · ')}
                    </div>
                    <div className="ga-actions">
                      <Link href={`/admin/gallery/${a.id}`} className="ga-btn manage">Manage photos →</Link>
                      {a.status === 'published'
                        ? <button className="ga-btn" disabled={busy === a.id} onClick={() => patch(a, { status: 'hidden' })}>Hide</button>
                        : <button className="ga-btn pub" disabled={busy === a.id} onClick={() => patch(a, { status: 'published' })}>Publish</button>}
                      <button className="ga-btn" disabled={busy === a.id} onClick={() => patch(a, { featured: !a.featured })}>{a.featured ? 'Unfeature' : 'Feature'}</button>
                      <button className="ga-btn" disabled={busy === a.id} onClick={() => setEditing(a)}>Edit</button>
                      <button className="ga-btn del" disabled={busy === a.id} onClick={() => remove(a)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editing && (
          <AlbumModal album={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        )}

        <style jsx>{`
          .ga { font-family: 'DM Sans', system-ui, sans-serif; }
          .ga-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
          .ga-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
          .ga-tab { display: inline-flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e5e9f2; color: #4a5568; border-radius: 100px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .18s ease; }
          .ga-tab:hover { border-color: #E8A020; color: #0B1B3A; }
          .ga-tab.active { background: #0B1B3A; border-color: #0B1B3A; color: #fff; }
          .ga-count { font-size: 11px; background: rgba(0,0,0,0.08); border-radius: 100px; padding: 1px 8px; }
          .ga-tab.active .ga-count { background: rgba(255,255,255,0.2); }
          .ga-add { background: #E8A020; color: #0B1B3A; border: 1.5px solid #E8A020; border-radius: 10px; padding: 9px 18px; font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
          .ga-add:hover { background: #F5C356; }

          .ga-empty { padding: 48px; text-align: center; color: #94a3b8; font-size: 14px; }
          .ga-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
          .ga-card { border: 1px solid #e5e9f2; border-radius: 16px; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
          /* :global() — the cover is a next/link <a>, which does NOT get the
             styled-jsx scope class, so a scoped rule would never apply (leaving
             the image at its natural portrait height instead of a 4:3 crop). */
          :global(.ga-cover) { position: relative; aspect-ratio: 4 / 3; background: #f4f6fb; display: block; overflow: hidden; }
          :global(.ga-cover) img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .ga-cover-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; }
          .ga-count-badge { position: absolute; bottom: 8px; right: 8px; background: rgba(7,18,42,0.86); color: #F5C356; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; }
          .ga-status { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 3px 9px; border-radius: 100px; }
          .ga-status.published { background: #dcfce7; color: #166534; }
          .ga-status.hidden { background: #f1f5f9; color: #64748b; }
          .ga-feat { position: absolute; top: 8px; right: 8px; background: #E8A020; color: #0B1B3A; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
          .ga-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; }
          .ga-title { font-family: 'Playfair Display', Georgia, serif; font-size: 16px; font-weight: 700; color: #0B1B3A; }
          .ga-meta { font-size: 12px; color: #64748b; }
          .ga-tag { display: inline-block; background: rgba(232,160,32,0.15); border: 1px solid rgba(232,160,32,0.3); color: #92660d; font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 100px; margin-right: 6px; }
          .ga-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
          .ga-btn { border: 1px solid #e5e9f2; background: #fff; color: #4a5568; border-radius: 8px; padding: 6px 11px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; text-decoration: none; transition: all .15s ease; }
          .ga-btn:disabled { opacity: .5; cursor: not-allowed; }
          /* Manage-photos is a next/link <a> -> :global() + self-contained. */
          :global(.ga-btn.manage) { display: inline-flex; align-items: center; border: 1px solid #0B1B3A; background: #0B1B3A; color: #fff; border-radius: 8px; padding: 6px 11px; font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer; transition: background .15s ease; }
          :global(.ga-btn.manage):hover { background: #16305F; color: #fff; }
          .ga-btn.pub { background: #16a34a; border-color: #16a34a; color: #fff; }
          .ga-btn.pub:hover:not(:disabled) { background: #15803d; }
          .ga-btn.del:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }
          .ga-btn:hover:not(:disabled):not(.pub):not(.del):not(.manage) { border-color: #0B1B3A; color: #0B1B3A; }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}

/* ─── Create / edit album (metadata only — photos are managed inside) ─── */
export function AlbumModal({ album, onClose, onSaved }: { album: Album | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!album;
  const [title, setTitle]       = useState(album?.title ?? '');
  const [description, setDesc]  = useState(album?.description ?? '');
  const [event, setEvent]       = useState(album?.event ?? '');
  const [eventDate, setEventDate] = useState(album?.event_date ?? '');
  const [category, setCategory] = useState(album?.category ?? '');
  const [order, setOrder]       = useState(album?.order_no != null ? String(album.order_no) : '');
  const [featured, setFeatured] = useState(album?.featured ?? false);
  const [status, setStatus]     = useState<'published' | 'hidden'>(album?.status ?? 'published');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');

  const save = async () => {
    if (!title.trim()) { setMsg('Please give the album a title.'); return; }
    setSaving(true); setMsg('');
    try {
      const body = {
        title: title.trim(), description: description.trim(), event: event.trim(),
        event_date: eventDate || null, category: category.trim(),
        order_no: order === '' ? null : Number(order), featured, status,
      };
      await fetchWithAuth(`${BASE}/admin/gallery/albums${isEdit ? `/${album!.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      onSaved();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Could not save the album.'); }
    finally { setSaving(false); }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="am-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="am">
        <h3 className="am-title">{isEdit ? 'Edit album' : 'New album'}</h3>

        <label className="am-label">Album title</label>
        <input className="am-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Convocation 2026" />

        <div className="am-row">
          <div className="am-field" style={{ flex: 1 }}>
            <label className="am-label">Category <span className="am-note">(filter tabs)</span></label>
            <input className="am-input" value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Events" />
          </div>
          <div className="am-field" style={{ flex: 1 }}>
            <label className="am-label">Event name</label>
            <input className="am-input" value={event} onChange={e => setEvent(e.target.value)} placeholder="e.g. Summer Demo Day" />
          </div>
        </div>

        <div className="am-row">
          <div className="am-field" style={{ flex: 1 }}>
            <label className="am-label">Event date</label>
            <input className="am-input" type="date" value={eventDate ?? ''} onChange={e => setEventDate(e.target.value)} />
          </div>
          <div className="am-field" style={{ width: 96 }}>
            <label className="am-label">Order</label>
            <input className="am-input" type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="—" />
          </div>
        </div>

        <label className="am-label">Description <span className="am-note">(optional)</span></label>
        <textarea className="am-input am-textarea" value={description} onChange={e => setDesc(e.target.value)} placeholder="A short line about this album" maxLength={2000} />

        <div className="am-row am-toggles">
          <label className="am-check"><input type="checkbox" checked={featured} onChange={() => setFeatured(v => !v)} /> Featured</label>
          <label className="am-check"><input type="checkbox" checked={status === 'published'} onChange={() => setStatus(s => s === 'published' ? 'hidden' : 'published')} /> Published</label>
        </div>

        {msg && <div className="am-msg">{msg}</div>}
        <div className="am-actions">
          <button className="am-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="am-btn save" onClick={save} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save album' : 'Create album'}</button>
        </div>

        <style jsx>{`
          :global(.am-overlay) { position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; overflow-y: auto; }
          .am { background: #fff; border-radius: 18px; padding: 24px; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 28px 70px rgba(0,0,0,0.4); }
          .am-title { font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-weight: 700; color: #0B1B3A; margin: 0 0 16px; }
          .am-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
          .am-label:first-of-type { margin-top: 0; }
          .am-note { color: #94a3b8; font-weight: 400; }
          .am-input { width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 10px 13px; font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; }
          .am-input:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .am-textarea { min-height: 70px; resize: vertical; line-height: 1.5; }
          .am-row { display: flex; gap: 12px; }
          .am-field { display: flex; flex-direction: column; }
          .am-toggles { margin-top: 16px; gap: 20px; flex-wrap: wrap; }
          .am-check { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: #334155; cursor: pointer; }
          .am-check input { accent-color: #E8A020; }
          .am-msg { margin-top: 14px; font-size: 12.5px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 9px 12px; }
          .am-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
          .am-btn { border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .am-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .am-btn.save { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .am-btn:disabled { opacity: .6; cursor: not-allowed; }
          @media (max-width: 480px) { .am-row { flex-direction: column; gap: 14px; } .am-row .am-field { width: 100% !important; } }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
