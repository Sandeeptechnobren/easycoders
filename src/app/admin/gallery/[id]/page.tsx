'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import { AlbumModal, type Album } from '../page';

/* /admin/gallery/[id] — manage the photos inside one album: upload photos
   (multi-select), pick the cover, edit a caption, hide, or delete each. Album
   metadata is edited via the shared AlbumModal. */

const BASE = 'https://api.easycoders.in/api';
const MAX_IMAGE = 5 * 1024 * 1024;

type Photo = {
  id: number;
  image_url: string | null;
  title: string | null;
  caption: string | null;
  status: 'published' | 'hidden';
  order_no: number | null;
  is_cover: boolean;
  created_at: string | null;
};

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = Number(params?.id);

  const [album, setAlbum]   = useState<Album | null>(null);
  const [items, setItems]   = useState<Photo[]>([]);
  const [loading, setLoad]  = useState(true);
  const [notFound, setNF]   = useState(false);
  const [busy, setBusy]     = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [editAlbum, setEditAlbum] = useState(false);
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null);

  const load = useCallback(() => {
    if (!albumId) return;
    setLoad(true);
    fetchWithAuth(`${BASE}/admin/gallery/albums/${albumId}/items`)
      .then(r => { setAlbum(r?.data?.album ?? null); setItems(Array.isArray(r?.data?.items) ? r.data.items : []); })
      .catch(() => setNF(true))
      .finally(() => setLoad(false));
  }, [albumId]);
  useEffect(() => { load(); }, [load]);

  const patchPhoto = async (p: Photo, payload: Record<string, unknown>) => {
    setBusy(p.id);
    try {
      await fetchWithAuth(`${BASE}/admin/gallery/items/${p.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed.'); }
    finally { setBusy(null); }
  };

  const setCover = async (p: Photo) => {
    setBusy(p.id);
    try {
      await fetchWithAuth(`${BASE}/admin/gallery/albums/${albumId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cover_item_id: p.id }),
      });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Could not set cover.'); }
    finally { setBusy(null); }
  };

  const removePhoto = async (p: Photo) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    setBusy(p.id);
    try { await fetchWithAuth(`${BASE}/admin/gallery/items/${p.id}`, { method: 'DELETE' }); load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
    finally { setBusy(null); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Community"
        title={album ? album.title : 'Album'}
        description={album ? `${items.length} photo${items.length === 1 ? '' : 's'}${album.event && album.event !== album.title ? ` · ${album.event}` : ''}` : 'Manage the photos in this album.'}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Gallery', href: '/admin/gallery' },
          { label: album?.title ?? 'Album' },
        ]}
      >
        <div className="ad">
          <div className="ad-top">
            <Link href="/admin/gallery" className="ad-back">← All albums</Link>
            <div className="ad-top-actions">
              {album && <button className="ad-btn ghost" onClick={() => setEditAlbum(true)}>Edit album details</button>}
              <button className="ad-btn add" onClick={() => setAdding(true)}>+ Add photos</button>
            </div>
          </div>

          {loading ? (
            <div className="ad-empty">Loading photos…</div>
          ) : notFound || !album ? (
            <div className="ad-empty">Album not found. <Link href="/admin/gallery">Back to albums</Link>.</div>
          ) : items.length === 0 ? (
            <div className="ad-empty">
              <div style={{ fontSize: 34, marginBottom: 10 }}>🖼️</div>
              This album has no photos yet. Click <strong>“Add photos”</strong> to upload some.
            </div>
          ) : (
            <div className="ad-grid">
              {items.map(p => (
                <div key={p.id} className={`ad-card ${p.is_cover ? 'cover' : ''}`}>
                  <div className="ad-thumb">
                    {p.image_url ? <img src={p.image_url} alt={p.caption || 'photo'} /> : <div className="ad-thumb-ph">no image</div>}
                    {p.is_cover && <span className="ad-cover-badge">★ Cover</span>}
                    <span className={`ad-status ${p.status}`}>{p.status}</span>
                  </div>
                  {p.caption && <div className="ad-cap">{p.caption}</div>}
                  <div className="ad-actions">
                    {!p.is_cover && <button className="ad-mini" disabled={busy === p.id} onClick={() => setCover(p)}>Set cover</button>}
                    {p.status === 'published'
                      ? <button className="ad-mini" disabled={busy === p.id} onClick={() => patchPhoto(p, { status: 'hidden' })}>Hide</button>
                      : <button className="ad-mini pub" disabled={busy === p.id} onClick={() => patchPhoto(p, { status: 'published' })}>Show</button>}
                    <button className="ad-mini" disabled={busy === p.id} onClick={() => setEditPhoto(p)}>Edit</button>
                    <button className="ad-mini del" disabled={busy === p.id} onClick={() => removePhoto(p)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {adding && <AddPhotosModal albumId={albumId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
        {editAlbum && album && <AlbumModal album={album} onClose={() => setEditAlbum(false)} onSaved={() => { setEditAlbum(false); load(); }} />}
        {editPhoto && <PhotoEditModal photo={editPhoto} onClose={() => setEditPhoto(null)} onSaved={() => { setEditPhoto(null); load(); }} />}

        <style jsx>{`
          .ad { font-family: 'DM Sans', system-ui, sans-serif; }
          .ad-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
          /* next/link <a> -> :global() (+ !important to beat CDN Bootstrap link styling). */
          :global(.ad-back) { font-size: 13.5px; font-weight: 600; color: #4a5568 !important; text-decoration: none !important; }
          :global(.ad-back):hover { color: #0B1B3A !important; }
          .ad-top-actions { display: flex; gap: 8px; flex-wrap: wrap; }
          .ad-btn { border-radius: 10px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .ad-btn.ghost { background: #fff; border-color: #e5e9f2; color: #4a5568; }
          .ad-btn.ghost:hover { border-color: #0B1B3A; color: #0B1B3A; }
          .ad-btn.add { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .ad-btn.add:hover { background: #F5C356; }
          .ad-empty { padding: 48px; text-align: center; color: #94a3b8; font-size: 14px; }
          .ad-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
          .ad-card { border: 1px solid #e5e9f2; border-radius: 14px; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
          .ad-card.cover { border-color: #E8A020; box-shadow: 0 0 0 2px rgba(232,160,32,0.25); }
          .ad-thumb { position: relative; aspect-ratio: 1 / 1; background: #f4f6fb; }
          .ad-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .ad-thumb-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; }
          .ad-cover-badge { position: absolute; top: 7px; left: 7px; background: #E8A020; color: #0B1B3A; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 100px; }
          .ad-status { position: absolute; top: 7px; right: 7px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 8px; border-radius: 100px; }
          .ad-status.published { background: #dcfce7; color: #166534; }
          .ad-status.hidden { background: #f1f5f9; color: #64748b; }
          .ad-cap { font-size: 12px; color: #475569; line-height: 1.4; padding: 8px 10px 0; }
          .ad-actions { display: flex; gap: 5px; flex-wrap: wrap; padding: 10px; margin-top: auto; }
          .ad-mini { border: 1px solid #e5e9f2; background: #fff; color: #4a5568; border-radius: 7px; padding: 5px 9px; font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s ease; }
          .ad-mini:disabled { opacity: .5; cursor: not-allowed; }
          .ad-mini.pub { background: #16a34a; border-color: #16a34a; color: #fff; }
          .ad-mini.del:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }
          .ad-mini:hover:not(:disabled):not(.pub):not(.del) { border-color: #0B1B3A; color: #0B1B3A; }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}

/* ─── Add photos to the album (multi-select upload) ─── */
function AddPhotosModal({ albumId, onClose, onSaved }: { albumId: number; onClose: () => void; onSaved: () => void }) {
  const [picks, setPicks]     = useState<{ file: File; url: string }[]>([]);
  const [caption, setCaption] = useState('');
  const [saving, setSaving]   = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [msg, setMsg]         = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const isBulk = picks.length > 1;

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!chosen.length) return;
    const valid: { file: File; url: string }[] = [];
    for (const f of chosen) {
      if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setMsg(`${f.name}: only PNG, JPG or WEBP images.`); continue; }
      if (f.size > MAX_IMAGE) { setMsg(`${f.name} is larger than 5 MB and was skipped.`); continue; }
      valid.push({ file: f, url: URL.createObjectURL(f) });
    }
    if (!valid.length) return;
    setMsg(''); setPicks(prev => [...prev, ...valid]);
  };
  const removePick = (i: number) => setPicks(prev => { const u = prev[i]?.url; if (u) URL.revokeObjectURL(u); return prev.filter((_, k) => k !== i); });

  const save = async () => {
    if (picks.length === 0) { setMsg('Please choose one or more photos.'); return; }
    setSaving(true); setMsg('');
    try {
      const failed: string[] = [];
      setProgress({ done: 0, total: picks.length });
      for (let i = 0; i < picks.length; i++) {
        const fd = new FormData();
        fd.append('caption', isBulk ? '' : caption.trim());
        fd.append('status', 'published');
        fd.append('image', picks[i].file);
        try { await fetchWithAuth(`${BASE}/admin/gallery/albums/${albumId}/items`, { method: 'POST', body: fd }); }
        catch { failed.push(picks[i].file.name); }
        setProgress({ done: i + 1, total: picks.length });
      }
      if (failed.length === picks.length) { setMsg('Upload failed. Please try again.'); return; }
      if (failed.length) alert(`${failed.length} of ${picks.length} photo(s) failed (${failed.join(', ')}). The rest were added.`);
      onSaved();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Could not upload.'); }
    finally { setSaving(false); setProgress(null); }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="ap-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ap">
        <h3 className="ap-title">Add photos</h3>

        {picks.length > 0 ? (
          <div className="ap-picks">
            {picks.map((p, i) => (
              <div key={i} className="ap-pick"><img src={p.url} alt={`selected ${i + 1}`} /><button type="button" className="ap-pick-x" onClick={() => removePick(i)} disabled={saving} aria-label="Remove">✕</button></div>
            ))}
          </div>
        ) : (
          <button type="button" className="ap-dropzone" onClick={() => fileRef.current?.click()} disabled={saving}>
            <span style={{ fontSize: 30 }}>📷</span>
            <span className="ap-dz-title">Choose photo(s)</span>
            <span className="ap-dz-sub">select one or more to upload into this album</span>
          </button>
        )}
        {picks.length > 0 && <button type="button" className="ap-more" onClick={() => fileRef.current?.click()} disabled={saving}>+ Add more</button>}
        <div className="ap-hint">PNG / JPG / WEBP · up to 5&nbsp;MB each{picks.length ? ` · ${picks.length} selected` : ''}</div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onPick} hidden />

        {!isBulk && picks.length === 1 && (
          <>
            <label className="ap-label">Caption <span className="ap-note">(optional, shown in the album)</span></label>
            <input className="ap-input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Team building session" />
          </>
        )}
        {isBulk && <div className="ap-bulk">Uploading {picks.length} photos — add captions later by editing a photo.</div>}

        {msg && <div className="ap-msg">{msg}</div>}
        {progress && <div className="ap-prog"><div className="ap-prog-bar"><span style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div><div className="ap-prog-txt">Uploading {progress.done} of {progress.total}…</div></div>}

        <div className="ap-actions">
          <button className="ap-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ap-btn save" onClick={save} disabled={saving}>{saving ? (progress ? `Uploading ${progress.done}/${progress.total}…` : 'Uploading…') : picks.length > 1 ? `Add ${picks.length} photos` : 'Add photo'}</button>
        </div>

        <style jsx>{`
          :global(.ap-overlay) { position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; overflow-y: auto; }
          .ap { background: #fff; border-radius: 18px; padding: 24px; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 28px 70px rgba(0,0,0,0.4); }
          .ap-title { font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-weight: 700; color: #0B1B3A; margin: 0 0 16px; }
          .ap-dropzone { width: 100%; aspect-ratio: 16 / 7; border: 2px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; font-family: inherit; transition: border-color .18s ease, background .18s ease; }
          .ap-dropzone:hover:not(:disabled) { border-color: #E8A020; background: #fffbeb; }
          .ap-dz-title { font-size: 14px; font-weight: 700; color: #334155; }
          .ap-dz-sub { font-size: 12px; color: #94a3b8; }
          .ap-picks { display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 8px; max-height: 240px; overflow-y: auto; }
          .ap-pick { position: relative; aspect-ratio: 1 / 1; border-radius: 8px; overflow: hidden; border: 1px solid #e5e9f2; }
          .ap-pick img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .ap-pick-x { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(11,27,58,0.78); color: #fff; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
          .ap-pick-x:hover:not(:disabled) { background: #b91c1c; }
          .ap-more { margin-top: 10px; border: 1px dashed #cbd5e1; background: #f8fafc; color: #334155; border-radius: 9px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; }
          .ap-more:hover:not(:disabled) { border-color: #E8A020; background: #fffbeb; }
          .ap-hint { font-size: 11.5px; color: #94a3b8; margin-top: 8px; }
          .ap-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
          .ap-note { color: #94a3b8; font-weight: 400; }
          .ap-input { width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 10px 13px; font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; }
          .ap-input:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .ap-bulk { margin-top: 14px; font-size: 12.5px; color: #475569; background: #fffbeb; border: 1px solid #F5E1B0; border-radius: 10px; padding: 10px 12px; }
          .ap-msg { margin-top: 14px; font-size: 12.5px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 9px 12px; }
          .ap-prog { margin-top: 16px; }
          .ap-prog-bar { height: 8px; border-radius: 100px; background: #eef2f8; overflow: hidden; }
          .ap-prog-bar span { display: block; height: 100%; background: #E8A020; border-radius: 100px; transition: width 0.25s ease; }
          .ap-prog-txt { font-size: 12px; color: #64748b; margin-top: 6px; text-align: center; }
          .ap-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
          .ap-btn { border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .ap-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .ap-btn.save { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .ap-btn:disabled { opacity: .6; cursor: not-allowed; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Edit a single photo (caption, status, replace image) ─── */
function PhotoEditModal({ photo, onClose, onSaved }: { photo: Photo; onClose: () => void; onSaved: () => void }) {
  const [caption, setCaption] = useState(photo.caption ?? '');
  const [status, setStatus]   = useState<'published' | 'hidden'>(photo.status);
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(photo.image_url);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setMsg('Please choose a PNG, JPG or WEBP image.'); return; }
    if (f.size > MAX_IMAGE) { setMsg('That photo is larger than 5 MB.'); return; }
    setMsg(''); setFile(f); setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('caption', caption.trim());
      fd.append('status', status);
      if (file) fd.append('image', file);
      fd.append('_method', 'PUT');
      await fetchWithAuth(`${BASE}/admin/gallery/items/${photo.id}`, { method: 'POST', body: fd });
      onSaved();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Could not save.'); }
    finally { setSaving(false); }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pe-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pe">
        <h3 className="pe-title">Edit photo</h3>
        <div className="pe-file">
          {preview ? <img className="pe-preview" src={preview} alt="preview" /> : <div className="pe-preview pe-ph">no image</div>}
          <div>
            <button type="button" className="pe-file-btn" onClick={() => fileRef.current?.click()}>📷 Replace photo</button>
            <div className="pe-hint">Leave as-is to keep the current photo.</div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} hidden />
          </div>
        </div>
        <label className="pe-label">Caption</label>
        <input className="pe-input" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Shown in the album" />
        <label className="pe-check"><input type="checkbox" checked={status === 'published'} onChange={() => setStatus(s => s === 'published' ? 'hidden' : 'published')} /> Published (visible in the album)</label>
        {msg && <div className="pe-msg">{msg}</div>}
        <div className="pe-actions">
          <button className="pe-btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="pe-btn save" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>

        <style jsx>{`
          :global(.pe-overlay) { position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; overflow-y: auto; }
          .pe { background: #fff; border-radius: 18px; padding: 24px; width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif; box-shadow: 0 28px 70px rgba(0,0,0,0.4); }
          .pe-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0 0 16px; }
          .pe-file { display: flex; gap: 14px; align-items: center; }
          .pe-preview { width: 96px; height: 72px; border-radius: 10px; object-fit: cover; border: 1px solid #e5e9f2; flex-shrink: 0; }
          .pe-ph { display: flex; align-items: center; justify-content: center; background: #f4f6fb; color: #94a3b8; font-size: 11px; }
          .pe-file-btn { border: 1px dashed #cbd5e1; background: #f8fafc; color: #334155; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
          .pe-file-btn:hover { border-color: #E8A020; background: #fffbeb; }
          .pe-hint { font-size: 11.5px; color: #94a3b8; margin-top: 6px; }
          .pe-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 16px 0 6px; }
          .pe-input { width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 10px 13px; font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; }
          .pe-input:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .pe-check { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: #334155; cursor: pointer; margin-top: 16px; }
          .pe-check input { accent-color: #E8A020; }
          .pe-msg { margin-top: 14px; font-size: 12.5px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 9px 12px; }
          .pe-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
          .pe-btn { border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .pe-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .pe-btn.save { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .pe-btn:disabled { opacity: .6; cursor: not-allowed; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
