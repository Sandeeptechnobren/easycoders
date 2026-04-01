'use client';
import { useEffect, useRef, useState } from 'react';

const TIMES = [30, 60, 120, 300];

export default function TypingGame() {
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [selectedTime, setSelectedTime] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchText = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.easycoders.in/projects/backend/public/api/typing/random');
      const json = await res.json();
      setText(json.data.content);
      resetGame();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const resetGame = () => {
    setInput('');
    setRemaining(selectedTime);
    setStarted(false);
    setEnded(false);
    setWpm(0);
    setAccuracy(100);
    setTimeout(() => textareaRef.current?.focus(), 200);
  };

  useEffect(() => { fetchText(); }, [selectedTime]);

  const finishTest = () => { setEnded(true); setStarted(false); };

  useEffect(() => {
    if (!started || ended) return;
    if (remaining === 0) { finishTest(); return; }
    const timer = setTimeout(() => setRemaining(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, started, ended]);

  const calculateMetrics = (value: string) => {
    const words = value.length / 5;
    const minutes = (selectedTime - remaining) / 60 || 1 / 60;
    setWpm(Math.round(words / minutes));
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === text[i]) correct++;
    }
    setAccuracy(Math.round((correct / value.length) * 100) || 100);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (ended) return;
    let val = e.target.value;
    if (val.length > text.length) val = val.substring(0, text.length);
    if (!started) setStarted(true);
    setInput(val);
    calculateMetrics(val);
    if (val.length === text.length) finishTest();
  };

  const progress = text.length > 0 ? (input.length / text.length) * 100 : 0;
  const timerPct = (remaining / selectedTime) * 100;
  const timerColor = remaining <= 10 ? '#ef4444' : remaining <= 20 ? '#f97316' : '#22c55e';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --primary: #0f172a;
          --accent: #f97316;
          --accent-light: #fff7ed;
          --muted: #64748b;
          --border: #e2e8f0;
          --surface: #f8fafc;
          --white: #ffffff;
          --correct: #16a34a;
          --correct-bg: #f0fdf4;
          --incorrect: #dc2626;
          --incorrect-bg: #fef2f2;
        }

        .tg-page {
          font-family: 'DM Sans', sans-serif;
          background: var(--primary);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ── HERO HEADER ── */
        .tg-hero {
          background: var(--primary);
          padding: 44px 24px 36px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .tg-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 70% 100% at 50% 0%, rgba(249,115,22,.14) 0%, transparent 70%);
          pointer-events: none;
        }

        .tg-hero-inner { position: relative; z-index: 1; }

        .tg-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(249,115,22,.15);
          border: .5px solid rgba(249,115,22,.3);
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 100px;
          margin-bottom: 14px;
        }

        .tg-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--accent);
          animation: tg-pulse 1.4s ease-in-out infinite;
        }

        @keyframes tg-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(.6); }
        }

        .tg-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 8px;
          letter-spacing: -.03em;
          line-height: 1.1;
        }

        .tg-title span { color: var(--accent); }

        .tg-sub {
          font-size: 14px;
          color: rgba(255,255,255,.45);
          margin: 0;
        }

        /* ── MAIN BODY ── */
        .tg-body {
          flex: 1;
          background: var(--surface);
          border-radius: 24px 24px 0 0;
          margin-top: -1px;
          padding: 40px 24px 64px;
        }

        .tg-container {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ── CONTROLS ROW ── */
        .tg-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .tg-time-selector {
          display: inline-flex;
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 100px;
          padding: 4px;
          gap: 3px;
        }

        .tg-time-btn {
          background: transparent;
          border: none;
          padding: 8px 18px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all .2s;
          white-space: nowrap;
        }

        .tg-time-btn:hover { color: var(--primary); background: var(--surface); }
        .tg-time-btn.active { background: var(--primary); color: var(--white); }

        .tg-shuffle-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 100px;
          padding: 9px 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          transition: all .2s;
        }

        .tg-shuffle-btn:hover { color: var(--primary); border-color: var(--primary); }

        /* ── STATS BAR ── */
        .tg-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .tg-stat-card {
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tg-stat-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: var(--surface);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 18px;
        }

        .tg-stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 3px;
        }

        .tg-stat-value {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .tg-stat-unit {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          margin-left: 3px;
        }

        /* Timer color states */
        .tg-stat-card.timer-warn .tg-stat-value { color: var(--accent); }
        .tg-stat-card.timer-danger .tg-stat-value { color: #ef4444; }

        /* ── PROGRESS BAR ── */
        .tg-progress-wrap {
          background: var(--border);
          border-radius: 100px;
          height: 4px;
          overflow: hidden;
        }

        .tg-progress-fill {
          height: 100%;
          border-radius: 100px;
          background: var(--accent);
          transition: width .1s linear;
        }

        /* ── TEXT DISPLAY ── */
        .tg-text-card {
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 18px;
          padding: 28px 32px;
          box-shadow: 0 2px 16px rgba(15,23,42,.04);
          position: relative;
          overflow: hidden;
        }

        .tg-text-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--accent);
          border-radius: 18px 18px 0 0;
          transform: scaleX(var(--prog, 0));
          transform-origin: left;
          transition: transform .1s linear;
        }

        .tg-text-display {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 17px;
          line-height: 1.9;
          color: #94a3b8;
          word-break: break-word;
          white-space: pre-wrap;
          min-height: 120px;
          user-select: none;
          letter-spacing: .01em;
        }

        .tg-text-display .correct {
          color: var(--primary);
        }

        .tg-text-display .incorrect {
          color: #ef4444;
          background: #fef2f2;
          border-radius: 2px;
        }

        .tg-loading-text {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
        }

        .tg-spin {
          width: 18px; height: 18px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: tg-spin .7s linear infinite;
        }

        @keyframes tg-spin { to { transform: rotate(360deg); } }

        /* ── TEXTAREA ── */
        .tg-input-wrap { position: relative; }

        .tg-textarea {
          width: 100%;
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 14px;
          padding: 16px 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          color: var(--primary);
          line-height: 1.7;
          resize: none;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
          min-height: 80px;
          box-sizing: border-box;
        }

        .tg-textarea::placeholder { color: #cbd5e1; font-family: 'DM Sans', sans-serif; }

        .tg-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(249,115,22,.1);
        }

        .tg-textarea:disabled { opacity: .5; cursor: not-allowed; }

        /* ── RESULT OVERLAY ── */
        .tg-result-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: tg-fadein .25s ease;
        }

        @keyframes tg-fadein { from { opacity: 0; } to { opacity: 1; } }

        .tg-result-card {
          background: var(--white);
          border-radius: 24px;
          padding: 44px 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 24px 64px rgba(15,23,42,.22);
          animation: tg-slideup .28s ease;
        }

        @keyframes tg-slideup {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tg-result-emoji { font-size: 48px; margin-bottom: 12px; display: block; }

        .tg-result-title {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 6px;
          letter-spacing: -.02em;
        }

        .tg-result-sub {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 32px;
        }

        .tg-result-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 32px;
        }

        .tg-result-stat {
          background: var(--surface);
          border: .5px solid var(--border);
          border-radius: 14px;
          padding: 18px;
        }

        .tg-result-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 700;
          color: var(--accent);
          line-height: 1;
          display: block;
        }

        .tg-result-stat-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 6px;
          display: block;
        }

        .tg-bonus-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: .5px solid rgba(22,163,74,.2);
          color: #16a34a;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 24px;
        }

        .tg-new-test-btn {
          width: 100%;
          background: var(--primary);
          color: var(--white);
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: background .2s, transform .15s;
          letter-spacing: .01em;
        }

        .tg-new-test-btn:hover { background: var(--accent); transform: translateY(-1px); }

        @media (max-width: 640px) {
          .tg-stats { grid-template-columns: 1fr 1fr; }
          .tg-stats .tg-stat-card:last-child { grid-column: 1 / -1; }
          .tg-text-card { padding: 20px; }
          .tg-text-display { font-size: 15px; }
          .tg-result-card { padding: 32px 24px; }
        }
      `}</style>

      <div className="tg-page">

        {/* ── HERO ── */}
        <div className="tg-hero">
          <div className="tg-hero-inner">
            <div className="tg-eyebrow">
              <span className="tg-dot" />
              Typing Challenge
            </div>
            <h1 className="tg-title">Speed <span>Typing</span> Test</h1>
            <p className="tg-sub">How fast can your fingers fly? Find out below.</p>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="tg-body">
          <div className="tg-container">

            {/* Controls */}
            <div className="tg-controls">
              <div className="tg-time-selector">
                {TIMES.map(t => (
                  <button
                    key={t}
                    className={`tg-time-btn ${selectedTime === t ? 'active' : ''}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t >= 60 ? `${t / 60}m` : `${t}s`}
                  </button>
                ))}
              </div>

              <button className="tg-shuffle-btn" onClick={fetchText} disabled={loading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="16 3 21 3 21 8"/>
                  <line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/>
                  <line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
                {loading ? 'Loading…' : 'New Text'}
              </button>
            </div>

            {/* Stats */}
            <div className="tg-stats">
              <div className={`tg-stat-card ${remaining <= 10 ? 'timer-danger' : remaining <= 20 ? 'timer-warn' : ''}`}>
                <div className="tg-stat-icon">⏱</div>
                <div>
                  <div className="tg-stat-label">Time Left</div>
                  <div className="tg-stat-value">{remaining}<span className="tg-stat-unit">s</span></div>
                </div>
              </div>
              <div className="tg-stat-card">
                <div className="tg-stat-icon">⚡</div>
                <div>
                  <div className="tg-stat-label">Speed</div>
                  <div className="tg-stat-value">{wpm}<span className="tg-stat-unit">wpm</span></div>
                </div>
              </div>
              <div className="tg-stat-card">
                <div className="tg-stat-icon">🎯</div>
                <div>
                  <div className="tg-stat-label">Accuracy</div>
                  <div className="tg-stat-value">{accuracy}<span className="tg-stat-unit">%</span></div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="tg-progress-wrap">
              <div className="tg-progress-fill" style={{ width: `${progress}%` }} />
            </div>

            {/* Text display */}
            <div className="tg-text-card" style={{ '--prog': `${progress / 100}` } as React.CSSProperties}>
              {loading ? (
                <div className="tg-loading-text">
                  <span className="tg-spin" />
                  Fetching text…
                </div>
              ) : (
                <div className="tg-text-display">
                  {text.split('').map((char, i) => {
                    let cls = '';
                    if (i < input.length) {
                      cls = char === input[i] ? 'correct' : 'incorrect';
                    }
                    return <span key={i} className={cls}>{char}</span>;
                  })}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="tg-input-wrap">
              <textarea
                ref={textareaRef}
                className="tg-textarea"
                value={input}
                onChange={handleTyping}
                disabled={loading || ended}
                maxLength={text.length}
                placeholder="Start typing to begin the test…"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                rows={3}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── RESULT MODAL ── */}
      {ended && (
        <div className="tg-result-overlay">
          <div className="tg-result-card">
            <span className="tg-result-emoji">{wpm >= 80 ? '🏆' : wpm >= 50 ? '🚀' : '💪'}</span>
            <h2 className="tg-result-title">
              {wpm >= 80 ? 'Blazing Fast!' : wpm >= 50 ? 'Great Speed!' : 'Test Complete!'}
            </h2>
            <p className="tg-result-sub">Here's how you performed this round.</p>

            <div className="tg-result-stats">
              <div className="tg-result-stat">
                <span className="tg-result-stat-val">{wpm}</span>
                <span className="tg-result-stat-label">WPM</span>
              </div>
              <div className="tg-result-stat">
                <span className="tg-result-stat-val">{accuracy}%</span>
                <span className="tg-result-stat-label">Accuracy</span>
              </div>
            </div>

            {remaining > 0 && (
              <div className="tg-bonus-tag">
                🔥 Finished {remaining}s early!
              </div>
            )}

            <button className="tg-new-test-btn" onClick={fetchText}>
              Try Again →
            </button>
          </div>
        </div>
      )}
    </>
  );
}