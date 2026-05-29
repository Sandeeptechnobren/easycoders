'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import {
  AdminSection, AdminPanel, AdminState,
} from '@/components/admin/AdminSection';
import {
  computeInterestStats, normalizeInterestLabel,
  type InterestLabel,
} from '@/lib/interest';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/users — Assessment Users admin list
 *
 * Pulls EasyAssess (assement_users) records via the existing `/hr/students`
 * endpoint. Per-row interest status pill (gold for Interested, etc.) +
 * profile link, plus a top stat strip with the breakdown.
 *
 * Filters: college dropdown (loaded from /collegeList) + client-side
 * search box.
 *
 * No backend changes needed — every endpoint here already exists.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Interest = {
  id: number;
  assessment_user_id: number;
  interest_status?: { id: number; interest: string };
  call_response?: string | null;
};

type AUser = {
  id:           number;
  name:         string;
  email:        string;
  phone?:       string;
  college_id?:  number;
  course?:      string;
  status?:      number | string;
  created_at?:  string;
  interest?:    Interest | null;
};

type College = { id: number | string; college_name: string };

type LoadState = 'loading' | 'ready' | 'error';

export default function AssessmentUsersAdmin() {
  const [users, setUsers]               = useState<AUser[]>([]);
  const [colleges, setColleges]         = useState<College[]>([]);
  const [collegeId, setCollegeId]       = useState<string>('');
  const [search, setSearch]             = useState('');
  const [state, setState]               = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg]         = useState('');

  /* ─── Load colleges once ─── */
  useEffect(() => {
    fetch(`${BASE}/collegeList`)
      .then(r => r.json())
      .then(j => setColleges(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setColleges([]));
  }, []);

  /* ─── Load users (re-runs on college change) ─── */
  useEffect(() => {
    let cancelled = false;
    // Defer ALL initial state-flips to a microtask so we don't trigger
    // the cascading-renders lint rule by calling setState synchronously
    // inside the effect body. The fetch starts right away regardless.
    queueMicrotask(() => {
      if (cancelled) return;
      setState('loading');
      setErrorMsg('');
    });
    const url = `${BASE}/hr/students${collegeId ? `?college_id=${encodeURIComponent(collegeId)}` : ''}`;
    fetchWithAuth(url)
      .then(j => {
        if (cancelled) return;
        setUsers(Array.isArray(j?.data) ? j.data : []);
        setState('ready');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load users.';
        setErrorMsg(msg === 'Unauthorized' ? 'Session expired — please sign in again.' : msg);
        setUsers([]);
        setState('error');
      });
    return () => { cancelled = true; };
  }, [collegeId]);

  /* ─── Client-side search filter ─── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(() => computeInterestStats(users), [users]);

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Assessment Users"
        description="Browse registered Easy Assess accounts, track their interest status and open individual profiles for follow-up."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Users' },
        ]}
      >
        <style jsx>{`
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
            margin-bottom: 18px;
          }
          .stat {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 14px;
            padding: 14px 16px;
            position: relative;
          }
          .stat-val {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 24px;
            font-weight: 700;
            color: #0B1B3A;
            letter-spacing: -0.01em;
            line-height: 1;
          }
          .stat-lbl {
            font-size: 11px;
            color: #94A3B8;
            margin-top: 6px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            font-weight: 600;
          }
          .stat-bar {
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 3px;
            border-radius: 14px 0 0 14px;
          }

          .toolbar {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
          }
          .toolbar select,
          .toolbar input {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 10px;
            padding: 8px 12px;
            font-family: inherit;
            font-size: 13px;
            color: #0B1B3A;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease;
          }
          .toolbar input { min-width: 220px; }
          .toolbar select:focus,
          .toolbar input:focus {
            border-color: #E8A020;
            box-shadow: 0 0 0 3px rgba(232,160,32,0.16);
          }

          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #94A3B8;
            padding: 12px 14px;
            border-bottom: 1px solid #E5E9F2;
          }
          tbody td {
            padding: 14px;
            border-bottom: 1px solid #F1F4F9;
            color: #0B1B3A;
            vertical-align: middle;
          }
          tbody tr:hover td { background: #F8FAFD; }
          tbody tr:last-child td { border-bottom: none; }

          .uname { font-weight: 600; }
          .umail { font-size: 12px; color: #4A5568; }
          .pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
          }
          .pill-interested    { background: #ECFDF5; color: #166534; }
          .pill-not-interested{ background: #FEF2F2; color: #991B1B; }
          .pill-callback      { background: #FEF6E7; color: #92660D; }
          .pill-unreachable   { background: #F1F5F9; color: #475569; }
          .pill-not-set       { background: #EEF2FF; color: #3730A3; }
          .pill-other         { background: #F4F6FB; color: #4A5568; }

          .openBtn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #0B1B3A;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            padding: 6px 12px;
            border-radius: 100px;
            text-decoration: none;
            transition: background 0.18s ease;
          }
          .openBtn:hover { background: #E8A020; color: #0B1B3A; }
        `}</style>

        {/* Stat strip */}
        <div className="stats">
          {[
            { label: 'Total',         val: stats.total,                color: '#0EA5E9' },
            { label: 'Interested',    val: stats.Interested,           color: '#22C55E' },
            { label: 'Not Interested',val: stats['Not Interested'],    color: '#EF4444' },
            { label: 'Call Back',     val: stats['Call Back Later'],   color: '#F59E0B' },
            { label: 'Not Reachable', val: stats['Not Reachable'],     color: '#64748B' },
            { label: 'Not Set',       val: stats['Not Set'],           color: '#8B5CF6' },
          ].map(s => (
            <div key={s.label} className="stat">
              <div className="stat-bar" style={{ background: s.color }} />
              <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        <AdminPanel
          title="Registered users"
          subtitle={state === 'ready' ? `${filtered.length} of ${users.length} matching` : undefined}
          toolbar={
            <div className="toolbar">
              <select
                value={collegeId}
                onChange={e => setCollegeId(e.target.value)}
                aria-label="Filter by college"
              >
                <option value="">All colleges</option>
                {colleges.map(c => (
                  <option key={String(c.id)} value={String(c.id)}>{c.college_name}</option>
                ))}
              </select>
              <input
                type="search"
                placeholder="Search name / email / phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search users"
              />
            </div>
          }
        >
          {state === 'loading' && <AdminState kind="loading" message="Loading assessment users…" />}
          {state === 'error'   && <AdminState kind="error" message={errorMsg || 'Failed to load.'} />}
          {state === 'ready' && filtered.length === 0 && (
            <AdminState kind="empty" message={search ? `No users match "${search}".` : 'No users found for the selected college.'} />
          )}

          {state === 'ready' && filtered.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Interest</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const label: InterestLabel = normalizeInterestLabel(u.interest?.interest_status?.interest);
                    // Map the InterestLabel string straight to a pill class.
                    // Cheaper + safer than indirecting through interestClass().
                    const cssCls: Record<InterestLabel, string> = {
                      'Interested':       'pill-interested',
                      'Not Interested':   'pill-not-interested',
                      'Call Back Later':  'pill-callback',
                      'Not Reachable':    'pill-unreachable',
                      'Not Set':          'pill-not-set',
                      'Other':            'pill-other',
                    };
                    return (
                      <tr key={String(u.id)}>
                        <td>
                          <div className="uname">{u.name || '—'}</div>
                          <div className="umail">{u.email}</div>
                        </td>
                        <td>{u.phone || '—'}</td>
                        <td><span className={`pill ${cssCls[label]}`}>{label}</span></td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/admin/easy-assess/users/${u.id}`} className="openBtn">
                            Open
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </AdminSection>
    </RoleGuard>
  );
}
