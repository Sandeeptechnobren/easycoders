'use client';

/**
 * "Indian glory" — a slow tricolour light that sweeps the viewport.
 *
 * Reads as a wash of saffron → white → green passing over the page, like light
 * moving across cloth. Deliberately restrained:
 *
 *  - Very low opacity and heavy blur, so it lifts colour rather than tinting the
 *    page. It must never reduce text contrast — that is the one thing it cannot
 *    be allowed to do.
 *  - `mix-blend-mode: screen` means it only ADDS light. It can brighten, never
 *    darken, so body copy can't be pushed toward its background.
 *  - Long cycle (26s) with the sweep occupying under a third of it, so the page
 *    is untouched most of the time. A constant moving wash would be exhausting
 *    and a permanent compositor cost.
 *  - fixed + pointer-events:none + z-index under the navbar, so it never
 *    intercepts a click or covers navigation.
 *  - One element, one transform. No canvas, no JS loop, no scroll handler.
 *  - Removed entirely under prefers-reduced-motion.
 */
export default function GloryWave() {
  return (
    <div className="gw" aria-hidden="true">
      <span className="gw-band" />

      <style jsx>{`
        .gw {
          position: fixed;
          inset: 0;
          z-index: 3;              /* above content, below navbar (999)/modals */
          pointer-events: none;
          overflow: hidden;
          mix-blend-mode: screen;  /* adds light only — never darkens text */
        }

        .gw-band {
          position: absolute;
          top: -30%;
          left: 0;
          width: 46vw;
          height: 160%;
          /* Saffron → white → green, soft-edged at both ends so there is no
             visible boundary as it crosses. */
          background: linear-gradient(
            100deg,
            transparent 0%,
            rgb(255 153 51 / 0.16) 26%,
            rgb(255 255 255 / 0.20) 50%,
            rgb(19 136 8 / 0.16) 74%,
            transparent 100%
          );
          filter: blur(46px);
          transform: translate3d(-140%, 0, 0) rotate(8deg);
          will-change: transform;
          animation: gw-sweep 26s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }

        @keyframes gw-sweep {
          0%   { transform: translate3d(-140%, 0, 0) rotate(8deg); opacity: 0; }
          6%   { opacity: 1; }
          26%  { opacity: 1; }
          32%  { transform: translate3d(320%, 0, 0) rotate(8deg); opacity: 0; }
          /* Parked off-screen for the remaining ~68% of the cycle. */
          100% { transform: translate3d(320%, 0, 0) rotate(8deg); opacity: 0; }
        }

        /* Phones: narrower band, weaker, and a longer gap between passes. */
        @media (max-width: 767px) {
          .gw-band { width: 70vw; filter: blur(38px); opacity: 0.75; }
        }

        @media (prefers-reduced-motion: reduce) {
          .gw { display: none; }
        }
      `}</style>
    </div>
  );
}
