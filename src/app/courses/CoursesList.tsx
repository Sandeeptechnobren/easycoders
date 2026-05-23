'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import {
  type ApiCourse,
  categorySlug,
  clipAtWord,
  courseImage,
  formatINR,
  titleCase,
} from '@/lib/course';

/* ──────────────────────────────────────────────────────────────────────────
 * Public courses listing.
 *
 * Re-architected May 2026:
 *  - Fetches /api/courses ONCE; filtering is client-side (was refetching
 *    on every tab change).
 *  - Tab state is synced both ways with the `?category=<slug>` URL param so
 *    a tab can be deep-linked / shared / bookmarked.
 *  - Price + offer + duration are visible on every list card (were hidden
 *    on the detail page only — major conversion blocker).
 *  - Re-skinned to the navy/gold brand palette matching the home page and
 *    footer (was navy + orange, off-brand).
 *  - Real keyboard support on the tab strip (Arrow / Home / End).
 *  - Animations respect prefers-reduced-motion.
 *  - Empty state distinguishes "API failure" from "no courses".
 * ────────────────────────────────────────────────────────────────────────── */

/** Categories we surface in the tab strip. Anything else from the API is hidden
 * (e.g. internal category drafts). Order here is the order users see. */
const VISIBLE_CATEGORIES = ['Summer Training', 'Internship', 'Job Oriented Programs'];

type LoadState = 'loading' | 'ready' | 'error';

