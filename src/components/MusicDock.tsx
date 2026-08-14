'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Track } from '@/lib/tracks';

/* ──────────────────────────────────────────────────────────────────────────
 * Bottom-centre music dock.
 *
 * Plays whatever `getTracks()` found in `public/audio/`. Mounted from
 * providers.tsx OUTSIDE `{children}`, which matters: the App Router swaps only
 * the page subtree on navigation, so the dock — and the <audio> element inside
 * it — survives route changes and the music keeps playing instead of cutting
 * out on every click.
 *
 * Three decisions worth knowing before editing:
 *
 * 1. `preload="none"`. The current track is a 10.4 MB MP3. With any other
 *    preload value every visitor downloads it on arrival, whether or not they
 *    ever press play — on mobile data that alone would dwarf the rest of the
 *    page. Nothing is fetched until the first press. The cost is that the
 *    duration is unknown until then, which is why the bar reads "—:—" while
 *    idle rather than showing a fake 0:00.
 *
 * 2. It NEVER autoplays. Browsers block un-muted autoplay without a user
 *    gesture, so an attempt would mostly fail anyway — but the real reason is
 *    that music starting by itself on a training site is hostile. The user
 *    presses play, or there is silence.
 *
 * 3. Volume/mute live on the <audio> element, not in React state, and the
 *    slider is uncontrolled. Restoring a saved volume is then a DOM assignment
 *    in an effect rather than a setState — which avoids both the hydration
 *    mismatch that reading localStorage during render would cause, and a
 *    set-state-in-effect. The icon still updates because assigning `.volume`
 *    fires `volumechange`, and that handler is an ordinary event handler.
 * ────────────────────────────────────────────────────────────────────────── */

const STORE_KEY = 'ec_music_prefs';

