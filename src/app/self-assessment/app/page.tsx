'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AssessmentCards from './assessment/[id]/AssessmentCards';

const API_BASE = 'https://api.easycoders.in/api';

type Stats = {
  appeared: number; qualified: number; avg_percent: number; best_percent: number;
  certificates: number; rank: number | null; total_participants: number;
};

export default function AssessmentDashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    const storedName = localStorage.getItem('logged_in_user');
    const storedEmail = localStorage.getItem('assessment_user');
    if (storedName) {
      setUserName(storedName);
    } else if (storedEmail) {
      setUserName(storedEmail.split('@')[0]);
    } else {
      setUserName('Learner');
    }
  }, []);
  useEffect(() => {
    const token = localStorage.getItem('assessment_token');
    if (!token) return;
    fetch(`${API_BASE}/assessment/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d?.data) setStats(d.data as Stats); })
      .catch(() => {});
  }, []);
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' :
    currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LC';
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .ad-wrap {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #f1f5f9;
          min-height: 100vh;
          padding: 32px 24px 48px;
        }
        .ad-wrap * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Hero banner */
        .ad-hero {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
          border-radius: 22px;
          padding: 32px 36px;
          margin-bottom: 28px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        /* Decorative circles in hero */
        .ad-hero::before {
          content: '';
          position: absolute;
          width: 320px; height: 320px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          top: -80px; right: -60px;
          pointer-events: none;
        }
        .ad-hero::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.04);
          bottom: -60px; right: 80px;
          pointer-events: none;
        }

        .ad-hero-left { position: relative; z-index: 1; }
        .ad-greeting-row {
          display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
        }
        .ad-avatar {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(255,255,255,0.15);
          border: 2px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .ad-greeting { font-size: 13px; color: rgba(255,255,255,0.55); font-weight: 500; margin-bottom: 2px; }
        .ad-name { font-size: 24px; font-weight: 900; color: #fff; line-height: 1.2; }
        .ad-sub { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 4px; }

        /* Hero right — quick stat pills */
        .ad-hero-pills {
          display: flex; gap: 10px; flex-wrap: wrap;
          position: relative; z-index: 1;
        }
        .ad-pill {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px; padding: 10px 16px;
        }
        .ad-pill-ico { font-size: 18px; }
        .ad-pill-val { font-size: 18px; font-weight: 800; color: #fff; line-height: 1; }
        .ad-pill-lbl { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 1px; }

        /* Section header */
        .ad-section-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }
        .ad-section-title-row { display: flex; align-items: center; gap: 10px; }
        .ad-section-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .ad-section-title { font-size: 17px; font-weight: 800; color: #0f172a; }
        .ad-section-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; }
        .ad-count-badge {
          display: inline-flex; align-items: center; justify-content: center;
          background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
          border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700;
        }

        /* Info strip */
        .ad-info-strip {
          display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
        }
        .ad-info-card {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 14px 18px; display: flex; align-items: center; gap: 12px;
          flex: 1; min-width: 140px;
          transition: box-shadow 0.2s;
        }
        .ad-info-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .ad-info-icon { font-size: 20px; flex-shrink: 0; }
        .ad-info-val { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1; }
        .ad-info-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* Cards area */
        .ad-cards-area {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          min-height: 200px;
        }

        /* Tip banner */
        .ad-tip {
          display: flex; align-items: flex-start; gap: 12px;
          background: #faf5ff; border: 1px solid #e9d5ff;
          border-radius: 14px; padding: 14px 18px; margin-top: 24px;
        }
        .ad-tip-ico { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .ad-tip-title { font-size: 13px; font-weight: 700; color: #6d28d9; margin-bottom: 2px; }
        .ad-tip-desc { font-size: 12px; color: #7c3aed; opacity: 0.8; line-height: 1.5; }
      `}</style>

      <div className="ad-wrap">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Hero */}
          <div className="ad-hero">
            <div className="ad-hero-left">
              <div className="ad-greeting-row">
                <div className="ad-avatar">{getInitials(userName || 'LC')}</div>
                <div>
                  <div className="ad-greeting">{greeting} ☀️</div>
                  <div className="ad-name">{userName || '...'}</div>
                </div>
              </div>
              <div className="ad-sub">Ready to test your knowledge? Your assessments are live below.</div>
            </div>

            <div className="ad-hero-pills">
              <div className="ad-pill">
                <span className="ad-pill-ico">📋</span>
                <div>
                  <div className="ad-pill-val">{stats ? stats.appeared : '—'}</div>
                  <div className="ad-pill-lbl">Appeared</div>
                </div>
              </div>
              <div className="ad-pill">
                <span className="ad-pill-ico">✅</span>
                <div>
                  <div className="ad-pill-val">{stats ? stats.qualified : '—'}</div>
                  <div className="ad-pill-lbl">Qualified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Your performance */}
          <div className="ad-section-head" style={{ marginBottom: 14 }}>
            <div className="ad-section-title-row">
              <div className="ad-section-icon">📊</div>
              <div>
                <div className="ad-section-title">Your Performance</div>
                <div className="ad-section-sub">A snapshot of how you&apos;re doing</div>
              </div>
            </div>
            <Link href="/self-assessment/app/results" className="ad-count-badge" style={{ textDecoration: 'none' }}>View all results →</Link>
          </div>
          <div className="ad-info-strip">
            <div className="ad-info-card">
              <span className="ad-info-icon">📊</span>
              <div>
                <div className="ad-info-val">{stats ? `${stats.avg_percent}%` : '—'}</div>
                <div className="ad-info-lbl">Average score</div>
              </div>
            </div>
            <div className="ad-info-card">
              <span className="ad-info-icon">🚀</span>
              <div>
                <div className="ad-info-val">{stats ? `${stats.best_percent}%` : '—'}</div>
                <div className="ad-info-lbl">Best score</div>
              </div>
            </div>
            <div className="ad-info-card">
              <span className="ad-info-icon">🎓</span>
              <div>
                <div className="ad-info-val">{stats ? stats.certificates : '—'}</div>
                <div className="ad-info-lbl">Certificates earned</div>
              </div>
            </div>
            <div className="ad-info-card">
              <span className="ad-info-icon">🏆</span>
              <div>
                <div className="ad-info-val">{stats && stats.rank ? `#${stats.rank}` : '—'}</div>
                <div className="ad-info-lbl">{stats && stats.rank ? `Rank of ${stats.total_participants}` : 'Leaderboard rank'}</div>
              </div>
            </div>
          </div>

          {/* Assessments section */}
          <div className="ad-section-head">
            <div className="ad-section-title-row">
              <div className="ad-section-icon">📋</div>
              <div>
                <div className="ad-section-title">Active Assessments</div>
                <div className="ad-section-sub">Click any card to start or continue</div>
              </div>
            </div>
            <span className="ad-count-badge">Available now</span>
          </div>

          {/* Assessment cards from existing component */}
          <div className="ad-cards-area">
            <AssessmentCards />
          </div>

          {/* Tip */}
          <div className="ad-tip">
            <span className="ad-tip-ico">💡</span>
            <div>
              <div className="ad-tip-title">Pro Tip</div>
              <div className="ad-tip-desc">
                Find a quiet spot before starting. Each assessment is timed and must be completed in one session. Your certificate is generated automatically once you pass.
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}