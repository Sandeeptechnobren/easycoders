'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    icon: '🧠',
    title: 'Concept Clarity',
    desc: 'Test real understanding, not just memory.',
  },
  {
    icon: '⚡',
    title: 'Instant Results',
    desc: 'Know your strengths & gaps immediately.',
  },
  {
    icon: '🎯',
    title: 'Clear Roadmap',
    desc: 'See exactly what to learn next.',
  },
];

export default function SelfAssessmentLanding() {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const fullText = 'Discover Your True Coding Level';

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTyped(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');

        .sa-landing {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 20%, #312e81, #020617);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        .sa-card {
          max-width: 960px;
          width: 100%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.07),
            rgba(255, 255, 255, 0.02)
          );
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 52px 40px;
          backdrop-filter: blur(24px);
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
          text-align: center;
        }

        .sa-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(167, 139, 250, 0.15);
          border: 1px solid rgba(167, 139, 250, 0.3);
          color: #c4b5fd;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 16px;
          border-radius: 999px;
          margin-bottom: 20px;
        }

        .sa-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          animation: sa-pulse 1.5s ease-in-out infinite;
        }

        @keyframes sa-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }

        .sa-title {
          font-size: clamp(30px, 5vw, 52px);
          font-weight: 900;
          background: linear-gradient(90deg, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          min-height: 68px;
          margin: 0 0 18px;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .sa-subtitle {
          font-size: clamp(14px, 2vw, 17px);
          max-width: 600px;
          margin: 0 auto 44px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.65);
        }

        .sa-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 48px;
        }

        .sa-feature-card {
          padding: 24px 20px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.3s ease;
          cursor: default;
        }

        .sa-feature-card.hovered {
          background: linear-gradient(
            180deg,
            rgba(167, 139, 250, 0.18),
            rgba(244, 114, 182, 0.1)
          );
          border-color: rgba(167, 139, 250, 0.25);
          transform: translateY(-6px);
        }

        .sa-feature-icon { font-size: 34px; margin-bottom: 10px; }

        .sa-feature-title {
          font-size: 16px;
          font-weight: 800;
          margin: 0 0 6px;
          color: #fff;
        }

        .sa-feature-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.5;
          margin: 0;
        }

        .sa-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .sa-btn-primary {
          padding: 15px 40px;
          font-size: 16px;
          font-weight: 800;
          border-radius: 999px;
          border: none;
          color: #0f172a;
          background: linear-gradient(90deg, #a78bfa, #f472b6);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(167, 139, 250, 0.35);
        }

        .sa-btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 28px rgba(167, 139, 250, 0.5);
        }

        .sa-btn-secondary {
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 700;
          border-radius: 999px;
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Plus Jakarta Sans', sans-serif;
          backdrop-filter: blur(8px);
        }

        .sa-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.03);
        }

        .sa-note {
          margin-top: 18px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.02em;
        }
      `}</style>

      <section className="sa-landing">
        <div className="sa-card">
          {/* Eyebrow */}
          <div className="sa-eyebrow">
            <span className="sa-eyebrow-dot" />
            Self Assessment Platform
          </div>

          {/* Typing headline */}
          <h1 className="sa-title">{typed}</h1>

          {/* Subtitle */}
          <p className="sa-subtitle">
            Stop guessing your level. Take a smart self-assessment and get
            instant clarity on what to learn next — in just 5 minutes.
          </p>

          {/* Feature cards */}
          <div className="sa-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`sa-feature-card ${hovered === i ? 'hovered' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="sa-feature-icon">{f.icon}</div>
                <h3 className="sa-feature-title">{f.title}</h3>
                <p className="sa-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="sa-cta-group">
            <button
              className="sa-btn-primary"
              onClick={() => router.push('/self-assessment/signup')}
            >
              Get Started →
            </button>
            <button
              className="sa-btn-secondary"
              onClick={() => router.push('/self-assessment/login')}
            >
              Login
            </button>
          </div>

          <p className="sa-note">Takes only 5 minutes &nbsp;•&nbsp; 100% Free &nbsp;•&nbsp; No credit card</p>
        </div>
      </section>
    </>
  );
}
