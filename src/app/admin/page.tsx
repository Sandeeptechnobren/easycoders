'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
 * Admin landing — 2-card hub
 *
 * Replaces the previous all-in-one dashboard. Admin picks which side of
 * the platform to manage (Easy Assess vs Easy Coders).
 *
 * Visual fixes in this revision:
 *   - Bootstrap CSS loaded from layout.tsx applies a default
 *     `a { text-decoration: underline; color: <link-color> }` which was
 *     bleeding onto every card (the card itself is wrapped in <Link>,
 *     so every text inside inherited the underline). Defeated with a
 *     :global(.hub a) reset at the top of the style block — same trick
 *     used on /self-assessment.
 *   - More interactive: cards now fade-up on mount, lift + tilt slightly
 *     on hover, the gold accent stripe slides under the card on hover,
 *     and a tiny pulse runs on the icon to draw the eye.
 * ────────────────────────────────────────────────────────────────────────── */

type SimpleUser = { name?: string; email?: string };

export default function AdminHub() {
  const [user, setUser] = useState<SimpleUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem('user');
        setUser(raw ? JSON.parse(raw) : null);
      } catch { /* ignore malformed JSON */ }
    });
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = (user?.name ?? '').split(' ')[0] || 'Admin';

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className="hub">
        <style jsx>{`
          /* ─── Bulletproof anchor reset ─────────────────────────────────────
             Bootstrap's a { color: var(--bs-link-color); text-decoration:
             underline } loaded globally in layout.tsx was bleeding onto
             every <Link>-wrapped card here. Per-class color/decoration
             still wins, but text-decoration cascades from the parent
             anchor, so we strip it at the .hub level. Same fix as on
             /self-assessment. */
          :global(.hub a) {
            color: inherit;
            text-decoration: none;
          }

          .hub {
            min-height: 100vh;
            background: linear-gradient(180deg, #0B1B3A 0%, #07122A 100%);
            padding: 130px 24px 80px;
            font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
            color: #ffffff;
            position: relative;
            overflow: hidden;
          }
          .hub::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse 800px 500px at 80% 30%, rgba(232,160,32,0.14) 0%, transparent 60%),
              radial-gradient(ellipse 600px 400px at 10% 80%, rgba(26,86,219,0.20) 0%, transparent 70%);
            pointer-events: none;
          }
          /* Subtle moving star-field background — adds depth without
             being distracting. Two layers at different opacities. */
          .hub::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
              radial-gradient(1px 1px at 25% 35%, rgba(255,255,255,0.22), transparent),
              radial-gradient(1px 1px at 60% 70%, rgba(232,160,32,0.30), transparent),
              radial-gradient(1px 1px at 85% 18%, rgba(255,255,255,0.18), transparent),
              radial-gradient(1px 1px at 12% 80%, rgba(245,195,86,0.25), transparent),
              radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.15), transparent);
            background-size: 100% 100%;
            opacity: 0.6;
            pointer-events: none;
            animation: hub-drift 80s linear infinite;
          }
          @keyframes hub-drift {
            from { transform: translateY(0); }
            to   { transform: translateY(-30px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .hub::after { animation: none; }
          }

          .inner {
            position: relative;
            z-index: 1;
            max-width: 1100px;
            margin: 0 auto;
          }

          /* ─── Hero ─── */
          .hero {
            text-align: center;
            margin-bottom: 52px;
            animation: hub-fade 0.55s ease both;
          }
          @keyframes hub-fade {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .hero, .card { animation: none !important; }
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: rgba(232,160,32,0.14);
            border: 1px solid rgba(232,160,32,0.36);
            color: #F5C356;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            padding: 6px 16px;
            border-radius: 100px;
            margin-bottom: 18px;
          }
          .eyebrow::before {
            content: '';
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #E8A020;
            box-shadow: 0 0 12px rgba(232,160,32,0.7);
            animation: hub-pulse 2s ease-in-out infinite;
          }
          @keyframes hub-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%      { opacity: 0.55; transform: scale(0.75); }
          }
          @media (prefers-reduced-motion: reduce) {
            .eyebrow::before { animation: none; }
          }

          .title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(32px, 5vw, 48px);
            font-weight: 700;
            margin: 0 0 10px;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }
          .title em {
            color: #E8A020;
            font-style: italic;
          }
          .sub {
            font-size: 16px;
            color: rgba(255,255,255,0.72);
            margin: 0;
            font-weight: 300;
          }

          /* ─── Cards ─── */
          .cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
          @media (max-width: 820px) {
            .cards { grid-template-columns: 1fr; }
            .hub { padding-top: 110px; }
          }

          /* Deliberate vertical rhythm via explicit margins, not a uniform
             flex gap. Within a unit (icon-row → title, title → desc)
             spacing stays tight (12px); between units (desc → footer)
             spacing opens up (22px). Reads as a clearer hierarchy. */
          .card {
            background: linear-gradient(180deg, #ffffff 0%, #fafbfd 100%);
            color: #0B1B3A;
            border-radius: 24px;
            padding: 32px 32px 26px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            min-height: 320px;
            border: 1px solid rgba(255,255,255,0.06);
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            cursor: pointer;
            transform-style: preserve-3d;
            animation: hub-rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
            transition:
              transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2),
              box-shadow 0.32s ease,
              border-color 0.32s ease;
          }
          .card:nth-child(1) { animation-delay: 0.08s; }
          .card:nth-child(2) { animation-delay: 0.16s; }
          @keyframes hub-rise {
            from { opacity: 0; transform: translateY(18px) scale(0.985); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }

          /* The gold stripe stays at the top by default; on hover it
             grows downward into a subtle background wash, drawing the
             eye to the active card without being shouty. */
          .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, #E8A020, #F5C356, #E8A020);
            background-size: 200% 100%;
            transition: height 0.32s ease;
          }
          .card::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 0%, rgba(232,160,32,0.10) 0%, transparent 55%);
            opacity: 0;
            transition: opacity 0.32s ease;
            pointer-events: none;
          }

          .card:hover {
            transform: translateY(-6px);
            box-shadow:
              0 24px 48px rgba(0,0,0,0.32),
              0 0 0 1px rgba(232,160,32,0.45);
            border-color: rgba(232,160,32,0.4);
          }
          .card:hover::before {
            height: 6px;
            background-position: 100% 0;
          }
          .card:hover::after { opacity: 1; }
          .card:focus-visible {
            outline: none;
            box-shadow:
              0 24px 48px rgba(0,0,0,0.32),
              0 0 0 3px rgba(232,160,32,0.7);
          }

          .card-icon {
            width: 58px;
            height: 58px;
            border-radius: 16px;
            background: linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%);
            color: #E8A020;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 6px 18px rgba(11, 27, 58, 0.20);
            position: relative;
            transition: transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2);
          }
          .card-icon::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 18px;
            background: radial-gradient(circle, rgba(232,160,32,0.32) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.32s ease;
            pointer-events: none;
            z-index: -1;
          }
          .card:hover .card-icon {
            transform: rotate(-6deg) scale(1.06);
          }
          .card:hover .card-icon::after { opacity: 1; }

          /* Top-align the icon and the tag pill. With center-align the
             ~24px pill floats at the vertical middle of the 58px icon —
             visually nervous because the eye doesn't know whether the
             icon or the pill is the anchor. Top-align makes the icon
             the clear visual anchor and the tag a corner label. */
          .card-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 22px;
          }
          .card-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 24px;
            font-weight: 700;
            color: #0B1B3A;
            margin: 0 0 12px;
            letter-spacing: -0.01em;
            line-height: 1.2;
          }
          .card-tag {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #B97A0F;
            background: #FEF6E7;
            padding: 5px 12px;
            border-radius: 100px;
            border: 1px solid rgba(232,160,32,0.34);
            /* Tiny nudge so the tag doesn't crowd the absolute top edge
               of the icon row. Reads as a deliberate label. */
            margin-top: 6px;
            white-space: nowrap;
          }
          .card-desc {
            font-size: 14.5px;
            color: #4A5568;
            line-height: 1.65;
            margin: 0;
            flex: 1;
            font-weight: 300;
          }
          .card-foot {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #E5E9F2;
            padding-top: 18px;
            margin-top: 22px;
            gap: 12px;
          }
          .card-count {
            font-size: 12px;
            color: #94A3B8;
            display: inline-flex;
            align-items: baseline;
            gap: 5px;
            letter-spacing: 0.02em;
          }
          .card-count strong {
            color: #0B1B3A;
            font-weight: 700;
            font-size: 17px;
            font-family: 'Playfair Display', Georgia, serif;
            line-height: 1;
          }
          .card-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #B97A0F;
            font-weight: 700;
            font-size: 13px;
            background: #FEF6E7;
            border: 1px solid rgba(232,160,32,0.34);
            padding: 7px 14px;
            border-radius: 100px;
            transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
          }
          .card:hover .card-cta {
            background: #E8A020;
            color: #0B1B3A;
            border-color: #E8A020;
            transform: translateX(3px);
          }
          .card-cta svg { transition: transform 0.22s ease; }
          .card:hover .card-cta svg { transform: translateX(3px); }
          @media (prefers-reduced-motion: reduce) {
            .card:hover,
            .card:hover .card-icon,
            .card:hover .card-cta,
            .card:hover .card-cta svg {
              transform: none;
            }
          }
        `}</style>

        <div className="inner">
          <header className="hero">
            <span className="eyebrow">Admin · Console</span>
            <h1 className="title">
              {greeting}, <em>{firstName}</em>
            </h1>
            <p className="sub">Which side of the platform would you like to manage today?</p>
          </header>

          <div className="cards">
            {/* Easy Assess card */}
            <Link href="/admin/easy-assess" className="card" aria-label="Open Easy Assess management — 6 modules">
              <div className="card-head">
                <span className="card-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </span>
                <span className="card-tag">Open platform</span>
              </div>
              <h2 className="card-title">Easy Assess Management</h2>
              <p className="card-desc">
                Run the public coding-assessment platform: assessment
                definitions, coding question bank, typing content, certificate
                logs, leaderboard and registered assessment users.
              </p>
              <div className="card-foot">
                <span className="card-count"><strong>6</strong>modules</span>
                <span className="card-cta">
                  Open section
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Easy Coders card */}
            <Link href="/admin/easy-coders" className="card" aria-label="Open Easy Coders management — 13 modules">
              <div className="card-head">
                <span className="card-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </span>
                <span className="card-tag">Training company</span>
              </div>
              <h2 className="card-title">Easy Coders Management</h2>
              <p className="card-desc">
                Run the training company: students, batches, admissions,
                attendance, fees, trainers, tasks, tickets, courses,
                categories, enrollment requests, contact inquiries and RBAC
                permissions.
              </p>
              <div className="card-foot">
                <span className="card-count"><strong>13</strong>modules</span>
                <span className="card-cta">
                  Open section
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
