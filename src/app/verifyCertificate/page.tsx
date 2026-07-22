'use client';

import React, { useEffect, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
 * Public certificate verification (/verifyCertificate).
 *
 * Re-skinned June 2026 from an off-brand purple/glass theme to the EasyCoders
 * navy + gold + teal identity (matches the home hero / PageHeader). Also:
 *  - Wired to the working backend endpoint
 *    GET /api/certificate/verify?certificate_code=… (was hitting a 404 path).
 *  - Auto-verifies when opened with `?code=…` (the QR printed on each
 *    certificate links here), so scanning the certificate verifies in one tap.
 *  - Surfaces the holder's NAME and the certificate's ISSUE DATE as the
 *    headline of the result, with the assessment / score / code beneath.
 * ────────────────────────────────────────────────────────────────────────── */

type VerifyData = {
  type?: 'assessment' | 'course_completion' | 'elite_alumni_card';
  certificate_code: string;
  user: { id: number; name: string; email: string };
  assessment?: { id: number; title: string };
  score?: number;
  completed_at?: string;
  // course-completion certificates
  course?: string;
  tech_field?: string;
  duration?: string;
  grade?: string;
  // elite alumni cards
  membership_label?: string;
  benefits?: string[];
  member_since?: string;
};

type VerifyApiResponse = {
  success: boolean;
  message: string;
  data?: VerifyData;
};

const API =
  'https://api.easycoders.in/projects/backend/public/api/certificate/verify';
const COURSE_API =
  'https://api.easycoders.in/projects/backend/public/api/course-completion/verify';
const ELITE_API =
  'https://api.easycoders.in/projects/backend/public/api/elite-card/verify';

export default function VerifyCertificate() {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<VerifyApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [openModal, setOpenModal] = useState(false);

  const runVerify = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setOpenModal(false);

    try {
      // 1) Assessment certificates.
      const res = await fetch(
        `${API}?certificate_code=${encodeURIComponent(code)}`,
        { method: 'GET', headers: { Accept: 'application/json' } },
      );
      const json: VerifyApiResponse = await res.json().catch(() => ({ success: false, message: '' } as VerifyApiResponse));
      if (res.ok && json?.success && json.data) {
        setResult({ ...json.data, type: 'assessment' });
        setOpenModal(true);
        return;
      }

      // 2) Course-completion certificates (offline courses).
      const res2 = await fetch(
        `${COURSE_API}?code=${encodeURIComponent(code)}`,
        { method: 'GET', headers: { Accept: 'application/json' } },
      );
      const json2: VerifyApiResponse = await res2.json().catch(() => ({ success: false, message: '' } as VerifyApiResponse));
      if (res2.ok && json2?.success && json2.data) {
        const d = json2.data;
        setResult({
          type: 'course_completion',
          certificate_code: d.certificate_code,
          user: d.user,
          completed_at: d.completed_at ?? (d as { completed_on?: string }).completed_on,
          course: d.course,
          tech_field: d.tech_field,
          duration: d.duration,
          grade: d.grade,
        });
        setOpenModal(true);
        return;
      }

      // 3) Elite Alumni Cards.
      const res3 = await fetch(
        `${ELITE_API}?code=${encodeURIComponent(code)}`,
        { method: 'GET', headers: { Accept: 'application/json' } },
      );
      const json3: VerifyApiResponse & { data?: { card_number?: string; holder?: string; membership_label?: string; benefits?: string[]; member_since?: string; issued_on?: string } } =
        await res3.json().catch(() => ({ success: false, message: '' } as VerifyApiResponse));
      if (res3.ok && json3?.success && json3.data) {
        const d = json3.data;
        setResult({
          type: 'elite_alumni_card',
          certificate_code: d.card_number ?? code,
          user: { id: 0, name: d.holder ?? '', email: '' },
          completed_at: d.issued_on,
          membership_label: d.membership_label,
          benefits: d.benefits,
          member_since: d.member_since,
        });
        setOpenModal(true);
        return;
      }

      setErrorMsg(json3?.message || json2?.message || json?.message || 'Certificate not found. Please check the ID.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    runVerify(identifier);
  };

  /* Auto-verify when arriving from a certificate QR (…/verifyCertificate?code=EC…).
     Reads window.location directly (no useSearchParams) to avoid forcing a
     Suspense boundary around the page. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      setIdentifier(code.toUpperCase());
      runVerify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => setOpenModal(false);
  const resetAll = () => {
    setResult(null);
    setIdentifier('');
    setErrorMsg('');
    setOpenModal(false);
  };

  const formattedDate = result?.completed_at
    ? new Date(result.completed_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .vc-page {
          --navy: #0B1B3A;
          --navy-mid: #152D5A;
          --gold: #E8A020;
          --gold-light: #F5C356;
          --teal: #1AA5BB;
          --slate: #4A5568;
          --border: #E5E9F2;
          font-family: 'DM Sans', system-ui, sans-serif;
          width: 100%; min-height: 100vh;
          background: var(--navy);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding: 140px 20px 90px;
        }
        .vc-page::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 680px 460px at 80% 12%, rgba(26,165,187,0.20) 0%, transparent 66%),
            radial-gradient(ellipse 520px 420px at 12% 78%, rgba(232,160,32,0.16) 0%, transparent 62%);
        }

        /* Concentric seal rings — gold/teal, faint */
        .vc-ring {
          position: absolute; border-radius: 50%; pointer-events: none;
          top: 220px; left: 50%; transform: translateX(-50%);
        }
        .vc-ring-1 { width: 620px; height: 620px; border: 1px solid rgba(232,160,32,0.10); }
        .vc-ring-2 { width: 920px; height: 920px; border: 1px solid rgba(26,165,187,0.07); }
        .vc-ring-3 { width: 1240px; height: 1240px; border: 1px solid rgba(255,255,255,0.04); }

        /* Badge */
        .vc-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(232,160,32,0.12); border: 1px solid rgba(232,160,32,0.42);
          border-radius: 100px; padding: 7px 16px;
          font-size: 12px; font-weight: 600; color: var(--gold-light);
          letter-spacing: 0.06em; text-transform: uppercase;
          margin-bottom: 22px; position: relative; z-index: 1;
        }
        .vc-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }

        /* Heading */
        .vc-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(30px, 5vw, 50px); font-weight: 900;
          color: #fff; text-align: center; margin: 0 0 10px;
          position: relative; z-index: 1; line-height: 1.12; letter-spacing: -0.01em;
        }
        .vc-heading em { color: var(--gold); font-style: italic; }
        .vc-subheading {
          font-size: 16px; color: rgba(255,255,255,0.72); text-align: center;
          margin: 0 0 38px; position: relative; z-index: 1; font-weight: 300;
          max-width: 460px;
        }

        /* Card — solid deep-navy panel (no glass) */
        .vc-card {
          width: 100%; max-width: 460px; position: relative; z-index: 1;
          background: #0E2148;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 20px; padding: 32px;
          box-shadow: 0 30px 70px rgba(0,0,0,0.42);
        }
        .vc-card::before {
          content: ''; position: absolute; top: 0; left: 32px; right: 32px; height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.7;
        }

        .vc-label {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.6);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 9px; display: block;
        }

        .vc-input-wrap { position: relative; }
        .vc-input-icon {
          position: absolute; left: 15px; top: 50%; transform: translateY(-50%);
          color: var(--gold); display: inline-flex; pointer-events: none;
        }
        .vc-input {
          width: 100%; height: 54px; padding: 0 16px 0 46px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.14);
          border-radius: 13px; font-size: 15px; color: #fff;
          font-family: inherit; font-weight: 600; outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
          letter-spacing: 0.04em;
        }
        .vc-input::placeholder { color: rgba(255,255,255,0.32); font-weight: 400; letter-spacing: 0; }
        .vc-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 4px rgba(232,160,32,0.16);
          background: rgba(255,255,255,0.08);
        }

        .vc-error {
          display: flex; align-items: center; gap: 9px;
          margin-top: 12px; padding: 11px 14px;
          background: rgba(220,38,38,0.14); border: 1px solid rgba(220,38,38,0.3);
          border-radius: 12px; font-size: 13px; color: #fca5a5; line-height: 1.45;
        }
        .vc-error svg { flex-shrink: 0; }

        .vc-hint {
          margin-top: 12px; font-size: 12px; color: rgba(255,255,255,0.38);
          text-align: center;
        }
        .vc-hint button {
          background: none; border: none; padding: 0; cursor: pointer;
          color: var(--gold-light); font-weight: 700; font-family: inherit; font-size: 12px;
          letter-spacing: 0.04em;
        }
        .vc-hint button:hover { text-decoration: underline; }

        /* Submit — brand gold pill */
        .vc-submit {
          width: 100%; height: 54px; margin-top: 22px;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          border: none; border-radius: 13px;
          font-size: 15px; font-weight: 700; color: var(--navy);
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: transform .15s ease, box-shadow .2s ease;
          box-shadow: 0 10px 26px rgba(232,160,32,0.34);
        }
        .vc-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 32px rgba(232,160,32,0.45); }
        .vc-submit:disabled { opacity: .65; cursor: not-allowed; }
        .vc-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(11,27,58,0.3);
          border-top-color: var(--navy); border-radius: 50%;
          animation: vc-spin .7s linear infinite;
        }
        @keyframes vc-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .vc-submit:hover:not(:disabled) { transform: none; }
        }

        /* Trust row */
        .vc-trust {
          display: flex; align-items: center; justify-content: center; gap: 18px;
          margin-top: 30px; position: relative; z-index: 1; flex-wrap: wrap;
        }
        .vc-trust-item {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 500;
        }
        .vc-trust-item svg { color: var(--teal); }
        .vc-trust-sep { width: 1px; height: 14px; background: rgba(255,255,255,0.14); }

        /* ===== MODAL ===== */
        .vc-overlay {
          position: fixed; inset: 0; background: rgba(7,18,42,0.78);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; z-index: 9999; animation: vc-fade .2s ease;
        }
        @keyframes vc-fade { from { opacity: 0; } to { opacity: 1; } }

        .vc-modal {
          width: 100%; max-width: 520px; background: #fff;
          border-radius: 22px; overflow: hidden;
          box-shadow: 0 40px 90px rgba(7,18,42,0.5);
          animation: vc-rise .28s cubic-bezier(.16,1,.3,1);
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        @keyframes vc-rise { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .vc-overlay, .vc-modal { animation: none; } }

        /* Banner */
        .vc-modal-banner {
          background: linear-gradient(135deg, #0B1B3A, #152D5A);
          padding: 30px 28px 26px; text-align: center; position: relative;
          overflow: hidden;
        }
        .vc-modal-banner::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 320px 200px at 50% -10%, rgba(232,160,32,0.22), transparent 70%);
        }
        .vc-modal-close {
          position: absolute; top: 15px; right: 15px; z-index: 1;
          width: 32px; height: 32px; border-radius: 10px;
          background: rgba(255,255,255,0.12); border: none;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .vc-modal-close:hover { background: rgba(255,255,255,0.24); }
        .vc-seal {
          width: 62px; height: 62px; border-radius: 50%; position: relative; z-index: 1;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          border: 3px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px; color: var(--navy);
          box-shadow: 0 8px 20px rgba(232,160,32,0.4);
        }
        .vc-modal-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 5px;
          position: relative; z-index: 1; letter-spacing: -0.01em;
        }
        .vc-modal-sub { font-size: 13px; color: rgba(255,255,255,0.72); position: relative; z-index: 1; }

        /* Headline block — NAME + ISSUE DATE (the answer to "who & when") */
        .vc-headline {
          margin: 22px 28px 4px; padding: 20px 22px;
          background: #FBF7EE; border: 1px solid #EFE6D2; border-radius: 16px;
          text-align: center;
        }
        .vc-headline-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: #8A5A0B; margin-bottom: 6px;
        }
        .vc-headline-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px; font-weight: 700; color: var(--navy); line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .vc-headline-date { font-size: 13px; color: var(--slate); margin-top: 8px; font-weight: 500; }
        .vc-headline-date strong { color: var(--navy); font-weight: 700; }

        /* Detail rows */
        .vc-modal-body { padding: 16px 28px 0; }
        .vc-detail-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 13px 0; border-bottom: 1px solid #EEF1F7;
        }
        .vc-detail-row:last-child { border-bottom: none; }
        .vc-detail-key { font-size: 12px; color: var(--slate); font-weight: 600; flex-shrink: 0; }
        .vc-detail-val { font-size: 13px; color: var(--navy); font-weight: 700; text-align: right; }
        .vc-detail-val.email { color: var(--teal); font-weight: 600; }

        .vc-score-val {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 46px; height: 26px; padding: 0 11px;
          background: #FEF6E7; border: 1px solid #F3DDA8;
          border-radius: 100px; font-size: 13px; font-weight: 800; color: #8A5A0B;
        }
        .vc-code-chip {
          font-size: 12px; font-weight: 800;
          font-family: 'DM Sans', monospace;
          background: var(--navy); color: var(--gold-light);
          border-radius: 8px; padding: 4px 11px; letter-spacing: 0.06em;
        }

        /* Footer */
        .vc-modal-footer { padding: 22px 28px 26px; display: flex; gap: 10px; }
        .vc-btn-primary {
          flex: 1; height: 46px;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          border: none; border-radius: 12px; font-size: 14px; font-weight: 700;
          color: var(--navy); cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform .15s ease, box-shadow .2s ease;
        }
        .vc-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(232,160,32,0.3); }
        .vc-btn-secondary {
          flex: 1; height: 46px; background: #fff;
          border: 1px solid var(--border); border-radius: 12px;
          font-size: 14px; font-weight: 700; color: var(--slate);
          cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s;
        }
        .vc-btn-secondary:hover { background: #F4F6FB; border-color: #d4dbe9; }
        @media (prefers-reduced-motion: reduce) { .vc-btn-primary:hover { transform: none; } }
      `}</style>

      <div className="vc-page">
        <div className="vc-ring vc-ring-1" />
        <div className="vc-ring vc-ring-2" />
        <div className="vc-ring vc-ring-3" />

        <div className="vc-badge">
          <span className="vc-badge-dot" />
          Easy Coders · Certificate Authority
        </div>

        <h1 className="vc-heading">
          Verify Your <em>Certificate</em>
        </h1>
        <p className="vc-subheading">
          Enter a certificate ID to confirm it is genuine and see who it was issued to.
        </p>

        <div className="vc-card">
          <form onSubmit={handleVerify}>
            <label className="vc-label" htmlFor="vc-id">Certificate ID</label>

            <div className="vc-input-wrap">
              <span className="vc-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="vc-id"
                type="text"
                className="vc-input"
                placeholder="e.g. EC2606…"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {errorMsg && (
              <div className="vc-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <p className="vc-hint">
              Your certificate ID is printed on your certificate (and in its QR code).
            </p>

            <button type="submit" className="vc-submit" disabled={loading}>
              {loading ? (
                <><span className="vc-spinner" /> Verifying…</>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  Verify Certificate
                </>
              )}
            </button>
          </form>
        </div>

        <div className="vc-trust">
          <div className="vc-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Secure Verification
          </div>
          <div className="vc-trust-sep" />
          <div className="vc-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            Tamper-proof Records
          </div>
          <div className="vc-trust-sep" />
          <div className="vc-trust-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6-4 6 4" /><path d="M4 22h16" /><path d="M6 22V9m12 13V9M10 22v-6h4v6" /></svg>
            Issued by Easy Coders
          </div>
        </div>
      </div>

      {/* Result modal */}
      {openModal && result && (
        <div className="vc-overlay" onClick={closeModal}>
          <div className="vc-modal" onClick={e => e.stopPropagation()}>
            <div className="vc-modal-banner">
              <button className="vc-modal-close" onClick={closeModal} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <div className="vc-seal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
              <div className="vc-modal-title">{result.type === 'elite_alumni_card' ? 'Platinum Card Verified' : 'Certificate Verified'}</div>
              <div className="vc-modal-sub">{result.type === 'elite_alumni_card' ? 'This Platinum Internship Privilege Card is authentic and issued by Easy Coders.' : 'This certificate is authentic and issued by Easy Coders.'}</div>
            </div>

            {/* Headline: who it was issued to + when */}
            <div className="vc-headline">
              <div className="vc-headline-eyebrow">Issued to</div>
              <div className="vc-headline-name">{result.user?.name}</div>
              {formattedDate && (
                <div className="vc-headline-date">Issued on <strong>{formattedDate}</strong></div>
              )}
            </div>

            <div className="vc-modal-body">
              {result.type === 'course_completion' ? (
                <>
                  <div className="vc-detail-row">
                    <span className="vc-detail-key">Course</span>
                    <span className="vc-detail-val">{result.course || result.tech_field}</span>
                  </div>
                  <div className="vc-detail-row">
                    <span className="vc-detail-key">Duration</span>
                    <span className="vc-detail-val">{result.duration}</span>
                  </div>
                  <div className="vc-detail-row">
                    <span className="vc-detail-key">Grade</span>
                    <span className="vc-score-val">{result.grade}</span>
                  </div>
                </>
              ) : result.type === 'elite_alumni_card' ? (
                <>
                  {result.membership_label && (
                    <div className="vc-detail-row">
                      <span className="vc-detail-key">Membership</span>
                      <span className="vc-detail-val">{result.membership_label}</span>
                    </div>
                  )}
                  {result.member_since && (
                    <div className="vc-detail-row">
                      <span className="vc-detail-key">Member since</span>
                      <span className="vc-detail-val">{result.member_since}</span>
                    </div>
                  )}
                  {Array.isArray(result.benefits) && result.benefits.length > 0 && (
                    <div className="vc-detail-row" style={{ alignItems: 'flex-start' }}>
                      <span className="vc-detail-key">Benefits</span>
                      <span className="vc-detail-val" style={{ maxWidth: 300 }}>{result.benefits.join(' · ')}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="vc-detail-row">
                    <span className="vc-detail-key">Assessment</span>
                    <span className="vc-detail-val">{result.assessment?.title}</span>
                  </div>
                  <div className="vc-detail-row">
                    <span className="vc-detail-key">Result</span>
                    <span className="vc-score-val">Qualified</span>
                  </div>
                </>
              )}
              {result.user?.email && (
                <div className="vc-detail-row">
                  <span className="vc-detail-key">Email</span>
                  <span className="vc-detail-val email">{result.user.email}</span>
                </div>
              )}
              <div className="vc-detail-row">
                <span className="vc-detail-key">{result.type === 'elite_alumni_card' ? 'Card Number' : 'Certificate ID'}</span>
                <span className="vc-code-chip">{result.certificate_code}</span>
              </div>
            </div>

            <div className="vc-modal-footer">
              <button className="vc-btn-primary" onClick={resetAll}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                Verify Another
              </button>
              <button className="vc-btn-secondary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
