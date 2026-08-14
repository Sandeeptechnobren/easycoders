'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ──────────────────────────────────────────────────────────────────────────
 * /about — client-side body.
 *
 * Re-skinned May 2026 to navy/gold matching home, footer, and courses.
 * Previous version used orange (#f97316) accents that didn't match the
 * rest of the public site.
 *
 * Defensible stats. The previous version claimed "120+ Live Projects",
 * "15+ Expert Trainers", "100+ Hiring Companies" for a single Jaunpur
 * office — fabricated-feeling. Now we surface qualitative + verifiable
 * counts only.
 *
 * Added "How we teach" 3-step block + final CTA section so the page now
 * has a real funnel from story → values → next action.
 *
 * Counter animation now uses requestAnimationFrame with ease-out and
 * snaps to the final value if the user prefers reduced motion.
 * ────────────────────────────────────────────────────────────────────────── */

type Stat = {
  value:  number;
  label:  string;
  suffix?: string;
};

const STATS: Stat[] = [
  { value: 4,   label: 'Core programs',           suffix: '' },
  { value: 100, label: 'Project-based curriculum', suffix: '%' },
  { value: 1,   label: 'Mentor-to-learner focus', suffix: ':1' },
];

const VALUES = [
  {
    title: 'Project-First Learning',
    desc: 'Every module ends in something you actually built.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" />
      </svg>
    ),
  },
  {
    title: 'Industry Mentors',
    desc: 'Guidance from people who ship production code.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Placement Support',
    desc: 'Resume reviews, mock interviews and real referrals.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: 'Hands-On Training',
    desc: 'Minimal slides, maximum keyboard time.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Real Codebase Experience',
    desc: 'Practice in realistic repos, not toy snippets.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    title: 'Community Growth',
    desc: 'A cohort that levels up together.',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: 1,
    title: 'Learn the fundamentals',
    body:
      'Start from absolute basics. Each module is delivered live with mentor support and concept-checks — no recorded-only courses, no copy-paste exercises.',
  },
  {
    n: 2,
    title: 'Build real projects',
    body:
      'Every program ships with a portfolio. You will design, code, debug and deploy actual applications — the kind employers ask for in interviews.',
  },
  {
    n: 3,
    title: 'Get placement-ready',
    body:
      'Resume review, mock interviews, soft-skill training and direct introductions to our hiring-partner network — all included.',
  },
];

