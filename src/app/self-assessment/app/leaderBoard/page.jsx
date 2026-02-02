
'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import './leaderboard.css';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('assessment_token'); //
    
    api.get('/leaderBoard/list', {
      headers: { Authorization: `Bearer ${token}` } //
    })
    .then(res => {
      setLeaders(res.data.data || []); //
      setUserStats(res.data.user_stats); //
    })
    .catch(err => console.error("Leaderboard error:", err))
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading Easy Coders Rankings...</div>;

  const first = leaders[0];
  const second = leaders[1];
  const third = leaders[2];
  const others = leaders.slice(3);

  return (
    <div className="leaderboardContainer">
      <header className="lbHeader">
        <h1>Leaderboard</h1>
        {/* <p>Top performers at Easy Coders</p> */}
      </header>

      {/* Podium Section */}
      <div className="podiumSection">
        {second && (
          <div className="podiumItem second">
            <div className="avatarRing">{second.user?.name?.charAt(0)}</div>
            <span className="podiumName">{second.user?.name}</span>
            <span className="podiumScore">{second.score} pts</span>
            <div className="step">2</div>
          </div>
        )}

        {first && (
          <div className="podiumItem first">
            <div className="crown">👑</div>
            <div className="avatarRing">{first.user?.name?.charAt(0)}</div>
            <span className="podiumName">{first.user?.name}</span>
            <span className="podiumScore">{first.score} pts</span>
            <div className="step">1</div>
          </div>
        )}

        {third && (
          <div className="podiumItem third">
            <div className="avatarRing">{third.user?.name?.charAt(0)}</div>
            <span className="podiumName">{third.user?.name}</span>
            <span className="podiumScore">{third.score} pts</span>
            <div className="step">3</div>
          </div>
        )}
      </div>

      {/* Ranked List */}
      <div className="lbList">
        {others.map((item, index) => (
          <div key={item.id} className="lbRow">
            {/* <span className="rank">#{index + 4}</span> */}
            {/* <div className="userBadge">{item.user?.name?.charAt(0)}</div> */}
            <div className="userInfo">
              <span className="userName">{item.user?.name}</span>
              <span className="certCode">{item.certificate_code}</span>
            </div>
            <span className="userScore">{item.score} pts</span>
          </div>
        ))}
      </div>

      {/* Logged-in User Sticky Bar */}
      {userStats && (
        <div className="userStickyBar">
          <div className="stickyInfo">
            <span className="stickyTitle">Your Best Performance</span>
            <span className="stickyCert">{userStats.certificate_code}</span>
          </div>
          <div className="stickyScore">{userStats.score} <small>pts</small></div>
        </div>
      )}
    </div>
  );
}