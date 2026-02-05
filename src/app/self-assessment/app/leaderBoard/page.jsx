'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import './leaderboard.css';

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
    .catch(err => console.error("Leaderboard error:", err))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="lb-loading">Authenticating Rankings...</div>;

  const topThree = leaders.slice(0, 3);
  const others = leaders.slice(3);

  return (
    <div className="lb-dashboard">
      <aside className="lb-celebration-panel">
        <div className="lb-glass-overlay">
          <header className="lb-panel-header">
            <h2>Hall of Fame</h2>
            <p>Top Performers at Easy Coders</p>
          </header>
          <div className="lb-winners-stack">
            {topThree.map((item, index) => (
              <div key={item.id} className={`lb-winner-card pos-${index + 1}`}>
                <div className="lb-rank-badge">{index + 1}</div>
                <div className="lb-winner-avatar">
                  {item.user?.name?.charAt(0)}
                </div>
                <div className="lb-winner-info">
                  <span className="lb-winner-name">{item.user?.name}</span>
                  <span className="lb-winner-score">{item.score} PTS</span>
                </div>
                {index === 0 && <span className="lb-crown">👑</span>}
              </div>
            ))}
          </div>
        </div>
      </aside>
      <main className="lb-rankings-panel">
        <header className="lb-list-header">
          <h3>Full Rankings</h3>
        </header>
        <div className="lb-scroll-area">
          {others.map((item, index) => (
            <div key={item.id} className="lb-list-row">
              <span className="lb-list-rank">#{index + 4}</span>
              <div className="lb-list-info">
                <span className="lb-list-name">{item.user?.name}</span>
                <span className="lb-list-code">{item.certificate_code}</span>
              </div>
              <span className="lb-list-pts">{item.score} pts</span>
            </div>
          ))}
          {userStats && (
            <div className="lb-list-row lb-my-stat">
              <span className="lb-list-rank">YOU</span>
              <div className="lb-list-info">
                <span className="lb-list-name">My Best Performance</span>
                <span className="lb-list-code">{userStats.certificate_code}</span>
              </div>
              <span className="lb-list-pts">{userStats.score} pts</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}