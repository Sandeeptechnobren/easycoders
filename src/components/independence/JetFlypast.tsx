'use client';

/**
 * Cinematic air-show flypast.
 *
 * Choreography (a 30s cycle, mostly empty sky):
 *   t+0s    Jet 1 — the leader, high and distant, small and slow
 *   t+2.4s  Jets 2 & 3 — the wingmen, in formation behind and below
 *   t+11s   Jet 4 — a solo crossing lower and larger (nearest the camera)
 *   t+18s   Jet 5 — enters from the RIGHT, opposing direction, highest and faintest
 *   then    empty sky until the cycle restarts
 *
 * Depth is what sells it: each jet has its own scale, opacity, blur, speed and
 * altitude drift, so the formation reads as occupying space rather than sliding
 * across a flat plane. Distant jets are smaller, slower, fainter and slightly
 * blurred — the same cues an atmosphere gives you in a real photograph.
 *
 * SMOKE — the part that matters most.
 * A flat coloured line reads as CSS. Real air-show smoke expands, softens,
 * turbulates and disperses. So each trail is composed of THREE offset layers:
 *   · core   — brightest, thinnest, tight to the aircraft
 *   · body   — wider, blurred, expanding along its length
 *   · disperse — widest, heavily blurred, lowest opacity, longest lag
 * Each layer has its own blur, delay and vertical drift, and the whole trail
 * scales up along X while fading, so it thins and dissipates toward the tail.
 *
 * PERFORMANCE — the reason this is affordable:
 *   · Pure CSS keyframes on transform/opacity/filter. No canvas, no rAF loop,
 *     no scroll handler, no library, no images.
 *   · The sky is EMPTY most of the cycle; jets are parked off-screen.
 *   · `contain: strict` + `will-change: transform` keep each jet on its own
 *     compositor layer and stop it invalidating the page.
 *   · Hidden below 768px and removed entirely under prefers-reduced-motion.
 */

type Jet = {
  /** vertical start, % of viewport */
  top: number;
  /** perspective scale — smaller = further away */
  scale: number;
  /** seconds into the 30s cycle */
  delay: number;
  /** crossing duration */
  dur: number;
  /** atmospheric haze for distant aircraft */
  blur: number;
  opacity: number;
  /** climb (negative) or descent across the crossing, px */
  drift: number;
  /** nose attitude */
  rotate: number;
  trail: 'saffron' | 'white' | 'green';
  /** true = enters from the right, flying left */
  reverse?: boolean;
};

/* Leader + two wingmen, then a near solo, then an opposing high pass. */
const JETS: Jet[] = [
  { top: 16, scale: 0.68, delay: 0,    dur: 13, blur: 0.7, opacity: 0.62, drift: -30, rotate: -4, trail: 'saffron' },
  { top: 21, scale: 0.58, delay: 2.4,  dur: 14, blur: 1.0, opacity: 0.52, drift: -22, rotate: -3, trail: 'white'   },
  { top: 25, scale: 0.58, delay: 2.9,  dur: 14, blur: 1.0, opacity: 0.52, drift: -22, rotate: -3, trail: 'green'   },
  { top: 38, scale: 1.00, delay: 11,   dur: 9,  blur: 0,   opacity: 0.85, drift: -46, rotate: -6, trail: 'saffron' },
  { top: 11, scale: 0.44, delay: 18,   dur: 16, blur: 1.4, opacity: 0.38, drift: 18,  rotate: 3,  trail: 'green', reverse: true },
];

