'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ──────────────────────────────────────────────────────────────────────────
 * /self-assessment — public landing for the Easy Assess sub-app.
 *
 * Redesigned May 2026:
 *  - Unified with the Easy Coders brand (navy + gold, Playfair Display +
 *    DM Sans) — was a generic indigo/magenta SaaS template that broke
 *    visual continuity for users arriving from the floating "Easy Assess"
 *    bubble on easycoders.in.
 *  - All purple gradients removed (CLAUDE.md design-rule violation).
 *  - Typing-animation headline removed (caused empty H1 flash, was hostile
 *    to screen readers, didn't respect prefers-reduced-motion).
 *  - Auth-aware primary CTA — if a returning user has an
 *    `assessment_token` in localStorage, the CTA jumps straight to their
 *    dashboard instead of asking them to sign up again.
 *  - Top bar with Easy Coders wordmark + discrete "← easycoders.in" link
 *    so users can find their way back to the main site.
 *  - Five sections instead of one card: hero / what-you-get /
 *    how-it-works / sample-report / final-CTA. Substantial enough to
 *    convert, focused enough to read in 30 seconds.
 *  - All icons are inline SVG (no emoji).
 *  - All animations respect prefers-reduced-motion.
 * ────────────────────────────────────────────────────────────────────────── */

type SessionState = 'unknown' | 'guest' | 'authed';

const EASYASSESS_DOWNLOAD_URL =
  'https://api.easycoders.in/downloads/easyassess.apk';

export default function SelfAssessmentLanding() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>('unknown');

  /* ─── Detect existing EasyAssess session ─────────────────────────────── */
  useEffect(() => {
    // Defer the setState to a microtask so we don't trigger the
    // cascading-renders lint warning. The initial render shows the
    // 'unknown' state (which renders the same UI as 'guest' — no
    // visible flash), then snaps to the real value on next tick.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const token = localStorage.getItem('assessment_token');
        setSession(token ? 'authed' : 'guest');
      } catch {
        setSession('guest');
      }
    });
    return () => { cancelled = true; };
  }, []);

  const primaryHref =
    session === 'authed' ? '/self-assessment/app' : '/self-assessment/signup';
  const primaryLabel =
    session === 'authed' ? 'Continue to your dashboard' : 'Start free';

  return (
    <>
      <style jsx>{`
        :global(html), :global(body) {
          background: #ffffff;
        }
        /* Bulletproof anchor reset for THIS landing only. The global
           Bootstrap CSS loaded from CDN in layout.tsx applies
           default underlined blue link styling to every a element,
           which was bleeding through onto our brand link and the
           "I have an account" outline button. By targeting an anchor
           inside .sa we win specificity (0,0,1,1) over the bare
           "a" selector (0,0,0,1) regardless of styled-jsx scoping. */
        :global(.sa a) {
          color: inherit;
          text-decoration: none;
        }
        .sa {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: #0B1B3A;
          min-height: 100vh;
          --navy:       #0B1B3A;
          --navy-mid:   #152D5A;
          --navy-deep:  #07122A;
          --navy-soft:  #F4F6FB;
          --gold:       #E8A020;
          --gold-light: #F5C356;
          --gold-soft:  #FEF6E7;
          --gold-deep:  #B97A0F;
          --slate:      #4A5568;
          --slate-soft: #94A3B8;
          --border:     #E5E9F2;
          --white:      #FFFFFF;
          --success:    #16a34a;
          --success-bg: #ecfdf5;
        }

        /* ─── Top bar ─── */
        .sa-topbar {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 5;
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: rgba(255,255,255,0.9);
        }
        .sa-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .sa-brand:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 4px;
          border-radius: 6px;
        }
        .sa-brand-logo {
          height: 30px;
          width: auto;
          /* The logo asset is dark; invert it to white so it reads on the
             navy hero. Same trick the footer uses. */
          filter: brightness(0) invert(1);
          opacity: 0.95;
        }
        .sa-brand-divider {
          width: 1px;
          height: 20px;
          background: rgba(255,255,255,0.25);
        }
        .sa-brand-sub {
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .sa-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px 8px 12px;
          border-radius: 100px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.82);
          font-size: 13px;
          font-weight: 500;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.18s ease;
        }
        .sa-back:hover {
          background: rgba(232,160,32,0.12);
          border-color: rgba(232,160,32,0.45);
          color: var(--gold-light);
          transform: translateY(-1px);
        }
        .sa-back:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        .sa-back svg {
          opacity: 0.85;
          flex-shrink: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-back:hover { transform: none; }
        }

        /* ─── Hero ─── */
        .sa-hero {
          position: relative;
          background: linear-gradient(180deg, var(--navy) 0%, var(--navy-mid) 100%);
          color: #ffffff;
          padding: 120px 24px 100px;
          overflow: hidden;
          text-align: center;
        }
        .sa-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 800px 500px at 80% 40%, rgba(232,160,32,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 700px 400px at 10% 90%, rgba(26,86,219,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .sa-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 760px;
          margin: 0 auto;
        }
        .sa-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(232,160,32,0.14);
          border: 1px solid rgba(232,160,32,0.34);
          color: var(--gold-light);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 26px;
        }
        .sa-eyebrow::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
        }
        .sa-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(36px, 5.5vw, 60px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 22px;
          color: #ffffff;
        }
        .sa-title em {
          font-style: italic;
          color: var(--gold);
        }
        .sa-lede {
          font-size: 18px;
          line-height: 1.65;
          color: rgba(255,255,255,0.72);
          margin: 0 auto 40px;
          max-width: 620px;
          font-weight: 300;
        }
        .sa-ctas {
          display: inline-flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .sa-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease, color 0.2s ease;
          border: 1.5px solid transparent;
        }
        .sa-btn-primary {
          background: var(--gold);
          color: var(--navy);
          border-color: var(--gold);
          box-shadow: 0 10px 24px rgba(11,27,58,0.28);
        }
        .sa-btn-primary:hover {
          background: var(--gold-light);
          border-color: var(--gold-light);
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(11,27,58,0.32);
          color: var(--navy);
        }
        .sa-btn-outline {
          background: transparent;
          color: rgba(255,255,255,0.9);
          border-color: rgba(255,255,255,0.3);
        }
        .sa-btn-outline:hover {
          border-color: rgba(255,255,255,0.7);
          color: #ffffff;
        }
        /* "Get the Android app" companion CTA — a gold-tinted ghost button
           so it reads as secondary to the solid-gold primary CTA. */
        .sa-btn-app {
          background: rgba(232,160,32,0.10);
          color: var(--gold-light);
          border-color: rgba(232,160,32,0.45);
        }
        .sa-btn-app:hover {
          background: rgba(232,160,32,0.18);
          border-color: var(--gold);
          color: var(--gold-light);
        }
        .sa-btn:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-btn:hover { transform: none; }
        }

        .sa-trust {
          margin-top: 36px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .sa-trust-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
        }
        .sa-trust strong {
          color: rgba(255,255,255,0.78);
          font-weight: 500;
        }

        /* ─── Section shell ─── */
        .sa-section {
          padding: 88px 24px;
        }
        .sa-section.alt {
          background: var(--navy-soft);
        }
        .sa-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .sa-section-head {
          text-align: center;
          margin-bottom: 48px;
        }
        .sa-section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--gold-soft);
          color: var(--gold-deep);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
        }
        .sa-section-eyebrow::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
        }
        .sa-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 3.4vw, 40px);
          font-weight: 700;
          color: var(--navy);
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 14px 0 12px;
        }
        .sa-section-sub {
          font-size: 16px;
          color: var(--slate);
          line-height: 1.7;
          max-width: 580px;
          margin: 0 auto;
          font-weight: 300;
        }

        /* ─── What you get cards ─── */
        .sa-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
        }
        .sa-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 26px 24px;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .sa-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(11,27,58,0.10);
          border-color: rgba(232,160,32,0.45);
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-card { transition: none; }
          .sa-card:hover { transform: none; }
        }
        .sa-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          color: var(--gold);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }
        .sa-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--navy);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .sa-card-body {
          font-size: 14px;
          line-height: 1.65;
          color: var(--slate);
          margin: 0;
          font-weight: 300;
        }

        /* ─── How it works steps ─── */
        .sa-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          counter-reset: sa-step;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sa-step {
          position: relative;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 32px 28px 28px;
          counter-increment: sa-step;
        }
        .sa-step::before {
          content: counter(sa-step, decimal-leading-zero);
          position: absolute;
          top: -16px;
          left: 28px;
          background: var(--navy);
          color: var(--gold);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 100px;
          letter-spacing: 0.06em;
        }
        .sa-step h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--navy);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .sa-step p {
          font-size: 14px;
          color: var(--slate);
          line-height: 1.65;
          margin: 0;
          font-weight: 300;
        }

        /* ─── Sample report ─── */
        .sa-report-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .sa-report-copy h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3vw, 36px);
          font-weight: 700;
          color: var(--navy);
          letter-spacing: -0.02em;
          margin: 14px 0 16px;
          line-height: 1.2;
        }
        .sa-report-copy h2 em { font-style: italic; color: var(--gold); }
        .sa-report-copy p {
          font-size: 15px;
          color: var(--slate);
          line-height: 1.7;
          margin: 0 0 18px;
          font-weight: 300;
        }
        .sa-report-bullets {
          list-style: none;
          padding: 0;
          margin: 22px 0 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sa-report-bullets li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: var(--navy);
        }
        .sa-tick {
          flex-shrink: 0;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--success-bg);
          color: var(--success);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        /* Mock score card */
        .sa-mock {
          background: linear-gradient(180deg, var(--navy) 0%, var(--navy-mid) 100%);
          border-radius: 22px;
          padding: 28px;
          box-shadow: 0 24px 60px rgba(11,27,58,0.22);
          color: #ffffff;
          position: relative;
          overflow: hidden;
        }
        .sa-mock::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 400px 200px at 80% 20%, rgba(232,160,32,0.10) 0%, transparent 60%);
          pointer-events: none;
        }
        .sa-mock-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          position: relative;
          z-index: 1;
        }
        .sa-mock-label {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.55);
          font-weight: 600;
        }
        .sa-mock-track {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 4px 10px;
          border-radius: 100px;
        }
        .sa-mock-score-row {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 22px;
          padding-bottom: 22px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 22px;
        }
        .sa-mock-circle {
          --pct: 72;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background:
            conic-gradient(var(--gold) calc(var(--pct) * 1%), rgba(255,255,255,0.08) 0);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }
        .sa-mock-circle::before {
          content: '';
          position: absolute;
          inset: 8px;
          background: var(--navy);
          border-radius: 50%;
        }
        .sa-mock-circle-text {
          position: relative;
          z-index: 1;
          text-align: center;
          line-height: 1;
        }
        .sa-mock-pct {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .sa-mock-pct-of {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          margin-top: 3px;
          display: block;
        }
        .sa-mock-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }
        .sa-mock-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }
        .sa-mock-section {
          position: relative;
          z-index: 1;
          margin-bottom: 16px;
        }
        .sa-mock-section:last-of-type { margin-bottom: 0; }
        .sa-mock-section-label {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          font-weight: 600;
          margin: 0 0 10px;
        }
        .sa-mock-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .sa-mock-chip {
          font-size: 12px;
          font-weight: 500;
          padding: 5px 11px;
          border-radius: 100px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
        }
        .sa-mock-chip.gold {
          background: rgba(232,160,32,0.14);
          border-color: rgba(232,160,32,0.34);
          color: var(--gold-light);
        }
        .sa-mock-hint {
          position: relative;
          z-index: 1;
          margin-top: 18px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .sa-mock-hint-icon {
          flex-shrink: 0;
          width: 28px; height: 28px;
          border-radius: 50%;
          background: rgba(232,160,32,0.18);
          color: var(--gold);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
        .sa-mock-hint-text {
          font-size: 13px;
          color: rgba(255,255,255,0.78);
          line-height: 1.55;
          margin: 0;
        }
        .sa-mock-hint-text strong { color: var(--gold-light); font-weight: 600; }

        /* ─── Final CTA ─── */
        .sa-final {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          padding: 96px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .sa-final::before,
        .sa-final::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .sa-final::before {
          width: 600px; height: 600px;
          border: 1px solid rgba(232,160,32,0.10);
        }
        .sa-final::after {
          width: 900px; height: 900px;
          border: 1px solid rgba(232,160,32,0.06);
        }
        .sa-final-inner {
          position: relative;
          z-index: 1;
          max-width: 640px;
          margin: 0 auto;
        }
        .sa-final-tag {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 18px;
        }
        .sa-final-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(30px, 4vw, 46px);
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 18px;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .sa-final-title em { font-style: italic; color: var(--gold); }
        .sa-final-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.62);
          margin: 0 0 32px;
          font-weight: 300;
        }

        /* ─── Sub-bar at very bottom (since main footer is hidden) ─── */
        .sa-mini-footer {
          background: var(--navy-deep);
          color: rgba(255,255,255,0.5);
          padding: 22px 24px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .sa-mini-footer a {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .sa-mini-footer a:hover { color: var(--gold-light); }

        /* ─── Responsive ─── */
        @media (max-width: 860px) {
          .sa-topbar { padding: 14px 20px; }
          .sa-hero { padding: 110px 22px 80px; }
          .sa-section { padding: 64px 22px; }
          .sa-report-grid { grid-template-columns: 1fr; gap: 40px; }
          .sa-steps { grid-template-columns: 1fr; gap: 28px; }
        }
        @media (max-width: 540px) {
          .sa-final { padding: 72px 22px; }
          .sa-mock-score-row { flex-direction: column; align-items: flex-start; }
          .sa-mock-circle { width: 96px; height: 96px; }
          .sa-mock-pct { font-size: 28px; }
        }
      `}</style>

      <div className="sa">
        {/* ─── HERO ─── */}
        <section className="sa-hero">
          {/* Top bar */}
          <nav className="sa-topbar" aria-label="Easy Assess header">
            <Link href="/" className="sa-brand" aria-label="Easy Coders — back to home">
              <Image
                src="/images/easyassess-mark.png"
                alt="Easy Assess"
                width={46}
                height={46}
                className="sa-brand-logo"
                priority
              />
              <span className="sa-brand-divider" aria-hidden="true" />
              <span className="sa-brand-sub">Easy Assess</span>
            </Link>
            <Link href="/" className="sa-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to easycoders.in
            </Link>
          </nav>

          <div className="sa-hero-inner">
            <div className="sa-eyebrow">Free skill check · No card required</div>
            <h1 className="sa-title">
              Find out exactly where you stand. <em>In 10 minutes.</em>
            </h1>
            <p className="sa-lede">
              A free, mentor-built coding assessment with MCQs, real coding
              challenges, a typing test and an AI hint coach. Get your
              strengths, your gaps, and a clear next step.
            </p>

            <div className="sa-ctas">
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={() => router.push(primaryHref)}
              >
                {primaryLabel}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              {session !== 'authed' && (
                <Link href="/self-assessment/login" className="sa-btn sa-btn-outline">
                  I have an account
                </Link>
              )}
              <a
                href={EASYASSESS_DOWNLOAD_URL}
                className="sa-btn sa-btn-app"
                download
                aria-label="Download the EasyAssess Android app"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
                </svg>
                Get the Android app
              </a>
            </div>

            <p className="sa-trust">
              <strong>From the team behind Easy Coders</strong>
              <span className="sa-trust-dot" aria-hidden="true" />
              Trusted by students across India
            </p>
          </div>
        </section>

        {/* ─── WHAT YOU GET ─── */}
        <section className="sa-section alt">
          <div className="sa-container">
            <div className="sa-section-head">
              <span className="sa-section-eyebrow">What you get</span>
              <h2 className="sa-section-title">Four ways to measure your coding chops</h2>
              <p className="sa-section-sub">
                One free account unlocks every test type. Pick the format
                that matches how you want to be challenged.
              </p>
            </div>

            <div className="sa-cards">
              {[
                {
                  title: 'MCQ assessments',
                  body: 'Curated multiple-choice questions per track and difficulty. Get scored instantly.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M8 9h8M8 13h5M8 17h6" />
                    </svg>
                  ),
                },
                {
                  title: 'Coding challenges',
                  body: 'Write real code in a Monaco editor, run it on Piston, and get a verdict against tests.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  ),
                },
                {
                  title: 'Typing speed test',
                  body: 'Practice your raw input speed on real code snippets — measured in WPM with accuracy.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
                    </svg>
                  ),
                },
                {
                  title: 'Live leaderboard',
                  body: 'See where you rank against the rest of the community. Earn a spot at the top.',
                  icon: (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M8 21h8" />
                      <path d="M12 17v4" />
                      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
                      <path d="M17 4h3v3a3 3 0 0 1-3 3M7 4H4v3a3 3 0 0 0 3 3" />
                    </svg>
                  ),
                },
              ].map(card => (
                <article key={card.title} className="sa-card">
                  <span className="sa-card-icon" aria-hidden="true">{card.icon}</span>
                  <h3 className="sa-card-title">{card.title}</h3>
                  <p className="sa-card-body">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="sa-section">
          <div className="sa-container">
            <div className="sa-section-head">
              <span className="sa-section-eyebrow">How it works</span>
              <h2 className="sa-section-title">Three steps. Real results.</h2>
              <p className="sa-section-sub">
                You can do the whole thing on your phone, on the train, in
                a tea break. No appointment, no installation.
              </p>
            </div>

            <ol className="sa-steps">
              <li className="sa-step">
                <h3>Sign up free</h3>
                <p>Email + a one-time code. Done in under a minute. We don&apos;t ask for payment information.</p>
              </li>
              <li className="sa-step">
                <h3>Pick a track</h3>
                <p>MCQ, coding, typing, or all of them. Choose your language and your difficulty.</p>
              </li>
              <li className="sa-step">
                <h3>Get your score + AI hints</h3>
                <p>Instant scoring, an AI tip on what to study next, and your name on the leaderboard.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* ─── SAMPLE REPORT ─── */}
        <section className="sa-section alt">
          <div className="sa-container">
            <div className="sa-report-grid">
              <div className="sa-report-copy">
                <span className="sa-section-eyebrow">Sample report</span>
                <h2>
                  This is what your <em>result</em> looks like
                </h2>
                <p>
                  Every assessment ends with a clear, single-page scorecard.
                  You see your overall score, which topics you nailed,
                  which need more practice, and an AI-generated tip for
                  exactly what to study next.
                </p>
                <ul className="sa-report-bullets">
                  <li>
                    <span className="sa-tick" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    Overall score with topic breakdown
                  </li>
                  <li>
                    <span className="sa-tick" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    Top-3 strengths and top-3 focus areas
                  </li>
                  <li>
                    <span className="sa-tick" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    AI study tip tailored to your weakest topics
                  </li>
                  <li>
                    <span className="sa-tick" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    Downloadable PDF certificate of attempt
                  </li>
                </ul>
              </div>

              {/* Pure-CSS mock score card */}
              <div className="sa-mock" role="img" aria-label="Sample score report preview">
                <div className="sa-mock-head">
                  <span className="sa-mock-label">Easy Assess · Report</span>
                  <span className="sa-mock-track">Python · Intermediate</span>
                </div>
                <div className="sa-mock-score-row">
                  <div className="sa-mock-circle" aria-hidden="true">
                    <div className="sa-mock-circle-text">
                      <div className="sa-mock-pct">72</div>
                      <span className="sa-mock-pct-of">out of 100</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="sa-mock-headline">Solid foundation, time to specialise</h4>
                    <p className="sa-mock-sub">You answered 18 of 25 correctly.</p>
                  </div>
                </div>
                <div className="sa-mock-section">
                  <p className="sa-mock-section-label">Top strengths</p>
                  <div className="sa-mock-chips">
                    <span className="sa-mock-chip gold">Loops</span>
                    <span className="sa-mock-chip gold">Strings</span>
                    <span className="sa-mock-chip gold">Lists & Dicts</span>
                  </div>
                </div>
                <div className="sa-mock-section">
                  <p className="sa-mock-section-label">Focus areas</p>
                  <div className="sa-mock-chips">
                    <span className="sa-mock-chip">Recursion</span>
                    <span className="sa-mock-chip">Async / Await</span>
                    <span className="sa-mock-chip">Big-O</span>
                  </div>
                </div>
                <div className="sa-mock-hint">
                  <span className="sa-mock-hint-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.9.8 1.5 2 1.5 3.3h5c0-1.3.6-2.5 1.5-3.3A7 7 0 0 0 12 2z" />
                    </svg>
                  </span>
                  <p className="sa-mock-hint-text">
                    <strong>AI tip:</strong> Spend 2 hours this week on
                    recursion patterns — the divide-and-conquer template
                    will unblock 3 of your weakest categories at once.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="sa-final">
          <div className="sa-final-inner">
            <p className="sa-final-tag">Ready in 10 minutes</p>
            <h2 className="sa-final-title">
              Find out exactly <em>where you stand</em>
            </h2>
            <p className="sa-final-sub">
              Free, fast, and you don&apos;t need to install anything.
              Your score is waiting.
            </p>
            <div className="sa-ctas">
              <button
                type="button"
                className="sa-btn sa-btn-primary"
                onClick={() => router.push(primaryHref)}
              >
                {primaryLabel}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <a
                href={EASYASSESS_DOWNLOAD_URL}
                className="sa-btn sa-btn-app"
                download
                aria-label="Download the EasyAssess Android app"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12M7 11l5 5 5-5M5 21h14" />
                </svg>
                Get the Android app
              </a>
            </div>
          </div>
        </section>

        {/* ─── Mini footer (main footer is hidden on this route) ─── */}
        <footer className="sa-mini-footer">
          <span>
            © {new Date().getFullYear()} Easy Coders · A unit of Technobren Infotech Pvt. Ltd.
          </span>
          <span>
            <Link href="/">easycoders.in</Link>
            &nbsp;·&nbsp;
            <Link href="/contactus">Contact</Link>
            &nbsp;·&nbsp;
            <Link href="/courses">Courses</Link>
          </span>
        </footer>
      </div>
    </>
  );
}
