'use client';

import { useId } from 'react';

/**
 * The shared loading indicator.
 *
 * Replaces `app/loader/page.tsx`, which was simultaneously a ROUTE and a
 * component: it always rendered `min-height:100vh`, so the four pages that
 * imported it as `<Loader />` got a full-viewport takeover even when the
 * spinner sat inside a card. It also `@import`ed a font from inside a `<style>`
 * tag — a render-blocking request fired at the exact moment the user is already
 * waiting — and used a fixed SVG gradient id, so two on one page would collide.
 *
 * This version fixes all three: it is inline by default, has no font import
 * (it inherits), and derives unique ids via useId().
 *
 * Under the Tiranga theme it becomes a rotating Ashoka chakra. Colours come
 * from tokens, so the loader follows whatever theme is active with no branching.
 */

type LoaderProps = {
  /** Fill the viewport (page-level waits). Default false — inline. */
  fullscreen?: boolean;
  /** Ring diameter in px. Default 56. */
  size?: number;
  /** Visible caption. Pass null for a bare spinner. Default 'Loading…' */
  label?: string | null;
};

export default function Loader({
  fullscreen = false,
  size = 56,
  label = 'Loading…',
}: LoaderProps) {
  // Unique per instance — the old fixed `ldr-grad` id meant two loaders on one
  // page silently shared (and fought over) a single gradient definition.
  const gradId = `ldr-grad-${useId().replace(/:/g, '')}`;

  return (
    <div className={`ldr ${fullscreen ? 'ldr-full' : ''}`} role="status" aria-live="polite">
      <div className="ldr-ring-wrap" style={{ width: size, height: size }}>
        {/* The chakra: 24 spokes at 15° intervals, drawn with a repeating
            conic-gradient. Pure CSS — no asset, no request, crisp at any size.
            Only visible under the Tiranga theme. */}
        <span className="ldr-chakra" aria-hidden="true" />

        <svg className="ldr-svg" viewBox="0 0 80 80" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--ldr-arc-from)" />
              <stop offset="100%" stopColor="var(--ldr-arc-to)" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="34" className="ldr-track" />
          <circle cx="40" cy="40" r="34" className="ldr-arc" stroke={`url(#${gradId})`} />
        </svg>
      </div>

      {label ? <p className="ldr-label">{label}</p> : null}
      {/* Always announce, even when the caption is hidden. */}
      <span className="ldr-sr">Loading</span>

      <style jsx>{`
        .ldr {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 0;
          /* Tokens resolve per-theme; default = the existing navy/gold. */
          --ldr-arc-from: var(--navy, #0B1B3A);
          --ldr-arc-to: var(--gold, #E8A020);
          --ldr-track: var(--border, #E5E9F2);
        }
        .ldr-full {
          min-height: 100vh;
          width: 100%;
          background: var(--navy-soft, #F4F6FB);
        }

        .ldr-ring-wrap { position: relative; display: grid; place-items: center; }

        .ldr-svg { width: 100%; height: 100%; transform-origin: 50% 50%; animation: ldr-rotate 1.4s linear infinite; }
        .ldr-track { fill: none; stroke: var(--ldr-track); stroke-width: 5; }
        .ldr-arc {
          fill: none;
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 213.6;
          stroke-dashoffset: 60;
          animation: ldr-dash 1.4s ease-in-out infinite;
        }

        /* Chakra — hidden by default, revealed by the Tiranga theme. */
        .ldr-chakra { display: none; }

        .ldr-label {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--slate, #4A5568);
        }

        /* Visually hidden but announced. */
        .ldr-sr {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }

        /* Linear rotation only — the project forbids bounce/elastic easing. */
        @keyframes ldr-rotate { to { transform: rotate(360deg); } }
        @keyframes ldr-dash {
          0%   { stroke-dashoffset: 200; }
          50%  { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 200; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ldr-svg { animation-duration: 3s; }
          .ldr-arc { animation: none; stroke-dashoffset: 120; }
        }
      `}</style>

      {/* Theme-specific styling has to be :global() — styled-jsx scopes to this
          component, and the [data-theme] attribute lives on <html>, an ancestor
          outside that scope. */}
      <style jsx global>{`
        [data-theme='tiranga'] .ldr {
          --ldr-arc-from: var(--saffron);
          --ldr-arc-to: var(--india-green);
          --ldr-track: rgb(var(--chakra-rgb) / 0.12);
        }
        [data-theme='tiranga'] .ldr-chakra {
          display: block;
          position: absolute;
          inset: 18%;
          border-radius: 50%;
          background: repeating-conic-gradient(
            from 0deg,
            var(--chakra) 0deg 0.9deg,
            transparent 0.9deg 15deg
          );
          box-shadow: inset 0 0 0 2px var(--chakra);
          opacity: 0.85;
          animation: ldr-chakra-spin 3.6s linear infinite;
        }
        @keyframes ldr-chakra-spin { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          [data-theme='tiranga'] .ldr-chakra { animation: none; }
        }
      `}</style>
    </div>
  );
}
