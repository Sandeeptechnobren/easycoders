'use client';

import { useEffect, useState } from 'react';

/**
 * Independence Day launch animation.
 *
 * Sequence (~1.6s total):
 *   1. Dark branded ground fades in
 *   2. Easy Coders logo settles
 *   3. Saffron → white → green light sweeps across it
 *   4. An Ashoka Chakra ring traces in behind
 *   5. A tricolour progress line fills
 *   6. The whole thing fades out
 *
 * Deliberate constraints, all from the brief and the project's rules:
 *  - Shows ONCE PER SESSION (sessionStorage), never on every route change.
 *  - Never blocks: `pointer-events: none` from the moment it starts fading, and
 *    it self-dismisses on a timer regardless of page state — it can't strand a
 *    user behind a stuck overlay.
 *  - `prefers-reduced-motion` collapses it to a brief static fade (no sweep, no
 *    spin) rather than removing the brand moment entirely.
 *  - Only renders when the Tiranga theme is ACTIVE, so with the theme off the
 *    site loads exactly as before.
 *  - Pure CSS/SVG — no library, no canvas, transform/opacity only.
 */

const SESSION_KEY = 'ec_independence_seen';

export default function IndependenceLoader() {
  // Start hidden and decide on the client: reading sessionStorage during render
  // would break hydration, and we must not flash the overlay for someone who
  // has already seen it this session.
  const [phase, setPhase] = useState<'idle' | 'playing' | 'leaving' | 'done'>('idle');

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* storage blocked — just play it */
    }
    // Already shown this session: stay in 'idle', which renders null. Returning
    // here (rather than setting 'done') also keeps this effect free of a
    // synchronous setState, which would cause a cascading render.
    if (seen) return;

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Shorter, gentler timing when reduced motion is requested.
    const hold = reduced ? 500 : 1400;
    const fade = reduced ? 200 : 420;

    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    // Start on the next frame so the state change is not synchronous inside the
    // effect body. One frame is imperceptible and it lets first paint land first.
    const raf = requestAnimationFrame(() => {
      setPhase('playing');
      t1 = setTimeout(() => setPhase('leaving'), hold);
      t2 = setTimeout(() => setPhase('done'), hold + fade);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div
      className={`idl ${phase === 'leaving' ? 'idl-out' : ''}`}
      role="status"
      aria-label="Easy Coders"
    >
      <div className="idl-stage">
        {/* Chakra ring traces in behind the mark */}
        <svg className="idl-chakra" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="idl-chakra-ring" cx="60" cy="60" r="52" />
          {/* 24 spokes — the correct count for the Ashoka Chakra */}
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="60"
              y1="12"
              x2="60"
              y2="26"
              transform={`rotate(${i * 15} 60 60)`}
            />
          ))}
        </svg>

        <div className="idl-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/eclogo.png" alt="" className="idl-logo" aria-hidden="true" />
          {/* The tricolour light sweep */}
          <span className="idl-sweep" aria-hidden="true" />
        </div>

        <p className="idl-word">Easy Coders</p>
        <div className="idl-bar" aria-hidden="true"><span /></div>
      </div>

      <style jsx>{`
        .idl {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: grid;
          place-items: center;
          background:
            radial-gradient(120% 90% at 50% 40%, #12244F 0%, #07122A 60%, #050D20 100%);
          animation: idl-in 260ms ease both;
        }
        .idl-out {
          animation: idl-out 420ms ease forwards;
          pointer-events: none; /* never trap the user behind a fading overlay */
        }

        .idl-stage { display: flex; flex-direction: column; align-items: center; gap: 16px; }

        .idl-chakra {
          position: absolute;
          width: 190px; height: 190px;
          top: 50%; left: 50%;
          transform: translate(-50%, calc(-50% - 34px));
          overflow: visible;
        }
        .idl-chakra-ring,
        .idl-chakra :global(line) {
          fill: none;
          stroke: #7FA0FF;
          stroke-width: 1.5;
          opacity: 0;
          animation: idl-chakra-fade 1.5s ease both;
        }
        .idl-chakra { animation: idl-chakra-spin 9s linear infinite; }

        .idl-logo-wrap { position: relative; overflow: hidden; border-radius: 14px; }
        .idl-logo {
          display: block;
          width: 96px; height: auto;
          animation: idl-pop 620ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        /* Saffron → white → green light passing across the mark. */
        .idl-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(255, 153, 51, 0.85) 38%,
            rgba(255, 255, 255, 0.95) 50%,
            rgba(19, 136, 8, 0.85) 62%,
            transparent 80%
          );
          transform: translateX(-120%);
          animation: idl-sweep 1150ms 260ms cubic-bezier(0.4, 0, 0.2, 1) both;
          mix-blend-mode: screen;
        }

        .idl-word {
          margin: 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #fff;
          opacity: 0;
          animation: idl-rise 520ms 420ms ease both;
        }

        .idl-bar {
          width: 150px; height: 3px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.14);
          overflow: hidden;
        }
        .idl-bar span {
          display: block;
          height: 100%;
          width: 100%;
          transform-origin: left center;
          transform: scaleX(0);
          background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%);
          animation: idl-fill 1250ms 200ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes idl-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes idl-out { to { opacity: 0; visibility: hidden } }
        /* Scale + fade only — no bounce/elastic, per the project's design rules. */
        @keyframes idl-pop  { from { opacity: 0; transform: scale(0.82) } to { opacity: 1; transform: scale(1) } }
        @keyframes idl-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes idl-sweep { to { transform: translateX(120%) } }
        @keyframes idl-fill  { to { transform: scaleX(1) } }
        @keyframes idl-chakra-fade { 0% { opacity: 0 } 45% { opacity: 0.5 } 100% { opacity: 0.28 } }
        @keyframes idl-chakra-spin { to { transform: translate(-50%, calc(-50% - 34px)) rotate(360deg) } }

        /* Reduced motion: keep the brand moment, drop the movement. */
        @media (prefers-reduced-motion: reduce) {
          .idl-logo, .idl-word { animation: idl-in 200ms ease both; transform: none; }
          .idl-sweep { display: none; }
          .idl-chakra { animation: none; }
          .idl-chakra-ring, .idl-chakra :global(line) { animation: none; opacity: 0.3; }
          .idl-bar span { animation: idl-fill 300ms linear both; }
        }
      `}</style>
    </div>
  );
}
