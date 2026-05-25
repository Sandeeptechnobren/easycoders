'use client';

import Link from 'next/link';

/* ──────────────────────────────────────────────────────────────────────────
 * Shared chrome for the new admin section pages.
 *
 * Provides:
 *   <AdminSection eyebrow title description breadcrumbs>...</AdminSection>
 *   <AdminCard href title description icon status badge />
 *
 * All visual styling is navy/gold matching the rest of the rebuilt site
 * (home, footer, courses, about, contactus, self-assessment landing).
 *
 * The new admin entry-point pages live under:
 *   /admin                  → 2-card hub
 *   /admin/easy-assess      → Easy Assess section dashboard
 *   /admin/easy-coders      → Easy Coders section dashboard
 *   /admin/easy-assess/*    → individual placeholder pages
 *
 * Existing admin pages (/admin/batches, /admin/permissions, etc.) keep
 * their current URLs and Bootstrap-styled chrome — only the entry points
 * are re-skinned. That keeps risk low and bookmarks valid.
 * ────────────────────────────────────────────────────────────────────────── */

type Crumb = { label: string; href?: string };

type AdminSectionProps = {
  eyebrow?:     string;
  title:        string;
  description?: string;
  breadcrumbs?: Crumb[];
  children:     React.ReactNode;
};

export function AdminSection({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
}: AdminSectionProps) {
  return (
    <div className="adm-page">
      <style jsx>{`
        :global(:root) {
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
        }
        .adm-page {
          min-height: 100vh;
          background: var(--navy-soft);
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
          color: var(--navy);
          padding-top: 110px; /* clear the fixed Navbar */
        }
        .adm-hero {
          background: linear-gradient(180deg, var(--navy) 0%, var(--navy-mid) 100%);
          padding: 40px 24px 56px;
          color: #ffffff;
          position: relative;
          overflow: hidden;
        }
        .adm-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 700px 400px at 80% 30%, rgba(232,160,32,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 500px 300px at 10% 80%, rgba(26,86,219,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .adm-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
        }
        .adm-crumbs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 14px;
        }
        .adm-crumbs :global(a) {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color 0.18s ease;
        }
        .adm-crumbs :global(a):hover { color: var(--gold-light); }
        .adm-crumb-sep { color: rgba(255,255,255,0.3); }
        .adm-crumb-current { color: #ffffff; font-weight: 500; }
        .adm-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(232,160,32,0.14);
          border: 1px solid rgba(232,160,32,0.34);
          color: var(--gold-light);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 12px;
        }
        .adm-eyebrow::before {
          content: '';
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
        }
        .adm-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(28px, 3.6vw, 38px);
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.015em;
          line-height: 1.2;
        }
        .adm-desc {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255,255,255,0.72);
          margin: 12px 0 0;
          max-width: 640px;
          font-weight: 300;
        }

        .adm-body {
          max-width: 1180px;
          margin: 0 auto;
          padding: 36px 24px 64px;
        }
      `}</style>

      <header className="adm-hero">
        <div className="adm-hero-inner">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="adm-crumbs" aria-label="Breadcrumb">
              {breadcrumbs.map((c, i) => {
                const last = i === breadcrumbs.length - 1;
                return (
                  <span key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {c.href && !last
                      ? <Link href={c.href}>{c.label}</Link>
                      : <span className="adm-crumb-current" aria-current={last ? 'page' : undefined}>{c.label}</span>}
                    {!last && <span className="adm-crumb-sep" aria-hidden="true">›</span>}
                  </span>
                );
              })}
            </nav>
          )}
          {eyebrow && <div className="adm-eyebrow">{eyebrow}</div>}
          <h1 className="adm-title">{title}</h1>
          {description && <p className="adm-desc">{description}</p>}
        </div>
      </header>

      <main className="adm-body">{children}</main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

type AdminCardProps = {
  href:         string;
  title:        string;
  description:  string;
  icon:         React.ReactNode;
  status?:      'live' | 'coming-soon';
  /** Optional small badge (e.g. count, "New") */
  badge?:       string;
};

