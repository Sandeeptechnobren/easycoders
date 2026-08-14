'use client';

/**
 * Air-force style flypast — a three-jet formation crossing the screen trailing
 * saffron / white / green smoke.
 *
 * Site-wide, but deliberately intermittent rather than constant: the formation
 * crosses, then the animation idles for the remainder of the cycle. A permanent
 * loop of moving objects over every page is both distracting and a steady
 * compositor cost.
 *
 * Cost control:
 *  - Pure CSS transform animation on 3 small SVGs. No canvas, no rAF loop, no
 *    scroll handler, no library.
 *  - `position: fixed` + `pointer-events: none` + low z-index, so it never
 *    intercepts a click and never affects layout.
 *  - Hidden entirely below 768px — on a phone the jets would cross a narrow
 *    viewport constantly and cover content.
 *  - Fully removed under `prefers-reduced-motion`.
 */
export default function JetFlypast() {
  return (
    <div className="jf" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`jf-jet jf-jet-${i}`}>
          <span className="jf-trail" />
          <svg viewBox="0 0 64 24" className="jf-svg">
            {/* Simple delta-wing silhouette, nose to the right. */}
            <path
              d="M2 12 L26 9 L40 4 L44 9 L60 11.2 L62 12 L60 12.8 L44 15 L40 20 L26 15 L2 12 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      ))}

      <style jsx>{`
        .jf {
          position: fixed;
          inset: 0;
          z-index: 2;          /* above page background, far below navbar/modals */
          pointer-events: none;
          overflow: hidden;
        }

        .jf-jet {
          position: absolute;
          display: flex;
          align-items: center;
          left: -180px;         /* start off-screen left */
          color: rgb(255 255 255 / 0.85);
          will-change: transform;
          /* 22s cycle: the crossing occupies only the first ~35%, so the
             formation is absent most of the time rather than looping forever. */
          animation: jf-cross 22s linear infinite;
        }
        .jf-svg { width: 46px; height: auto; display: block; filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.35)); }

        /* Smoke trail streaming behind each jet. */
        .jf-trail {
          display: block;
          width: 190px;
          height: 3px;
          border-radius: 99px;
          margin-right: -6px;
          opacity: 0.75;
        }
        .jf-jet-0 { top: 16%; animation-delay: 0s;    }
        .jf-jet-1 { top: 21%; animation-delay: 1.1s;  }
        .jf-jet-2 { top: 26%; animation-delay: 2.2s;  }

        /* Leader trails saffron, wingmen white and green — the tricolour, in order. */
        .jf-jet-0 .jf-trail { background: linear-gradient(90deg, transparent, rgb(255 153 51 / 0.9)); }
        .jf-jet-1 .jf-trail { background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.9)); }
        .jf-jet-2 .jf-trail { background: linear-gradient(90deg, transparent, rgb(19 136 8 / 0.95)); }

        @keyframes jf-cross {
          0%   { transform: translate3d(0, 0, 0);                opacity: 0; }
          3%   { opacity: 1; }
          32%  { opacity: 1; }
          35%  { transform: translate3d(calc(100vw + 380px), -26px, 0); opacity: 0; }
          /* Idle for the rest of the cycle, parked off-screen. */
          100% { transform: translate3d(calc(100vw + 380px), -26px, 0); opacity: 0; }
        }

        /* Phones: a formation crossing a 375px viewport is constant motion over
           the content, so it is removed rather than scaled down. */
        @media (max-width: 767px) {
          .jf { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .jf { display: none; }
        }
      `}</style>
    </div>
  );
}
