'use client';

import React, { useState } from 'react';

type VerifyApiResponse = {
  success: boolean;
  message: string;
  data?: {
    certificate_code: string;
    user: { id: number; name: string; email: string };
    assessment: { id: number; title: string };
    score: number;
    completed_at: string;
  };
};

export default function VerifyCertificate() {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<VerifyApiResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [openModal, setOpenModal] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setOpenModal(false);

    try {
      const code = identifier.trim().toUpperCase();
      const url =
        `https://api.easycoders.in/projects/backend/public/api/certificate/verify` +
        `?certificate_code=${encodeURIComponent(code)}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const json: VerifyApiResponse = await res.json();

      if (!res.ok || !json?.success) {
        setErrorMsg(json?.message || 'Certificate not found. Please check the ID.');
        setLoading(false);
        return;
      }

      setResult(json.data ?? null);
      setOpenModal(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Server error. Please try again later.');
      setLoading(false);
    }
  };

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .vc-page {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          width: 100%; min-height: 100vh;
          background: #0f172a;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px 20px;
          gap: 0;
        }

        /* Background decorative rings */
        .vc-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(139,92,246,0.12);
          pointer-events: none;
        }
        .vc-ring-1 { width: 600px; height: 600px; top: 50%; left: 50%; transform: translate(-50%,-50%); }
        .vc-ring-2 { width: 900px; height: 900px; top: 50%; left: 50%; transform: translate(-50%,-50%); border-color: rgba(139,92,246,0.06); }
        .vc-ring-3 { width: 1200px; height: 1200px; top: 50%; left: 50%; transform: translate(-50%,-50%); border-color: rgba(139,92,246,0.04); }
        .vc-glow {
          position: absolute; width: 500px; height: 500px;
          border-radius: 50%; top: -100px; left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Badge */
        .vc-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.35);
          border-radius: 20px; padding: 6px 16px;
          font-size: 12px; font-weight: 600; color: #c4b5fd;
          margin-bottom: 20px; position: relative; z-index: 1;
        }
        .vc-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #a78bfa; }

        /* Heading */
        .vc-heading {
          font-size: clamp(28px, 5vw, 46px); font-weight: 900;
          color: #fff; text-align: center; margin-bottom: 8px;
          position: relative; z-index: 1; line-height: 1.2;
        }
        .vc-heading span { color: #a78bfa; }
        .vc-subheading {
          font-size: 15px; color: #64748b; text-align: center;
          margin-bottom: 36px; position: relative; z-index: 1;
        }

        /* Card */
        .vc-card {
          width: 100%; max-width: 440px; position: relative; z-index: 1;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* Label */
        .vc-label {
          font-size: 12px; font-weight: 700; color: #94a3b8;
          text-transform: uppercase; letter-spacing: .06em;
          margin-bottom: 8px; display: block;
        }

        /* Input wrapper */
        .vc-input-wrap { position: relative; margin-bottom: 6px; }
        .vc-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          font-size: 16px; pointer-events: none;
        }
        .vc-input {
          width: 100%; height: 52px; padding: 0 16px 0 44px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px; font-size: 15px; color: #fff;
          font-family: inherit; font-weight: 600; outline: none;
          transition: border-color .2s, box-shadow .2s;
          letter-spacing: .04em;
        }
        .vc-input::placeholder { color: rgba(255,255,255,0.25); font-weight: 400; letter-spacing: 0; }
        .vc-input:focus {
          border-color: rgba(139,92,246,0.6);
          box-shadow: 0 0 0 4px rgba(139,92,246,0.12);
          background: rgba(255,255,255,0.09);
        }

        /* Error */
        .vc-error {
          display: flex; align-items: center; gap: 8px;
          margin-top: 10px; padding: 11px 14px;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 12px; font-size: 13px; color: #fca5a5;
        }

        /* Hint */
        .vc-hint {
          margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.3);
          text-align: center;
        }
        .vc-hint span { color: #a78bfa; font-weight: 600; }

        /* Submit btn */
        .vc-submit {
          width: 100%; height: 52px; margin-top: 20px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          border: none; border-radius: 14px;
          font-size: 15px; font-weight: 800; color: #fff;
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity .2s, transform .12s;
          box-shadow: 0 8px 24px rgba(124,58,237,0.4);
        }
        .vc-submit:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
        .vc-submit:active:not(:disabled) { transform: scale(.98); }
        .vc-submit:disabled { opacity: .5; cursor: not-allowed; }
        .vc-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Trust row */
        .vc-trust {
          display: flex; align-items: center; justify-content: center; gap: 20px;
          margin-top: 28px; position: relative; z-index: 1; flex-wrap: wrap;
        }
        .vc-trust-item {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500;
        }
        .vc-trust-sep { width: 1px; height: 14px; background: rgba(255,255,255,0.1); }

        /* ===== MODAL ===== */
        .vc-overlay {
          position: fixed; inset: 0; background: rgba(5,8,20,0.8);
          display: flex; align-items: center; justify-content: center;
          padding: 20px; z-index: 9999;
          backdrop-filter: blur(6px);
          animation: fadeIn .2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .vc-modal {
          width: 100%; max-width: 520px; background: #fff;
          border-radius: 24px; overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5);
          animation: slideUp .3s ease;
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

        /* Modal top banner */
        .vc-modal-banner {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          padding: 28px 28px 24px;
          text-align: center; position: relative;
        }
        .vc-modal-close {
          position: absolute; top: 14px; right: 14px;
          width: 32px; height: 32px; border-radius: 10px;
          background: rgba(255,255,255,0.15); border: none;
          color: #fff; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .vc-modal-close:hover { background: rgba(255,255,255,0.25); }
        .vc-verified-badge {
          width: 64px; height: 64px; border-radius: 20px;
          background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 14px;
        }
        .vc-modal-title { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 4px; }
        .vc-modal-sub { font-size: 13px; color: rgba(255,255,255,0.7); }

        /* Modal body */
        .vc-modal-body { padding: 24px 28px 0; }
        .vc-detail-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; padding: 13px 0; border-bottom: 1px solid #f1f5f9;
        }
        .vc-detail-row:last-child { border-bottom: none; }
        .vc-detail-key { font-size: 12px; color: #94a3b8; font-weight: 600; flex-shrink: 0; }
        .vc-detail-val { font-size: 13px; color: #1e293b; font-weight: 700; text-align: right; }

        /* Score ring */
        .vc-score-val {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 44px; height: 26px; padding: 0 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 20px; font-size: 13px; font-weight: 800; color: #15803d;
        }

        /* Code chip */
        .vc-code-chip {
          font-size: 12px; font-weight: 800; font-family: monospace;
          background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe;
          border-radius: 8px; padding: 3px 10px; letter-spacing: .06em;
        }

        /* Modal footer */
        .vc-modal-footer {
          padding: 20px 28px 24px;
          display: flex; gap: 10px;
        }
        .vc-btn-primary {
          flex: 1; height: 46px; background: linear-gradient(135deg,#7c3aed,#4f46e5);
          border: none; border-radius: 12px; font-size: 14px; font-weight: 800;
          color: #fff; cursor: pointer; font-family: inherit;
          transition: opacity .15s, transform .12s;
        }
        .vc-btn-primary:hover { opacity: .9; transform: translateY(-1px); }
        .vc-btn-secondary {
          flex: 1; height: 46px; background: #fff;
          border: 1px solid #e2e8f0; border-radius: 12px;
          font-size: 14px; font-weight: 700; color: #475569;
          cursor: pointer; font-family: inherit;
          transition: background .15s;
        }
        .vc-btn-secondary:hover { background: #f8fafc; }
      `}</style>

      <div className="vc-page global-header-bg">
        {/* Decorative bg */}
        <div className="vc-ring vc-ring-1" />
        <div className="vc-ring vc-ring-2" />
        <div className="vc-ring vc-ring-3" />
        <div className="vc-glow" />

        {/* Badge */}
        <div className="vc-badge">
          <span className="vc-badge-dot" />
          Easy Coders — Certificate Authority
        </div>

        {/* Heading */}
        <h1 className="vc-heading">
          Verify Your <span>Certificate</span>
        </h1>
        <p className="vc-subheading">
          Enter your certificate or enrollment ID to confirm authenticity
        </p>

        {/* Form card */}
        <div className="vc-card">
          <form onSubmit={handleVerify}>
            <label className="vc-label">Certificate ID / Enrollment ID</label>

            <div className="vc-input-wrap">
              <span className="vc-input-icon">🔐</span>
              <input
                type="text"
                className="vc-input"
                placeholder="e.g. EC0031"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {errorMsg && (
              <div className="vc-error">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <p className="vc-hint">
              Try sample ID: <span>EC0031</span>
            </p>

            <button type="submit" className="vc-submit" disabled={loading}>
              {loading
                ? <><span className="vc-spinner" /> Verifying...</>
                : <><span>🔍</span> Verify Certificate</>
              }
            </button>
          </form>
        </div>

        {/* Trust indicators */}
        <div className="vc-trust">
          <div className="vc-trust-item"><span>🔒</span> Secure Verification</div>
          <div className="vc-trust-sep" />
          <div className="vc-trust-item"><span>✅</span> Tamper-proof Records</div>
          <div className="vc-trust-sep" />
          <div className="vc-trust-item"><span>🏛️</span> Issued by Easy Coders</div>
        </div>
      </div>

      {/* Result Modal */}
      {openModal && result && (
        <div className="vc-overlay" onClick={closeModal}>
          <div className="vc-modal" onClick={e => e.stopPropagation()}>

            {/* Banner */}
            <div className="vc-modal-banner">
              <button className="vc-modal-close" onClick={closeModal} aria-label="Close">✕</button>
              <div className="vc-verified-badge">🏅</div>
              <div className="vc-modal-title">Certificate Verified</div>
              <div className="vc-modal-sub">This certificate is authentic and issued by Easy Coders</div>
            </div>

            {/* Details */}
            <div className="vc-modal-body">
              <div className="vc-detail-row">
                <span className="vc-detail-key">Certificate Code</span>
                <span className="vc-code-chip">{result.certificate_code}</span>
              </div>
              <div className="vc-detail-row">
                <span className="vc-detail-key">Student Name</span>
                <span className="vc-detail-val">{result.user?.name}</span>
              </div>
              <div className="vc-detail-row">
                <span className="vc-detail-key">Email</span>
                <span className="vc-detail-val" style={{ color: '#6d28d9' }}>{result.user?.email}</span>
              </div>
              <div className="vc-detail-row">
                <span className="vc-detail-key">Assessment</span>
                <span className="vc-detail-val">{result.assessment?.title}</span>
              </div>
              <div className="vc-detail-row">
                <span className="vc-detail-key">Score</span>
                <span className="vc-score-val">{result.score}%</span>
              </div>
              <div className="vc-detail-row">
                <span className="vc-detail-key">Completed On</span>
                <span className="vc-detail-val">{formattedDate}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="vc-modal-footer">
              <button className="vc-btn-primary" onClick={resetAll}>
                🔍 Verify Another
              </button>
              <button className="vc-btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}