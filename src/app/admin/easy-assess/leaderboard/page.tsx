'use client';

import RoleGuard from '@/components/RoleGuard';
import { useCallback, useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/leaderboard — Top-N admin leaderboard
 *
 * Calls GET /api/assessment/admin/leaderboard?limit=…&assessment_id=…
 *      &from=…&to=… (new Phase 2a endpoint added to AssessmentController).
 *
 * Renders a clean rank table: rank · user · assessment · raw score +
 * computed percentage · completed timestamp · certificate code (if any).
 * Filters: assessment dropdown (loaded from /assessment/admin/list),
 * date-from / date-to range, top-N limit selector.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Row = {
  id:                number;
  assessment_id:     number;
  user_id:           number;
  score:             number;
  status:            string;
  certificate_code?: string | null;
  completed_at:      string;
  assessment?:       { id: number; title: string; total_marks?: number; passing_score?: number };
  user?:             { id: number; name: string; email: string; phone?: string };
};

type Assessment = { id: number; title: string };

type LoadState = 'loading' | 'ready' | 'error';

export default function AssessmentLeaderboardAdmin() {
  const [rows, setRows]               = useState<Row[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [from, setFrom]               = useState<string>('');
  const [to, setTo]                   = useState<string>('');
  const [limit, setLimit]             = useState<number>(50);
  const [state, setState]             = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg]       = useState<string>('');

  /* ─── Load assessment list once for the dropdown ─── */
  useEffect(() => {
    fetchWithAuth(`${BASE}/assessment/admin/list`)
      .then(j => setAssessments(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setAssessments([]));
  }, []);

  /* ─── Load leaderboard, re-runs on any filter change ─── */
  const load = useCallback(() => {
    // Defer ALL state-flips to a microtask so we don't trigger the
    // cascading-renders lint rule when load() is called from inside a
    // useEffect.
    queueMicrotask(() => {
      setState('loading');
      setErrorMsg('');
    });
    const qs = new URLSearchParams({ limit: String(limit) });
    if (assessmentId) qs.set('assessment_id', assessmentId);
    if (from)         qs.set('from', from);
    if (to)           qs.set('to', to);
    fetchWithAuth(`${BASE}/assessment/admin/leaderboard?${qs.toString()}`)
      .then(j => {
        setRows(Array.isArray(j?.data) ? j.data : []);
        setState('ready');
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load leaderboard.';
        setErrorMsg(msg === 'Unauthorized' ? 'Session expired — please sign in again.' : msg);
        setRows([]);
        setState('error');
      });
  }, [assessmentId, from, to, limit]);

  useEffect(() => { load(); }, [load]);

  /* ─── Helper: compute percentage from raw score + total_marks ─── */
  const pct = (r: Row): number => {
    const total = Number(r.assessment?.total_marks || 0);
    if (total <= 0) return 0;
    return Math.round((Number(r.score) / total) * 100);
  };

  /* ─── Helper: medal emoji for top 3 (decorative only) ─── */
  const medal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Leaderboard"
        description="Top performers across the Easy Assess platform, ordered by raw score then most-recent completion. Filter by assessment or date range."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Leaderboard' },
        ]}
      >
        <style jsx>{`
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
          .toolbar select:focus,
          .toolbar input:focus {
            border-color: #E8A020;
            box-shadow: 0 0 0 3px rgba(232,160,32,0.16);
          }
          .toolbar-lbl {
            font-size: 11px;
            color: #94A3B8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-right: 2px;
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

          .rank {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px; height: 32px;
            border-radius: 50%;
            background: #F4F6FB;
            color: #4A5568;
            font-weight: 700;
            font-size: 13px;
            font-family: 'Playfair Display', Georgia, serif;
          }
          .rank.top {
            background: linear-gradient(135deg, #FEF6E7 0%, #F5C356 100%);
            color: #92660D;
          }
          .uname { font-weight: 600; }
          .umail { font-size: 12px; color: #4A5568; }
          .aname { font-weight: 500; color: #4A5568; }
          .score-pct {
            display: inline-block;
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 16px;
            font-weight: 700;
            color: #0B1B3A;
            letter-spacing: -0.01em;
          }
          .score-raw {
            font-size: 11px;
            color: #94A3B8;
            margin-left: 6px;
          }
          .cert-pill {
            display: inline-block;
            background: #ECFDF5;
            color: #166534;
            border: 1px solid rgba(22,163,74,0.25);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 3px 9px;
            border-radius: 100px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          }
          .when {
            font-size: 12px;
            color: #4A5568;
          }
        `}</style>

        <AdminPanel
          title="Top performers"
          subtitle={state === 'ready' ? `${rows.length} attempts shown` : undefined}
          toolbar={
            <div className="toolbar">
              <span className="toolbar-lbl">Assessment</span>
              <select value={assessmentId} onChange={e => setAssessmentId(e.target.value)} aria-label="Filter by assessment">
                <option value="">All</option>
                {assessments.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
              <span className="toolbar-lbl">From</span>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} aria-label="From date" />
              <span className="toolbar-lbl">To</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} aria-label="To date" />
              <span className="toolbar-lbl">Show</span>
              <select value={String(limit)} onChange={e => setLimit(Number(e.target.value))} aria-label="Result limit">
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          }
        >
          {state === 'loading' && <AdminState kind="loading" message="Loading leaderboard…" />}
          {state === 'error'   && <AdminState kind="error" message={errorMsg || 'Failed to load.'} />}
          {state === 'ready' && rows.length === 0 && (
            <AdminState kind="empty" message="No completed attempts match those filters." />
          )}

          {state === 'ready' && rows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Rank</th>
                    <th>User</th>
                    <th>Assessment</th>
                    <th>Score</th>
                    <th>Certificate</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const rank = i + 1;
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className={`rank ${rank <= 3 ? 'top' : ''}`}>
                            {medal(rank) || rank}
                          </span>
                        </td>
                        <td>
                          <div className="uname">{r.user?.name || '—'}</div>
                          <div className="umail">{r.user?.email || ''}</div>
                        </td>
                        <td><span className="aname">{r.assessment?.title || `#${r.assessment_id}`}</span></td>
                        <td>
                          <span className="score-pct">{pct(r)}%</span>
                          <span className="score-raw">{r.score} / {r.assessment?.total_marks ?? '?'}</span>
                        </td>
                        <td>
                          {r.certificate_code
                            ? <span className="cert-pill" title={r.certificate_code}>{r.certificate_code}</span>
                            : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>}
                        </td>
                        <td>
                          <span className="when">
                            {r.completed_at
                              ? new Date(r.completed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </span>
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
