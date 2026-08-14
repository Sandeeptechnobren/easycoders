'use client';

/**
 * Flag hoisting — the tricolour rises up the pole once, then settles into a
 * slow wave.
 *
 * The hoist runs ONCE on mount (2.2s) rather than looping, which is what makes
 * it read as a hoisting ceremony rather than a repeating banner ad. The wave
 * that follows is a very slow, low-amplitude skew.
 *
 * Built from CSS gradients + SVG, so there is no image to download and it stays
 * crisp at any size. `aria-hidden` because it is decorative — the page already
 * says "Independence Day" in real text, and a screen reader announcing a flag
 * graphic adds nothing.
 */
export default function FlagHoist({ height = 190 }: { height?: number }) {
  return (
    <div className="fh" style={{ ['--fh-h' as string]: `${height}px` }} aria-hidden="true">
      <div className="fh-pole">
        <span className="fh-finial" />
      </div>

      <div className="fh-flag-wrap">
        <div className="fh-flag">
          <span className="fh-band fh-saffron" />
          <span className="fh-band fh-white">
            {/* Ashoka Chakra — 24 spokes, navy, as on the flag. */}
            <svg viewBox="0 0 100 100" className="fh-chakra">
              <circle cx="50" cy="50" r="30" fill="none" stroke="#000080" strokeWidth="4" />
              <circle cx="50" cy="50" r="5" fill="#000080" />
              {Array.from({ length: 24 }).map((_, i) => (
                <line
                  key={i}
                  x1="50" y1="21" x2="50" y2="30"
                  stroke="#000080" strokeWidth="2"
                  transform={`rotate(${i * 15} 50 50)`}
                />
              ))}
            </svg>
          </span>
          <span className="fh-band fh-green" />
        </div>
      </div>

      <style jsx>{`
        .fh {
          position: relative;
          width: 150px;
          height: var(--fh-h);
          flex: none;
        }

        .fh-pole {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 5px;
          border-radius: 99px;
          background: linear-gradient(180deg, #E6E9F0 0%, #A9B2C4 45%, #79839A 100%);
          box-shadow: 0 2px 8px rgb(0 0 0 / 0.28);
        }
        .fh-finial {
          position: absolute;
          top: -9px; left: 50%;
          width: 13px; height: 13px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: radial-gradient(circle at 32% 30%, #FFE39A, #E8A020 60%, #A9700D);
          box-shadow: 0 0 10px rgb(232 160 32 / 0.65);
        }

        /* The wrapper does the HOISTING (vertical travel, once).
           The flag inside does the WAVING. Separating them keeps each animation
           on a single transform and avoids them fighting. */
        .fh-flag-wrap {
          position: absolute;
          left: 5px;
          top: 6px;
          transform-origin: left top;
          animation: fh-hoist 2200ms cubic-bezier(0.25, 0.9, 0.3, 1) both;
        }

        .fh-flag {
          display: flex;
          flex-direction: column;
          width: 132px;
          border-radius: 0 3px 3px 0;
          overflow: hidden;
          box-shadow: 3px 4px 14px rgb(0 0 0 / 0.30);
          transform-origin: left center;
          /* Starts only after the hoist finishes. */
          animation: fh-wave 5.5s 2200ms ease-in-out infinite;
        }
        .fh-band { display: block; height: 29px; }
        .fh-saffron { background: #FF9933; }
        .fh-white   { background: #FFFFFF; display: grid; place-items: center; }
        .fh-green   { background: #138808; }
        .fh-chakra  { width: 26px; height: 26px; display: block; }

        @keyframes fh-hoist {
          0%   { transform: translateY(calc(var(--fh-h) - 110px)) scaleY(0.9); opacity: 0; }
          12%  { opacity: 1; }
          /* Slight overshoot-free settle — no bounce, per the project's rules. */
          100% { transform: translateY(0) scaleY(1); opacity: 1; }
        }

        /* Low-amplitude skew reads as cloth without the cost of a real ripple. */
        @keyframes fh-wave {
          0%, 100% { transform: perspective(420px) rotateY(0deg) skewY(0deg); }
          35%      { transform: perspective(420px) rotateY(-7deg) skewY(0.9deg); }
          70%      { transform: perspective(420px) rotateY(5deg) skewY(-0.7deg); }
        }

        @media (max-width: 900px) {
          .fh { width: 116px; }
          .fh-flag { width: 104px; }
          .fh-band { height: 23px; }
        }

        @media (prefers-reduced-motion: reduce) {
          /* Keep the flag, drop the motion — it appears already hoisted. */
          .fh-flag-wrap { animation: none; transform: none; }
          .fh-flag { animation: none; }
        }
      `}</style>
    </div>
  );
}
