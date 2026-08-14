'use client';

import { useEffect, useState } from 'react';

/**
 * Falling tricolour celebration, played once when the site loads.
 *
 * Timing: waits for the loader to finish (it dispatches `ec:loader-done`, and
 * dispatches it immediately when it decides not to show) so the confetti is
 * never wasted behind the overlay. A 4s fallback timer covers the case where
 * that event never arrives.
 *
 * It is a ONE-SHOT: the pieces fall, and the component then UNMOUNTS itself so
 * there are no leftover compositor layers or running animations for the rest of
 * the session. Continuous confetti would be both distracting and a permanent
 * cost — the brief was explicit about avoiding that.
 *
 * Hydration: the pieces use random positions/delays, so they are generated in
 * an effect and the component renders null on the server. Generating them
 * during render would produce different markup on server and client.
 */

const DESKTOP_PIECES = 38;
const MOBILE_PIECES = 16;
/**
 * How long the fall runs before the component removes itself.
 * MUST exceed the slowest piece: max delay (2.2s) + max duration (6.0s) = 8.2s.
 * A shorter value unmounts the last pieces mid-air and they vanish visibly.
 */
const LIFETIME_MS = 9000;
/** Safety net if `ec:loader-done` never fires. */
const FALLBACK_START_MS = 4000;

type Piece = {
  left: number;      // vw
  delay: number;     // s
  duration: number;  // s
  size: number;      // px
  ratio: number;     // height multiplier — thin strips read better than squares
  drift: number;     // px horizontal travel
  spin: number;      // deg
  tone: 'saffron' | 'white' | 'green';
  round: boolean;
};

function makePieces(count: number): Piece[] {
  const tones: Piece['tone'][] = ['saffron', 'white', 'green'];
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    // Spread the start so they don't fall as one curtain.
    delay: Math.random() * 2.2,
    duration: 3.4 + Math.random() * 2.6,
    size: 7 + Math.random() * 7,
    ratio: 0.4 + Math.random() * 0.5,
    drift: (Math.random() - 0.5) * 160,
    spin: (Math.random() - 0.5) * 900,
    // Cycle the tones so the tricolour stays balanced rather than clumping.
    tone: tones[i % 3],
    round: Math.random() > 0.72,
  }));
}

export default function TricolourFall() {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Motion-sensitive users get no falling debris at all.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const count = window.matchMedia?.('(max-width: 767px)').matches
      ? MOBILE_PIECES
      : DESKTOP_PIECES;

    let endTimer: ReturnType<typeof setTimeout>;
    // Guards against the event and the fallback timer both firing; that alone
    // makes clearing the pending timer inside start() unnecessary.
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      setPieces(makePieces(count));
      // Unmount once the last piece has landed — no lingering layers.
      endTimer = setTimeout(() => setGone(true), LIFETIME_MS);
    };

    window.addEventListener('ec:loader-done', start, { once: true });
    const startTimer = setTimeout(start, FALLBACK_START_MS);

    return () => {
      window.removeEventListener('ec:loader-done', start);
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, []);

  if (gone || !pieces) return null;

  return (
    <div className="tf" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`tf-p ${p.tone} ${p.round ? 'round' : ''}`}
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size * p.ratio}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
            ['--spin' as string]: `${p.spin}deg`,
          }}
        />
      ))}

      <style jsx>{`
        .tf {
          position: fixed;
          inset: 0;
          /* Above the page, below the navbar (999) and modals (9999), so it
             never lands on top of navigation or a dialog. */
          z-index: 900;
          pointer-events: none;
          overflow: hidden;
        }

        .tf-p {
          position: absolute;
          top: -6vh;
          border-radius: 1px;
          will-change: transform, opacity;
          animation-name: tf-fall;
          animation-timing-function: cubic-bezier(0.35, 0.15, 0.5, 1);
          animation-fill-mode: both;
          /* Explicitly ONE pass — a looping celebration would be exhausting. */
          animation-iteration-count: 1;
        }
        .tf-p.round { border-radius: 50%; }

        .saffron { background: linear-gradient(180deg, #FFB25E, #FF9933); }
        .white   { background: linear-gradient(180deg, #FFFFFF, #E9EEF7); }
        .green   { background: linear-gradient(180deg, #2FA81C, #138808); }

        /* Falls, drifts sideways and tumbles. Translate+rotate only, so each
           piece stays on the compositor and never triggers layout. */
        @keyframes tf-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% {
            transform: translate3d(var(--drift), 112vh, 0) rotate(var(--spin));
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tf { display: none; }
        }
      `}</style>
    </div>
  );
}
