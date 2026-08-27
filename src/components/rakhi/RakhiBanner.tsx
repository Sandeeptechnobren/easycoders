'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A slim greeting bar above the navigation.
 *
 * Deliberately restrained: one line, dismissible, and it REMEMBERS the
 * dismissal. A festive bar that reappears on every page is an irritation, not
 * a greeting — which is why the close button is real rather than decorative.
 *
 * Renders nothing until mounted so the server and first client render agree;
 * reading localStorage during render would be a hydration mismatch.
 */

const KEY = 'ec_rakhi_banner_dismissed';

export default function RakhiBanner() {
  const [show, setShow] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  /* The navbar is `position: fixed; top: 0`, and every page hardcodes its own
   * top padding to clear it. So a banner in normal document flow renders
   * UNDERNEATH the navbar and is never seen — which is exactly what happened.
   *
   * Rather than hardcode a height, the bar measures itself and publishes
   * `--rb-h`; the CSS in rakhi.css then offsets the navbar and <main> by that
   * amount, preserving every page's existing spacing. `rb-on` gates those
   * rules, so dismissing the bar puts the layout back untouched — and portal
   * pages, where the bar never renders, are never shifted at all.
   */
  const measure = useCallback(() => {
    const h = barRef.current?.offsetHeight ?? 0;
    document.documentElement.style.setProperty('--rb-h', `${h}px`);
  }, []);

  useEffect(() => {
    /* Deferred to a microtask, NOT requestAnimationFrame. rAF does not fire in a
       background tab, so the rAF version never greeted anyone who opened the
       site in a new tab and switched to it later — the banner simply never
       entered the DOM. A promise callback still satisfies
       react-hooks/set-state-in-effect and runs regardless of visibility. */
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        if (localStorage.getItem(KEY) !== '1') setShow(true);
      } catch {
        setShow(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (!show) {
      root.classList.remove('rb-on');
      root.style.removeProperty('--rb-h');
      return;
    }

    root.classList.add('rb-on');
    measure();

    // Re-measure on resize: the message is hidden under 720px, which changes
    // the height, and a wrapped line on a narrow screen changes it again.
    const ro = new ResizeObserver(measure);
    if (barRef.current) ro.observe(barRef.current);

    return () => {
      ro.disconnect();
      root.classList.remove('rb-on');
      root.style.removeProperty('--rb-h');
    };
  }, [show, measure]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* private mode — it will simply greet them again next visit */
    }
  };

  if (!show) return null;

  return (
    <div className="rb" role="note" ref={barRef}>
      <span className="rb-charm" aria-hidden="true" />
      <span className="rb-text">
        <strong>Happy Raksha Bandhan</strong>
        <span className="rb-sep" aria-hidden="true">·</span>
        <span className="rb-msg">Celebrating the bond that protects and encourages — from all of us at Easy Coders</span>
      </span>
      <button type="button" className="rb-x" onClick={dismiss} aria-label="Dismiss greeting">
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>

      <style jsx>{`
        .rb {
          /* Fixed and above the navbar's z-index: 999 — see the measure()
             comment above for why flow positioning could not work here. */
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 9px 44px 9px 16px;
          /* Brand navy, not a red bar. The first version was a red-to-orange
             gradient, which made the top of every page read as a generic
             festival banner rather than as Easy Coders. The festival lives in
             the thread underneath and in the charm, at ornament scale. */
          background: linear-gradient(100deg, #07122A 0%, #0B1B3A 55%, #14294F 100%);
          color: #FEF6E7;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          text-align: center;
        }

        /* The thread, sitting under the bar. */
        .rb::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          /* Same gold-dominant braid as --rakhi-thread in rakhi.css. Inlined
             rather than referenced because styled-jsx here has no guarantee
             the theme stylesheet is loaded. */
          background: repeating-linear-gradient(
            62deg,
            #E8A020 0 8px, #F5C356 8px 13px, #A3121B 13px 18px, #E8A020 18px 21px
          );
        }

        .rb-charm {
          flex: none;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, #F5C356 0 20%, #A3121B 20% 28%, transparent 28%),
            repeating-conic-gradient(from 0deg, #FEF6E7 0deg 15deg, #E8A020 15deg 30deg);
          box-shadow: 0 0 0 1px rgb(232 160 32 / 0.5);
        }

        .rb-text strong { color: #F5C356; font-weight: 700; }
        .rb-text { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .rb-sep { opacity: 0.55; }
        /* Cream on navy is ~14:1; the message at 0.85 alpha is still ~11:1. */
        .rb-msg { opacity: 0.85; }

        .rb-x {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border: 0;
          border-radius: 6px;
          background: rgb(255 255 255 / 0.16);
          color: #fff;
          cursor: pointer;
          transition: background 0.16s ease;
        }
        .rb-x:hover { background: rgb(255 255 255 / 0.3); }
        .rb-x:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

        @media (max-width: 720px) {
          .rb { font-size: 12px; padding: 8px 40px 8px 12px; }
          /* The headline greeting is the part that matters on a phone. */
          .rb-msg, .rb-sep { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .rb-x { transition: none; }
        }
      `}</style>
    </div>
  );
}
