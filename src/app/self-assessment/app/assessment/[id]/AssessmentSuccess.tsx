'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ──────────────────────────────────────────────────────────────────────────
 * Post-assessment result screen.
 *
 * Rewritten May 2026 for two reasons:
 *
 *  1. The previous version read `localStorage.score` (the RAW count of
 *     correct answers, e.g. "7" out of 20) and rendered it as "7 Points"
 *     with a confetti shower and "Congratulations!" — regardless of
 *     whether the user actually passed. A user scoring 7/20 (35%, below
 *     the 40% passing threshold) saw the same celebration as a user
 *     scoring 20/20. They then went to the dashboard, clicked
 *     "Certificate", and got told they failed — confusing.
 *
 *  2. The visual was purple-gradient / sans-default — not aligned with
 *     the rest of the brand (navy + gold + Playfair).
 *
 * Now:
 *   - Reads score + total_marks + passing_score from localStorage (set by
 *     the assessment page on submit).
 *   - Computes the percentage and a pass/fail outcome.
 *   - Renders a navy/gold scorecard with a ring-style percentage circle.
 *   - Shows the ratio ("16 of 20 correct") AND the percentage.
 *   - Confetti only on pass.
 *   - CTAs adapt: "Download certificate →" + "Back to dashboard" when
 *     passed; "Retake assessment" + "Back to dashboard" when failed.
 * ────────────────────────────────────────────────────────────────────────── */

type Outcome = {
  score:        number;
  total:        number;
  passing:      number;
  percent:      number;
  passed:       boolean;
  assessmentId: number | null;
};

