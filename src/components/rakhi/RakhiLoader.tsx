'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Opening loader for the Raksha Bandhan theme: a rakhi being TIED onto a wrist.
 *
 * The thread wraps around the arm — back half first, then round the front —
 * the charm settles onto the knot, and the two loose ends flick out. That
 * order is the whole point: a thread that simply appears reads as decoration,
 * while one that goes behind the arm and comes back around reads as tying.
 *
 * PURE CSS + inline SVG — no video, no image. The Independence loader shipped a
 * 3MB MP4; this costs nothing to download, cannot fail to decode, and works
 * offline.
 *
 * The arm is a lighter navy silhouette with a gold rim-light, deliberately NOT
 * a skin tone. A loader shown to every visitor should not pick one.
 *
 * Rules it has to obey, learned from the Independence loader:
 *  1. HARD TIMEOUT. The overlay leaves at HOLD_MS whatever happens. A loader
 *     that can outstay its welcome is worse than no loader.
 *  2. It announces `ec:loader-done` when it leaves AND immediately when it
 *     decides not to show, so anything waiting on that cue (the petals) is
 *     never left hanging.
 *
 * ⚠️ It no longer stores a once-per-session flag: it now plays on EVERY page
 * load, by request. Note that in this App Router SPA a client-side navigation
 * is not a page load — this component stays mounted across route changes, so
 * clicking a nav link does NOT replay it. Only a real load/reload does. Making
 * it fire on route changes as well would put a 2s block in front of every
 * internal click, which is a different (and much more intrusive) thing.
 */

/** How long the loader stays on screen before it starts leaving. */
const HOLD_MS = 2000;
/** Fade-out length. Must match the transition on `.rl` below. */
const FADE_MS = 360;

