'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
 * Admin landing — 2-card hub
 *
 * Replaces the previous all-in-one dashboard. The admin now picks which
 * side of the platform they want to manage:
 *
 *   1. Easy Assess Management   — the open self-assessment platform
 *                                 (assessments, coding questions, typing
 *                                 content, leaderboard, certificates,
 *                                 assessment users)
 *   2. Easy Coders Management   — the training-company operations
 *                                 (batches, students, admissions,
 *                                 attendance, fees, trainers, tasks,
 *                                 tickets, courses, categories,
 *                                 enrollment requests, contact inquiries,
 *                                 RBAC permissions)
 *
 * Each card routes to a section dashboard at /admin/easy-assess and
 * /admin/easy-coders respectively. The existing per-feature admin pages
 * (/admin/batches, /admin/permissions, etc.) keep their current URLs —
 * only the entry-point flow changed. Bookmarks still work.
 * ────────────────────────────────────────────────────────────────────────── */

type SimpleUser = { name?: string; email?: string };

export default function AdminHub() {
  const [user, setUser] = useState<SimpleUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Defer to a microtask so we don't trigger the cascading-renders
    // lint rule by calling setState synchronously inside the effect.
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
              radial-gradient(ellipse 800px 500px at 80% 30%, rgba(232,160,32,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 600px 400px at 10% 80%, rgba(26,86,219,0.18) 0%, transparent 70%);
            pointer-events: none;
          }
          .inner {
            position: relative;
            z-index: 1;
            max-width: 1080px;
            margin: 0 auto;
          }
          .hero {
            text-align: center;
            margin-bottom: 48px;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: rgba(232,160,32,0.14);
            border: 1px solid rgba(232,160,32,0.34);
            color: #F5C356;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 5px 14px;
            border-radius: 100px;
            margin-bottom: 16px;
          }
          .eyebrow::before {
            content: '';
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #E8A020;
          }
          .title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(28px, 4vw, 40px);
            font-weight: 700;
            margin: 0 0 10px;
            letter-spacing: -0.02em;
            line-height: 1.15;
          }
          .title em { color: #E8A020; font-style: italic; }
          .sub {
            font-size: 15px;
            color: rgba(255,255,255,0.65);
            margin: 0;
            font-weight: 300;
          }

          .cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 22px;
          }
          @media (max-width: 760px) {
            .cards { grid-template-columns: 1fr; }
            .hub { padding-top: 110px; }
          }

          .card {
            background: #ffffff;
            color: #0B1B3A;
            border-radius: 22px;
            padding: 32px 30px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 320px;
            text-decoration: none;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            border: 1px solid rgba(255,255,255,0.06);
          }
          .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, #E8A020, #F5C356);
          }
          .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 24px 48px rgba(0,0,0,0.35);
            text-decoration: none;
            color: #0B1B3A;
          }
          @media (prefers-reduced-motion: reduce) {
            .card { transition: none; }
            .card:hover { transform: none; }
          }
          .card-icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%);
            color: #E8A020;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .card-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .card-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 22px;
            font-weight: 700;
            color: #0B1B3A;
            margin: 0;
            letter-spacing: -0.01em;
          }
          .card-tag {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #B97A0F;
            background: #FEF6E7;
            padding: 4px 10px;
            border-radius: 100px;
          }
          .card-desc {
            font-size: 14px;
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
            padding-top: 14px;
          }
          .card-count {
            font-size: 12px;
            color: #94A3B8;
          }
          .card-count strong {
            color: #0B1B3A;
            font-weight: 700;
            font-size: 14px;
          }
          .card-cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #E8A020;
            font-weight: 700;
            font-size: 13px;
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
            <Link href="/admin/easy-assess" className="card">
              <div className="card-head">
                <span className="card-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </span>
                <span className="card-tag">Open platform</span>
              </div>
              <h2 className="card-title">Easy Assess Management</h2>
              <p className="card-desc">
                Manage the public coding-assessment platform — assessment
                definitions, coding question bank, typing content,
                certificate logs, leaderboard and registered assessment
                users.
              </p>
              <div className="card-foot">
                <span className="card-count"><strong>6</strong> modules</span>
                <span className="card-cta">
                  Open section
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Easy Coders card */}
            <Link href="/admin/easy-coders" className="card">
              <div className="card-head">
                <span className="card-icon" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </span>
                <span className="card-tag">Training company</span>
              </div>
              <h2 className="card-title">Easy Coders Management</h2>
              <p className="card-desc">
                Manage the training company — students, batches,
                admissions, attendance, fees, trainers, tasks, tickets,
                courses, categories, enrollment requests, contact
                inquiries and RBAC permissions.
              </p>
              <div className="card-foot">
                <span className="card-count"><strong>13</strong> modules</span>
                <span className="card-cta">
                  Open section
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