export default function AboutInner() {
  const [counts, setCounts] = useState<number[]>(STATS.map(() => 0));
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const started    = useRef(false);

  /* ─── Counter animation ──────────────────────────────────────────────── */
  useEffect(() => {
    // Respect prefers-reduced-motion: snap straight to the final value.
    // Defer to a microtask so we don't call setState synchronously inside
    // the effect body (avoids the cascading-renders lint warning).
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      started.current = true;
      queueMicrotask(() => setCounts(STATS.map(s => s.value)));
      return;
    }

    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;

        const start  = performance.now();
        const dur    = 1100; // ms
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          const e = easeOut(t);
          setCounts(STATS.map(s => Math.round(s.value * e)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* ─── Values cards: reveal (stagger) when they scroll into view ────────── */
  const valuesRef = useRef<HTMLDivElement | null>(null);
  const [valuesIn, setValuesIn] = useState(false);
  useEffect(() => {
    const node = valuesRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') { queueMicrotask(() => setValuesIn(true)); return; }
    const obs = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) { setValuesIn(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style jsx>{`
        /* The brand tokens that used to be redeclared here are now defined once
           in globals.css. Every value in this block was identical to the central
           set, so removing it is a visual no-op — and it is necessary, because a
           local :root redeclaration outranks the theme override and would defeat
           theming while this page is mounted. */

        .ab {
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          background: var(--navy-soft);
          color: var(--navy);
        }

        /* ─── STATS BAND ──────────────────────────────────────────────── */
        .ab-stats {
          background: linear-gradient(180deg, var(--navy) 0%, var(--navy-mid) 100%);
          padding: 56px 24px;
          position: relative;
          overflow: hidden;
        }
        .ab-stats::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 600px 300px at 80% 50%, rgba(232,160,32,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 500px 300px at 10% 80%, rgba(26,86,219,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .ab-stats-inner {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }
        .ab-stat {
          text-align: center;
          padding: 0 32px;
          position: relative;
        }
        .ab-stat:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0; top: 18%;
          height: 64%;
          width: 1px;
          background: rgba(255,255,255,0.14);
        }
        .ab-stat-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(42px, 5vw, 60px);
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          letter-spacing: -0.03em;
          display: inline-flex;
          align-items: baseline;
        }
        .ab-stat-num span {
          color: var(--gold);
          margin-left: 4px;
        }
        .ab-stat-label {
          font-size: 13px;
          color: rgba(255,255,255,0.62);
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-top: 12px;
          display: block;
        }

        /* ─── HOW WE TEACH ──────────────────────────────────────────── */
        .ab-section {
          padding: 80px 24px;
        }
        .ab-section.alt {
          background: var(--white);
        }
        .ab-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .ab-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--gold-soft);
          color: #92660D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
        }
        .ab-eyebrow::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--gold);
        }
        .ab-section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 700;
          color: var(--navy);
          margin: 14px 0 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .ab-section-sub {
          font-size: 16px;
          color: var(--slate);
          line-height: 1.7;
          margin: 12px 0 0;
          font-weight: 300;
          max-width: 580px;
        }
        .ab-section-head {
          text-align: center;
          margin-bottom: 48px;
        }
        .ab-section-head .ab-section-sub {
          margin-left: auto;
          margin-right: auto;
        }

        .ab-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .ab-step {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .ab-step:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 36px rgba(11, 27, 58, 0.10);
          border-color: #d4dbe9;
        }
        @media (prefers-reduced-motion: reduce) {
          .ab-step { transition: none; }
          .ab-step:hover { transform: none; }
        }
        .ab-step-num {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          color: var(--gold);
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          letter-spacing: 0;
        }
        .ab-step-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--navy);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }
        .ab-step-body {
          font-size: 14px;
          color: var(--slate);
          line-height: 1.65;
          margin: 0;
          font-weight: 300;
        }

        /* ─── STORY ──────────────────────────────────────────────────── */
        .ab-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: center;
        }
        .ab-story-body p {
          font-size: 15px;
          color: var(--slate);
          line-height: 1.8;
          margin: 0 0 14px;
        }
        .ab-story-divider {
          width: 48px;
          height: 3px;
          background: var(--gold);
          border-radius: 2px;
          margin: 26px 0;
          border: none;
        }
        .ab-story-tagline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--navy);
          line-height: 1.45;
          margin: 0;
        }
        .ab-story-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 700;
          color: var(--navy);
          line-height: 1.2;
          margin: 14px 0 20px;
          letter-spacing: -0.02em;
        }
        .ab-story-title em {
          font-style: italic;
          color: var(--gold);
        }

        .ab-story-img-wrap {
          position: relative;
        }
        .ab-story-img {
          width: 100%;
          height: auto;
          border-radius: 20px;
          display: block;
          object-fit: cover;
          aspect-ratio: 4/3;
        }
        .ab-story-badge {
          position: absolute;
          bottom: -18px;
          left: -18px;
          background: var(--navy);
          color: var(--white);
          padding: 16px 22px;
          border-radius: 14px;
          box-shadow: 0 10px 26px rgba(11, 27, 58, 0.22);
        }
        .ab-badge-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          display: block;
          line-height: 1;
          color: var(--gold);
        }
        .ab-badge-txt {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          margin-top: 4px;
          display: block;
        }

        /* ─── MISSION + VISION ──────────────────────────────────────── */
        .ab-mv {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .ab-mv-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 36px;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .ab-mv-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(11, 27, 58, 0.08);
        }
        @media (prefers-reduced-motion: reduce) {
          .ab-mv-card { transition: none; }
          .ab-mv-card:hover { transform: none; }
        }
        .ab-mv-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--gold);
          border-radius: 20px 20px 0 0;
        }
        .ab-mv-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: var(--gold-soft);
          color: #92660D;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .ab-mv-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--navy);
          margin: 0 0 12px;
          letter-spacing: -0.01em;
        }
        .ab-mv-text {
          font-size: 15px;
          color: var(--slate);
          line-height: 1.75;
          margin: 0;
        }

        /* ─── VALUES STRIP ───────────────────────────────────────────── */
        .ab-values {
          background: linear-gradient(180deg, var(--navy-mid) 0%, var(--navy-deep) 100%);
          padding: 56px 24px;
          position: relative;
          overflow: hidden;
        }
        .ab-values::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 700px 300px at 50% 100%, rgba(232,160,32,0.08) 0%, transparent 65%);
          pointer-events: none;
        }
        .ab-values-inner {
          position: relative;
          z-index: 1;
          max-width: 1120px;
          margin: 0 auto;
        }
        .ab-values-head { text-align: center; max-width: 620px; margin: 0 auto 40px; }
        .ab-values-eyebrow {
          font-size: 12px;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }
        .ab-values-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(24px, 3.4vw, 36px);
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 0 0 12px;
        }
        .ab-values-sub {
          font-size: 15px;
          font-weight: 300;
          color: rgba(255,255,255,0.6);
          line-height: 1.65;
          margin: 0;
        }
        .ab-values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        .ab-vcard {
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          padding: 26px 24px;
          opacity: 0;
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease, background 0.3s ease, box-shadow 0.32s ease;
        }
        /* Staggered reveal when the section scrolls into view */
        .ab-values.in .ab-vcard { opacity: 1; animation: abReveal 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes abReveal {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Gold glow bloom behind the card on hover */
        .ab-vcard::before {
          content: '';
          position: absolute;
          top: -40%; left: -20%;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(232,160,32,0.22) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.32s ease;
          pointer-events: none;
        }
        .ab-vcard:hover {
          transform: translateY(-6px);
          border-color: rgba(232,160,32,0.5);
          background: rgba(255,255,255,0.065);
          box-shadow: 0 20px 44px rgba(0,0,0,0.30);
        }
        .ab-vcard:hover::before { opacity: 1; }
        .ab-vicon {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 46px; height: 46px;
          border-radius: 13px;
          background: rgba(232,160,32,0.12);
          border: 1px solid rgba(232,160,32,0.28);
          color: var(--gold-light);
          margin-bottom: 16px;
          transition: transform 0.32s cubic-bezier(0.22,1,0.36,1), background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        .ab-vcard:hover .ab-vicon {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--navy);
          transform: scale(1.08) rotate(-4deg);
        }
        .ab-vtitle {
          position: relative;
          z-index: 1;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 7px;
          letter-spacing: -0.01em;
        }
        .ab-vdesc {
          position: relative;
          z-index: 1;
          font-size: 13.5px;
          font-weight: 300;
          color: rgba(255,255,255,0.62);
          line-height: 1.6;
          margin: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .ab-vcard { opacity: 1; animation: none; }
          .ab-values.in .ab-vcard { animation: none; }
          .ab-vcard:hover { transform: none; }
          .ab-vcard:hover .ab-vicon { transform: none; }
        }

        /* ─── FINAL CTA ──────────────────────────────────────────────── */
        .ab-cta {
          background:
            radial-gradient(ellipse 720px 380px at 50% 42%, rgba(232,160,32,0.11) 0%, transparent 60%),
            linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          padding: 104px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        /* Slowly-pulsing concentric rings behind the CTA */
        .ab-cta-rings {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          z-index: 0;
        }
        .ab-cta-rings span {
          grid-area: 1 / 1;
          border-radius: 50%;
          border: 1px solid rgba(232,160,32,0.12);
          animation: abPulse 6s ease-in-out infinite;
        }
        .ab-cta-rings span:nth-child(1) { width: 420px; height: 420px; }
        .ab-cta-rings span:nth-child(2) { width: 680px; height: 680px; border-color: rgba(232,160,32,0.085); animation-delay: 1.2s; }
        .ab-cta-rings span:nth-child(3) { width: 960px; height: 960px; border-color: rgba(232,160,32,0.05); animation-delay: 2.4s; }
        @keyframes abPulse {
          0%, 100% { transform: scale(1); opacity: 0.65; }
          50%      { transform: scale(1.05); opacity: 1; }
        }

        .ab-cta-tag {
          position: relative;
          z-index: 1;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 18px;
        }
        .ab-cta-title {
          position: relative;
          z-index: 1;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(30px, 4vw, 48px);
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 18px;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }
        .ab-cta-title em { color: var(--gold); font-style: italic; }
        .ab-cta-sub {
          position: relative;
          z-index: 1;
          font-size: 17px;
          color: rgba(255,255,255,0.62);
          margin: 0 0 36px;
          font-weight: 300;
          max-width: 540px;
          margin-left: auto;
          margin-right: auto;
        }
        .ab-cta-actions {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        /* Buttons render via next/link (<Link>), whose <a> does NOT get the
           styled-jsx scope class, so these are :global(). And the CDN Bootstrap
           stylesheet styles bare <a> aggressively (blue + underline) — so the
           colour/decoration essentials use !important + literal hex to win over
           it reliably. These classes are only used on this page, so it's safe. */
        :global(.ab-btn-primary),
        :global(.ab-btn-outline) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none !important;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        /* Scoped under .ab-cta to raise specificity to (0,3,0) so it beats the
           higher-specificity !important link rule in the CDN Bootstrap sheet. */
        .ab-cta :global(.ab-btn-primary) {
          background: #E8A020 !important;
          color: #0B1B3A !important;
          border: 1.5px solid #E8A020 !important;
        }
        .ab-cta :global(.ab-btn-primary):hover {
          background: #F5C356 !important;
          border-color: #F5C356 !important;
          transform: translateY(-2px);
          color: #0B1B3A !important;
          box-shadow: 0 14px 30px rgba(232,160,32,0.32);
        }
        :global(.ab-btn-arrow) { display: inline-block; transition: transform 0.22s cubic-bezier(0.22,1,0.36,1); }
        .ab-cta :global(.ab-btn-primary):hover :global(.ab-btn-arrow) { transform: translateX(4px); }
        .ab-cta :global(.ab-btn-outline) {
          background: rgba(255,255,255,0.03) !important;
          color: rgba(255,255,255,0.9) !important;
          border: 1.5px solid rgba(255,255,255,0.3) !important;
        }
        .ab-cta :global(.ab-btn-outline):hover {
          border-color: #E8A020 !important;
          color: #F5C356 !important;
          background: rgba(232,160,32,0.08) !important;
          transform: translateY(-2px);
        }

        /* Trust row under the CTA buttons */
        .ab-cta-trust {
          position: relative;
          z-index: 1;
          list-style: none;
          margin: 32px 0 0;
          padding: 0;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px 22px;
        }
        .ab-cta-trust li {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
        }
        .ab-cta-trust li::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.ab-btn-primary):hover, :global(.ab-btn-outline):hover { transform: none; }
          :global(.ab-btn-primary):hover :global(.ab-btn-arrow) { transform: none; }
          .ab-cta-rings span { animation: none; }
        }

        /* ─── RESPONSIVE ─────────────────────────────────────────────── */
        @media (max-width: 860px) {
          .ab-stats-inner { grid-template-columns: 1fr; gap: 36px; }
          .ab-stat::after { display: none; }
          .ab-steps { grid-template-columns: 1fr; }
          .ab-story-grid { grid-template-columns: 1fr; gap: 56px; }
          .ab-mv { grid-template-columns: 1fr; }
          .ab-story-badge { left: 14px; }
          .ab-values { padding: 56px 22px; }
        }
        @media (max-width: 520px) {
          .ab-cta { padding: 76px 20px; }
          .ab-cta-actions { flex-direction: column; align-items: stretch; }
          :global(.ab-btn-primary), :global(.ab-btn-outline) { width: 100%; justify-content: center; }
          .ab-cta-trust { gap: 8px 16px; }
        }
      `}</style>

      <div className="ab">
        {/* ─── STATS BAND ─── */}
        <div className="ab-stats" ref={sectionRef}>
          <div className="ab-stats-inner">
            {STATS.map((s, i) => (
              <div key={s.label} className="ab-stat">
                <span className="ab-stat-num" aria-label={`${s.value}${s.suffix ?? ''} ${s.label}`}>
                  {counts[i]}
                  {s.suffix && <span>{s.suffix}</span>}
                </span>
                <span className="ab-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── HOW WE TEACH ─── */}
        <section className="ab-section alt">
          <div className="ab-container">
            <div className="ab-section-head">
              <div className="ab-eyebrow">How we teach</div>
              <h2 className="ab-section-title">Three steps from curious to hired</h2>
              <p className="ab-section-sub">
                Every Easy Coders program follows the same arc — learn the
                fundamentals, build something real, then prepare to ship it.
              </p>
            </div>

            <ol className="ab-steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {STEPS.map(step => (
                <li key={step.n} className="ab-step">
                  <div className="ab-step-num" aria-hidden="true">{step.n}</div>
                  <h3 className="ab-step-title">{step.title}</h3>
                  <p className="ab-step-body">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── STORY ─── */}
        <section className="ab-section">
          <div className="ab-container">
            <div className="ab-story-grid">
              <div className="ab-story-body">
                <span className="ab-eyebrow">Our story</span>
                <h2 className="ab-story-title">
                  Born from a <em>real problem</em>, built for real careers
                </h2>
                <p>
                  Easy Coders started with one observation: students learn
                  syntax, but struggle to build real applications. We decided
                  to flip the model — focusing on projects, workflows and
                  problem-solving instead of memorisation.
                </p>
                <p>
                  Today, we help learners go from absolute beginner to
                  job-ready through structured paths, mentor support and
                  industry-style training.
                </p>
                <hr className="ab-story-divider" />
                <p className="ab-story-tagline">
                  Modern technology.<br />Develop with us.
                </p>
              </div>

              <div className="ab-story-img-wrap">
                <Image
                  src="/images/profile-img.jpg"
                  alt="An Easy Coders class in session"
                  width={640}
                  height={480}
                  sizes="(max-width: 860px) 100vw, 480px"
                  className="ab-story-img"
                  priority={false}
                />
                <div className="ab-story-badge">
                  <span className="ab-badge-num">5+</span>
                  <span className="ab-badge-txt">Years of teaching</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MISSION + VISION ─── */}
        <section className="ab-section alt">
          <div className="ab-container">
            <div className="ab-section-head">
              <div className="ab-eyebrow">Our purpose</div>
              <h2 className="ab-section-title">What drives everything we do</h2>
            </div>

            <div className="ab-mv">
              <article className="ab-mv-card">
                <div className="ab-mv-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="ab-mv-title">Our mission</h3>
                <p className="ab-mv-text">
                  Create confident developers through practical, project-driven
                  and career-focused technical education that closes the gap
                  between learning and doing.
                </p>
              </article>

              <article className="ab-mv-card">
                <div className="ab-mv-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22" />
                    <line x1="2"  y1="12" x2="4"  y2="12" />
                    <line x1="20" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <h3 className="ab-mv-title">Our vision</h3>
                <p className="ab-mv-text">
                  Become India&apos;s most trusted platform for learning
                  real-world software development — empowering every learner
                  to build, ship and grow.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ─── VALUES STRIP ─── */}
        <div className={`ab-values ${valuesIn ? 'in' : ''}`} ref={valuesRef}>
          <div className="ab-values-inner">
            <div className="ab-values-head">
              <p className="ab-values-eyebrow">Our principles</p>
              <h2 className="ab-values-title">What we stand for</h2>
              <p className="ab-values-sub">The commitments behind every batch we run — the reasons students go from beginner to job-ready with us.</p>
            </div>
            <div className="ab-values-grid">
              {VALUES.map((v, i) => (
                <article className="ab-vcard" key={v.title} style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="ab-vicon" aria-hidden="true">{v.icon}</span>
                  <h3 className="ab-vtitle">{v.title}</h3>
                  <p className="ab-vdesc">{v.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* ─── FINAL CTA ─── */}
        <section className="ab-cta">
          <div className="ab-cta-rings" aria-hidden="true"><span /><span /><span /></div>
          <p className="ab-cta-tag">Ready to start?</p>
          <h2 className="ab-cta-title">
            Your <em>coding career</em><br />starts with us.
          </h2>
          <p className="ab-cta-sub">
            Explore our programs or talk to a counsellor — we&apos;ll help you
            pick the format that fits your goals and your schedule.
          </p>
          <div className="ab-cta-actions">
            <Link href="/courses" className="ab-btn-primary">
              Browse all courses <span className="ab-btn-arrow" aria-hidden="true">→</span>
            </Link>
            <Link href="/contactus" className="ab-btn-outline">Talk to a counsellor</Link>
          </div>
          <ul className="ab-cta-trust" aria-label="Why students choose us">
            <li>No experience needed</li>
            <li>Mentor-led</li>
            <li>Project-based</li>
            <li>Placement support</li>
          </ul>
        </section>
      </div>
    </>
  );
}
