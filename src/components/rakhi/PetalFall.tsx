'use client';

import { useEffect, useState } from 'react';

/**
 * Marigold petals drifting down, played ONCE when the site loads.
 *
 * Marigold rather than generic confetti because it is the flower actually used
 * at the ceremony — the detail is the point.
 *
 * ONE-SHOT by design: the petals fall and the component then UNMOUNTS itself,
 * so nothing keeps animating for the rest of the session. A permanent fall
 * would be both distracting and a permanent compositor cost.
 *
 * Hydration: positions and delays are random, so they are generated in an
 * effect and the component renders null on the server. Generating them during
 * render would produce different markup on server and client.
 */

const DESKTOP_PETALS = 26;
const MOBILE_PETALS = 12;

/**
 * How long before the component removes itself.
 * MUST exceed the slowest petal: max delay (2.4s) + max duration (6.5s) = 8.9s.
 * Anything shorter unmounts petals mid-air and they visibly vanish.
 */
const LIFETIME_MS = 9500;
/** Safety net if `ec:loader-done` never fires. Sits just past the loader's own
 *  2.36s lifetime (2000ms hold + 360ms fade), so it only ever wins when the
 *  loader is genuinely absent. */
const FALLBACK_START_MS = 3000;

type Petal = {
  left: number;      // vw
  delay: number;     // s
  duration: number;  // s
  size: number;      // px
  drift: number;     // px sideways travel
  spin: number;      // deg
  tone: 'marigold' | 'amber' | 'red';
  flip: number;      // starting rotation, so they don't all face the same way
};

function makePetals(count: number): Petal[] {
  /* Weighted, not an even third each. A 1-in-3 red fall reads as a red
     confetti drop; at 1-in-6 the gold stays dominant and the red registers as
     an accent — the same 70/20/10 balance the theme stylesheet follows. */
  const tones: Petal['tone'][] = ['marigold', 'amber', 'marigold', 'amber', 'marigold', 'red'];
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.4,
    duration: 4.0 + Math.random() * 2.5,
    size: 9 + Math.random() * 9,
    drift: (Math.random() - 0.5) * 190,
    spin: (Math.random() - 0.5) * 760,
    // Cycle the tones so the mix stays balanced rather than clumping.
    tone: tones[i % tones.length],
    flip: Math.random() * 360,
  }));
}

export default function PetalFall() {
  const [petals, setPetals] = useState<Petal[] | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Motion-sensitive visitors get no falling debris at all.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const count = window.matchMedia?.('(max-width: 767px)').matches
      ? MOBILE_PETALS
      : DESKTOP_PETALS;

    /* Wait for the loader to get out of the way.
     *
     * These used to start on mount, which meant a 9.5s fall began behind a 2s
     * opaque overlay — a fifth of the animation was spent invisible, and the
     * first petals the visitor actually saw were already halfway down. This is
     * the same cue and the same fallback that TricolourFall uses on the
     * Independence theme.
     *
     * RakhiLoader fires `ec:loader-done` when it leaves AND immediately if it
     * decides not to show at all (reduced motion), so the common path never
     * reaches the fallback. The fallback exists only for the case where the
     * loader is absent entirely — e.g. if the chrome is ever rendered without
     * it — because petals that never arrive are worse than late ones. */
    let started = false;
    let endTimer: ReturnType<typeof setTimeout>;

    const start = () => {
      if (started) return;
      started = true;
      setPetals(makePetals(count));
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

  if (gone || !petals) return null;

  return (
    <div className="pf" aria-hidden="true">
      {petals.map((p, i) => (
        <span
          key={i}
          className={`pf-p ${p.tone}`}
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size * 0.72}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--drift' as string]: `${p.drift}px`,
            ['--spin' as string]: `${p.spin}deg`,
            ['--flip' as string]: `${p.flip}deg`,
          }}
        />
      ))}

      <style jsx>{`
        .pf {
          position: fixed;
          inset: 0;
          /* Above content, below the navbar (999) and modals (9999), so a petal
             can never land on top of navigation or a dialog. */
          z-index: 900;
          pointer-events: none;
          overflow: hidden;
        }

        .pf-p {
          position: absolute;
          top: -8vh;
          /* Asymmetric radii give a petal silhouette rather than a rectangle. */
          border-radius: 60% 60% 55% 55% / 70% 70% 40% 40%;
          will-change: transform, opacity;
          animation-name: pf-fall;
          animation-timing-function: cubic-bezier(0.36, 0.12, 0.5, 1);
          animation-fill-mode: both;
          animation-iteration-count: 1;   /* explicitly one pass */
        }

        /* Brand gold first — #E8A020 / #F5C356 are the site's own tokens, not a
           marigold palette borrowed from stock festival art. One deep-red petal
           in the mix supplies the rakhi without recolouring the fall. */
        .marigold { background: linear-gradient(150deg, #F5C356, #E8A020); }
        .amber    { background: linear-gradient(150deg, #E8A020, #C07E12); }
        .red      { background: linear-gradient(150deg, #C1272D, #A3121B); }

        /* Translate + rotate only, so each petal stays on the compositor and
           never triggers layout. */
        @keyframes pf-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--flip));
            opacity: 0;
          }
          9%  { opacity: 1; }
          82% { opacity: 1; }
          100% {
            transform: translate3d(var(--drift), 112vh, 0) rotate(calc(var(--flip) + var(--spin)));
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pf { display: none; }
        }
      `}</style>
    </div>
  );
}
