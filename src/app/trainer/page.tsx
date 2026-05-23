'use client';

import { useEffect, useState, useMemo } from 'react';
import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/api';
import { useHasPermission } from '@/lib/permissions';
import styles from './trainer-home.module.css';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Batch = {
  id: number;
  name: string;
  course?: { id: number; name: string };
  start_date: string;
  end_date: string;
  status: string;
  students_count?: number;
};

type Task = {
  id: number;
  title: string;
  batch?: { id: number; name: string };
  due_date?: string;
  status: string;
  priority: string;
};

export default function TrainerDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // Show the Tickets shortcut only if this trainer has been granted ticket
  // access by an admin (manage_queries or respond_queries).
  const canAccessTickets = useHasPermission(['manage_queries', 'respond_queries']);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      setUserData(u ? JSON.parse(u) : null);
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [batchRes, taskRes] = await Promise.all([
          fetchWithAuth(`${BASE}/batches`),
          fetchWithAuth(`${BASE}/tasks`),
        ]);
        setBatches(batchRes.data || []);
        setTasks(taskRes.data || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const activeBatches = batches.filter(b => b.status === 'active');
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'active');

  const statusColor: Record<string, string> = {
    upcoming: '#0ea5e9', active: '#22c55e', completed: '#64748b', cancelled: '#ef4444',
  };
  const priorityColor: Record<string, string> = {
    high: '#ef4444', medium: '#f59e0b', low: '#22c55e',
  };

  return (
    <RoleGuard allowedRoles={[4]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <span className={styles.crumbNow}>Trainer Dashboard</span>
            </div>
            <h1 className={styles.title}>Hi {userData?.name || 'Trainer'}, {greeting}</h1>
            <p className={styles.subtitle}>Your batches and tasks at a glance</p>
          </div>
          <div className={styles.right}>
            <Link href="/trainer/tasks" className={`${styles.btn} ${styles.primary}`}>My Tasks</Link>
            <Link href="/trainer/syllabus" className={styles.btn}>Syllabus</Link>
            <Link href="/trainer/attendance" className={styles.btn}>Attendance</Link>
            {canAccessTickets && (
              <Link href="/trainer/tickets" className={styles.btn}>Tickets</Link>
            )}
          </div>
        </header>

        {loading ? (
          <section className={styles.card}><div className={styles.state}>Loading dashboard...</div></section>
        ) : (
          <>
            <section className={styles.kpis}>
              <div className={styles.kpi} style={{ borderLeft: '3px solid #22c55e' }}>
                <div className={styles.kpiLabel}>Active Batches</div>
                <div className={styles.kpiValue} style={{ color: '#22c55e' }}>{activeBatches.length}</div>
                <div className={styles.kpiHint}>Currently running</div>
              </div>
              <div className={styles.kpi} style={{ borderLeft: '3px solid #0ea5e9' }}>
                <div className={styles.kpiLabel}>Total Batches</div>
                <div className={styles.kpiValue} style={{ color: '#0ea5e9' }}>{batches.length}</div>
                <div className={styles.kpiHint}>Assigned to you</div>
              </div>
              <div className={styles.kpi} style={{ borderLeft: '3px solid #f59e0b' }}>
                <div className={styles.kpiLabel}>Pending Tasks</div>
                <div className={styles.kpiValue} style={{ color: '#f59e0b' }}>{pendingTasks.length}</div>
                <div className={styles.kpiHint}>Need your review</div>
              </div>
              <div className={styles.kpi} style={{ borderLeft: '3px solid #8b5cf6' }}>
                <div className={styles.kpiLabel}>Total Students</div>
                <div className={styles.kpiValue} style={{ color: '#8b5cf6' }}>
                  {batches.reduce((sum, b) => sum + (b.students_count || 0), 0)}
                </div>
                <div className={styles.kpiHint}>Across all batches</div>
              </div>
            </section>

            <section className={styles.grid}>
              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>My Batches</div>
                    <div className={styles.cardSub}>Batches you are assigned as trainer</div>
                  </div>
                </div>
                <div className={styles.list}>
                  {batches.length === 0 ? (
                    <div className={styles.state}>No batches assigned yet.</div>
                  ) : batches.map(b => (
                    <div key={b.id} className={styles.row}>
                      <div className={styles.avatar} style={{ background: statusColor[b.status] || '#64748b', color: '#fff', fontSize: 16 }}>
                        {b.name[0].toUpperCase()}
                      </div>
                      <div className={styles.rowMid}>
                        <div className={styles.rowTitle}>{b.name}</div>
                        <div className={styles.rowSub}>
                          {b.course?.name || '—'} · {b.start_date?.slice(0, 10)} → {b.end_date?.slice(0, 10)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span className={styles.pill} style={{ background: statusColor[b.status] || '#64748b', color: '#fff', border: 'none' }}>
                          {b.status}
                        </span>
                        <small style={{ color: '#94a3b8' }}>{b.students_count ?? 0} students</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <div className={styles.cardTitle}>Tasks Needing Review</div>
                    <div className={styles.cardSub}>Student submissions pending approval</div>
                  </div>
                  <Link className={styles.link} href="/trainer/tasks">View all →</Link>
                </div>
                <div className={styles.list}>
                  {pendingTasks.length === 0 ? (
                    <div className={styles.state}>All caught up! No pending tasks.</div>
                  ) : pendingTasks.slice(0, 5).map(t => (
                    <Link key={t.id} href="/trainer/tasks" className={styles.row}>
                      <div className={styles.rowMid}>
                        <div className={styles.rowTitle}>{t.title}</div>
                        <div className={styles.rowSub}>{t.batch?.name || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        {t.due_date && <small style={{ color: '#94a3b8' }}>{t.due_date.slice(0, 10)}</small>}
                        <span className={styles.pill} style={{ background: priorityColor[t.priority] || '#64748b', color: '#fff', border: 'none' }}>
                          {t.priority}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>Quick Actions</div>
              </div>
              <div className={styles.quickGrid}>
                <Link href="/trainer/tasks" className={styles.quick}>
                  <div className={styles.quickIcon}>✅</div>
                  <div className={styles.quickText}>
                    <div className={styles.quickTitle}>Mark Tasks Complete</div>
                    <div className={styles.quickSub}>Review and approve student submissions</div>
                  </div>
                  <div className={styles.chev}>→</div>
                </Link>
                <Link href="/trainer/syllabus" className={styles.quick}>
                  <div className={styles.quickIcon}>📚</div>
                  <div className={styles.quickText}>
                    <div className={styles.quickTitle}>Edit Syllabus</div>
                    <div className={styles.quickSub}>Add/edit modules, topics, subtopics</div>
                  </div>
                  <div className={styles.chev}>→</div>
                </Link>
                <Link href="/trainer/attendance" className={styles.quick}>
                  <div className={styles.quickIcon}>📍</div>
                  <div className={styles.quickText}>
                    <div className={styles.quickTitle}>Punch In / Out</div>
                    <div className={styles.quickSub}>Mark today's attendance via WiFi or GPS</div>
                  </div>
                  <div className={styles.chev}>→</div>
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