export function AdminCard({
  href,
  title,
  description,
  icon,
  status = 'live',
  badge,
}: AdminCardProps) {
  const isStub = status === 'coming-soon';

  const inner = (
    <article className={`adm-card ${isStub ? 'adm-card-stub' : ''}`}>
      <style jsx>{`
        .adm-card {
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 18px;
          padding: 26px 24px 22px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
          cursor: pointer;
        }
        .adm-card:hover {
          transform: translateY(-3px);
          border-color: #E8A020;
          box-shadow: 0 16px 36px rgba(11, 27, 58, 0.10);
        }
        @media (prefers-reduced-motion: reduce) {
          .adm-card { transition: none; }
          .adm-card:hover { transform: none; }
        }
        .adm-card-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%);
          color: #E8A020;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .adm-card-stub .adm-card-icon {
          background: #F4F6FB;
          color: #94A3B8;
          border: 1px dashed #E5E9F2;
        }
        .adm-card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .adm-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          color: #0B1B3A;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .adm-card-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 9px;
          border-radius: 100px;
          background: #FEF6E7;
          color: #B97A0F;
          flex-shrink: 0;
        }
        .adm-card-stub .adm-card-badge {
          background: #F4F6FB;
          color: #94A3B8;
        }
        .adm-card-desc {
          font-size: 13px;
          color: #4A5568;
          line-height: 1.6;
          margin: 0;
          flex: 1;
          font-weight: 300;
        }
        .adm-card-cta {
          font-size: 13px;
          font-weight: 600;
          color: #B97A0F;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }
        .adm-card-stub .adm-card-cta {
          color: #94A3B8;
        }
      `}</style>
      <span className="adm-card-icon" aria-hidden="true">{icon}</span>
      <div className="adm-card-title-row">
        <h3 className="adm-card-title">{title}</h3>
        {badge && <span className="adm-card-badge">{badge}</span>}
        {isStub && !badge && <span className="adm-card-badge">Coming soon</span>}
      </div>
      <p className="adm-card-desc">{description}</p>
      <span className="adm-card-cta">
        {isStub ? 'Preview' : 'Open'}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </article>
  );

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      {inner}
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Reusable grid wrapper so each section dashboard stays small. */
export function AdminCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="adm-grid">{children}</div>
      <style jsx>{`
        .adm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }
      `}</style>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Placeholder body for "Coming soon" stub pages. Wrap inside <AdminSection>
 * with the appropriate breadcrumb / title; this provides the inner panel. */
type AdminComingSoonProps = {
  /** What this module will eventually do — 1-3 sentences. */
  whatItWillDo:  string;
  /** Optional bullet list of features the user can expect. */
  capabilities?: string[];
  /** href + label for the back button (defaults to section root). */
  backHref:      string;
  backLabel:     string;
};

export function AdminComingSoon({
  whatItWillDo,
  capabilities,
  backHref,
  backLabel,
}: AdminComingSoonProps) {
  return (
    <div className="adm-cs">
      <style jsx>{`
        .adm-cs {
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 20px;
          padding: 36px 32px;
          max-width: 680px;
          margin: 0 auto;
          box-shadow: 0 8px 24px rgba(11, 27, 58, 0.06);
        }
        .adm-cs-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #F4F6FB;
          color: #94A3B8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 13px;
          border-radius: 100px;
          margin-bottom: 14px;
          border: 1px solid #E5E9F2;
        }
        .adm-cs-h {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #0B1B3A;
          margin: 0 0 10px;
          letter-spacing: -0.01em;
        }
        .adm-cs-body {
          font-size: 14px;
          color: #4A5568;
          line-height: 1.7;
          margin: 0 0 18px;
          font-weight: 300;
        }
        .adm-cs-list {
          margin: 0 0 22px;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }
        .adm-cs-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: #0B1B3A;
        }
        .adm-cs-tick {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FEF6E7;
          color: #B97A0F;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }
        .adm-cs-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 18px;
          border-top: 1px solid #E5E9F2;
        }
        .adm-cs-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #0B1B3A;
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.18s ease;
        }
        .adm-cs-back:hover {
          background: #E8A020;
          color: #0B1B3A;
          transform: translateY(-1px);
        }
        @media (prefers-reduced-motion: reduce) {
          .adm-cs-back:hover { transform: none; }
        }
        .adm-cs-note {
          font-size: 12px;
          color: #94A3B8;
        }
      `}</style>

      <span className="adm-cs-badge">Coming soon</span>
      <h2 className="adm-cs-h">This module is on the roadmap</h2>
      <p className="adm-cs-body">{whatItWillDo}</p>

      {capabilities && capabilities.length > 0 && (
        <ul className="adm-cs-list">
          {capabilities.map((c, i) => (
            <li key={i}>
              <span className="adm-cs-tick" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {c}
            </li>
          ))}
        </ul>
      )}

      <div className="adm-cs-actions">
        <Link href={backHref} className="adm-cs-back">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {backLabel}
        </Link>
        <span className="adm-cs-note">Need it sooner? Ping the team.</span>
      </div>
    </div>
  );
}
