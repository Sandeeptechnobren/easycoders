'use client';

import { useEffect } from 'react';

/**
 * Shared pointer layer: publishes the cursor position as CSS custom properties
 * and renders the ambient tricolour light.
 *
 * ONE listener for the whole site. Every parallax layer, the cursor glow and
 * any hover lighting all read `--ptr-x` / `--ptr-y` from :root, so adding a new
 * depth layer costs nothing extra at runtime — CSS does the work on the
 * compositor instead of React re-rendering.
 *
 *  - Coalesced through requestAnimationFrame, so a 1000Hz mouse still updates
 *    at most once per frame.
 *  - Passive listener; never blocks scrolling.
 *  - Pointer-driven effects are meaningless on touch and expensive on low-end
 *    phones, so this bails out entirely for coarse pointers and for
 *    prefers-reduced-motion.
 *
 * Values are normalised to roughly -1 … 1 from the viewport centre.
 */
export default function PointerFX() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fine = window.matchMedia?.('(pointer: fine)').matches;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const root = document.documentElement;
    root.setAttribute('data-ptr', 'on');

    let raf = 0;
    let x = 0;
    let y = 0;
    let pending = false;

    const flush = () => {
      pending = false;
      root.style.setProperty('--ptr-x', x.toFixed(4));
      root.style.setProperty('--ptr-y', y.toFixed(4));
      // Raw px for the cursor glow, which needs absolute position not ratio.
      root.style.setProperty('--ptr-px', `${lastX}px`);
      root.style.setProperty('--ptr-py', `${lastY}px`);
    };

    let lastX = 0;
    let lastY = 0;

    const onMove = (e: PointerEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(flush);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      root.removeAttribute('data-ptr');
      root.style.removeProperty('--ptr-x');
      root.style.removeProperty('--ptr-y');
      root.style.removeProperty('--ptr-px');
      root.style.removeProperty('--ptr-py');
    };
  }, []);

  return (
    <div className="pfx" aria-hidden="true">
      <span className="pfx-saffron" />
      <span className="pfx-white" />
      <span className="pfx-green" />

      <style jsx>{`
        .pfx {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          display: none;             /* only when a fine pointer is present */
          mix-blend-mode: screen;    /* light, not paint */
        }
        :global(html[data-ptr='on']) .pfx { display: block; }

        .pfx span {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 50%;
          filter: blur(46px);
          /* The three layers lag by different amounts, which is what makes them
             read as one soft ambient light rather than three tracking dots. */
          transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
          will-change: transform;
        }
        .pfx-saffron {
          width: 260px; height: 260px; margin: -130px 0 0 -130px;
          background: radial-gradient(circle, rgb(255 153 51 / 0.20), transparent 68%);
          transform: translate3d(var(--ptr-px, 50vw), var(--ptr-py, 50vh), 0);
        }
        .pfx-white {
          width: 190px; height: 190px; margin: -95px 0 0 -95px;
          background: radial-gradient(circle, rgb(255 255 255 / 0.14), transparent 68%);
          transform: translate3d(var(--ptr-px, 50vw), var(--ptr-py, 50vh), 0);
          transition-duration: 380ms;
        }
        .pfx-green {
          width: 300px; height: 300px; margin: -150px 0 0 -150px;
          background: radial-gradient(circle, rgb(19 136 8 / 0.16), transparent 68%);
          transform: translate3d(var(--ptr-px, 50vw), var(--ptr-py, 50vh), 0);
          transition-duration: 520ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .pfx { display: none !important; }
        }
      `}</style>
    </div>
  );
}
