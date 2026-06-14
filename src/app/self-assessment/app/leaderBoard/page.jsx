'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../../../loader/page';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('assessment_token');
    api.get('/leaderBoard/list', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setLeaders(res.data.data || []);
        setUserStats(res.data.user_stats);
      })
      .catch(err => console.error('Leaderboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  const topThree = leaders.slice(0, 3);
  const others = leaders.slice(3);

  const medalColors = ['#f97316', '#7c8fa6', '#b45309'];
  const medalLabels = ['1st', '2nd', '3rd'];
  const crownPos = [1, 0, 2]; // podium order: 2nd, 1st, 3rd

  function initials(name) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  }

  if (loading) return <Loader />;

  return (
    <>
      <style>{pageStyle}</style>

      <div className="lb-page">

        {/* ── HERO HEADER ── */}
        <div className="lb-hero">
          <div className="lb-hero-inner">
            <div className="lb-hero-eyebrow">
              <span className="lb-eyebrow-dot" />
              Live Rankings
            </div>
            <h1 className="lb-hero-title">Hall of Fame</h1>
            <p className="lb-hero-sub">Top performers — ranked by total performance points across all assessments.</p>
          </div>
        </div>

        <div className="lb-body">

          {/* ── PODIUM ── */}
          {topThree.length > 0 && (
            <div className="lb-podium-section">
              <div className="lb-podium">
                {crownPos.map((origIdx) => {
                  const item = topThree[origIdx];
                  if (!item) return null;
                  const rank = origIdx + 1;
                  const isFirst = origIdx === 0;
                  return (
                    <div key={item.id} className={`lb-podium-item rank-${rank}`}>
                      {isFirst && <div className="lb-crown-icon">👑</div>}
                      <div className="lb-podium-avatar" style={{ borderColor: medalColors[origIdx] }}>
                        <span>{initials(item.user?.name)}</span>
                      </div>
                      <div className="lb-podium-name">{item.user?.name}</div>
                      <div className="lb-podium-score" style={{ color: medalColors[origIdx] }}>
                        {item.points} pts
                      </div>
                      <div className="lb-podium-meta">{item.assessments} {item.assessments === 1 ? 'test' : 'tests'} · avg {item.avg_percent}%</div>
                      <div className="lb-podium-block" style={{ background: medalColors[origIdx], height: isFirst ? 90 : origIdx === 1 ? 64 : 48 }}>
                        <span className="lb-podium-rank">{medalLabels[origIdx]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── FULL RANKINGS ── */}
          <div className="lb-rankings-card">
            <div className="lb-rankings-header">
              <h2 className="lb-rankings-title">Full Rankings</h2>
              <span className="lb-count-badge">{leaders.length} participants</span>
            </div>

            {/* Top 3 mini rows */}
            <div className="lb-list">
              {topThree.map((item, i) => (
                <div key={item.id} className="lb-row lb-row-top">
                  <div className="lb-row-rank" style={{ color: medalColors[i] }}>
                    <span className="lb-medal" style={{ background: medalColors[i] }}>{item.rank ?? i + 1}</span>
                  </div>
                  <div className="lb-row-avatar" style={{ background: medalColors[i] + '22', color: medalColors[i] }}>
                    {initials(item.user?.name)}
                  </div>
                  <div className="lb-row-info">
                    <span className="lb-row-name">{item.user?.name}</span>
                    <span className="lb-row-meta">{item.assessments} {item.assessments === 1 ? 'assessment' : 'assessments'} · avg {item.avg_percent}% · best {item.best_percent}%</span>
                  </div>
                  <div className="lb-row-score" style={{ color: medalColors[i] }}>{item.points} pts</div>
                </div>
              ))}

              {/* Divider */}
              {others.length > 0 && (
                <div className="lb-section-divider">
                  <span>Other Participants</span>
                </div>
              )}

              {/* Others */}
              {others.map((item, i) => (
                <div key={item.id} className="lb-row">
                  <div className="lb-row-rank">
                    <span className="lb-rank-num">#{item.rank ?? i + 4}</span>
                  </div>
                  <div className="lb-row-avatar">
                    {initials(item.user?.name)}
                  </div>
                  <div className="lb-row-info">
                    <span className="lb-row-name">{item.user?.name}</span>
                    <span className="lb-row-meta">{item.assessments} {item.assessments === 1 ? 'assessment' : 'assessments'} · avg {item.avg_percent}% · best {item.best_percent}%</span>
                  </div>
                  <div className="lb-row-score">{item.points} pts</div>
                </div>
              ))}

              {leaders.length === 0 && (
                <div className="lb-empty">No rankings yet — be the first to complete an assessment.</div>
              )}
            </div>

            {/* My stat sticky */}
            {userStats && (
              <div className="lb-my-stat">
                <div className="lb-my-stat-inner">
                  <div className="lb-my-label">{userStats.rank ? `#${userStats.rank}` : '—'}</div>
                  <div className="lb-row-avatar lb-my-avatar">
                    {initials(userStats.user?.name || 'Me')}
                  </div>
                  <div className="lb-row-info">
                    <span className="lb-row-name">You{userStats.rank && userStats.total_participants ? ` · rank ${userStats.rank} of ${userStats.total_participants}` : ''}</span>
                    <span className="lb-row-meta">{userStats.assessments} {userStats.assessments === 1 ? 'assessment' : 'assessments'} · avg {userStats.avg_percent}% · best {userStats.best_percent}%</span>
                  </div>
                  <div className="lb-my-score">{userStats.points} pts</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

const loadingStyle = `
  .lb-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px; font-family: 'DM Sans', sans-serif; color: #64748b;
  }
  .lb-spinner {
    width: 40px; height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #f97316;
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const pageStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --primary: #0f172a;
    --accent: #f97316;
    --accent-light: #fff7ed;
    --muted: #64748b;
    --border: #e2e8f0;
    --surface: #f8fafc;
    --white: #ffffff;
  }

  .lb-page {
    font-family: 'DM Sans', sans-serif;
    background: var(--surface);
    min-height: 100vh;
  }

  /* HERO */
  .lb-hero {
    background: var(--primary);
    padding: 56px 24px 52px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .lb-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 80% at 50% 0%, rgba(249,115,22,.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .lb-hero-inner { position: relative; z-index: 1; }

  .lb-hero-eyebrow {
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
    margin-bottom: 16px;
  }

  .lb-eyebrow-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .5; transform: scale(.7); }
  }

  .lb-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 10px;
    letter-spacing: -.03em;
    line-height: 1.1;
  }

  .lb-hero-sub {
    font-size: 15px;
    color: rgba(255,255,255,.5);
    margin: 0;
    line-height: 1.6;
  }

  /* BODY */
  .lb-body {
    max-width: 980px;
    margin: 0 auto;
    padding: 48px 24px 80px;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  /* PODIUM */
  .lb-podium-section {
    background: var(--white);
    border: .5px solid var(--border);
    border-radius: 20px;
    padding: 40px 24px 0;
    overflow: visible;
  }

  .lb-podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 8px;
  }

  .lb-podium-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 180px;
    flex-shrink: 0;
    position: relative;
    animation: riseUp .6s ease forwards;
    opacity: 0;
  }

  .lb-podium-item.rank-1 { animation-delay: .05s; }
  .lb-podium-item.rank-2 { animation-delay: .15s; }
  .lb-podium-item.rank-3 { animation-delay: .25s; }

  @keyframes riseUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lb-crown-icon {
    font-size: 26px;
    margin-bottom: 4px;
    animation: float 2.5s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .lb-podium-avatar {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--white);
    border: 3px solid;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(15,23,42,.1);
  }

  .rank-1 .lb-podium-avatar { width: 80px; height: 80px; font-size: 26px; }

  .lb-podium-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary);
    text-align: center;
    margin-bottom: 4px;
    max-width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lb-podium-score {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 14px;
  }

  .lb-podium-block {
    width: 100%;
    border-radius: 10px 10px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
  }

  .lb-podium-rank {
    color: rgba(255,255,255,.9);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  /* RANKINGS CARD */
  .lb-rankings-card {
    background: var(--white);
    border: .5px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(15,23,42,.05);
  }

  .lb-rankings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 28px;
    border-bottom: .5px solid var(--border);
  }

  .lb-rankings-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
    margin: 0;
  }

  .lb-count-badge {
    background: var(--surface);
    border: .5px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 100px;
  }

  /* LIST */
  .lb-list { padding: 8px 0; }

  .lb-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 28px;
    transition: background .15s;
  }

  .lb-row:hover { background: var(--surface); }

  .lb-row-top { background: var(--surface); }
  .lb-row-top:hover { background: #f0f4f8; }

  .lb-row-rank { width: 44px; flex-shrink: 0; }

  .lb-medal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    border-radius: 50%;
    color: white;
    font-size: 11px;
    font-weight: 800;
  }

  .lb-rank-num {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
  }

  .lb-row-avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--surface);
    border: .5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    flex-shrink: 0;
  }

  .lb-row-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .lb-row-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lb-row-code {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .lb-row-meta {
    font-size: 11.5px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lb-podium-meta {
    font-size: 11px;
    color: var(--muted);
    margin-top: -8px;
    margin-bottom: 14px;
  }

  .lb-empty {
    padding: 44px 28px;
    text-align: center;
    color: var(--muted);
    font-size: 14px;
  }

  .lb-row-score {
    font-size: 14px;
    font-weight: 700;
    color: var(--primary);
    flex-shrink: 0;
  }

  /* Section divider */
  .lb-section-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 28px;
    margin: 4px 0;
  }

  .lb-section-divider::before,
  .lb-section-divider::after {
    content: '';
    flex: 1;
    height: .5px;
    background: var(--border);
  }

  .lb-section-divider span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }

  /* My stat */
  .lb-my-stat {
    border-top: .5px solid var(--border);
    background: var(--accent-light);
  }

  .lb-my-stat-inner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 28px;
  }

  .lb-my-label {
    width: 44px;
    font-size: 11px;
    font-weight: 800;
    color: var(--accent);
    letter-spacing: .06em;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .lb-my-avatar {
    background: var(--accent-light) !important;
    border-color: rgba(249,115,22,.3) !important;
    color: var(--accent) !important;
  }

  .lb-my-score {
    font-size: 15px;
    font-weight: 800;
    color: var(--accent);
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .lb-hero { padding: 44px 20px 40px; }
    .lb-body { padding: 32px 16px 60px; }
    .lb-row { padding: 12px 18px; gap: 10px; }
    .lb-rankings-header { padding: 18px 18px; }
    .lb-my-stat-inner { padding: 14px 18px; }
    .lb-section-divider { padding: 8px 18px; }
    .lb-podium-name { font-size: 11px; max-width: 90px; }
  }
`;