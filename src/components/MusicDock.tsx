'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type Track = {
  /** Absolute URL on the backend host. */
  src: string;
  title: string;
  subtitle?: string | null;
  cover?: string | null;
};

/* Same hardcoded base as src/lib/axios.ts and the ~13 pages that inline it.
 * Plain fetch rather than the axios instance: this endpoint is public, so the
 * bearer-token interceptor has nothing to add. */
const API_BASE = 'https://api.easycoders.in/api';

/* ──────────────────────────────────────────────────────────────────────────
 * Bottom-centre music dock.
 *
 * Plays the playlist returned by `GET /api/music`. Mounted from
 * providers.tsx OUTSIDE `{children}`, which matters: the App Router swaps only
 * the page subtree on navigation, so the dock — and the <audio> element inside
 * it — survives route changes and the music keeps playing instead of cutting
 * out on every click.
 *
 * Three decisions worth knowing before editing:
 *
 * 1. `preload="metadata"`. Only the file header is fetched up front — enough
 *    for the duration to show before anything plays — not the multi-MB body.
 *    The body streams progressively once playback starts (the server answers
 *    range requests with 206, verified), so a visitor who leaves after twenty
 *    seconds never pulls the whole file.
 *
 * 2. AUTOPLAY, with a gesture fallback. See AUTOPLAY below — the short version
 *    is that no amount of code can force this, so it degrades to starting on
 *    the visitor's first click/keypress instead of failing silently.
 *
 * 3. Volume/mute live on the <audio> element, not in React state, and the
 *    slider is uncontrolled. Restoring a saved volume is then a DOM assignment
 *    in an effect rather than a setState — which avoids both the hydration
 *    mismatch that reading localStorage during render would cause, and a
 *    set-state-in-effect. The icon still updates because assigning `.volume`
 *    fires `volumechange`, and that handler is an ordinary event handler.
 * ────────────────────────────────────────────────────────────────────────── */

const STORE_KEY = 'ec_music_prefs';

/**
 * Safety net for the autoplay attempt if `ec:loader-done` never arrives.
 * The loader fires that event at its 3.2s hard timeout — and fires it
 * immediately when it decides not to show at all — so this rarely runs.
 */
const AUTOPLAY_FALLBACK_MS = 4000;

/** Seconds → m:ss. Duration is NaN until metadata loads, hence the guard. */
function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '—:—';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
}

/**
 * Fetches the playlist, then hands it to the dock.
 *
 * The split is structural, not stylistic. `Dock` runs its setup on mount —
 * restoring volume onto the <audio> element and firing the autoplay attempt —
 * and both need that element to exist. If one component both fetched and
 * rendered, those effects would run on the first paint, when there is no track
 * yet and therefore no <audio> in the tree; they would bail on a null ref and
 * never retry. Mounting `Dock` only once tracks exist makes its mount the right
 * moment by construction.
 *
 * A failed or empty fetch renders nothing at all — the site is simply quiet.
 * There is no error UI because there is no action a visitor could take.
 */
export default function MusicDock() {
  const [tracks, setTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch(`${API_BASE}/music`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        const list = Array.isArray(json?.data) ? (json.data as Track[]) : [];
        // Guard the shape: a track with no src would mount a dock that can
        // never play anything.
        setTracks(list.filter((t) => t && typeof t.src === 'string' && t.src));
      })
      .catch(() => setTracks([]));
    return () => ac.abort();
  }, []);

  if (!tracks?.length) return null;
  return <Dock tracks={tracks} />;
}