export default function JetFlypast() {
  return (
    <div className="jf" aria-hidden="true">
      {JETS.map((j, i) => (
        <div
          key={i}
          className={`jf-lane ${j.reverse ? 'rev' : ''}`}
          style={{
            top: `${j.top}%`,
            opacity: j.opacity,
            ['--s' as string]: j.scale,
            ['--d' as string]: `${j.delay}s`,
            ['--dur' as string]: `${j.dur}s`,
            ['--blur' as string]: `${j.blur}px`,
            ['--drift' as string]: `${j.drift}px`,
            ['--rot' as string]: `${j.rotate}deg`,
          }}
        >
          <div className="jf-craft">
            {/* Volumetric trail: three offset layers, widest and softest last. */}
            <span className={`jf-smoke disperse ${j.trail}`} />
            <span className={`jf-smoke body ${j.trail}`} />
            <span className={`jf-smoke core ${j.trail}`} />

            {/* Light bloom that travels with the aircraft. */}
            <span className="jf-bloom" />

            <svg viewBox="0 0 80 26" className="jf-svg">
              {/* Delta-wing silhouette with canards and fin — reads as a fast
                  jet at small sizes without pretending to be a specific type. */}
              <path
                d="M3 13 L20 11.2 L30 6.5 L34 6.5 L31.5 11 L46 9.4 L52 3 L56 3 L54.5 9 L70 11.6 L76 12.6 L78 13 L76 13.4 L70 14.4 L54.5 17 L56 23 L52 23 L46 16.6 L31.5 15 L34 19.5 L30 19.5 L20 14.8 L3 13 Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      ))}

      <style jsx>{`
        .jf {
          position: fixed;
          inset: 0;
          z-index: 2;              /* above background, far below navbar/modals */
          pointer-events: none;
          overflow: hidden;
        }

        /* The lane owns the horizontal crossing. */
        .jf-lane {
          position: absolute;
          left: 0;
          width: 100%;
          height: 0;
          animation: jf-cross var(--dur) cubic-bezier(0.34, 0.02, 0.64, 1) var(--d) infinite;
          will-change: transform;
        }
        /* Opposing pass: flip the whole lane, so the same keyframes fly it the
           other way and the aircraft faces correctly without a second animation. */
        .jf-lane.rev { transform: scaleX(-1); }

        /* The craft owns scale, attitude, altitude drift and haze. Separating
           these from the crossing keeps each animation on one transform. */
        .jf-craft {
          position: absolute;
          left: 0;
          display: flex;
          align-items: center;
          color: #E8EDF7;
          filter: blur(var(--blur)) drop-shadow(0 2px 5px rgb(0 0 0 / 0.4));
          transform: scale(var(--s)) rotate(var(--rot));
          animation: jf-drift var(--dur) ease-in-out var(--d) infinite;
          will-change: transform;
          contain: strict;
        }
        .jf-svg { width: 62px; height: auto; display: block; flex: none; }

        /* ── Smoke ───────────────────────────────────────────────────────── */
        .jf-smoke {
          position: absolute;
          right: 100%;                 /* always behind the aircraft */
          margin-right: -4px;
          border-radius: 99px;
          transform-origin: right center;
          will-change: transform, opacity;
        }
        /* Tight, bright, close to the tailpipe. */
        .jf-smoke.core {
          width: 150px; height: 3px; top: 50%; margin-top: -1.5px;
          filter: blur(1.5px);
          animation: jf-smoke-core var(--dur) ease-out var(--d) infinite;
        }
        /* The main body of the trail — expands and softens. */
        .jf-smoke.body {
          width: 300px; height: 9px; top: 50%; margin-top: -4.5px;
          filter: blur(7px);
          animation: jf-smoke-body var(--dur) ease-out var(--d) infinite;
        }
        /* The oldest smoke: widest, faintest, drifting off the flight path. */
        .jf-smoke.disperse {
          width: 470px; height: 22px; top: 50%; margin-top: -11px;
          filter: blur(15px);
          animation: jf-smoke-disperse var(--dur) ease-out var(--d) infinite;
        }

        .saffron.core     { background: linear-gradient(270deg, rgb(255 153 51 / 0.95), rgb(255 153 51 / 0)); }
        .saffron.body     { background: linear-gradient(270deg, rgb(255 153 51 / 0.55), rgb(255 170 80 / 0)); }
        .saffron.disperse { background: linear-gradient(270deg, rgb(255 170 80 / 0.26), rgb(255 190 130 / 0)); }
        .white.core       { background: linear-gradient(270deg, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0)); }
        .white.body       { background: linear-gradient(270deg, rgb(255 255 255 / 0.50), rgb(255 255 255 / 0)); }
        .white.disperse   { background: linear-gradient(270deg, rgb(255 255 255 / 0.24), rgb(255 255 255 / 0)); }
        .green.core       { background: linear-gradient(270deg, rgb(19 136 8 / 0.95), rgb(19 136 8 / 0)); }
        .green.body       { background: linear-gradient(270deg, rgb(30 150 20 / 0.52), rgb(60 170 40 / 0)); }
        .green.disperse   { background: linear-gradient(270deg, rgb(60 170 40 / 0.26), rgb(90 190 70 / 0)); }

        /* Soft light travelling with the aircraft — a brightness lift, never a flash. */
        .jf-bloom {
          position: absolute;
          top: 50%; left: 50%;
          width: 150px; height: 150px;
          margin: -75px 0 0 -75px;
          border-radius: 50%;
          background: radial-gradient(circle, rgb(255 246 230 / 0.16), transparent 66%);
          filter: blur(12px);
        }

        /* ── Keyframes ───────────────────────────────────────────────────── */
        /* Crossing: off-screen left → off-screen right, then parked for the
           remainder of the 30s cycle so the sky is empty most of the time. */
        @keyframes jf-cross {
          0%    { transform: translate3d(-460px, 0, 0); }
          46%   { transform: translate3d(calc(100vw + 460px), 0, 0); }
          100%  { transform: translate3d(calc(100vw + 460px), 0, 0); }
        }
        .jf-lane.rev { animation-name: jf-cross-rev; }
        @keyframes jf-cross-rev {
          0%    { transform: scaleX(-1) translate3d(-460px, 0, 0); }
          46%   { transform: scaleX(-1) translate3d(calc(100vw + 460px), 0, 0); }
          100%  { transform: scaleX(-1) translate3d(calc(100vw + 460px), 0, 0); }
        }

        /* Gentle climb/descent + attitude change during the pass. */
        @keyframes jf-drift {
          0%   { transform: scale(var(--s)) rotate(var(--rot)) translateY(0); }
          46%  { transform: scale(var(--s)) rotate(calc(var(--rot) * 0.35)) translateY(var(--drift)); }
          100% { transform: scale(var(--s)) rotate(calc(var(--rot) * 0.35)) translateY(var(--drift)); }
        }

        /* Smoke grows along its length and thins as it ages, then clears before
           the next pass. scaleX from the right edge = it trails from the tail. */
        @keyframes jf-smoke-core {
          0%   { transform: scaleX(0.05); opacity: 0; }
          6%   { opacity: 1; }
          40%  { transform: scaleX(1); opacity: 0.9; }
          46%  { transform: scaleX(1.1); opacity: 0; }
          100% { transform: scaleX(0); opacity: 0; }
        }
        @keyframes jf-smoke-body {
          0%   { transform: scaleX(0.05) scaleY(0.6); opacity: 0; }
          8%   { opacity: 0.9; }
          40%  { transform: scaleX(1) scaleY(1.35); opacity: 0.55; }
          46%  { transform: scaleX(1.15) scaleY(1.6); opacity: 0; }
          100% { transform: scaleX(0); opacity: 0; }
        }
        /* The dispersing layer also drifts downward slightly — smoke sinks and
           smears rather than holding a perfect line. */
        @keyframes jf-smoke-disperse {
          0%   { transform: scaleX(0.05) scaleY(0.5) translateY(0); opacity: 0; }
          12%  { opacity: 0.65; }
          40%  { transform: scaleX(1) scaleY(1.9) translateY(7px); opacity: 0.3; }
          46%  { transform: scaleX(1.2) scaleY(2.3) translateY(11px); opacity: 0; }
          100% { transform: scaleX(0); opacity: 0; }
        }

        /* Phones: at most the leader + one wingman, smaller and fainter, so the
           sky still has an air-show without covering a 375px viewport. */
        @media (max-width: 767px) {
          .jf-lane:nth-child(n + 3) { display: none; }
          .jf-craft { transform: scale(calc(var(--s) * 0.62)) rotate(var(--rot)); }
          .jf-smoke.disperse { display: none; }   /* the most expensive blur */
          .jf-smoke.body { filter: blur(5px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .jf { display: none; }
        }
      `}</style>
    </div>
  );
}
