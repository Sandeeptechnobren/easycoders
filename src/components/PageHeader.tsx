'use client';

import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  /** The single H1 for the page. */
  title: string;
  /** Optional supporting line under the title. */
  description?: string;
  /** Breadcrumb trail ending at the current page (no href on the last item). */
  breadcrumbs: BreadcrumbItem[];
};

/* ──────────────────────────────────────────────────────────────────────────
 * Shared marketing-page header.
 *
 * Re-skinned May 2026 to the navy/gold brand palette matching the home page
 * hero + footer. The previous version relied on legacy `globals.css` classes
 * (`home-header-bg`, `innerBanner`, `heading1`) that used a cyan→purple
 * gradient and a light-cyan background — completely off-brand for the new
 * design system. Now it is self-contained: no globals.css dependency.
 *
 * Used by /about, /contactus, /courses, /courses/[id]. As an h1 owner, it
 * also emits the canonical `BreadcrumbList` JSON-LD for that page (helps
 * Google render the rich breadcrumb in search results).
 * ────────────────────────────────────────────────────────────────────────── */
export default function PageHeader({
  title,
  description,
  breadcrumbs,
}: PageHeaderProps) {
  // Build absolute URLs for the JSON-LD (Google needs absolute, not relative).
  const SITE = 'https://easycoders.in';
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.label,
      ...(b.href ? { item: b.href.startsWith('http') ? b.href : `${SITE}${b.href}` } : {}),
    })),
  };

  return (
    <header className="ph-wrap">
      <style jsx>{`
        .ph-wrap {
          background: linear-gradient(180deg, #0B1B3A 0%, #152D5A 100%);
          color: #ffffff;
          padding: 120px 0 56px;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .ph-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          /* Lit by brand gold + teal (was a stock indigo glow) so the hero
             introduces the palette instead of reading as a flat dark block. */
          background:
            radial-gradient(ellipse 600px 400px at 80% 30%, rgba(232,160,32,0.16) 0%, transparent 65%),
            radial-gradient(ellipse 520px 320px at 10% 90%, rgba(26,165,187,0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .ph-rule {
          width: 44px;
          height: 3px;
          background: #E8A020;
          border-radius: 3px;
          margin-bottom: 18px;
        }
        .ph-container {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .ph-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 18px;
        }
        .ph-breadcrumb :global(a) {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .ph-breadcrumb :global(a):hover {
          color: #F5C356;
        }
        .ph-crumb-current {
          color: #ffffff;
          font-weight: 500;
        }
        .ph-sep {
          color: rgba(255,255,255,0.3);
          margin: 0 2px;
        }
        .ph-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(32px, 4.5vw, 48px);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin: 0;
          color: #ffffff;
          max-width: 800px;
        }
        .ph-desc {
          margin: 14px 0 0;
          font-size: 17px;
          line-height: 1.65;
          color: rgba(255,255,255,0.82);
          font-weight: 300;
          max-width: 640px;
        }
        @media (max-width: 640px) {
          .ph-wrap { padding: 100px 0 40px; }
          .ph-desc { font-size: 15px; }
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="ph-container">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="ph-breadcrumb">
          {breadcrumbs.map((item, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={`${item.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {item.href && !isLast ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span className="ph-crumb-current" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
                {!isLast && <span className="ph-sep" aria-hidden="true">›</span>}
              </span>
            );
          })}
        </nav>

        <div className="ph-rule" aria-hidden="true" />
        <h1 className="ph-title">{title}</h1>
        {description && <p className="ph-desc">{description}</p>}
      </div>
    </header>
  );
}