function Dock({ tracks }: { tracks: Track[] }) {
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
  /** Autoplay was refused; playback is queued behind the first user gesture. */
  const [armed, setArmed] = useState(false);
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

  /* ── AUTOPLAY ─────────────────────────────────────────────────────────────
     Starts the music on load, once the loader overlay has cleared (it fires
     `ec:loader-done`, the same cue TricolourFall waits on) so the song doesn't
     begin behind a full-screen overlay.

     ⚠️ THIS CANNOT BE GUARANTEED, and no amount of code changes that. Every
     current browser blocks un-muted autoplay until the visitor has interacted
     with the site; Chrome relaxes it only once its Media Engagement Index for
     the domain is high, which a first-time visitor never has. So `play()` here
     is EXPECTED to reject on a cold visit — that is policy, not a bug.

     The fallback is the standard one: on rejection, arm a one-shot listener and
     start at the visitor's very first click, tap or keypress, wherever on the
     page it lands. In practice the music begins a second or two later than
     asked, rather than not at all.

     Starting muted would evade the block, but silent music is not music — and
     un-muting later needs a gesture anyway, so it buys nothing.

     No opt-out is stored: a visitor who pauses gets the music again on their
     next page load, as specified. Persisting a manual pause into
     `ec_music_prefs` would be a small addition here if that becomes annoying. */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    let disarm = () => {};

    /* Autoplay was refused — wait for the first gesture anywhere and go then. */
    const armForGesture = () => {
      setArmed(true);

      const go = () => {
        disarm();
        a.play()
          .then(() => setArmed(false))
          .catch(() => setArmed(false)); // out of options; leave the dock idle
      };

      // `capture` so a handler that stops propagation can't swallow this, and
      // pointerdown/keydown/touchend between them cover mouse, touch and
      // keyboard-only navigation.
      const opts = { capture: true } as const;
      const events = ['pointerdown', 'keydown', 'touchend'] as const;
      events.forEach((ev) => window.addEventListener(ev, go, opts));
      disarm = () => {
        events.forEach((ev) => window.removeEventListener(ev, go, opts));
        disarm = () => {};
      };
    };

    let tried = false;
    const attempt = () => {
      if (tried) return;
      tried = true;
      // Both setState paths are inside promise callbacks, so neither runs
      // synchronously inside this effect.
      a.play().catch(armForGesture);
    };

    window.addEventListener('ec:loader-done', attempt, { once: true });
    const timer = setTimeout(attempt, AUTOPLAY_FALLBACK_MS);

    return () => {
      window.removeEventListener('ec:loader-done', attempt);
      clearTimeout(timer);
      disarm();
    };
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
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setArmed(false); // covers a manual press that beat the gesture handler
        }}
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
                    {t.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- see the note on the bar artwork
                      <img className="md-thumb" src={t.cover} alt="" width={28} height={28} loading="lazy" />
                    ) : (
                      <span className="md-thumb md-art-none" aria-hidden="true" />
                    )}
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
        {/* Cover art, straight off the track's ID3 APIC frame. Five of the six
            files carry one; the sixth gets the tricolour placeholder. alt="" —
            it is decoration, and the title sits next to it in text. */}
        {track.cover ? (
          /* A 38px thumbnail off a local static file. next/image would add a
             runtime optimiser pass and layout machinery for no gain at this
             size, so the plain element is the right call here. */
          // eslint-disable-next-line @next/next/no-img-element
          <img className="md-art" src={track.cover} alt="" width={38} height={38} />
        ) : (
          <span className="md-art md-art-none" aria-hidden="true" />
        )}

        <div className="md-meta">
          <span className="md-title">{failed ? 'Track unavailable' : track.title}</span>
          {track.subtitle && !failed && <span className="md-sub">{track.subtitle}</span>}
        </div>

        <div className="md-transport">
          {many && (
            <button type="button" className="md-step" onClick={() => skip(-1)} aria-label="Previous track">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M7.5 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 6.9v10.2a.9.9 0 0 1-1.39.75l-7.7-5.1a.9.9 0 0 1 0-1.5l7.7-5.1A.9.9 0 0 1 18 6.9Z" fill="currentColor" />
              </svg>
            </button>
          )}

          <button
            type="button"
            className={`md-play ${armed ? 'armed' : ''}`}
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
            <button type="button" className="md-step" onClick={() => skip(1)} aria-label="Next track">
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M16.5 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 6.9v10.2a.9.9 0 0 0 1.39.75l7.7-5.1a.9.9 0 0 0 0-1.5l-7.7-5.1A.9.9 0 0 0 6 6.9Z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>

        {/* Equalizer — a playing indicator that doesn't need a label. */}
        <span className={`md-eq ${playing ? 'on' : ''}`} aria-hidden="true">
          <i /><i /><i />
        </span>

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
          max-width: min(640px, calc(100vw - 32px));
          /* Fully rounded ends — a pill. Opening it swaps to a large-but-finite
             radius, because a pill silhouette on a tall panel reads as a
             mistake rather than a shape. */
          border-radius: 999px;
          overflow: hidden;
          color: #fff;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: rgb(var(--navy-deep-rgb, 7 18 42) / 0.88);
          backdrop-filter: blur(14px) saturate(1.2);
          -webkit-backdrop-filter: blur(14px) saturate(1.2);
          border: 1px solid rgb(255 255 255 / 0.12);
          box-shadow: 0 14px 40px rgb(0 0 0 / 0.34);
          transition: border-radius 0.24s ease;
        }
        .md[data-open='y'] { border-radius: 24px; }

        /* Tricolour edge. This used to be a 2px seam across the top, which a
           pill silhouette destroys — with rounded ends a straight top line
           clips to a stub in the middle.

           So it becomes a RING that follows the radius: a filled tricolour
           layer masked down to just its own 2px border box. Two masks are
           composited so the middle is punched out; without that the ::before
           would sit over the whole dock as a solid tricolour block, which is
           exactly what an unsupporting browser would render — hence the
           @supports gate rather than trusting the fallback. */
        @supports (mask-composite: exclude) or (-webkit-mask-composite: xor) {
          .md::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 2px;
            background: var(--tiranga-bar, linear-gradient(90deg, #FF9933 0 33.33%, #fff 33.33% 66.66%, #138808 66.66%));
            -webkit-mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            mask:
              linear-gradient(#000 0 0) content-box,
              linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            z-index: 2;
          }
        }

        .md-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          /* Asymmetric on purpose: the artwork is a rounded square hard against
             the left cap, so it needs less inset than the round buttons at the
             other end to look equally spaced inside a pill. */
          padding: 7px 14px 7px 8px;
        }

        /* ── Cover art ─────────────────────────────────────────────────── */
        .md-art {
          flex: none;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          object-fit: cover;
          background: rgb(255 255 255 / 0.08);
          box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
        }
        /* Placeholder for a track with no APIC frame — a tricolour tile rather
           than a broken-image box or an empty hole. */
        .md-art-none {
          display: block;
          background:
            radial-gradient(circle at 50% 50%, transparent 34%, rgb(0 0 128 / 0.85) 35%, rgb(0 0 128 / 0.85) 42%, transparent 43%),
            linear-gradient(
              180deg,
              var(--saffron, #FF9933) 0 33.33%,
              #fff 33.33% 66.66%,
              var(--india-green, #138808) 66.66%
            );
        }

        .md-transport {
          flex: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        /* Prev/next as real controls: same visual family as play, one step down
           in weight, so the transport group reads as a unit. */
        .md-step {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          cursor: pointer;
          color: rgb(255 255 255 / 0.85);
          background: rgb(255 255 255 / 0.09);
          transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
        }
        .md-step:hover {
          background: rgb(255 255 255 / 0.18);
          color: #fff;
          transform: scale(1.06);
        }
        .md-step:active { transform: scale(0.94); }

        .md-play {
          position: relative;   /* containing block for the .armed halo */
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

        /* Autoplay refused and waiting on a gesture. A halo rather than a
           message: it will resolve itself the moment the visitor touches
           anything, so it needs to read as "ready", not as an error. */
        .md-play.armed::after {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 2px solid rgb(var(--saffron-rgb, 255 153 51) / 0.8);
          animation: md-halo 1.9s ease-out infinite;
        }
        @keyframes md-halo {
          0%        { transform: scale(0.8); opacity: 0.9; }
          70%, 100% { transform: scale(1.45); opacity: 0; }
        }

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

        /* Fixed width, not content width. The dock is centred, so letting this
           size to the title would make the whole pill grow and shrink — and
           shift sideways — on every track change. Titles here range from
           "Desh Mere" to "Dil Diya Hai Jaan Bhi Denge Aye Watan Tere Liye";
           the long ones ellipsis instead. */
        .md-meta {
          flex: none;
          width: 190px;
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
        .md-thumb {
          flex: none;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          object-fit: cover;
          background: rgb(255 255 255 / 0.08);
        }
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
            /* Explicit width rather than max-content: with the meta column
               flexing below, max-content would collapse the pill to its
               contents and re-centre it on every track change. */
            width: calc(100vw - 20px);
            max-width: calc(100vw - 20px);
          }
          .md-meta { flex: 1 1 auto; width: auto; }
          .md-bar { gap: 8px; padding: 6px 10px 6px 6px; }
          /* Phones have hardware volume, and the equalizer is decoration —
             both give up their width so the artwork and transport survive,
             which are the parts you actually operate. */
          .md-vol,
          .md-eq { display: none; }
          .md-art { width: 34px; height: 34px; border-radius: 10px; }
          .md-title { font-size: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .md-eq.on i,
          .md-spin { animation: none; }
          .md-eq.on i { height: 9px; }
          /* The halo still has to be visible, just still — it is the only cue
             that playback is waiting on a gesture. */
          .md-play.armed::after { animation: none; opacity: 0.9; }
          .md-play,
          .md-mini,
          .md-toggle svg { transition: none; }
        }
      `}</style>
    </section>
  );
}
