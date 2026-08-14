'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Independence Day launch animation.
 *
 * Plays a branded video (public/videos/ec-loader.mp4) over a CSS fallback that
 * is ALWAYS rendered underneath. If the video is slow, blocked or unsupported,
 * the CSS animation is already on screen and the user sees no gap.
 *
 * ── Why this is capped ────────────────────────────────────────────────────
 * The source video is 10.0s / 2.9MB. A 10s gate in front of a website is a bad
 * first impression, so the loader auto-dismisses at MAX_MS regardless of how
 * much of the video has played, and a Skip control appears almost immediately.
 * Change MAX_MS to let it run longer (10_000 plays the whole thing).
 *
 * ── Guards, in order of importance ────────────────────────────────────────
 *  1. HARD TIMEOUT. The overlay leaves at MAX_MS whatever happens — a stalled
 *     download or a decode failure can never strand a visitor behind it.
 *  2. NOT SHOWN ON EXPENSIVE CONNECTIONS. 2.9MB is skipped entirely when
 *     Save-Data is on or the connection reports 2g/3g; the CSS loader plays
 *     instead. A branded flourish is not worth someone's data.
 *  3. ONCE PER SESSION (sessionStorage) — never on route changes.
 *  4. NEVER BLOCKS INPUT: pointer-events:none the moment it starts fading.
 *  5. prefers-reduced-motion skips the video and shows a brief static fade.
 */

/** How long the loader is allowed to hold the screen. Video is 10s; raise to 10_000 to play it in full. */
const MAX_MS = 3200;
/** Skip appears this soon, so the exit is always within reach. */
const SKIP_AFTER_MS = 600;
/** If the video hasn't buffered enough by now, don't bother — stay on CSS. */
const VIDEO_BUDGET_MS = 1200;

const SESSION_KEY = 'ec_independence_seen';