export default function RakhiLoader() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const announce = useCallback(() => {
    if (done.current) return;
    done.current = true;
    window.dispatchEvent(new CustomEvent('ec:loader-done'));
  }, []);

  const finish = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      setShow(false);
      announce();
    }, FADE_MS);
  }, [announce]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* Skipped entirely under prefers-reduced-motion. Showing a static overlay
       for the same 2s would respect the letter of the preference and none of
       its intent — it would just be two blank seconds. */
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      announce();
      return;
    }

    /* Microtask deferral, not requestAnimationFrame: rAF is frozen in a
       background tab, which left the loader mounted-but-never-shown and, worse,
       never started the timer that takes it away again. */
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setShow(true);
      timer = setTimeout(finish, HOLD_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [announce, finish]);

  if (!show) return null;

  return (
    <div className={`rl ${leaving ? 'out' : ''}`} role="status" aria-label="Loading">
      <div className="rl-inner">
        {/* pathLength="1" on every stroked path normalises its length, so the
            draw animations below can use dasharray/dashoffset of 1 → 0 without
            measuring anything at runtime. */}
        <svg className="rl-svg" viewBox="0 0 240 150" role="img"
             aria-label="A rakhi being tied around a wrist">
          <defs>
            <linearGradient id="rlArm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#263B66" />
              <stop offset="100%" stopColor="#13203D" />
            </linearGradient>
            {/* The braid: gold-dominant, one red strand — the same ratio the
                rest of the theme uses. */}
            <linearGradient id="rlThread" x1="0" y1="0" x2="1" y2="1"
                            gradientUnits="objectBoundingBox">
              <stop offset="0%"   stopColor="#E8A020" />
              <stop offset="34%"  stopColor="#F5C356" />
              <stop offset="52%"  stopColor="#A3121B" />
              <stop offset="70%"  stopColor="#F5C356" />
              <stop offset="100%" stopColor="#E8A020" />
            </linearGradient>
            <radialGradient id="rlCharm" cx="50%" cy="42%">
              <stop offset="0%"   stopColor="#F5C356" />
              <stop offset="52%"  stopColor="#E8A020" />
              <stop offset="100%" stopColor="#A3121B" />
            </radialGradient>
            {/* Clips the front arcs to the arm, so the thread cannot spill past
                the silhouette's edge where it would stop reading as a wrap. */}
            <clipPath id="rlArmClip">
              <path d="M -6 112 C 62 108, 132 95, 246 76 L 246 38 C 132 57, 62 65, -6 70 Z" />
            </clipPath>
          </defs>

          {/* ⚠️ PAINT ORDER IS THE ILLUSION. SVG has no z-index — it paints in
                document order — so the far side of each wrap must be declared
                BEFORE the arm, and the near side after it. Get this backwards
                and the thread lies flat on top of the arm like a sticker.

                Geometry is measured against the arm path, not guessed: at
                x=94 the band runs y 60.3–100.9 and at x=150 y 52.9–92.1, so
                each arc is set ~7px proud at BOTH ends. An earlier version
                cleared the top by 8px and the bottom by 1px, which hid the
                lower bulge and killed the sense of going around. */}

          {/* ── Far side of both wraps (behind the arm) ── */}
          <path className="rl-back rl-back-1" pathLength="1"
                d="M 96 53 A 15 27 -9 0 1 93 108" />
          <path className="rl-back rl-back-2" pathLength="1"
                d="M 152 46 A 15 27 -9 0 1 149 99" />

          {/* ── The arm. Runs off both edges: a forearm cropped by the frame
                reads as an arm, one floating in space reads as a sausage. ── */}
          <g className="rl-arm">
            <path d="M -6 112 C 62 108, 132 95, 246 76 L 246 38 C 132 57, 62 65, -6 70 Z"
                  fill="url(#rlArm)" />
            {/* Rim-light along the top edge, picking up the brand gold. */}
            <path d="M -6 70 C 62 65, 132 57, 246 38" fill="none"
                  stroke="#E8A020" strokeOpacity="0.34" strokeWidth="1.5" />
          </g>

          {/* ── Near side of both wraps (over the arm, clipped to it) ── */}
          <g clipPath="url(#rlArmClip)">
            <path className="rl-front rl-front-1" pathLength="1"
                  d="M 96 53 A 15 27 -9 0 0 93 108" />
            <path className="rl-front rl-front-2" pathLength="1"
                  d="M 152 46 A 15 27 -9 0 0 149 99" />
          </g>

          {/* ── The two loose ends, flicking out after the knot ── */}
          <path className="rl-tail rl-tail-a" pathLength="1"
                d="M 122 79 C 100 90, 74 99, 44 99" />
          <path className="rl-tail rl-tail-b" pathLength="1"
                d="M 122 79 C 146 86, 176 90, 204 84" />

          {/* ── The charm, landing on the knot.
                cy=77 is the arm's measured centre line at x=122 (76.7), not the
                eyeballed 72 an earlier version used — 5px high is enough to read
                as sitting on the edge rather than on the wrist. ── */}
          <g className="rl-charm">
            <circle cx="122" cy="77" r="19" fill="url(#rlCharm)" />
            <circle cx="122" cy="77" r="19" fill="none" stroke="#F5C356" strokeWidth="1.4" />
            <circle cx="122" cy="77" r="11" fill="none" stroke="#0B1B3A"
                    strokeOpacity="0.5" strokeWidth="2.4" />
            <circle cx="122" cy="77" r="4.5" fill="#FEF6E7" />
          </g>
        </svg>

        <span className="rl-word">Easy Coders</span>
        <span className="rl-sub">Happy Raksha Bandhan</span>
      </div>

      <style jsx>{`
        .rl {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          background:
            radial-gradient(ellipse 60% 45% at 18% 88%, rgb(163 18 27 / 0.28) 0%, transparent 70%),
            radial-gradient(ellipse at 50% 40%, #16223E 0%, #0B1B3A 58%, #07122A 100%);
          transition: opacity ${FADE_MS}ms ease;
        }
        .rl.out { opacity: 0; }

        .rl-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .rl-svg {
          width: min(340px, 74vw);
          height: auto;
          overflow: visible;
        }

        /* ── Choreography ──────────────────────────────────────────────────
           Every duration below is chosen against HOLD_MS = 2000: the last
           element finishes at ~1800ms, leaving a brief settled beat before the
           overlay starts to fade. Nothing may end after HOLD_MS or it would be
           cut off mid-motion. */

        .rl-arm { animation: rl-arm-in 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both; }

        .rl-back, .rl-front {
          fill: none;
          stroke: url(#rlThread);
          stroke-width: 9;
          stroke-linecap: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        /* The far side is dimmer — it is notionally behind the arm, and equal
           brightness on both halves flattens the wrap into a flat ring. */
        .rl-back { stroke-opacity: 0.5; stroke-width: 7.5; }

        .rl-back-1  { animation: rl-draw 0.40s ease-in     0.32s both; }
        .rl-front-1 { animation: rl-draw 0.36s ease-out    0.70s both; }
        .rl-back-2  { animation: rl-draw 0.40s ease-in     0.46s both; }
        .rl-front-2 { animation: rl-draw 0.36s ease-out    0.84s both; }

        .rl-tail {
          fill: none;
          stroke: url(#rlThread);
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
        }
        .rl-tail-a { animation: rl-draw 0.42s cubic-bezier(0.22, 0.61, 0.36, 1) 1.24s both; }
        .rl-tail-b { animation: rl-draw 0.42s cubic-bezier(0.22, 0.61, 0.36, 1) 1.32s both; }

        .rl-charm {
          transform-origin: 122px 77px;
          /* A short overshoot, not a bounce: the charm is being pressed into
             place, and elastic easing would read as a toy. */
          animation: rl-charm-in 0.46s cubic-bezier(0.34, 1.28, 0.64, 1) 1.06s both;
        }

        .rl-word {
          margin-top: 4px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #fff;
          animation: rl-fade 0.44s ease 1.30s both;
        }

        .rl-sub {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          /* Light gold on deep navy — around 8:1, comfortably readable. */
          color: #F5C356;
          animation: rl-fade 0.44s ease 1.46s both;
        }

        @keyframes rl-draw {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes rl-arm-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rl-charm-in {
          from { opacity: 0; transform: scale(0.25) rotate(-38deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes rl-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .rl-word { font-size: 17px; }
          .rl-sub  { font-size: 10.5px; letter-spacing: 0.14em; }
        }

        /* Belt and braces: the effect also bails out in JS above, but if that
           ever regresses the overlay must still not animate. */
        @media (prefers-reduced-motion: reduce) {
          .rl-arm, .rl-back, .rl-front, .rl-tail, .rl-charm, .rl-word, .rl-sub {
            animation: none;
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
