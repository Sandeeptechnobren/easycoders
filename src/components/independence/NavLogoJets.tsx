'use client';

/**
 * Miniature flypast that circles the navbar logo.
 *
 * Four tiny jets on staggered loops, two crossing left→right above the mark and
 * two right→left below it, each trailing a short tricolour wisp. Unlike the
 * hero flypast this one repeats continuously — the request was for a persistent
 * detail around the logo — but it is kept cheap and unobtrusive:
 *
 *  - Rendered BEHIND the logo (z-index 0 vs the mark's own stacking), so the
 *    jets pass behind the brand rather than obscuring it. The logo must stay
 *    perfectly legible; it is the brand.
 *  - `pointer-events: none` on the wrapper, so the logo link keeps its full
 *    click target.
 *  - `overflow: hidden` on a fixed-size box, so jets can never spill into the
 *    nav links or the page.
 *  - Tiny (14–18px) and low opacity — a detail you notice on a second look, not
 *    something competing with the wordmark.
 *  - Hidden below 900px: the mobile navbar is tight and this would collide with
 *    the burger and the logo.
 *  - Removed entirely under prefers-reduced-motion.
 */
export default function NavLogoJets() {
  return (
    <span className="nlj" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`nlj-lane nlj-${i}`}>
          <span className="nlj-craft">
            <span className="nlj-trail" />
            <svg viewBox="0 0 64 22" className="nlj-svg">
              <path
                d="M2 11 L18 9.4 L28 5 L31 5 L29 9.2 L44 8 L49 2.6 L52 2.6 L50.6 7.8 L60 10.4 L62 11 L60 11.6 L50.6 14.2 L52 19.4 L49 19.4 L44 14 L29 12.8 L31 17 L28 17 L18 12.6 L2 11 Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </span>
      ))}

      <style jsx>{`
        .nlj {
          position: absolute;
          /* Generous box around the mark so jets have runway on both sides,
             clipped so nothing escapes into the nav. */
          top: 50%;
          left: 50%;
          width: 320px;
          height: 88px;
          margin: -44px 0 0 -160px;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;          /* behind the logo link, which sits above it */
        }

        .nlj-lane {
          position: absolute;
          left: 0;
          width: 100%;
          height: 0;
          will-change: transform;
        }
        .nlj-craft {
          position: absolute;
          left: -60px;
          display: flex;
          align-items: center;
          color: rgb(11 27 58 / 0.42);
          will-change: transform;
        }
        .nlj-svg { width: 17px; height: auto; display: block; flex: none; }

        .nlj-trail {
          display: block;
          width: 42px;
          height: 2px;
          margin-right: -3px;
          border-radius: 99px;
          filter: blur(1.1px);
          opacity: 0.9;
        }

        /* Two above the mark heading right, two below heading left. */
        .nlj-0 { top: 20px; animation: nlj-right 7s linear infinite; animation-delay: 0s; }
        .nlj-1 { top: 30px; animation: nlj-right 9s linear infinite; animation-delay: 2.6s; }
        .nlj-2 { top: 58px; animation: nlj-left  8s linear infinite; animation-delay: 1.3s; }
        .nlj-3 { top: 68px; animation: nlj-left 11s linear infinite; animation-delay: 4.2s; }

        /* Flip the leftward pair so the airframe faces its direction of travel. */
        .nlj-2 .nlj-craft,
        .nlj-3 .nlj-craft { transform: scaleX(-1); }
        .nlj-2 .nlj-trail,
        .nlj-3 .nlj-trail { order: 2; margin: 0 0 0 -3px; }

        /* Tricolour, in order across the four aircraft. */
        .nlj-0 .nlj-trail { background: linear-gradient(270deg, rgb(255 153 51 / 0.95), transparent); }
        .nlj-1 .nlj-trail { background: linear-gradient(270deg, rgb(19 136 8 / 0.95), transparent); }
        .nlj-2 .nlj-trail { background: linear-gradient(90deg,  rgb(255 153 51 / 0.95), transparent); }
        .nlj-3 .nlj-trail { background: linear-gradient(90deg,  rgb(19 136 8 / 0.95), transparent); }

        /* Slight climb across the pass so they arc rather than slide flat. */
        @keyframes nlj-right {
          0%   { transform: translate3d(0, 0, 0);              opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translate3d(400px, -7px, 0);       opacity: 0; }
        }
        @keyframes nlj-left {
          0%   { transform: translate3d(400px, 0, 0);          opacity: 0; }
          12%  { opacity: 1; }
          88%  { opacity: 1; }
          100% { transform: translate3d(0, 6px, 0);            opacity: 0; }
        }

        /* On the white navbar the darker airframe reads best; once scrolled the
           surface is glassy, so lift the contrast slightly. */
        :global(.nb.scrolled) .nlj-craft { color: rgb(11 27 58 / 0.5); }

        @media (max-width: 900px) {
          .nlj { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nlj { display: none; }
        }
      `}</style>
    </span>
  );
}
