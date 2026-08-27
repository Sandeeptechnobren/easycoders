'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Opening loader for the Raksha Bandhan theme: a rakhi charm that draws itself
 * on a thread.
 *
 * PURE CSS — no video, no image. The Independence loader shipped a 3MB MP4;
 * this costs nothing to download, cannot fail to decode, and works offline.
 *
 * Rules it has to obey, learned from that loader:
 *  1. HARD TIMEOUT. The overlay leaves at MAX_MS whatever happens. A loader
 *     that can outstay its welcome is worse than no loader.
 *  2. It announces `ec:loader-done` when it leaves AND immediately when it
 *     decides not to show, so anything waiting on that cue (the petals) is
 *     never left hanging.
 *  3. ONCE PER SESSION. Seeing it on every navigation would be maddening.
 */

const MAX_MS = 2200;
const SESSION_KEY = 'ec_rakhi_loader_seen';

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
    // Matches the fade-out duration below; the element is removed after it.
    setTimeout(() => {
      setShow(false);
      announce();
    }, 420);
  }, [announce]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* private mode — treat as unseen; worst case it shows once more */
    }

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (seen || reduced) {
      // Tell listeners immediately — they must not wait on a loader that will
      // never appear.
      announce();
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    /* Microtask deferral, not requestAnimationFrame: rAF is frozen in a
       background tab, which left the loader mounted-but-never-shown and, worse,
       never started the MAX_MS timer that takes it away again. */
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    void Promise.resolve().then(() => {
      if (cancelled) return;
      setShow(true);
      timer = setTimeout(finish, MAX_MS);
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
        <span className="rl-thread" />
        <span className="rl-charm" />
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
          transition: opacity 0.42s ease;
        }
        .rl.out { opacity: 0; }

        .rl-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          position: relative;
        }

        /* The thread the charm hangs from — draws downward, then the charm
           lands on it. */
        .rl-thread {
          width: 3px;
          height: 54px;
          border-radius: 2px;
          background: repeating-linear-gradient(
            180deg,
            #E8A020 0 7px, #F5C356 7px 11px, #A3121B 11px 15px, #E8A020 15px 18px
          );
          transform-origin: top center;
          animation: rl-drop 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both;
        }

        .rl-charm {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, #F5C356 0 14%, #E8A020 14% 20%, transparent 20%),
            radial-gradient(circle at 50% 50%, transparent 0 62%, #E8A020 62% 70%, #A3121B 70% 76%, transparent 76%),
            repeating-conic-gradient(from 0deg, #0B1B3A 0deg 15deg, #E8A020 15deg 30deg);
          box-shadow: 0 6px 26px rgb(193 39 45 / 0.45);
          animation:
            rl-land 0.55s cubic-bezier(0.34, 1.3, 0.64, 1) 0.35s both,
            rl-spin 5s linear 0.9s infinite;
        }

        .rl-word {
          margin-top: 6px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #fff;
          animation: rl-fade 0.5s ease 0.7s both;
        }

        .rl-sub {
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          /* Light gold on deep navy — around 8:1, comfortably readable. */
          color: #F5C356;
          animation: rl-fade 0.5s ease 0.9s both;
        }

        @keyframes rl-drop {
          from { transform: scaleY(0); opacity: 0; }
          to   { transform: scaleY(1); opacity: 1; }
        }
        @keyframes rl-land {
          from { transform: scale(0.2) translateY(-18px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes rl-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rl-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Belt and braces: the effect also bails out in JS above, but if that
           ever regresses the overlay must still not animate. */
        @media (prefers-reduced-motion: reduce) {
          .rl-thread, .rl-charm, .rl-word, .rl-sub { animation: none; }
        }
      `}</style>
    </div>
  );
}
