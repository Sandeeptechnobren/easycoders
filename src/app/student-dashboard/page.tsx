'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import MyBatchCard from '@/components/MyBatchCard';
import MyTasksCard from '@/components/MyTasksCard';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Real ticket counters (was previously hardcoded to 0 on the dashboard).
  const [openTickets,    setOpenTickets]    = useState(0);
  const [activeTickets,  setActiveTickets]  = useState(0);
  // Real pending-task count (batch tasks not yet completed/approved).
  const [pendingTasks,   setPendingTasks]   = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch the student's own tickets in the background and count by status.
  // Failures fall back to the previous hardcoded zero — non-blocking.
  useEffect(() => {
    api.get('/student/myTickets')
      .then(res => {
        const list: Array<{ status?: string }> = res.data?.data ?? [];
        setOpenTickets(list.filter(t => t.status === 'open').length);
        setActiveTickets(list.filter(t =>
          t.status === 'open' || t.status === 'assigned' ||
          t.status === 'in_progress' || t.status === 'resolved'
        ).length);
      })
      .catch(() => { /* leave at 0 */ });
  }, []);

  // Count the student's batch tasks that aren't completed/approved yet.
  useEffect(() => {
    api.get('/student/tasks')
      .then(res => {
        const list: Array<{ my_submission?: { status?: string } | null }> = res.data?.data ?? [];
        setPendingTasks(list.filter(t => {
          const s = t.my_submission?.status;
          return s !== 'completed' && s !== 'approved';
        }).length);
      })
      .catch(() => { /* leave at 0 */ });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: '#f8f9fc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid #e2e8f0',
            borderTop: '3px solid #2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
            Loading your dashboard...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <RoleGuard allowedRoles={[3]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .sd-wrap * { box-sizing: border-box; margin: 0; padding: 0; }
        .sd-wrap {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #f1f5f9;
          min-height: 100vh;
          padding: 32px 24px 48px;
        }

        /* Header */
        .sd-header {
          display: flex;
          align-items: center;
          margin-top: 100px;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sd-header-left { display: flex; align-items: center; gap: 16px; }
        .sd-avatar {
          width: 52px; height: 52px; border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 18px; font-weight: 700; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }
        .sd-greeting { font-size: 13px; color: #64748b; font-weight: 500; margin-bottom: 2px; }
        .sd-name { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.2; }
        .sd-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;
          border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600;
        }
        .sd-badge-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }

        /* Stats row */
        .sd-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }
        .sd-stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sd-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .sd-stat-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; margin-bottom: 12px;
        }
        .sd-stat-label { font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px; }
        .sd-stat-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
        .sd-stat-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .sd-stat-accent {
          position: absolute; top: 0; right: 0;
          width: 60px; height: 60px; border-radius: 0 16px 0 60px;
          opacity: 0.07;
        }

        /* Main grid */
        .sd-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) { .sd-grid { grid-template-columns: 1fr; } }

        /* Cards */
        .sd-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .sd-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); }
        .sd-card-header {
          padding: 20px 24px 0;
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .sd-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .sd-card-sub { font-size: 12px; color: #94a3b8; }
        .sd-card-body { padding: 16px 24px 24px; }

        /* Action links */
        .sd-action-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
          text-decoration: none;
          transition: all 0.15s;
          border-radius: 0;
          cursor: pointer;
        }
        .sd-action-item:last-child { border-bottom: none; padding-bottom: 0; }
        .sd-action-item:first-child { padding-top: 4px; }
        .sd-action-item:hover .sd-action-icon { transform: scale(1.1); }
        .sd-action-item:hover .sd-action-arrow { transform: translateX(4px); color: #2563eb; }
        .sd-action-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0; transition: transform 0.2s;
        }
        .sd-action-label { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
        .sd-action-desc { font-size: 12px; color: #94a3b8; }
        .sd-action-arrow { margin-left: auto; color: #cbd5e1; font-size: 16px; transition: all 0.2s; }

        /* Progress items */
        .sd-progress-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .sd-progress-item:last-child { border-bottom: none; padding-bottom: 0; }
        .sd-progress-item:first-child { padding-top: 4px; }
        .sd-progress-left { display: flex; align-items: center; gap: 12px; }
        .sd-progress-icon {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
        }
        .sd-progress-label { font-size: 13px; font-weight: 600; color: #1e293b; }
        .sd-progress-sub { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .sd-pill {
          font-size: 11px; font-weight: 700; padding: 4px 10px;
          border-radius: 20px; white-space: nowrap;
        }

        /* Activity card */
        .sd-activity-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .sd-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 24px; text-align: center;
        }
        .sd-empty-icon {
          width: 64px; height: 64px; border-radius: 18px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 16px;
        }
        .sd-empty-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .sd-empty-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; max-width: 300px; }
        .sd-empty-cta {
          margin-top: 20px;
          display: inline-flex; align-items: center; gap: 8px;
          background: #2563eb; color: #fff; border: none;
          border-radius: 10px; padding: 10px 20px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: background 0.2s, transform 0.15s;
        }
        .sd-empty-cta:hover { background: #1d4ed8; transform: translateY(-1px); }

        /* Header icon for card */
        .sd-card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
      `}</style>

      <div className="sd-wrap">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div className="sd-header">
            <div className="sd-header-left">
              <div className="sd-avatar">{getInitials(user?.name)}</div>
              <div>
                <div className="sd-greeting">{greeting} ☀️</div>
                <div className="sd-name">{user?.name || 'Student'}</div>
              </div>
            </div>
            <div className="sd-badge">
              <span className="sd-badge-dot" />
              Student Portal
            </div>
          </div>

          {/* Stats */}
          <div className="sd-stats">
            <div className="sd-stat-card">
              <div className="sd-stat-accent" style={{ background: '#2563eb' }} />
              <div className="sd-stat-icon" style={{ background: '#eff6ff' }}>📚</div>
              <div className="sd-stat-label">Enrolled Courses</div>
              <div className="sd-stat-value" style={{ color: '#2563eb' }}>0</div>
              <div className="sd-stat-sub">Active this semester</div>
            </div>
            <div className="sd-stat-card">
              <div className="sd-stat-accent" style={{ background: '#16a34a' }} />
              <div className="sd-stat-icon" style={{ background: '#f0fdf4' }}>✅</div>
              <div className="sd-stat-label">Tasks Completed</div>
              <div className="sd-stat-value" style={{ color: '#16a34a' }}>0</div>
              <div className="sd-stat-sub">Great progress!</div>
            </div>
            <div className="sd-stat-card">
              <div className="sd-stat-accent" style={{ background: '#d97706' }} />
              <div className="sd-stat-icon" style={{ background: '#fffbeb' }}>⏳</div>
              <div className="sd-stat-label">Pending Tasks</div>
              <div className="sd-stat-value" style={{ color: '#d97706' }}>{pendingTasks}</div>
              <div className="sd-stat-sub">Awaiting completion</div>
            </div>
            <div className="sd-stat-card">
              <div className="sd-stat-accent" style={{ background: '#7c3aed' }} />
              <div className="sd-stat-icon" style={{ background: '#f5f3ff' }}>🎫</div>
              <div className="sd-stat-label">Open Tickets</div>
              <div className="sd-stat-value" style={{ color: '#7c3aed' }}>{openTickets}</div>
              <div className="sd-stat-sub">{activeTickets > openTickets ? `${activeTickets} active total` : 'Support requests'}</div>
            </div>
          </div>

          {/* My Batch (renders only when the student is enrolled in a batch) */}
          <MyBatchCard />

          {/* My Tasks (renders only when the student has batch tasks) */}
          <MyTasksCard />

          {/* Main Grid */}
          <div className="sd-grid">

            {/* Quick Actions */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div>
                  <div className="sd-card-title">Quick Actions</div>
                  <div className="sd-card-sub">Jump to what you need</div>
                </div>
                <div className="sd-card-icon" style={{ background: '#eff6ff', fontSize: 16 }}>⚡</div>
              </div>
              <div className="sd-card-body">

                <Link href="/students/tasks" className="sd-action-item" style={{ display: 'flex' }}>
                  <div className="sd-action-icon" style={{ background: '#eff6ff' }}>📝</div>
                  <div style={{ flex: 1 }}>
                    <div className="sd-action-label">My Tasks</div>
                    <div className="sd-action-desc">View and manage assigned tasks</div>
                  </div>
                  <span className="sd-action-arrow">→</span>
                </Link>

                <Link href="/students/tickets" className="sd-action-item" style={{ display: 'flex' }}>
                  <div className="sd-action-icon" style={{ background: '#f5f3ff' }}>🎫</div>
                  <div style={{ flex: 1 }}>
                    <div className="sd-action-label">Support Tickets</div>
                    <div className="sd-action-desc">Raise a query or get help</div>
                  </div>
                  <span className="sd-action-arrow">→</span>
                </Link>

                <Link href="/students/attendance" className="sd-action-item" style={{ display: 'flex' }}>
                  <div className="sd-action-icon" style={{ background: '#f0fdf4' }}>📍</div>
                  <div style={{ flex: 1 }}>
                    <div className="sd-action-label">Attendance</div>
                    <div className="sd-action-desc">Punch in / out & view history</div>
                  </div>
                  <span className="sd-action-arrow">→</span>
                </Link>

                <Link href="/students/courses" className="sd-action-item" style={{ display: 'flex' }}>
                  <div className="sd-action-icon" style={{ background: '#fff7ed' }}>📖</div>
                  <div style={{ flex: 1 }}>
                    <div className="sd-action-label">My Courses</div>
                    <div className="sd-action-desc">Browse enrolled courses</div>
                  </div>
                  <span className="sd-action-arrow">→</span>
                </Link>

              </div>
            </div>

            {/* Progress */}
            <div className="sd-card">
              <div className="sd-card-header">
                <div>
                  <div className="sd-card-title">Your Progress</div>
                  <div className="sd-card-sub">Track your learning journey</div>
                </div>
                <div className="sd-card-icon" style={{ background: '#f0fdf4', fontSize: 16 }}>📊</div>
              </div>
              <div className="sd-card-body">

                <div className="sd-progress-item">
                  <div className="sd-progress-left">
                    <div className="sd-progress-icon" style={{ background: '#eff6ff' }}>📚</div>
                    <div>
                      <div className="sd-progress-label">Courses Enrolled</div>
                      <div className="sd-progress-sub">Continue your learning</div>
                    </div>
                  </div>
                  <span className="sd-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>Active</span>
                </div>

                <div className="sd-progress-item">
                  <div className="sd-progress-left">
                    <div className="sd-progress-icon" style={{ background: '#f0fdf4' }}>✅</div>
                    <div>
                      <div className="sd-progress-label">Completed Tasks</div>
                      <div className="sd-progress-sub">Keep it up!</div>
                    </div>
                  </div>
                  <span className="sd-pill" style={{ background: '#f0fdf4', color: '#16a34a' }}>0 Done</span>
                </div>

                <div className="sd-progress-item">
                  <div className="sd-progress-left">
                    <div className="sd-progress-icon" style={{ background: '#fffbeb' }}>⏰</div>
                    <div>
                      <div className="sd-progress-label">Pending Tasks</div>
                      <div className="sd-progress-sub">Waiting for you</div>
                    </div>
                  </div>
                  <span className="sd-pill" style={{ background: '#fffbeb', color: '#d97706' }}>{pendingTasks} Left</span>
                </div>

              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="sd-activity-card">
            <div className="sd-card-header" style={{ padding: '20px 24px 0' }}>
              <div>
                <div className="sd-card-title">Recent Activity</div>
                <div className="sd-card-sub">Your latest interactions</div>
              </div>
              <div className="sd-card-icon" style={{ background: '#faf5ff', fontSize: 16 }}>🕐</div>
            </div>
            <div className="sd-empty">
              <div className="sd-empty-icon">🚀</div>
              <div className="sd-empty-title">No activity yet</div>
              <div className="sd-empty-desc">
                Your learning journey starts here. Check your tasks or raise a support ticket to get going.
              </div>
              <Link href="/students/tasks" className="sd-empty-cta">
                View My Tasks →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}