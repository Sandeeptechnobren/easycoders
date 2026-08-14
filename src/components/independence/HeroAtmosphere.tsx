'use client';

/**
 * Atmospheric depth behind the hero: light rays, drifting cloud banks and
 * floating particles, arranged as three parallax planes.
 *
 * Depth comes from each plane reacting to the pointer by a DIFFERENT amount —
 * far things barely move, near things move most. That difference is the whole
 * illusion; the absolute travel is tiny (max ~26px) so it never feels gimmicky
 * or makes text swim.
 *
 * Parallax reads `--ptr-x` / `--ptr-y`, published once by PointerFX, so there is
 * no listener here at all. With no pointer (touch, or reduced motion) the
 * variables are simply absent and everything falls back to its resting position.
 *
 * Everything is CSS gradients — no images, nothing to download. The whole layer
 * is masked to fade out before it reaches the headline, so contrast over the
 * copy is never reduced.
 */
export default function HeroAtmosphere() {
  return (
    <div className="atm" aria-hidden="true">
      {/* FAR — sun glow + volumetric rays */}
      <div className="atm-plane atm-far">
        <span className="atm-sun" />
        <span className="atm-rays" />
      </div>

      {/* MID — cloud banks at three speeds */}
      <div className="atm-plane atm-mid">
        <span className="atm-cloud c1" />
        <span className="atm-cloud c2" />
        <span className="atm-cloud c3" />
      </div>

      {/* NEAR — drifting motes */}
      <div className="atm-plane atm-near">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`atm-mote m${i % 7}`} />
        ))}
      </div>

      <style jsx>{`
        .atm {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          /* Fade the whole atmosphere out toward the bottom, where the copy and
             CTAs live — the effect must never cost text contrast. */
          -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 52%, transparent 92%);
                  mask-image: linear-gradient(180deg, #000 0%, #000 52%, transparent 92%);
        }

        .atm-plane {
          position: absolute;
          inset: -8%;
          transition: transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1);
          will-change: transform;
        }
        /* The three parallax depths. Far barely moves; near moves most. */
        .atm-far  { transform: translate3d(calc(var(--ptr-x, 0) *  -5px), calc(var(--ptr-y, 0) *  -4px), 0); }
        .atm-mid  { transform: translate3d(calc(var(--ptr-x, 0) * -14px), calc(var(--ptr-y, 0) *  -9px), 0); }
        .atm-near { transform: translate3d(calc(var(--ptr-x, 0) * -26px), calc(var(--ptr-y, 0) * -16px), 0); }

        /* ── Sun + rays ──────────────────────────────────────────────────── */
        .atm-sun {
          position: absolute;
          top: -14%; left: 6%;
          width: 460px; height: 460px;
          border-radius: 50%;
          background: radial-gradient(circle, rgb(255 214 150 / 0.20) 0%, rgb(255 180 90 / 0.10) 38%, transparent 68%);
          filter: blur(14px);
        }
        /* Rays as a repeating conic sweep, masked to a soft wedge and rotated
           very slowly — cheaper and softer than stacked gradients. */
        .atm-rays {
          position: absolute;
          top: -46%; left: -12%;
          width: 880px; height: 880px;
          background: repeating-conic-gradient(
            from 200deg at 50% 50%,
            rgb(255 220 170 / 0.085) 0deg 2.2deg,
            transparent 2.2deg 9deg
          );
          -webkit-mask: radial-gradient(circle, #000 6%, rgb(0 0 0 / 0.5) 34%, transparent 62%);
                  mask: radial-gradient(circle, #000 6%, rgb(0 0 0 / 0.5) 34%, transparent 62%);
          filter: blur(3px);
          animation: atm-rays 90s linear infinite;
          transform-origin: 50% 50%;
        }

        /* ── Clouds ──────────────────────────────────────────────────────── */
        .atm-cloud {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(ellipse at 50% 55%, rgb(255 255 255 / 0.085), transparent 66%);
          filter: blur(22px);
          will-change: transform;
        }
        .c1 { top: 12%; width: 560px; height: 180px; animation: atm-drift 82s linear infinite; }
        .c2 { top: 30%; width: 420px; height: 140px; opacity: 0.75; animation: atm-drift 118s linear infinite; animation-delay: -40s; }
        .c3 { top: 5%;  width: 700px; height: 210px; opacity: 0.5;  animation: atm-drift 152s linear infinite; animation-delay: -95s; }

        /* ── Motes ───────────────────────────────────────────────────────── */
        .atm-mote {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: rgb(255 255 255 / 0.5);
          box-shadow: 0 0 6px rgb(255 210 150 / 0.5);
          animation: atm-float 20s ease-in-out infinite;
        }
        .m0 { left: 8%;  top: 62%; animation-duration: 17s; animation-delay: -2s;  }
        .m1 { left: 19%; top: 28%; animation-duration: 23s; animation-delay: -7s;  background: rgb(255 190 120 / 0.55); }
        .m2 { left: 31%; top: 47%; animation-duration: 19s; animation-delay: -12s; }
        .m3 { left: 44%; top: 20%; animation-duration: 26s; animation-delay: -4s;  background: rgb(150 220 140 / 0.45); }
        .m4 { left: 57%; top: 55%; animation-duration: 21s; animation-delay: -15s; }
        .m5 { left: 69%; top: 33%; animation-duration: 24s; animation-delay: -9s;  background: rgb(255 190 120 / 0.5); }
        .m6 { left: 82%; top: 60%; animation-duration: 18s; animation-delay: -19s; }
        .atm-mote:nth-child(n + 8) { opacity: 0.55; transform: scale(0.7); }

        @keyframes atm-rays  { to { transform: rotate(360deg); } }
        @keyframes atm-drift {
          0%   { transform: translateX(-30%); }
          100% { transform: translateX(130vw); }
        }
        @keyframes atm-float {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.35; }
          50%      { transform: translate3d(14px, -22px, 0); opacity: 0.85; }
        }

        /* Phones: keep the light, drop the per-element animation cost. */
        @media (max-width: 767px) {
          .atm-rays { display: none; }
          .atm-mote { display: none; }
          .c3 { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .atm-rays, .atm-cloud, .atm-mote { animation: none !important; }
          .atm-plane { transition: none; transform: none !important; }
          .atm-mote { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