export default function AssessmentSuccess() {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  /* Read the cached result on mount. Defer the setState to a microtask
   * so we don't trigger the cascading-renders lint rule by setting state
   * synchronously inside the effect body. */
  useEffect(() => {
    queueMicrotask(() => {
      const score   = Number(localStorage.getItem('score') ?? 0);
      const total   = Number(localStorage.getItem('score_total') ?? 0);
      const passing = Number(localStorage.getItem('score_passing') ?? 40);
      const aid     = localStorage.getItem('score_assessment_id');
      const percent = total > 0 ? Math.round((score / total) * 100) : 0;
      setOutcome({
        score,
        total,
        passing,
        percent,
        passed: percent >= passing,
        assessmentId: aid ? Number(aid) : null,
      });
    });
  }, []);

  /* Confetti only when the user actually passed. */
  useEffect(() => {
    if (!outcome?.passed) return;
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const colors = ['#E8A020', '#F5C356', '#FFFFFF', '#152D5A'];
    for (let i = 0; i < 80; i++) {
      setTimeout(() => {
        const c = document.createElement('div');
        c.className = 'sa-confetti';
        c.style.left            = `${Math.random() * 100}vw`;
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.width           = `${Math.random() * 8 + 5}px`;
        c.style.height          = `${Math.random() * 12 + 7}px`;
        c.style.opacity         = String(Math.random() * 0.6 + 0.4);
        if (Math.random() > 0.5) c.style.borderRadius = '50%';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
      }, i * 22);
    }
  }, [outcome?.passed]);

  if (!outcome) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1B3A', color: '#fff' }}>
        Loading result…
      </div>
    );
  }

  const { score, total, passing, percent, passed, assessmentId } = outcome;

  return (
    <div className="sa-result">
      <style>{`
        .sa-result {
          min-height: 100vh;
          background: linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
        }
        .sa-result::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 700px 400px at 80% 30%, rgba(232,160,32,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 600px 350px at 10% 80%, rgba(26,86,219,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .sa-confetti {
          position: fixed;
          top: -20px;
          z-index: 999;
          animation: sa-fall 4s linear forwards;
          pointer-events: none;
        }
        @keyframes sa-fall {
          0%   { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(720deg); }
        }

        .sa-card {
          position: relative;
          z-index: 1;
          background: #ffffff;
          border-radius: 24px;
          padding: 44px 36px 36px;
          max-width: 460px;
          width: 100%;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
          animation: sa-rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes sa-rise {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-card, .sa-circle-ring { animation: none; }
        }

        /* ── Scorecard circle ── */
        .sa-circle {
          --pct: 0;
          --ring: #22c55e;
          width: 144px;
          height: 144px;
          border-radius: 50%;
          margin: 0 auto 22px;
          position: relative;
          background: conic-gradient(var(--ring) calc(var(--pct) * 1%), #E5E9F2 0);
        }
        .sa-circle::after {
          content: '';
          position: absolute;
          inset: 10px;
          background: #ffffff;
          border-radius: 50%;
        }
        .sa-circle-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .sa-percent {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 38px;
          font-weight: 700;
          color: #0B1B3A;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .sa-percent-of {
          font-size: 11px;
          color: #94A3B8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
          margin-top: 4px;
        }

        /* ── Pass / fail badge ── */
        .sa-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .sa-badge-pass {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid rgba(22,163,74,0.25);
        }
        .sa-badge-fail {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid rgba(220,38,38,0.25);
        }

        /* ── Title + subtitle ── */
        .sa-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 700;
          color: #0B1B3A;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .sa-sub {
          font-size: 14px;
          color: #4A5568;
          line-height: 1.65;
          margin: 0 0 22px;
          font-weight: 300;
        }
        .sa-sub strong { color: #0B1B3A; font-weight: 600; }

        /* ── Stat strip ── */
        .sa-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          background: #F4F6FB;
          border-radius: 14px;
          padding: 14px 18px;
          margin: 0 0 24px;
        }
        .sa-stat {
          padding: 0 8px;
        }
        .sa-stat + .sa-stat {
          border-left: 1px solid #E5E9F2;
        }
        .sa-stat-label {
          font-size: 10px;
          color: #94A3B8;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .sa-stat-value {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          color: #0B1B3A;
          letter-spacing: -0.01em;
        }

        /* ── Buttons ── */
        .sa-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sa-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 24px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.01em;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.18s ease;
          text-decoration: none;
        }
        .sa-btn-primary {
          background: #E8A020;
          color: #0B1B3A;
          border-color: #E8A020;
        }
        .sa-btn-primary:hover {
          background: #F5C356;
          border-color: #F5C356;
          transform: translateY(-1px);
        }
        .sa-btn-outline {
          background: #ffffff;
          color: #0B1B3A;
          border-color: #E5E9F2;
        }
        .sa-btn-outline:hover {
          border-color: #0B1B3A;
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-btn:hover { transform: none; }
        }
      `}</style>

      <div className="sa-card">
        <div
          className="sa-circle"
          style={{
            ['--pct' as string]: percent,
            ['--ring' as string]: passed ? '#22c55e' : '#dc2626',
          }}
          aria-hidden="true"
        >
          <div className="sa-circle-inner">
            <span className="sa-percent">{percent}%</span>
            <span className="sa-percent-of">your score</span>
          </div>
        </div>

        <span className={`sa-badge ${passed ? 'sa-badge-pass' : 'sa-badge-fail'}`}>
          {passed ? '✓ Passed' : 'Below passing threshold'}
        </span>

        <h1 className="sa-title">
          {passed ? 'Congratulations!' : 'Almost there.'}
        </h1>
        <p className="sa-sub">
          {passed
            ? <>You scored above the <strong>{passing}%</strong> threshold and earned a certificate.</>
            : <>You need <strong>{passing}%</strong> to earn a certificate. Try the assessment again to improve your score.</>}
        </p>

        <div className="sa-stats">
          <div className="sa-stat">
            <p className="sa-stat-label">Correct</p>
            <div className="sa-stat-value">{score} <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>/ {total}</span></div>
          </div>
          <div className="sa-stat">
            <p className="sa-stat-label">Passing mark</p>
            <div className="sa-stat-value">{passing}%</div>
          </div>
        </div>

        <div className="sa-actions">
          {passed ? (
            <>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={() => router.replace('/self-assessment/app')}
              >
                Download your certificate →
              </button>
              <button
                type="button"
                className="sa-btn sa-btn-outline"
                onClick={() => router.replace('/self-assessment/app')}
              >
                Back to dashboard
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={() => {
                  if (assessmentId) {
                    router.replace(`/self-assessment/app/assessment/${assessmentId}`);
                  } else {
                    router.replace('/self-assessment/app');
                  }
                  // The page does a hard re-render via the router, which will
                  // remount the assessment-take component and clear the
                  // submitted state. Cached score keys stay so the dashboard
                  // still shows the latest attempt.
                }}
              >
                Retake assessment →
              </button>
              <button
                type="button"
                className="sa-btn sa-btn-outline"
                onClick={() => router.replace('/self-assessment/app')}
              >
                Back to dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
