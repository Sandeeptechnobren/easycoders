'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/* Student-facing "Share your story" card for the student dashboard.
 *
 * A student may hold ONE review. This card:
 *   • shows a submission form when they have none,
 *   • shows their existing review + moderation status otherwise,
 *   • lets them edit/resubmit while it is not yet published.
 * Photo is REQUIRED on a new submission (matches the backend rule). Uploads go
 * as multipart via fetchWithAuth (no Content-Type set → browser adds the
 * boundary); edits use POST + _method=PUT so the file survives. Self-contained,
 * mirroring MyCertificatesCard. */

const BASE = 'https://api.easycoders.in/api';
const MAX_IMAGE = 2 * 1024 * 1024; // 2 MB — matches the backend max:2048

type Review = {
  id: number;
  name: string;
  headline: string | null;
  body: string;
  rating: number;
  image_url: string | null;
  status: 'pending' | 'published' | 'rejected';
  featured: boolean;
  created_at: string | null;
};

const STATUS_META: Record<Review['status'], { label: string; bg: string; color: string; note: string }> = {
  pending:   { label: 'Pending review', bg: '#fffbeb', color: '#b45309', note: 'Our team will review it shortly. You can still edit it until it goes live.' },
  published: { label: 'Published',       bg: '#f0fdf4', color: '#15803d', note: 'Your story is live on the Easy Coders website. Thank you! 🎉' },
  rejected:  { label: 'Not approved',    bg: '#fef2f2', color: '#b91c1c', note: 'This review was not approved. You can edit it and submit again.' },
};

