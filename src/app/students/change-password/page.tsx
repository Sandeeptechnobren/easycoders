'use client';

import RoleGuard from '@/components/RoleGuard';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

/* ──────────────────────────────────────────────────────────────────────────
 * /students/change-password — first-login password change
 *
 * A student admitted through the admin console signs in with a temporary
 * password and is routed here (LoginModal checks user.requires_password_change).
 * On success the backend clears the temp-password state and we send them on
 * to the student dashboard.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/api';

export default function StudentChangePasswordPage() {
  const router = useRouter();

  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  /* Simple strength read-out: length + character-class variety. */
  const strength = useMemo(() => {
    const p = next;
    if (!p) return { score: 0, label: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const label = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong';
    return { score: Math.min(score, 5), label };
  }, [next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError('New password and confirmation do not match.'); return; }
    if (next === current) { setError('New password must be different from the temporary one.'); return; }

    setSaving(true);
    try {
      await fetchWithAuth(`${BASE}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: current,
          new_password: next,
          new_password_confirmation: confirm,
        }),
      });
      // Reflect the cleared flag locally so a refresh doesn't bounce back here.
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          u.requires_password_change = false;
          u.must_change_password = false;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch { /* ignore */ }
      router.push('/student-dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not change your password. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <RoleGuard allowedRoles={[3]}>
      <div className="cp-page">
        <style jsx>{`
          :global(.cp-page a) { color: inherit; text-decoration: none; }
          .cp-page {
            min-height: 100vh;
            background: linear-gradient(180deg, #0B1B3A 0%, #07122A 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 130px 20px 60px;
            font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
            position: relative;
            overflow: hidden;
          }
          .cp-page::before {
            content: '';
            position: absolute; inset: 0;
            background:
              radial-gradient(ellipse 700px 400px at 80% 20%, rgba(232,160,32,0.14) 0%, transparent 60%),
              radial-gradient(ellipse 500px 320px at 10% 90%, rgba(26,86,219,0.20) 0%, transparent 70%);
            pointer-events: none;
          }
          .cp-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 440px;
            background: #fff;
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(7,18,42,0.4);
          }
          .cp-band {
            height: 5px;
            background: linear-gradient(90deg, #E8A020, #F5C356, #E8A020);
          }
          .cp-body { padding: 32px 34px 34px; }
          .cp-eyebrow {
            display: inline-flex; align-items: center; gap: 7px;
            background: #FEF6E7; color: #B97A0F;
            border: 1px solid rgba(232,160,32,0.34);
            font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
            text-transform: uppercase; padding: 5px 12px; border-radius: 100px;
            margin-bottom: 14px;
          }
          .cp-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 26px; font-weight: 700; color: #0B1B3A; margin: 0 0 6px;
            letter-spacing: -0.01em;
          }
          .cp-sub { font-size: 14px; color: #4A5568; margin: 0 0 24px; line-height: 1.55; }
          .cp-fld { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
          .cp-lbl { font-size: 12px; font-weight: 600; color: #0B1B3A; letter-spacing: 0.04em; text-transform: uppercase; }
          .cp-in {
            background: #F8FAFC; border: 1.5px solid #E5E9F2; border-radius: 12px;
            padding: 12px 14px; font-family: inherit; font-size: 14.5px; color: #0B1B3A;
            outline: none; width: 100%; box-sizing: border-box;
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          }
          .cp-in:focus { background: #fff; border-color: #E8A020; box-shadow: 0 0 0 4px rgba(232,160,32,0.14); }

          .cp-meter { display: flex; gap: 4px; margin-top: 8px; }
          .cp-meter-seg { height: 4px; flex: 1; border-radius: 100px; background: #E5E9F2; transition: background 0.2s ease; }
          .cp-meter-seg.on-weak   { background: #EF4444; }
          .cp-meter-seg.on-fair   { background: #E8A020; }
          .cp-meter-seg.on-strong { background: #22C55E; }
          .cp-meter-label { font-size: 11px; font-weight: 600; margin-top: 5px; }
          .cp-meter-label.weak { color: #991B1B; }
          .cp-meter-label.fair { color: #92660D; }
          .cp-meter-label.strong { color: #166534; }

          .cp-show {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 12px; color: #4A5568; cursor: pointer; user-select: none; margin-bottom: 18px;
          }
          .cp-show input { accent-color: #E8A020; width: 15px; height: 15px; }

          .cp-error {
            background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5;
            border-radius: 10px; padding: 10px 13px; font-size: 13px; margin-bottom: 16px;
          }

          .cp-submit {
            width: 100%; padding: 14px; border: none; border-radius: 12px;
            font-family: inherit; font-size: 14.5px; font-weight: 700; letter-spacing: 0.02em;
            background: #0B1B3A; color: #fff; cursor: pointer;
            transition: background 0.18s ease, transform 0.15s ease;
          }
          .cp-submit:hover:not(:disabled) { background: #E8A020; color: #0B1B3A; }
          .cp-submit:active { transform: translateY(1px); }
          .cp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>

        <div className="cp-card">
          <div className="cp-band" />
          <div className="cp-body">
            <span className="cp-eyebrow">First sign-in</span>
            <h1 className="cp-title">Set your password</h1>
            <p className="cp-sub">
              You signed in with a temporary password. Choose a new one to secure your account
              and reach your dashboard.
            </p>

            {error && <div className="cp-error">{error}</div>}

            <form onSubmit={submit}>
              <div className="cp-fld">
                <label className="cp-lbl">Temporary password</label>
                <input className="cp-in" type={show ? 'text' : 'password'} value={current}
                  autoComplete="current-password"
                  placeholder="The password you just signed in with"
                  onChange={e => setCurrent(e.target.value)} required />
              </div>

              <div className="cp-fld">
                <label className="cp-lbl">New password</label>
                <input className="cp-in" type={show ? 'text' : 'password'} value={next}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  onChange={e => setNext(e.target.value)} required />
                {next && (
                  <>
                    <div className="cp-meter" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map(i => (
                        <span key={i} className={`cp-meter-seg ${
                          i < strength.score
                            ? (strength.label === 'Weak' ? 'on-weak' : strength.label === 'Fair' ? 'on-fair' : 'on-strong')
                            : ''}`} />
                      ))}
                    </div>
                    <span className={`cp-meter-label ${strength.label.toLowerCase()}`}>{strength.label} password</span>
                  </>
                )}
              </div>

              <div className="cp-fld">
                <label className="cp-lbl">Confirm new password</label>
                <input className="cp-in" type={show ? 'text' : 'password'} value={confirm}
                  autoComplete="new-password"
                  placeholder="Re-enter the new password"
                  onChange={e => setConfirm(e.target.value)} required />
              </div>

              <label className="cp-show">
                <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />
                Show passwords
              </label>

              <button type="submit" className="cp-submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save password & continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
