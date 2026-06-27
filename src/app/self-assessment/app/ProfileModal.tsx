'use client';

import { useEffect, useRef, useState } from 'react';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

export type AssessProfile = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  gender?: string;
  date_of_birth?: string;
  course?: string;
  year?: string;
  avatar_url?: string | null;
  avatar_thumb_url?: string | null;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  is_easycoders_student?: boolean;
  requires_parent_contact?: boolean;
};

const TEXT_FIELDS: (keyof AssessProfile)[] = [
  'name', 'phone', 'address', 'city', 'state', 'country', 'postal_code', 'gender', 'date_of_birth', 'course', 'year',
  'parent_name', 'parent_phone', 'parent_email',
];

function initialsOf(name?: string) {
  return (name || '?').split(' ').map((n) => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';
}

/**
 * EasyAssess "My Profile" modal. Loads /assessment/me on open, lets the taker
 * edit their details + upload an avatar, and saves via /assessment/profile
 * (multipart). The avatar's original + thumbnail are produced server-side.
 */
export default function ProfileModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (p: AssessProfile) => void;
}) {
  const [form, setForm] = useState<AssessProfile>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setAvatarFile(null);
    setPreview(null);
    const token = localStorage.getItem('assessment_token');
    setLoading(true);
    fetch(`${BASE}/assessment/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d?.data) setForm(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (k: keyof AssessProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { setError('Image must be 4 MB or smaller.'); return; }
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const save = async () => {
    if (!form.name || !form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('assessment_token');
      const fd = new FormData();
      TEXT_FIELDS.forEach((k) => {
        const v = form[k];
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (avatarFile) fd.append('avatar', avatarFile);
      const res = await fetch(`${BASE}/assessment/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok || d?.status === false) {
        setError(d?.message || 'Could not save your profile. Please check the details and try again.');
        setSaving(false);
        return;
      }
      const p: AssessProfile = d.data || form;
      if (p.name) localStorage.setItem('logged_in_user', p.name);
      onSaved(p);
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = preview || form.avatar_url || form.avatar_thumb_url || null;

  return (
    <div className="pm-overlay" onMouseDown={onClose}>
      <div className="pm-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="My profile">
        <div className="pm-head">
          <div>
            <h2 className="pm-title">My Profile</h2>
            <p className="pm-sub">Update your details and photo</p>
          </div>
          <button className="pm-x" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="pm-body">
          {/* Avatar */}
          <div className="pm-avatar-row">
            <div className="pm-avatar">
              {currentAvatar
                ? <img src={currentAvatar} alt={form.name || 'Avatar'} />
                : <span>{initialsOf(form.name)}</span>}
            </div>
            <div className="pm-avatar-actions">
              <button type="button" className="pm-photo-btn" onClick={() => fileRef.current?.click()}>
                {currentAvatar ? 'Change photo' : 'Upload photo'}
              </button>
              <span className="pm-photo-hint">JPG, PNG or WebP · up to 4 MB</span>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} hidden />
            </div>
          </div>

          {error && <div className="pm-error">{error}</div>}

          <div className="pm-grid">
            <label className="pm-field pm-col2">
              <span>Full name</span>
              <input value={form.name || ''} onChange={set('name')} placeholder="Your name" />
            </label>
            <label className="pm-field">
              <span>Email</span>
              <input value={form.email || ''} disabled placeholder="—" />
            </label>
            <label className="pm-field">
              <span>Phone</span>
              <input value={form.phone || ''} onChange={set('phone')} placeholder="Phone number" />
            </label>
            <label className="pm-field">
              <span>Gender</span>
              <select value={form.gender || ''} onChange={set('gender')}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="pm-field">
              <span>Date of birth</span>
              <input type="date" value={(form.date_of_birth || '').slice(0, 10)} onChange={set('date_of_birth')} />
            </label>
            <label className="pm-field">
              <span>Course</span>
              <input value={form.course || ''} onChange={set('course')} placeholder="e.g. B.Tech CSE" />
            </label>
            <label className="pm-field">
              <span>Year</span>
              <input value={form.year || ''} onChange={set('year')} placeholder="e.g. 3rd year" />
            </label>
            <label className="pm-field pm-col2">
              <span>Address</span>
              <input value={form.address || ''} onChange={set('address')} placeholder="Street address" />
            </label>
            <label className="pm-field">
              <span>City</span>
              <input value={form.city || ''} onChange={set('city')} placeholder="City" />
            </label>
            <label className="pm-field">
              <span>State</span>
              <input value={form.state || ''} onChange={set('state')} placeholder="State" />
            </label>
            <label className="pm-field">
              <span>Country</span>
              <input value={form.country || ''} onChange={set('country')} placeholder="Country" />
            </label>
            <label className="pm-field">
              <span>Postal code</span>
              <input value={form.postal_code || ''} onChange={set('postal_code')} placeholder="PIN / ZIP" />
            </label>

            {form.is_easycoders_student && (
              <>
                <div className="pm-section pm-col2">Parent / Guardian contact</div>
                <label className="pm-field">
                  <span>Parent / guardian name</span>
                  <input value={form.parent_name || ''} onChange={set('parent_name')} placeholder="Full name" />
                </label>
                <label className="pm-field">
                  <span>Parent / guardian phone</span>
                  <input value={form.parent_phone || ''} onChange={set('parent_phone')} placeholder="Phone number" />
                </label>
                <label className="pm-field pm-col2">
                  <span>Parent / guardian email</span>
                  <input value={form.parent_email || ''} onChange={set('parent_email')} placeholder="name@example.com" />
                </label>
              </>
            )}
          </div>
          {loading && <div className="pm-loading">Loading your profile…</div>}
        </div>

        <div className="pm-foot">
          <button className="pm-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="pm-save" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <style>{`
        .pm-overlay { position: fixed; inset: 0; z-index: 2000; background: rgba(15,23,42,0.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; animation: pmFade .2s ease; }
        @keyframes pmFade { from { opacity: 0 } to { opacity: 1 } }
        .pm-modal { background: #fff; width: 100%; max-width: 620px; max-height: 92vh; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(15,23,42,0.28); animation: pmRise .26s cubic-bezier(.22,1,.36,1); }
        @keyframes pmRise { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        .pm-head { display: flex; align-items: flex-start; justify-content: space-between; padding: 22px 24px 16px; border-bottom: 1px solid #eef2f7; }
        .pm-title { font-size: 19px; font-weight: 800; color: #0f172a; margin: 0; }
        .pm-sub { font-size: 13px; color: #94a3b8; margin: 2px 0 0; }
        .pm-x { border: none; background: #f1f5f9; color: #64748b; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; }
        .pm-x:hover { background: #e2e8f0; color: #0f172a; }
        .pm-body { padding: 20px 24px; overflow-y: auto; }
        .pm-avatar-row { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
        .pm-avatar { width: 84px; height: 84px; border-radius: 50%; overflow: hidden; background: linear-gradient(135deg,#7c3aed,#4f46e5); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 28px; font-weight: 800; flex-shrink: 0; box-shadow: 0 6px 18px rgba(79,70,229,0.32); }
        .pm-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pm-photo-btn { border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 13px; padding: 9px 16px; border-radius: 10px; cursor: pointer; transition: background .15s; font-family: inherit; }
        .pm-photo-btn:hover { background: #e0e7ff; }
        .pm-photo-hint { display: block; font-size: 11.5px; color: #94a3b8; margin-top: 7px; }
        .pm-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 13px; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; }
        .pm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .pm-col2 { grid-column: 1 / -1; }
        .pm-section { font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: #6366f1; margin: 6px 0 -4px; }
        .pm-field { display: flex; flex-direction: column; gap: 6px; }
        .pm-field > span { font-size: 12px; font-weight: 700; color: #475569; }
        .pm-field input, .pm-field select { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 14px; color: #0f172a; font-family: inherit; background: #fff; transition: border-color .15s, box-shadow .15s; }
        .pm-field input:focus, .pm-field select:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .pm-field input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .pm-loading { text-align: center; color: #94a3b8; font-size: 13px; padding: 12px 0 0; }
        .pm-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #eef2f7; background: #f8fafc; }
        .pm-cancel { border: 1px solid #e2e8f0; background: #fff; color: #475569; font-weight: 700; font-size: 14px; padding: 11px 20px; border-radius: 11px; cursor: pointer; font-family: inherit; }
        .pm-cancel:hover { background: #f1f5f9; }
        .pm-save { border: none; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; font-weight: 700; font-size: 14px; padding: 11px 24px; border-radius: 11px; cursor: pointer; font-family: inherit; transition: filter .15s; }
        .pm-save:hover { filter: brightness(1.07); }
        .pm-save:disabled, .pm-cancel:disabled { opacity: .6; cursor: not-allowed; }
        @media (max-width: 520px) { .pm-grid { grid-template-columns: 1fr; } .pm-col2 { grid-column: auto; } }
      `}</style>
    </div>
  );
}