export default function MyReviewCard() {
  const { user } = useAuth();
  const [review, setReview]   = useState<Review | null>(null);
  const [loaded, setLoaded]   = useState(false);

  const [editing, setEditing] = useState(false);
  const [rating, setRating]   = useState(5);
  const [hover, setHover]     = useState(0);
  const [headline, setHeadline] = useState('');
  const [body, setBody]       = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    fetchWithAuth(`${BASE}/my-reviews`)
      .then(r => {
        const list: Review[] = Array.isArray(r?.data) ? r.data : [];
        setReview(list[0] ?? null);
      })
      .catch(() => setReview(null))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = (from?: Review | null) => {
    setMsg('');
    setRating(from?.rating ?? 5);
    setHeadline(from?.headline ?? '');
    setBody(from?.body ?? '');
    setImageFile(null);
    setPreview(from?.image_url ?? null);
    setEditing(true);
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { setMsg('Please choose a PNG, JPG or WEBP image.'); return; }
    if (f.size > MAX_IMAGE) { setMsg('That photo is larger than 2 MB. Please choose a smaller one.'); return; }
    setMsg('');
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim())          { setMsg('Please write your review.'); return; }
    if (rating < 1 || rating > 5) { setMsg('Please pick a star rating.'); return; }
    const isEdit = !!review;
    if (!isEdit && !imageFile) { setMsg('A photo is required to submit your review.'); return; }

    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('body', body.trim());
      fd.append('rating', String(rating));
      fd.append('headline', headline.trim());
      if (imageFile) fd.append('image', imageFile);
      if (isEdit) fd.append('_method', 'PUT');

      // No Content-Type — the browser sets the multipart boundary.
      await fetchWithAuth(`${BASE}/${isEdit ? `my-reviews/${review!.id}` : 'reviews'}`, {
        method: 'POST',
        body: fd,
      });
      setEditing(false);
      load();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Could not submit your review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  const canEdit = review && review.status !== 'published';

  return (
    <div className="mrc-card">
      <style>{`
        .mrc-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
          padding: 20px 24px; margin: 0 0 22px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .mrc-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .mrc-head-icon { width: 36px; height: 36px; border-radius: 10px; background: #fffbeb; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .mrc-title { font-size: 15px; font-weight: 700; color: #0f172a; }
        .mrc-sub { font-size: 12px; color: #94a3b8; }
        .mrc-badge { margin-left: auto; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; white-space: nowrap; }
        .mrc-view { display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap; padding: 14px; border: 1px solid #eef2f7; border-radius: 14px; background: #f8fafc; }
        .mrc-photo { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; flex-shrink: 0; border: 1px solid #e2e8f0; }
        .mrc-stars { color: #E8A020; font-size: 14px; letter-spacing: 2px; }
        .mrc-body-text { font-size: 13.5px; color: #334155; line-height: 1.6; margin: 4px 0 0; font-style: italic; }
        .mrc-note { font-size: 12px; color: #64748b; margin-top: 12px; line-height: 1.5; }
        .mrc-prompt { font-size: 13.5px; color: #475569; line-height: 1.6; margin: 0 0 14px; }
        .mrc-btn { display: inline-flex; align-items: center; gap: 8px; background: #E8A020; color: #0B1B3A; border: 1.5px solid #E8A020; border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background .18s ease, transform .15s ease; }
        .mrc-btn:hover:not(:disabled) { background: #F5C356; border-color: #F5C356; transform: translateY(-1px); }
        .mrc-btn:disabled { opacity: .6; cursor: not-allowed; }
        .mrc-btn.ghost { background: transparent; color: #475569; border-color: #e2e8f0; }
        .mrc-btn.ghost:hover:not(:disabled) { border-color: #0B1B3A; color: #0B1B3A; background: transparent; transform: none; }
        .mrc-form { display: flex; flex-direction: column; gap: 14px; }
        .mrc-label { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block; }
        .mrc-star-pick { display: inline-flex; gap: 4px; }
        .mrc-star-pick button { background: none; border: none; cursor: pointer; font-size: 26px; line-height: 1; color: #E8A020; padding: 0; transition: transform .12s ease; }
        .mrc-star-pick button:hover { transform: scale(1.15); }
        .mrc-input, .mrc-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 11px; padding: 11px 14px; font-size: 14px; font-family: inherit; color: #0f172a; outline: none; transition: border-color .18s ease, box-shadow .18s ease; }
        .mrc-input:focus, .mrc-textarea:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
        .mrc-textarea { min-height: 92px; resize: vertical; line-height: 1.55; }
        .mrc-file-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .mrc-file-btn { display: inline-flex; align-items: center; gap: 8px; border: 1px dashed #cbd5e1; background: #f8fafc; color: #334155; border-radius: 11px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .mrc-file-btn:hover { border-color: #E8A020; background: #fffbeb; }
        .mrc-file-hint { font-size: 12px; color: #94a3b8; }
        .mrc-preview { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0; }
        .mrc-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .mrc-msg { font-size: 12.5px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 9px 12px; }
      `}</style>

      <div className="mrc-head">
        <div className="mrc-head-icon">⭐</div>
        <div>
          <div className="mrc-title">Share Your Story</div>
          <div className="mrc-sub">Tell future students about your Easy Coders experience</div>
        </div>
        {review && !editing && (
          <span className="mrc-badge" style={{ background: STATUS_META[review.status].bg, color: STATUS_META[review.status].color }}>
            {STATUS_META[review.status].label}
          </span>
        )}
      </div>

      {/* ─── Existing review (not editing) ─── */}
      {review && !editing && (
        <>
          <div className="mrc-view">
            {review.image_url && <img className="mrc-photo" src={review.image_url} alt={review.name} />}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mrc-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              <p className="mrc-body-text">&ldquo;{review.body}&rdquo;</p>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>{review.name}</div>
              {review.headline && <div style={{ fontSize: 12, color: '#94a3b8' }}>{review.headline}</div>}
            </div>
          </div>
          <p className="mrc-note">{STATUS_META[review.status].note}</p>
          {canEdit && (
            <div style={{ marginTop: 12 }}>
              <button type="button" className="mrc-btn ghost" onClick={() => openForm(review)}>Edit my review</button>
            </div>
          )}
        </>
      )}

      {/* ─── No review yet (prompt) ─── */}
      {!review && !editing && (
        <>
          <p className="mrc-prompt">
            Loved learning with us? Share a short review and a photo — once approved, it appears on the Easy Coders homepage.
          </p>
          <button type="button" className="mrc-btn" onClick={() => openForm(null)}>
            Write a review
            <span aria-hidden="true">→</span>
          </button>
        </>
      )}

      {/* ─── Form (new or edit) ─── */}
      {editing && (
        <form className="mrc-form" onSubmit={submit}>
          <div>
            <label className="mrc-label">Your rating</label>
            <div className="mrc-star-pick" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  {n <= (hover || rating) ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mrc-label">Your headline <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
            <input
              className="mrc-input"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Full-Stack Developer · MERN 2026"
              maxLength={120}
            />
          </div>

          <div>
            <label className="mrc-label">Your review</label>
            <textarea
              className="mrc-textarea"
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What did you learn, and how did Easy Coders help you get there?"
              maxLength={2000}
              required
            />
          </div>

          <div>
            <label className="mrc-label">Your photo {review ? '' : <span style={{ color: '#E8A020' }}>(required)</span>}</label>
            <div className="mrc-file-row">
              {preview && <img className="mrc-preview" src={preview} alt="preview" />}
              <button type="button" className="mrc-file-btn" onClick={() => fileRef.current?.click()}>
                📷 {preview ? 'Change photo' : 'Choose a photo'}
              </button>
              <span className="mrc-file-hint">PNG / JPG / WEBP · up to 2&nbsp;MB{review ? ' · leave as-is to keep your current photo' : ''}</span>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickImage} hidden />
            </div>
          </div>

          {msg && <div className="mrc-msg">{msg}</div>}

          <div style={{ fontSize: 12, color: '#94a3b8' }}>Posting as <strong style={{ color: '#475569' }}>{user?.name || 'you'}</strong> · your review is checked by our team before it goes live.</div>

          <div className="mrc-actions">
            <button type="submit" className="mrc-btn" disabled={saving}>
              {saving ? 'Submitting…' : review ? 'Save & resubmit' : 'Submit review'}
            </button>
            <button type="button" className="mrc-btn ghost" onClick={() => { setEditing(false); setMsg(''); }} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
