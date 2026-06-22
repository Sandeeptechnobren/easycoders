'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type RosterRow = {
  attempt_id: number;
  student: { id: number | null; name: string; email: string | null };
  score: number; total_marks: number; percent: number;
  qualified: boolean; status: string;
  started_at: string | null; completed_at: string | null;
};
type Summary = {
  assessment: { id: number; title: string; passing_score: number; total_marks: number };
  total_attempts: number; distinct_students: number; completed: number;
  qualified: number; avg_percent: number; best_percent: number;
};
type DetailQ = {
  question_id: number; question_text: string; type: string; marks: number;
  marks_awarded: number | null; is_correct: boolean | null; answered: boolean;
  code?: string | null; language?: string | null; code_grading?: string; run_meta?: Record<string, unknown>;
  options?: { id: number; text: string; is_correct: boolean }[];
  selected_option_id?: number | null; answer_text?: string | null;
};
type Detail = {
  attempt: { id: number; status: string; score: number; total_marks: number; percent: number; passing_score: number; qualified: boolean; completed_at: string | null };
  student: { id: number | null; name: string; email: string | null };
  assessment: { id: number | null; title: string };
  questions: DetailQ[];
};

const fmtDate = (s?: string | null) => (s ? new Date(s.replace(' ', 'T')).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

export default function AssessmentStatsPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [openAttempt, setOpenAttempt] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const res = await fetchWithAuth(`${BASE}/assessment/admin/${id}/attempts`);
      const d = await res.json();
      if (!res.ok) throw new Error(d?.message || 'Failed to load statistics.');
      setSummary(d.summary || null);
      setRoster(Array.isArray(d.data) ? d.data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load statistics.');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (attemptId: number) => {
    setOpenAttempt(attemptId); setDetail(null); setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/assessment/admin/attempts/${attemptId}/detail`);
      const d = await res.json();
      if (res.ok) setDetail(d.data);
    } catch { /* ignore */ } finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setOpenAttempt(null); setDetail(null); };

  const stat = (label: string, value: React.ReactNode) => (
    <div className="st-metric"><div className="st-metric-val">{value}</div><div className="st-metric-lbl">{label}</div></div>
  );

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className="st-wrap">
        <style>{styles}</style>

        <button className="st-back" onClick={() => router.push('/admin/assessments')}>← Back to assessments</button>

        <div className="st-head">
          <div>
            <div className="st-eyebrow">Assessment statistics</div>
            <h1 className="st-title">{summary?.assessment.title || 'Loading…'}</h1>
          </div>
          <button className="st-refresh" onClick={load}>Refresh</button>
        </div>

        {err && <div className="st-error">{err}</div>}

        {summary && (
          <div className="st-metrics">
            {stat('Appeared', summary.distinct_students)}
            {stat('Attempts', summary.total_attempts)}
            {stat('Completed', summary.completed)}
            {stat('Qualified', summary.qualified)}
            {stat('Avg score', `${summary.avg_percent}%`)}
            {stat('Best score', `${summary.best_percent}%`)}
          </div>
        )}

        <div className="st-card">
          <div className="st-card-head">
            <h2 className="st-card-title">Who appeared</h2>
            <span className="st-pill">Pass mark: {summary?.assessment.passing_score ?? 40}%</span>
          </div>

          {loading ? (
            <div className="st-empty">Loading…</div>
          ) : roster.length === 0 ? (
            <div className="st-empty">No one has attempted this assessment yet.</div>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr><th>Student</th><th>Score</th><th>Result</th><th>Status</th><th>Submitted</th><th></th></tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.attempt_id}>
                      <td>
                        <div className="st-name">{r.student.name}</div>
                        <div className="st-email">{r.student.email}</div>
                      </td>
                      <td><strong>{r.score}</strong> / {r.total_marks} <span className="st-pct">({r.percent}%)</span></td>
                      <td>
                        {r.status === 'completed'
                          ? <span className={`st-badge ${r.qualified ? 'ok' : 'no'}`}>{r.qualified ? 'Qualified' : 'Not qualified'}</span>
                          : <span className="st-badge muted">—</span>}
                      </td>
                      <td><span className={`st-status ${r.status}`}>{r.status}</span></td>
                      <td className="st-date">{fmtDate(r.completed_at)}</td>
                      <td><button className="st-view" onClick={() => openDetail(r.attempt_id)}>View answers</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per-attempt detail modal */}
        {openAttempt !== null && (
          <div className="st-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}>
            <div className="st-modal">
              <div className="st-modal-head">
                <div>
                  <div className="st-modal-name">{detail?.student.name || 'Loading…'}</div>
                  {detail && (
                    <div className="st-modal-sub">
                      {detail.student.email} · scored <strong>{detail.attempt.score}/{detail.attempt.total_marks} ({detail.attempt.percent}%)</strong>
                      {detail.attempt.status === 'completed' && <span className={`st-badge ${detail.attempt.qualified ? 'ok' : 'no'}`} style={{ marginLeft: 8 }}>{detail.attempt.qualified ? 'Qualified' : 'Not qualified'}</span>}
                    </div>
                  )}
                </div>
                <button className="st-x" onClick={closeDetail} aria-label="Close">✕</button>
              </div>

              <div className="st-modal-body">
                {detailLoading ? (
                  <div className="st-empty">Loading answers…</div>
                ) : !detail ? (
                  <div className="st-empty">Could not load the answers.</div>
                ) : (
                  detail.questions.map((q, i) => (
                    <div key={q.question_id} className="st-q">
                      <div className="st-q-head">
                        <span className="st-q-num">Q{i + 1}</span>
                        <span className="st-q-type">{q.type === 'coding' ? 'Coding' : 'MCQ'}</span>
                        <span className="st-q-marks">
                          {q.answered
                            ? (q.marks_awarded ?? 0)
                            : <span className="st-q-skip">not answered</span>} / {q.marks}
                        </span>
                      </div>
                      <div className="st-q-text">{q.question_text}</div>

                      {q.type === 'coding' ? (
                        q.code ? (
                          <>
                            <div className="st-code-bar">
                              <span>{q.language || 'code'}</span>
                              {q.code_grading === 'manual' && <span className="st-tag">manual review</span>}
                            </div>
                            <pre className="st-code">{q.code}</pre>
                          </>
                        ) : <div className="st-noanswer">No code submitted.</div>
                      ) : (
                        <div className="st-opts">
                          {(q.options || []).map((o) => {
                            const picked = o.id === q.selected_option_id;
                            const cls = o.is_correct ? 'correct' : picked ? 'wrong' : '';
                            return (
                              <div key={o.id} className={`st-opt ${cls} ${picked ? 'picked' : ''}`}>
                                <span className="st-opt-mark">{o.is_correct ? '✓' : picked ? '✕' : ''}</span>
                                <span>{o.text}</span>
                                {picked && <span className="st-opt-tag">their answer</span>}
                              </div>
                            );
                          })}
                          {!q.answered && <div className="st-noanswer">Not answered.</div>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

const styles = `
  .st-wrap { max-width: 1100px; margin: 0 auto; padding: 28px 24px 60px; font-family: 'DM Sans', system-ui, sans-serif; color: #0B1B3A; }
  .st-back { background: none; border: none; color: #475569; font-size: 14px; font-weight: 600; cursor: pointer; padding: 4px 0; margin-bottom: 14px; }
  .st-back:hover { color: #0B1B3A; }
  .st-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
  .st-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #E8A020; margin-bottom: 4px; }
  .st-title { font-size: 26px; font-weight: 800; margin: 0; color: #0B1B3A; line-height: 1.2; }
  .st-refresh { border: 1px solid #d8dee9; background: #fff; color: #334155; font-weight: 600; font-size: 14px; padding: 9px 18px; border-radius: 10px; cursor: pointer; }
  .st-refresh:hover { background: #f1f5f9; }
  .st-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 12px; margin-bottom: 18px; font-size: 14px; }
  .st-metrics { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 24px; }
  .st-metric { background: #fff; border: 1px solid #e7ecf3; border-radius: 14px; padding: 16px 14px; text-align: center; }
  .st-metric-val { font-size: 24px; font-weight: 800; color: #0B1B3A; line-height: 1; }
  .st-metric-lbl { font-size: 11.5px; color: #6b7891; margin-top: 6px; font-weight: 600; }
  .st-card { background: #fff; border: 1px solid #e7ecf3; border-radius: 18px; overflow: hidden; }
  .st-card-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #eef2f7; }
  .st-card-title { font-size: 17px; font-weight: 800; margin: 0; }
  .st-pill { background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
  .st-empty { padding: 44px 20px; text-align: center; color: #94a3b8; font-size: 14px; }
  .st-table-wrap { overflow-x: auto; }
  .st-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .st-table th { text-align: left; padding: 12px 22px; font-size: 11.5px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; font-weight: 700; border-bottom: 1px solid #eef2f7; }
  .st-table td { padding: 13px 22px; border-bottom: 1px solid #f3f6fa; vertical-align: middle; }
  .st-table tr:last-child td { border-bottom: none; }
  .st-table tbody tr:hover { background: #f8fafc; }
  .st-name { font-weight: 700; color: #0B1B3A; }
  .st-email { font-size: 12px; color: #94a3b8; }
  .st-pct { color: #64748b; font-size: 13px; }
  .st-badge { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 100px; white-space: nowrap; }
  .st-badge.ok { background: #dcfce7; color: #15803d; }
  .st-badge.no { background: #fee2e2; color: #b91c1c; }
  .st-badge.muted { background: #f1f5f9; color: #94a3b8; }
  .st-status { font-size: 12px; font-weight: 600; text-transform: capitalize; color: #64748b; }
  .st-status.completed { color: #15803d; }
  .st-date { font-size: 12.5px; color: #64748b; white-space: nowrap; }
  .st-view { border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 13px; padding: 7px 14px; border-radius: 9px; cursor: pointer; white-space: nowrap; }
  .st-view:hover { background: #e0e7ff; }
  .st-modal-backdrop { position: fixed; inset: 0; z-index: 1200; background: rgba(11,27,58,0.55); backdrop-filter: blur(2px); display: flex; align-items: flex-start; justify-content: center; padding: 28px 16px; overflow-y: auto; }
  .st-modal { background: #fff; width: 100%; max-width: 760px; border-radius: 18px; box-shadow: 0 24px 60px rgba(11,27,58,0.3); display: flex; flex-direction: column; max-height: calc(100vh - 56px); }
  .st-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 20px 24px; border-bottom: 1px solid #eef2f7; }
  .st-modal-name { font-size: 18px; font-weight: 800; color: #0B1B3A; }
  .st-modal-sub { font-size: 13px; color: #64748b; margin-top: 3px; }
  .st-x { border: none; background: #f1f5f9; color: #64748b; width: 34px; height: 34px; border-radius: 9px; cursor: pointer; font-size: 14px; flex-shrink: 0; }
  .st-x:hover { background: #e2e8f0; }
  .st-modal-body { padding: 18px 24px 24px; overflow-y: auto; }
  .st-q { border: 1px solid #eef2f7; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px; }
  .st-q-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .st-q-num { font-size: 12px; font-weight: 800; color: #fff; background: #4f46e5; padding: 2px 9px; border-radius: 7px; }
  .st-q-type { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #6b7891; }
  .st-q-marks { margin-left: auto; font-size: 13px; font-weight: 700; color: #0B1B3A; }
  .st-q-skip { color: #b91c1c; font-weight: 600; }
  .st-q-text { font-size: 14px; color: #1e293b; line-height: 1.5; margin-bottom: 10px; white-space: pre-wrap; }
  .st-code-bar { display: flex; align-items: center; justify-content: space-between; background: #1e293b; color: #cbd5e1; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: 7px 12px; border-radius: 9px 9px 0 0; }
  .st-tag { background: #f59e0b; color: #1c1206; padding: 1px 8px; border-radius: 6px; font-size: 10.5px; }
  .st-code { background: #0f172a; color: #e2e8f0; font-family: 'Fira Code', Consolas, monospace; font-size: 13px; line-height: 1.55; padding: 14px 16px; border-radius: 0 0 9px 9px; margin: 0; overflow-x: auto; white-space: pre; }
  .st-noanswer { font-size: 13px; color: #94a3b8; font-style: italic; padding: 6px 0; }
  .st-opts { display: flex; flex-direction: column; gap: 7px; }
  .st-opt { display: flex; align-items: center; gap: 10px; border: 1px solid #e7ecf3; border-radius: 9px; padding: 9px 12px; font-size: 13.5px; color: #1e293b; }
  .st-opt.correct { border-color: #86efac; background: #f0fdf4; }
  .st-opt.wrong { border-color: #fca5a5; background: #fef2f2; }
  .st-opt-mark { width: 16px; font-weight: 800; color: #15803d; }
  .st-opt.wrong .st-opt-mark { color: #b91c1c; }
  .st-opt-tag { margin-left: auto; font-size: 11px; font-weight: 700; color: #4338ca; background: #eef2ff; padding: 2px 8px; border-radius: 6px; }
  @media (max-width: 760px) { .st-metrics { grid-template-columns: repeat(3, 1fr); } }
`;
