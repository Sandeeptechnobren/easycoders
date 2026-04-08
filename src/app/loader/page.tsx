'use client';

export default function Loader() {
  return (
    <div className="ldr-root">
      <div className="ldr-card">

        {/* Spinner ring with logo inside */}
        <div className="ldr-spinner-wrap">
          <svg className="ldr-ring" viewBox="0 0 80 80">
            {/* Track */}
            <circle cx="40" cy="40" r="34" className="ldr-track" />
            {/* Animated arc */}
            <circle cx="40" cy="40" r="34" className="ldr-arc" />
          </svg>

          {/* Logo in centre */}
          <div className="ldr-badge">
            <img src="/images/eclogo.png" alt="Easy Coders" className="ldr-logo-img" />
          </div>
        </div>

        {/* Brand name */}
        <p className="ldr-brand">Easy Coders</p>

        {/* Animated dots */}
        <div className="ldr-dots">
          <span /><span /><span />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;800&display=swap');

        .ldr-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        .ldr-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }

        /* ── SPINNER ── */
        .ldr-spinner-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ldr-ring {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          animation: ldr-rotate 1.4s linear infinite;
        }

        .ldr-track {
          fill: none;
          stroke: #e2e8f0;
          stroke-width: 5;
        }

        .ldr-arc {
          fill: none;
          stroke: url(#ldr-grad);
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 213.6;
          stroke-dashoffset: 160;
          animation: ldr-dash 1.4s ease-in-out infinite;
        }

        @keyframes ldr-rotate {
          to { transform: rotate(360deg); }
        }

        @keyframes ldr-dash {
          0%   { stroke-dashoffset: 200; }
          50%  { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 200; }
        }

        /* ── LOGO BADGE ── */
        .ldr-badge {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 18px rgba(99, 102, 241, 0.25);
          animation: ldr-pulse 1.6s ease-in-out infinite;
          overflow: hidden;
        }

        .ldr-logo-img {
          width: 38px;
          height: 38px;
          object-fit: contain;
          animation: ldr-morph 1.6s ease-in-out infinite;
        }

        @keyframes ldr-pulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 4px 18px rgba(99,102,241,0.25); }
          50%       { transform: scale(1.08); box-shadow: 0 8px 28px rgba(99,102,241,0.45); }
        }

        @keyframes ldr-morph {
          0%, 100% { transform: scale(1)    rotate(0deg);   opacity: 1;   }
          25%       { transform: scale(1.12) rotate(-6deg);  opacity: 0.85; }
          50%       { transform: scale(0.92) rotate(0deg);   opacity: 1;   }
          75%       { transform: scale(1.12) rotate(6deg);   opacity: 0.85; }
        }

        /* ── BRAND TEXT ── */
        .ldr-brand {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: 0.02em;
          margin: 0;
        }

        /* ── DOTS ── */
        .ldr-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .ldr-dots span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7c3aed;
          animation: ldr-bounce 1.2s ease-in-out infinite;
          display: block;
        }

        .ldr-dots span:nth-child(1) { animation-delay: 0s;    background: #4f46e5; }
        .ldr-dots span:nth-child(2) { animation-delay: 0.2s;  background: #7c3aed; }
        .ldr-dots span:nth-child(3) { animation-delay: 0.4s;  background: #a855f7; }

        @keyframes ldr-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1;   }
        }

        /* SVG gradient definition (inline via foreignObject trick — use defs inside svg) */
        .ldr-ring defs { display: block; }
      `}</style>

      {/* SVG gradient — must be in DOM for stroke: url(#) to work */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="ldr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