export default function IndependenceLoader() {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'leaving' | 'done'>('idle');
  const [useVideo, setUseVideo] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** Tells anything waiting on the loader (e.g. the tricolour fall) to begin. */
  const announceDone = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('ec:loader-done'));
    } catch {
      /* ignore */
    }
  }, []);

  // useCallback so the mount effect can depend on it honestly rather than
  // silencing the exhaustive-deps warning.
  const finish = useCallback(() => {
    setPhase((p) => (p === 'done' ? p : 'leaving'));
    announceDone();
    const t = setTimeout(() => setPhase('done'), 420);
    timers.current.push(t);
  }, [announceDone]);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* storage blocked — play it */
    }
    // Already shown this session: stay 'idle' (renders null). Announce
    // immediately so anything waiting on the loader — the tricolour fall —
    // starts straight away rather than sitting on its fallback timer.
    if (seen) {
      const t = setTimeout(announceDone, 60);
      timers.current.push(t);
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Don't spend 2.9MB of someone's mobile data on decoration.
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const expensive = !!conn?.saveData || /(^|-)(2g|3g)$/.test(conn?.effectiveType ?? '');

    const wantVideo = !reduced && !expensive;

    const raf = requestAnimationFrame(() => {
      setPhase('playing');
      if (wantVideo) setUseVideo(true);

      timers.current.push(setTimeout(() => setShowSkip(true), SKIP_AFTER_MS));
      // The hard stop. Nothing about the video can extend this.
      timers.current.push(setTimeout(finish, reduced ? 700 : MAX_MS));

      if (wantVideo) {
        // If it hasn't started playing within the budget, drop it and let the
        // CSS loader (already visible underneath) carry on alone.
        timers.current.push(
          setTimeout(() => {
            const v = videoRef.current;
            if (!v || v.readyState < 3 /* HAVE_FUTURE_DATA */) setUseVideo(false);
          }, VIDEO_BUDGET_MS),
        );
      }
    });

    const snapshot = timers.current;
    return () => {
      cancelAnimationFrame(raf);
      snapshot.forEach(clearTimeout);
    };
    // Both are useCallback-stable, so this still runs exactly once on mount.
  }, [announceDone, finish]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div className={`idl ${phase === 'leaving' ? 'idl-out' : ''}`} role="status" aria-label="Easy Coders">
      {/* CSS fallback — always rendered, sits under the video. If the video
          never arrives, this is what the user sees, with no visible gap. */}
      <div className={`idl-stage ${useVideo ? 'idl-stage-hidden' : ''}`}>
        <svg className="idl-chakra" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="idl-chakra-ring" cx="60" cy="60" r="52" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line key={i} x1="60" y1="12" x2="60" y2="26" transform={`rotate(${i * 15} 60 60)`} />
          ))}
        </svg>

        <div className="idl-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/eclogo.png" alt="" className="idl-logo" aria-hidden="true" />
          <span className="idl-sweep" aria-hidden="true" />
        </div>

        <p className="idl-word">Easy Coders</p>
        <div className="idl-bar" aria-hidden="true"><span /></div>
      </div>

      {useVideo && (
        <video
          ref={videoRef}
          className="idl-video"
          src="/videos/ec-loader.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          // A decode/network failure must not leave a black screen — fall back.
          onError={() => setUseVideo(false)}
          onStalled={() => setUseVideo(false)}
          // If the clip is shorter than MAX_MS, leave as soon as it ends.
          onEnded={finish}
        />
      )}

      {showSkip && (
        <button type="button" className="idl-skip" onClick={finish}>
          Skip
        </button>
      )}

      <style jsx>{`
        .idl {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: grid;
          place-items: center;
          background: radial-gradient(120% 90% at 50% 40%, #12244F 0%, #07122A 60%, #050D20 100%);
          animation: idl-in 260ms ease both;
        }
        .idl-out { animation: idl-out 420ms ease forwards; pointer-events: none; }

        /* object-fit: contain, not cover — cover would crop the branding badly
           on a portrait phone. The dark ground fills the letterbox. */
        .idl-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: transparent;
        }

        .idl-stage {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          transition: opacity 300ms ease;
        }
        /* Kept mounted (so it can take over instantly on video failure) but
           faded out while the video is playing. */
        .idl-stage-hidden { opacity: 0; }

        .idl-skip {
          position: absolute;
          right: 22px; bottom: 20px;
          padding: 7px 16px;
          font-size: 12px; font-weight: 700; letter-spacing: .04em;
          color: rgb(255 255 255 / 0.9);
          background: rgb(255 255 255 / 0.10);
          border: 1px solid rgb(255 255 255 / 0.28);
          border-radius: 99px;
          cursor: pointer;
          backdrop-filter: blur(6px);
          z-index: 2;
        }
        .idl-skip:hover { background: rgb(255 255 255 / 0.20); }
        .idl-skip:focus-visible { outline: 2px solid #FF9933; outline-offset: 2px; }

        .idl-chakra {
          position: absolute;
          width: 190px; height: 190px;
          top: 50%; left: 50%;
          transform: translate(-50%, calc(-50% - 34px));
          overflow: visible;
          animation: idl-chakra-spin 9s linear infinite;
        }
        .idl-chakra-ring,
        .idl-chakra :global(line) {
          fill: none; stroke: #7FA0FF; stroke-width: 1.5;
          opacity: 0; animation: idl-chakra-fade 1.5s ease both;
        }

        .idl-logo-wrap { position: relative; overflow: hidden; border-radius: 14px; }
        .idl-logo { display: block; width: 96px; height: auto; animation: idl-pop 620ms cubic-bezier(0.22,0.61,0.36,1) both; }
        .idl-sweep {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 20%, rgba(255,153,51,.85) 38%, rgba(255,255,255,.95) 50%, rgba(19,136,8,.85) 62%, transparent 80%);
          transform: translateX(-120%);
          animation: idl-sweep 1150ms 260ms cubic-bezier(0.4,0,0.2,1) both;
          mix-blend-mode: screen;
        }
        .idl-word {
          margin: 0; font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px; font-weight: 700; letter-spacing: .02em; color: #fff;
          opacity: 0; animation: idl-rise 520ms 420ms ease both;
        }
        .idl-bar { width: 150px; height: 3px; border-radius: 99px; background: rgb(255 255 255 / .14); overflow: hidden; }
        .idl-bar span {
          display: block; height: 100%; width: 100%;
          transform-origin: left center; transform: scaleX(0);
          background: linear-gradient(90deg,#FF9933 0%,#FFFFFF 50%,#138808 100%);
          animation: idl-fill 1250ms 200ms cubic-bezier(0.4,0,0.2,1) both;
        }

        @keyframes idl-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes idl-out { to { opacity: 0; visibility: hidden } }
        @keyframes idl-pop  { from { opacity: 0; transform: scale(.82) } to { opacity: 1; transform: scale(1) } }
        @keyframes idl-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes idl-sweep { to { transform: translateX(120%) } }
        @keyframes idl-fill  { to { transform: scaleX(1) } }
        @keyframes idl-chakra-fade { 0% { opacity: 0 } 45% { opacity: .5 } 100% { opacity: .28 } }
        @keyframes idl-chakra-spin { to { transform: translate(-50%, calc(-50% - 34px)) rotate(360deg) } }

        @media (prefers-reduced-motion: reduce) {
          .idl-logo, .idl-word { animation: idl-in 200ms ease both; transform: none; }
          .idl-sweep { display: none; }
          .idl-chakra { animation: none; }
          .idl-chakra-ring, .idl-chakra :global(line) { animation: none; opacity: .3; }
          .idl-bar span { animation: idl-fill 300ms linear both; }
        }
      `}</style>
    </div>
  );
}
