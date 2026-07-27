'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import styles from './students.module.css';
import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

type Student = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  status: number | string;
  interest?: null | {
    id: number;
    interest_status?: { id: number; interest: string } | null;
    call_response?: string | null;
  };
};

function interestLabel(s: Student): string {
  const v = s?.interest?.interest_status?.interest;
  return v ? v : 'Not Set';
}

function interestKey(label: string) {
  const k = label.trim().toLowerCase();
  if (k === 'interested') return 'Interested';
  if (k === 'not interest' || k === 'not interested') return 'Not Interested';
  if (k === 'call back later') return 'Call Back Later';
  if (k === 'not reachable') return 'Not Reachable';
  if (k === 'not set') return 'Not Set';
  return 'Other';
}

function badgeClass(label: string, styles: any) {
  const k = interestKey(label);
  if (k === 'Interested') return styles.pillInterested;
  if (k === 'Not Interested') return styles.pillNotInterested;
  if (k === 'Call Back Later') return styles.pillCallBack;
  if (k === 'Not Reachable') return styles.pillNotReachable;
  if (k === 'Not Set') return styles.pillNotSet;
  return styles.pillOther;
}

export default function TrainerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const base = {
      total: students.length,
      Interested: 0,
      'Not Interested': 0,
      'Call Back Later': 0,
      'Not Reachable': 0,
      'Not Set': 0,
      Other: 0,
    };
    for (const s of students) {
      const k = interestKey(interestLabel(s));
      (base as any)[k] = ((base as any)[k] || 0) + 1;
    }
    return base;
  }, [students]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const json = await fetchWithAuth(
          'https://api.easycoders.in/api/student/studentslist'
        );
        setStudents(json.data || []);
      } catch (e: any) {
        setStudents([]);
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <RoleGuard allowedRoles={[4]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/trainer" className={styles.crumbLink}>Trainer</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Students</span>
            </div>

            <h1 className={styles.title}>Students Directory</h1>
            <p className={styles.subtitle}>Open a student profile to manage interest & training.</p>
          </div>

          <div className={styles.right}>
            <div className={styles.miniStats}>
              <div className={styles.mini}>
                <div className={styles.miniLabel}>Total</div>
                <div className={styles.miniValue}>{stats.total}</div>
              </div>
              <div className={`${styles.mini} ${styles.miniInterested}`}>
                <div className={styles.miniLabel}>Interested</div>
                <div className={styles.miniValue}>{stats.Interested}</div>
              </div>
              <div className={`${styles.mini} ${styles.miniCallBack}`}>
                <div className={styles.miniLabel}>Call Back</div>
                <div className={styles.miniValue}>{stats['Call Back Later']}</div>
              </div>
              <div className={`${styles.mini} ${styles.miniNotReachable}`}>
                <div className={styles.miniLabel}>Not Reachable</div>
                <div className={styles.miniValue}>{stats['Not Reachable']}</div>
              </div>
            </div>

            <Link href="/trainer/students" className={`${styles.btn} ${styles.primary}`}>
              Refresh
            </Link>
          </div>
        </header>

        <section className={styles.card}>
          {loading && <div className={styles.state}>Loading…</div>}

          {!loading && error && (
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load students</div>
              <div className={styles.stateText}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>Go to Login →</Link>
              </div>
            </div>
          )}

          {!loading && !error && students.length === 0 && (
            <div className={styles.state}>
              <div className={styles.stateTitle}>No results</div>
              <div className={styles.stateText}>No students found.</div>
            </div>
          )}

          {!loading && !error && students.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Interest</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((s) => {
                    const lbl = interestLabel(s);
                    return (
                      <tr key={String(s.id)}>
                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                            <div className={styles.studentMeta}>
                              <div className={styles.studentName}>{s.name}</div>
                              <div className={styles.studentSub}>{s.email} • {s.phone}</div>
                            </div>
                          </div>
                        </td>

                        <td><div className={styles.muted}>{s.email}</div></td>

                        <td>
                          <span className={`${styles.pill} ${badgeClass(lbl, styles)}`}>{lbl}</span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <Link className={`${styles.btn} ${styles.small}`} href={`/trainer/students/${s.id}`}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className={styles.mobileList}>
                {students.map((s) => {
                  const lbl = interestLabel(s);
                  return (
                    <Link key={String(s.id)} href={`/trainer/students/${s.id}`} className={styles.mCard}>
                      <div className={styles.mTop}>
                        <div className={styles.mLeft}>
                          <div className={styles.avatar}>{(s.name?.[0] || 'S').toUpperCase()}</div>
                          <div className={styles.mText}>
                            <div className={styles.studentName}>{s.name}</div>
                            <div className={styles.studentSub}>{s.email}</div>
                          </div>
                        </div>
                        <span className={`${styles.pill} ${badgeClass(lbl, styles)}`}>{lbl}</span>
                      </div>
                      <div className={styles.mAction}>View Details →</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}