/** Seconds → m:ss. Duration is NaN until metadata loads, hence the guard. */
function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '—:—';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function MusicDock({ tracks }: { tracks: Track[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const volRef = useRef<HTMLInputElement>(null);
  /** True while the user drags the seek bar — suppresses `timeupdate` so the
   *  thumb doesn't fight the pointer. */
  const scrubbing = useRef(false);
  /** Set just before a track change that should start playing immediately. */
  const wantPlay = useRef(false);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const [open, setOpen] = useState(false);

  const many = tracks.length > 1;
  const track = tracks[index];

  /* Restore saved volume/mute. DOM assignment only — see note 3 above. */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { volume?: number; muted?: boolean };
        if (typeof p.volume === 'number' && Number.isFinite(p.volume)) {
          a.volume = Math.min(1, Math.max(0, p.volume));
        }
        if (typeof p.muted === 'boolean') a.muted = p.muted;
      }
    } catch {
      /* Corrupt or unavailable storage is not worth failing over. */
    }
    if (volRef.current) volRef.current.value = String(a.muted ? 0 : a.volume);
  }, []);

  /* React writes the new `src` during render; the element only picks it up on
     load(). Doing this in an effect (rather than inside the click handler) is
     what guarantees we act on the NEW src and not the outgoing one.
     `load()` is cheap here — with preload="none" it resets the element without
     fetching anything. */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.load();
    if (wantPlay.current) {
      wantPlay.current = false;
      // setState lives in the promise callback, so it never runs synchronously
      // inside the effect.
      a.play().catch(() => setFailed(true));
    }
  }, [index]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      setFailed(false);
      a.play().catch(() => setFailed(true));
    } else {
      a.pause();
    }
  }, []);

  /** `delta` of +1/-1, wrapping — an explicit skip should never dead-end. */
  const skip = useCallback(
    (delta: number) => {
      if (!many) return;
      wantPlay.current = !audioRef.current?.paused;
      setIndex((i) => (i + delta + tracks.length) % tracks.length);
    },
    [many, tracks.length],
  );

  const choose = useCallback((i: number) => {
    wantPlay.current = true;
    setIndex(i);
  }, []);

  const onVolume = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setMuted(a.muted || a.volume === 0);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ volume: a.volume, muted: a.muted }));
    } catch {
      /* Private mode / full quota — playback still works, prefs just won't stick. */
    }
  }, []);

  /* Auto-advance, but only forward: the playlist plays through and STOPS.
     Wrapping here would loop the music forever, which nobody asked for and
     nobody can escape without finding this dock again. */
  const onEnded = useCallback(() => {
    if (index < tracks.length - 1) {
      wantPlay.current = true;
      setIndex(index + 1);
    }
  }, [index, tracks.length]);

  // Every hook is above this line — the early return has to come after them.
  if (!tracks.length) return null;

  const pct = Number.isFinite(duration) && duration > 0 ? (time / duration) * 100 : 0;

  return (
    <section className="md" data-open={open ? 'y' : 'n'} aria-label="Music player">
      <audio
        ref={audioRef}
        src={track.src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          if (!scrubbing.current) setTime(e.currentTarget.currentTime);
        }}
        onVolumeChange={onVolume}
        onError={() => {
          setFailed(true);
          setBuffering(false);
        }}
      />

      {/* ── Expanded panel: seek, playlist ─────────────────────────────── */}
      {open && (
        <div className="md-panel">
          <div className="md-seek">
            <span className="md-t">{fmt(time)}</span>
            <input
              type="range"
              className="md-range"
              min={0}
              max={Number.isFinite(duration) && duration > 0 ? duration : 100}
              step={0.1}
              value={time}
              disabled={!Number.isFinite(duration)}
              aria-label="Seek"
              style={{ ['--p' as string]: `${pct}%` }}
              onPointerDown={() => {
                scrubbing.current = true;
              }}
              onPointerUp={() => {
                scrubbing.current = false;
              }}
              onChange={(e) => {
                const v = Number(e.target.value);
                setTime(v);
                if (audioRef.current) audioRef.current.currentTime = v;
              }}
            />
            <span className="md-t">{fmt(duration)}</span>
          </div>

          {many && (
            <ol className="md-list">
              {tracks.map((t, i) => (
                <li key={t.src}>
                  <button
                    type="button"
                    className="md-item"
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => choose(i)}
                  >
                    <span className="md-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="md-item-txt">
                      {t.title}
                      {t.subtitle && <em> · {t.subtitle}</em>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* ── Always-visible bar ─────────────────────────────────────────── */}
      <div className="md-bar">
        <button
          type="button"
          className="md-play"
          onClick={toggle}
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {buffering ? (
            <span className="md-spin" aria-hidden="true" />
          ) : playing ? (
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1.2" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1.2" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.4-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2Z" fill="currentColor" />
            </svg>
          )}
        </button>

        {many && (
          <button type="button" className="md-mini" onClick={() => skip(-1)} aria-label="Previous track">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M7 6v12M18 6.6v10.8a.8.8 0 0 1-1.25.66l-7.9-5.4a.8.8 0 0 1 0-1.32l7.9-5.4A.8.8 0 0 1 18 6.6Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <div className="md-meta">
          <span className="md-title">{failed ? 'Track unavailable' : track.title}</span>
          {track.subtitle && !failed && <span className="md-sub">{track.subtitle}</span>}
        </div>

        {/* Equalizer — a playing indicator that doesn't need a label. */}
        <span className={`md-eq ${playing ? 'on' : ''}`} aria-hidden="true">
          <i /><i /><i />
        </span>

        {many && (
          <button type="button" className="md-mini" onClick={() => skip(1)} aria-label="Next track">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M17 6v12M6 6.6v10.8a.8.8 0 0 0 1.25.66l7.9-5.4a.8.8 0 0 0 0-1.32l-7.9-5.4A.8.8 0 0 0 6 6.6Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className="md-mini"
          onClick={() => {
            const a = audioRef.current;
            if (a) a.muted = !a.muted;
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M4 9v6h3.5L12 19V5L7.5 9H4Z" fill="currentColor" />
              <path d="m16 9 4 6m0-6-4 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M4 9v6h3.5L12 19V5L7.5 9H4Z" fill="currentColor" />
              <path d="M15.5 9.4a3.4 3.4 0 0 1 0 5.2M18 7a6.8 6.8 0 0 1 0 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
            </svg>
          )}
        </button>

        <input
          ref={volRef}
          type="range"
          className="md-vol"
          min={0}
          max={1}
          step={0.01}
          defaultValue={1}
          aria-label="Volume"
          onChange={(e) => {
            const a = audioRef.current;
            if (!a) return;
            const v = Number(e.target.value);
            a.volume = v;
            // Dragging the slider off zero is an intent to hear something.
            a.muted = v === 0;
          }}
        />

        <button
          type="button"
          className="md-mini md-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Collapse player' : 'Expand player'}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="m6 14 6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .md {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          /* Level with the self-assessment bubble: above page content and the
             navbar (999), below modals (9999). */
          z-index: 1000;
          width: max-content;
          max-width: min(560px, calc(100vw - 32px));
          border-radius: 16px;
          overflow: hidden;
          color: #fff;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: rgb(var(--navy-deep-rgb, 7 18 42) / 0.88);
          backdrop-filter: blur(14px) saturate(1.2);
          -webkit-backdrop-filter: blur(14px) saturate(1.2);
          border: 1px solid rgb(255 255 255 / 0.12);
          box-shadow: 0 14px 40px rgb(0 0 0 / 0.34);
        }
        /* Tricolour seam along the top, matching the navbar/footer/banner. */
        .md::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 2px;
          background: var(--tiranga-bar, linear-gradient(90deg, #FF9933 0 33.33%, #fff 33.33% 66.66%, #138808 66.66%));
        }

        .md-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
        }

        .md-play {
          flex: none;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          cursor: pointer;
          color: #07122A;
          background: linear-gradient(140deg, var(--saffron, #FF9933), #FFC078);
          box-shadow: 0 2px 10px rgb(var(--saffron-rgb, 255 153 51) / 0.4);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .md-play:hover { transform: scale(1.07); box-shadow: 0 4px 16px rgb(var(--saffron-rgb, 255 153 51) / 0.55); }
        .md-play:active { transform: scale(0.96); }

        .md-mini {
          flex: none;
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          color: rgb(255 255 255 / 0.72);
          background: transparent;
          transition: color 0.16s ease, background 0.16s ease;
        }
        .md-mini:hover { color: #fff; background: rgb(255 255 255 / 0.1); }
        .md-toggle svg { transition: transform 0.22s ease; }
        .md[data-open='y'] .md-toggle svg { transform: rotate(180deg); }

        .md-meta {
          min-width: 0;
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .md-title {
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .md-sub {
          font-size: 11px;
          /* 0.62 white on this navy is ~6:1 — a quiet second line, still legible. */
          color: rgb(255 255 255 / 0.62);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Equalizer ─────────────────────────────────────────────────── */
        .md-eq {
          flex: none;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
        }
        .md-eq i {
          width: 3px;
          height: 4px;
          border-radius: 1px;
          background: rgb(255 255 255 / 0.3);
          transition: background 0.2s ease;
        }
        .md-eq.on i {
          background: var(--saffron, #FF9933);
          animation: md-bounce 0.9s ease-in-out infinite;
        }
        .md-eq.on i:nth-child(2) { animation-delay: 0.18s; background: #fff; }
        .md-eq.on i:nth-child(3) { animation-delay: 0.36s; background: var(--india-green, #138808); }
        @keyframes md-bounce {
          0%, 100% { height: 4px; }
          50%      { height: 13px; }
        }

        /* ── Sliders ───────────────────────────────────────────────────── */
        .md-vol {
          flex: none;
          width: 62px;
        }
        .md-range { flex: 1 1 auto; min-width: 0; }

        .md-vol,
        .md-range {
          appearance: none;
          -webkit-appearance: none;
          height: 14px;
          background: transparent;
          cursor: pointer;
        }
        .md-vol::-webkit-slider-runnable-track,
        .md-range::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
          background: rgb(255 255 255 / 0.2);
        }
        /* The seek bar shows progress; --p is written inline from React. */
        .md-range::-webkit-slider-runnable-track {
          background: linear-gradient(
            90deg,
            var(--saffron, #FF9933) var(--p, 0%),
            rgb(255 255 255 / 0.2) var(--p, 0%)
          );
        }
        .md-vol::-moz-range-track,
        .md-range::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: rgb(255 255 255 / 0.2);
        }
        .md-range::-moz-range-progress {
          height: 4px;
          border-radius: 2px;
          background: var(--saffron, #FF9933);
        }
        .md-vol::-webkit-slider-thumb,
        .md-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px;
          height: 11px;
          margin-top: -3.5px;
          border-radius: 50%;
          background: #fff;
          border: 0;
          box-shadow: 0 1px 4px rgb(0 0 0 / 0.4);
        }
        .md-vol::-moz-range-thumb,
        .md-range::-moz-range-thumb {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #fff;
          border: 0;
        }
        .md-range:disabled { opacity: 0.45; cursor: default; }

        /* ── Expanded panel ────────────────────────────────────────────── */
        .md-panel {
          padding: 14px 14px 2px;
          border-bottom: 1px solid rgb(255 255 255 / 0.09);
        }
        .md-seek {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .md-t {
          flex: none;
          font-size: 11px;
          font-variant-numeric: tabular-nums;
          color: rgb(255 255 255 / 0.62);
          min-width: 34px;
          text-align: center;
        }

        .md-list {
          list-style: none;
          margin: 10px 0 8px;
          padding: 0;
          max-height: 168px;
          overflow-y: auto;
        }
        .md-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 7px 8px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: rgb(255 255 255 / 0.78);
          font-size: 12.5px;
          text-align: left;
          cursor: pointer;
          transition: background 0.16s ease, color 0.16s ease;
        }
        .md-item:hover { background: rgb(255 255 255 / 0.08); color: #fff; }
        .md-item[aria-current='true'] {
          background: rgb(var(--saffron-rgb, 255 153 51) / 0.16);
          color: #fff;
        }
        .md-num {
          flex: none;
          font-size: 10.5px;
          font-variant-numeric: tabular-nums;
          color: rgb(255 255 255 / 0.42);
        }
        .md-item[aria-current='true'] .md-num { color: var(--saffron, #FF9933); }
        .md-item-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .md-item-txt em { font-style: normal; color: rgb(255 255 255 / 0.5); }

        .md-spin {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgb(7 18 42 / 0.25);
          border-top-color: #07122A;
          animation: md-spin 0.7s linear infinite;
        }
        @keyframes md-spin { to { transform: rotate(360deg); } }

        /* Keyboard focus must stay visible on a dark glass surface. */
        .md-play:focus-visible,
        .md-mini:focus-visible,
        .md-item:focus-visible,
        .md-vol:focus-visible,
        .md-range:focus-visible {
          outline: 2px solid var(--saffron, #FF9933);
          outline-offset: 2px;
        }

        /* ── Phones ────────────────────────────────────────────────────────
           Lifted clear of the self-assessment bubble (bottom-right, 20px +
           ~56px tall): at this width a centred dock is wide enough to run
           underneath it, so it sits on its own row above instead. */
        @media (max-width: 600px) {
          .md {
            bottom: 88px;
            max-width: calc(100vw - 20px);
          }
          .md-bar { gap: 7px; padding: 8px 10px; }
          .md-vol { display: none; }   /* phones have hardware volume */
          .md-title { font-size: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .md-eq.on i,
          .md-spin { animation: none; }
          .md-eq.on i { height: 9px; }
          .md-play,
          .md-mini,
          .md-toggle svg { transition: none; }
        }
      `}</style>
    </section>
  );
}
