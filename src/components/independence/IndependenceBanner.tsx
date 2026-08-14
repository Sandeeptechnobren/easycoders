'use client';

import { useEffect, useState } from 'react';

/**
 * Slim, dismissible Independence Day announcement.
 *
 * Reads as a technology-brand announcement rather than a festival poster: one
 * line, glass surface, a thin tricolour edge, no emoji spam.
 *
 * Dismissal is remembered in localStorage, so it never nags. The key is
 * year-scoped, so next year's banner isn't suppressed by this year's dismissal.
 */

const KEY = 'ec_independence_banner_2026';

export default function IndependenceBanner() {
  // Render nothing until the client has checked storage — reading it during
  // render would cause a hydration mismatch, and flashing a banner the user
  // already dismissed is worse than showing it a beat late.
  const [show, setShow] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === '1';
    } catch {
      /* storage blocked — treat as not dismissed */
    }
    if (dismissed) return;

    // Next frame, so the state change isn't synchronous inside the effect body
    // (react-hooks/set-state-in-effect); it also lets first paint land first.
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="idb" role="region" aria-label="Independence Day announcement">
      <p className="idb-text">
        <span className="idb-tag">15 August 2026</span>
        <span className="idb-copy">Celebrating Freedom. Inspiring Innovation.</span>
      </p>
      <button type="button" className="idb-x" onClick={dismiss} aria-label="Dismiss announcement">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <style jsx>{`
        .idb {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 9px 44px 9px 20px;
          background: linear-gradient(90deg, rgba(255,153,51,.12), rgba(255,255,255,.06) 50%, rgba(19,136,8,.12));
          border-bottom: 1px solid rgba(255,255,255,.10);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        /* Tricolour hairline along the bottom edge. */
        .idb::after {
          content: '';
          position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
          background: linear-gradient(90deg,#FF9933 0 33.33%,#FFF 33.33% 66.66%,#138808 66.66% 100%);
          opacity: .85;
        }
        .idb-text {
          margin: 0; display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap; justify-content: center; text-align: center;
        }
        .idb-tag {
          font-size: 10.5px; font-weight: 800; letter-spacing: .10em; text-transform: uppercase;
          color: #0B1B3A; background: linear-gradient(90deg,#FFC078,#FF9933);
          padding: 3px 10px; border-radius: 99px; white-space: nowrap;
        }
        .idb-copy { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.92); }

        .idb-x {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          display: grid; place-items: center;
          width: 26px; height: 26px; border-radius: 8px;
          background: transparent; border: 1px solid rgba(255,255,255,.18);
          color: rgba(255,255,255,.75); cursor: pointer;
          transition: background .18s ease, color .18s ease;
        }
        .idb-x:hover { background: rgba(255,255,255,.12); color: #fff; }
        .idb-x:focus-visible { outline: 2px solid #FF9933; outline-offset: 2px; }

        @media (max-width: 560px) {
          .idb { padding: 8px 40px 8px 14px; }
          .idb-copy { font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .idb-x { transition: none; }
        }
      `}</style>
    </div>
  );
}