export default function CoursesList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courses, setCourses]   = useState<ApiCourse[]>([]);
  const [state, setState]       = useState<LoadState>('loading');
  const [activeTab, setActive]  = useState<string>('');

  const tabsRef = useRef<HTMLDivElement | null>(null);

  /* ─── Single fetch on mount ──────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api.get('/courses')
      .then(res => {
        if (cancelled) return;
        const data = (res.data?.data ?? res.data ?? []) as ApiCourse[];
        setCourses(Array.isArray(data) ? data : []);
        setState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setCourses([]);
        setState('error');
      });
    return () => { cancelled = true; };
  }, []);

  /* ─── Categories that actually have courses ──────────────────────────── */
  const availableCategories = useMemo(
    () => VISIBLE_CATEGORIES.filter(cat => courses.some(c => c.category?.name === cat)),
    [courses]
  );

  /* ─── Sync URL → tab (on first load + back/forward nav) ───────────────── */
  useEffect(() => {
    if (availableCategories.length === 0) return;
    const urlSlug = searchParams.get('category');
    const fromUrl = availableCategories.find(cat => categorySlug(cat) === urlSlug);
    setActive(prev => prev || fromUrl || availableCategories[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCategories.join(',')]);

  /* ─── Tab change → state + URL (replace, no history bloat) ───────────── */
  const selectTab = useCallback((cat: string) => {
    setActive(cat);
    const next = new URLSearchParams(Array.from(searchParams.entries()));
    next.set('category', categorySlug(cat));
    router.replace(`/courses?${next.toString()}`, { scroll: false });
  }, [router, searchParams]);

  /* ─── Tab strip keyboard navigation (arrows, Home/End) ────────────────── */
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
    const len = availableCategories.length;
    let next = currentIdx;
    if (e.key === 'ArrowRight') next = (currentIdx + 1) % len;
    else if (e.key === 'ArrowLeft') next = (currentIdx - 1 + len) % len;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = len - 1;
    else return;
    e.preventDefault();
    selectTab(availableCategories[next]);
    // Move focus to the new tab so the visual + a11y states match.
    const btn = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next];
    btn?.focus();
  };

  const filtered = useMemo(
    () => courses.filter(c => c.category?.name === activeTab),
    [courses, activeTab]
  );

  return (
    <section className="cl-wrap" aria-labelledby="courses-heading">
      <style jsx>{`
        :global(:root) {
          --navy:        #0B1B3A;
          --navy-mid:    #152D5A;
          --navy-soft:   #F4F6FB;
          --gold:        #E8A020;
          --gold-light:  #F5C356;
          --gold-soft:   #FEF6E7;
          --slate:       #4A5568;
          --slate-soft:  #94A3B8;
          --border:      #E5E9F2;
          --white:       #FFFFFF;
        }
        .cl-wrap {
          background: var(--navy-soft);
          padding: 64px 0 96px;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }
        .cl-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ─── Tab strip ─── */
        .cl-tabs-row {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .cl-tabs {
          display: inline-flex;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 5px;
          gap: 4px;
          box-shadow: 0 2px 12px rgba(11, 27, 58, 0.06);
          flex-wrap: wrap;
          justify-content: center;
        }
        .cl-tab {
          background: transparent;
          border: none;
          padding: 10px 22px;
          border-radius: 100px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          color: var(--slate);
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cl-tab:hover:not(.active) {
          color: var(--navy);
          background: var(--navy-soft);
        }
        .cl-tab.active {
          background: var(--navy);
          color: var(--white);
          box-shadow: 0 2px 8px rgba(11, 27, 58, 0.18);
        }
        .cl-tab:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        .cl-tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          background: rgba(255,255,255,0.18);
        }
        .cl-tab:not(.active) .cl-tab-count {
          background: var(--border);
          color: var(--slate);
        }

        /* ─── Meta row ─── */
        .cl-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          font-size: 13px;
          color: var(--slate);
        }
        .cl-meta strong { color: var(--navy); font-weight: 600; }

        /* ─── Grid ─── */
        .cl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
          gap: 26px;
        }

        /* ─── Card ─── */
        .cl-card {
          background: var(--white);
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 14px rgba(11, 27, 58, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          opacity: 0;
          animation: cl-rise 0.45s ease forwards;
          animation-delay: var(--cl-delay, 0s);
        }
        .cl-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 36px rgba(11, 27, 58, 0.12);
          border-color: #d4dbe9;
        }
        @keyframes cl-rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-card { animation: none; opacity: 1; transition: none; }
          .cl-card:hover { transform: none; }
        }

        .cl-image-wrap {
          position: relative;
          aspect-ratio: 16 / 9;
          background: var(--navy-soft);
          overflow: hidden;
        }
        .cl-image-wrap :global(img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .cl-card:hover .cl-image-wrap :global(img) {
          transform: scale(1.04);
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-card:hover .cl-image-wrap :global(img) { transform: none; }
        }
        .cl-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(11,27,58,0.45) 0%, transparent 55%);
          pointer-events: none;
        }
        .cl-offer-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--gold);
          color: var(--navy);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 100px;
          z-index: 2;
        }
        .cl-cat-chip {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          color: var(--navy);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          z-index: 2;
        }

        .cl-body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }
        .cl-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          color: var(--navy);
          line-height: 1.3;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .cl-desc {
          font-size: 14px;
          color: var(--slate);
          line-height: 1.6;
          font-weight: 300;
          margin: 0;
          flex: 1;
        }

        /* ─── Price row ─── */
        .cl-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-top: 4px;
        }
        .cl-price {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: -0.01em;
        }
        .cl-price-strike {
          font-size: 13px;
          color: var(--slate-soft);
          text-decoration: line-through;
        }
        .cl-price-save {
          margin-left: auto;
          font-size: 12px;
          font-weight: 700;
          color: #166534;
          background: #ecfdf5;
          padding: 3px 9px;
          border-radius: 100px;
        }

        /* ─── Meta chips ─── */
        .cl-meta-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .cl-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--slate);
          font-weight: 500;
        }
        .cl-chip svg { opacity: 0.55; }

        /* ─── CTA ─── */
        .cl-cta {
          display: block;
          width: 100%;
          padding: 12px 18px;
          background: var(--navy);
          color: var(--white);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          margin-top: 6px;
          transition: background 0.2s ease, transform 0.18s ease;
          letter-spacing: 0.01em;
        }
        .cl-cta:hover {
          background: var(--gold);
          color: var(--navy);
          transform: translateY(-1px);
          text-decoration: none;
        }
        .cl-cta:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-cta:hover { transform: none; }
        }

        /* ─── Empty / error states ─── */
        .cl-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 64px 24px;
          background: var(--white);
          border-radius: 18px;
          border: 1px solid var(--border);
        }
        .cl-state-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.6;
        }
        .cl-state-title {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: var(--navy);
          margin: 0 0 6px;
        }
        .cl-state-msg {
          color: var(--slate);
          font-size: 14px;
          margin: 0 0 16px;
        }
        .cl-retry {
          background: var(--gold);
          color: var(--navy);
          border: none;
          padding: 10px 22px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .cl-retry:hover { background: var(--gold-light); }

        /* ─── Skeleton (loading) ─── */
        .cl-skel {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          height: 380px;
        }
        .cl-skel-img {
          background: linear-gradient(90deg, #eef2f8 0%, #f7f9fc 50%, #eef2f8 100%);
          background-size: 200% 100%;
          animation: cl-shimmer 1.4s linear infinite;
          aspect-ratio: 16 / 9;
        }
        @keyframes cl-shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-skel-img { animation: none; }
        }

        @media (max-width: 720px) {
          .cl-wrap { padding: 48px 0 72px; }
          .cl-grid { grid-template-columns: 1fr; }
          .cl-tab { flex: 1; justify-content: center; font-size: 13px; padding: 9px 14px; }
        }
      `}</style>

      <div className="cl-container">
        {/* Tab strip — never rendered while loading initial state, to avoid layout shift */}
        {availableCategories.length > 0 && (
          <div className="cl-tabs-row">
            <div
              ref={tabsRef}
              className="cl-tabs"
              role="tablist"
              aria-label="Filter courses by program type"
            >
              {availableCategories.map((cat, idx) => {
                const count = courses.filter(c => c.category?.name === cat).length;
                const isActive = activeTab === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    id={`cl-tab-${categorySlug(cat)}`}
                    aria-selected={isActive}
                    aria-controls={`cl-panel-${categorySlug(cat)}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`cl-tab ${isActive ? 'active' : ''}`}
                    onClick={() => selectTab(cat)}
                    onKeyDown={e => onTabKeyDown(e, idx)}
                  >
                    {cat}
                    <span className="cl-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results meta */}
        {state === 'ready' && filtered.length > 0 && (
          <div className="cl-meta">
            <p>
              Showing <strong>{filtered.length}</strong> course{filtered.length !== 1 ? 's' : ''} in <strong>{activeTab}</strong>
            </p>
          </div>
        )}

        {/* Panel */}
        <div
          role="tabpanel"
          id={activeTab ? `cl-panel-${categorySlug(activeTab)}` : undefined}
          aria-labelledby={activeTab ? `cl-tab-${categorySlug(activeTab)}` : undefined}
        >
          <div className="cl-grid">
            {/* Loading skeletons */}
            {state === 'loading' && Array.from({ length: 4 }).map((_, i) => (
              <div key={`skel-${i}`} className="cl-skel">
                <div className="cl-skel-img" />
                <div style={{ padding: 22 }}>
                  <div style={{ height: 18, background: '#eef2f8', borderRadius: 6, width: '70%', marginBottom: 12 }} />
                  <div style={{ height: 12, background: '#eef2f8', borderRadius: 6, width: '95%', marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#eef2f8', borderRadius: 6, width: '80%' }} />
                </div>
              </div>
            ))}

            {/* Error state */}
            {state === 'error' && (
              <div className="cl-state">
                <div className="cl-state-icon" aria-hidden="true">⚠️</div>
                <h2 className="cl-state-title">Couldn&apos;t load courses</h2>
                <p className="cl-state-msg">There was a network hiccup. Please try again.</p>
                <button type="button" className="cl-retry" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}

            {/* Empty state (filter has zero hits) */}
            {state === 'ready' && filtered.length === 0 && availableCategories.length > 0 && (
              <div className="cl-state">
                <div className="cl-state-icon" aria-hidden="true">📚</div>
                <h2 className="cl-state-title">No courses in this category yet</h2>
                <p className="cl-state-msg">Try another program type above.</p>
              </div>
            )}

            {/* Genuinely empty catalogue */}
            {state === 'ready' && courses.length === 0 && (
              <div className="cl-state">
                <div className="cl-state-icon" aria-hidden="true">📚</div>
                <h2 className="cl-state-title">No courses available right now</h2>
                <p className="cl-state-msg">New programs are added regularly — check back soon.</p>
              </div>
            )}

            {/* Cards */}
            {state === 'ready' && filtered.map((course, idx) => {
              const price       = formatINR(course.discounted_price);
              const original    = formatINR(course.original_price);
              const showStrike  = original && original !== price;
              const savingsPct  = (() => {
                const orig = parseFloat(String(course.original_price ?? ''));
                const disc = parseFloat(String(course.discounted_price ?? ''));
                if (!Number.isFinite(orig) || !Number.isFinite(disc) || orig <= 0 || disc >= orig) return null;
                return Math.round((1 - disc / orig) * 100);
              })();

              return (
                <article
                  key={course.id}
                  className="cl-card"
                  style={{ ['--cl-delay' as string]: `${Math.min(idx, 5) * 60}ms` }}
                >
                  <Link
                    href={`/courses/${course.id}`}
                    aria-label={`View ${course.title}`}
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="cl-image-wrap">
                      <Image
                        src={courseImage(course)}
                        alt={course.title}
                        width={600}
                        height={338}
                        sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="cl-overlay" />
                      {course.offer && <span className="cl-offer-pill">{course.offer}</span>}
                      {course.category?.name && (
                        <span className="cl-cat-chip">{course.category.name}</span>
                      )}
                    </div>
                  </Link>

                  <div className="cl-body">
                    <h3 className="cl-title">{course.title}</h3>
                    <p className="cl-desc">
                      {clipAtWord(course.description, 110) ||
                        'Hands-on, project-based training with 1:1 mentor support.'}
                    </p>

                    {/* Price */}
                    {price && (
                      <div className="cl-price-row">
                        <span className="cl-price">{price}</span>
                        {showStrike && <span className="cl-price-strike">{original}</span>}
                        {savingsPct !== null && (
                          <span className="cl-price-save">Save {savingsPct}%</span>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="cl-meta-chips">
                      {course.duration && (
                        <span className="cl-chip">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {course.duration}
                        </span>
                      )}
                      {course.level && (
                        <span className="cl-chip">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          {titleCase(course.level)}
                        </span>
                      )}
                    </div>

                    <Link href={`/courses/${course.id}`} className="cl-cta">
                      View course →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
