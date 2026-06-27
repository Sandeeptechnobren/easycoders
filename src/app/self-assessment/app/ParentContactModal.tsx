'use client';

import { useState } from 'react';
import type { AssessProfile } from './ProfileModal';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

/**
 * Blocking parent/guardian-contact gate. Shown to EasyCoders-enrolled students
 * (is_easycoders_student) who have not yet supplied parent contact. Until they
 * save, they cannot reach the assessments — the assessment "start" endpoint also
 * enforces this server-side, so this is the friendly front door, not the lock.
 * Direct EasyAssess signups never see it. A Log out link is the only escape so
 * nobody gets trapped.
 */
export default function ParentContactModal({
  open,
  initial,
  onSaved,
  onLogout,
}: {
  open: boolean;
  initial?: AssessProfile;
  onSaved: (p: AssessProfile) => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(initial?.parent_name || '');
  const [phone, setPhone] = useState(initial?.parent_phone || '');
  const [email, setEmail] = useState(initial?.parent_email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const save = async () => {
    const n = name.trim(), p = phone.trim(), e = email.trim();
    if (!n) { setError('Please enter your parent / guardian name.'); return; }
    if (!/^[0-9+\-\s()]{7,20}$/.test(p)) { setError('Please enter a valid parent / guardian phone number.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError('Please enter a valid parent / guardian email.'); return; }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('assessment_token');
      const fd = new FormData();
      fd.append('parent_name', n);
      fd.append('parent_phone', p);
      fd.append('parent_email', e);
      const res = await fetch(`${BASE}/assessment/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok || d?.status === false) {
        setError(d?.message || 'Could not save the details. Please try again.');
        setSaving(false);
        return;
      }
      onSaved((d.data as AssessProfile) || { ...initial, parent_name: n, parent_phone: p, parent_email: e, requires_parent_contact: false });
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="pc-overlay" role="dialog" aria-modal="true" aria-label="Parent contact required">
      <div className="pc-modal">
        <div className="pc-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="pc-title">One quick step before you begin</h2>
        <p className="pc-sub">
          Please add a parent / guardian contact. We share your assessment results with them, and
          it&rsquo;s required before you can start any assessment.
        </p>

        {error && <div className="pc-error">{error}</div>}

        <label className="pc-field">
          <span>Parent / guardian name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
        </label>
        <label className="pc-field">
          <span>Parent / guardian phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" />
        </label>
        <label className="pc-field">
          <span>Parent / guardian email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" inputMode="email" />
        </label>

        <button className="pc-save" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save & continue'}
        </button>
        <button className="pc-logout" onClick={onLogout} disabled={saving}>Log out instead</button>
      </div>

      <style>{`
        .pc-overlay { position: fixed; inset: 0; z-index: 2200; background: rgba(15,23,42,0.62); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; animation: pcFade .2s ease; }
        @keyframes pcFade { from { opacity: 0 } to { opacity: 1 } }
        .pc-modal { background: #fff; width: 100%; max-width: 440px; border-radius: 20px; padding: 30px 28px 24px; box-shadow: 0 24px 60px rgba(15,23,42,0.32); animation: pcRise .28s cubic-bezier(.22,1,.36,1); }
        @keyframes pcRise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        .pc-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 22px rgba(79,70,229,0.36); margin-bottom: 16px; }
        .pc-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
        .pc-sub { font-size: 13.5px; line-height: 1.55; color: #64748b; margin: 0 0 18px; }
        .pc-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 13px; padding: 10px 13px; border-radius: 10px; margin-bottom: 14px; }
        .pc-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 13px; }
        .pc-field > span { font-size: 12px; font-weight: 700; color: #475569; }
        .pc-field input { border: 1px solid #e2e8f0; border-radius: 11px; padding: 11px 13px; font-size: 14px; color: #0f172a; font-family: inherit; transition: border-color .15s, box-shadow .15s; }
        .pc-field input:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,0.16); }
        .pc-save { width: 100%; border: none; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; font-weight: 800; font-size: 14.5px; padding: 13px; border-radius: 12px; cursor: pointer; font-family: inherit; margin-top: 6px; transition: filter .15s; }
        .pc-save:hover { filter: brightness(1.07); }
        .pc-save:disabled { opacity: .6; cursor: not-allowed; }
        .pc-logout { width: 100%; border: none; background: none; color: #94a3b8; font-weight: 600; font-size: 12.5px; padding: 11px; cursor: pointer; font-family: inherit; }
        .pc-logout:hover { color: #64748b; text-decoration: underline; }
        .pc-logout:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
