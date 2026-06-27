'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Attempt = {
  attempt_id: number; score: number; total_marks: number;
  percent: number; qualified: boolean; completed_at: string | null;
};
type Result = {
  assessment_id: number; title: string; passing_score: number; total_marks: number;
  best_percent: number; best_score: number; has_certificate: boolean;
  last_attempt_at: string | null; attempts_count: number; qualified: boolean; attempts: Attempt[];
};
type Summary = { appeared: number; qualified: number; avg_percent: number; best_percent: number };

const fmtDate = (s?: string | null) =>
  s ? new Date(s.replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function MyResultsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('assessment_token');
    fetch(`${BASE}/assessment/my-results`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d?.status) { setSummary(d.summary || null); setResults(Array.isArray(d.data) ? d.data : []); }
        else setErr(d?.message || 'Could not load your results.');
      })
      .catch(() => setErr('Could not load your results.'))
      .finally(() => setLoading(false));
  }, []);

  const downloadCert = async (assessmentId: number) => {
    setDownloading(assessmentId);
    try {
      const token = localStorage.getItem('assessment_token');
      const res = await fetch(`${BASE}/assessment/certificate/${assessmentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        alert(j?.message || 'Certificate is not available for this assessment.');
        return;
      }
      const cd = res.headers.get('content-disposition') || '';
      const m = cd.match(/filename="?([^"]+)"?/);
      const name = m ? m[1] : `certificate-${assessmentId}.pdf`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download the certificate. Please try again.');
    } finally { setDownloading(null); }
  };

  const metric = (label: string, value: React.ReactNode) => (
    <div className="mr-metric"><div className="mr-metric-val">{value}</div><div className="mr-metric-lbl">{label}</div></div>
  );

  return (
    <div className="mr-wrap">
      <style>{styles}</style>

      <div className="mr-head">
        <div>
          <div className="mr-eyebrow">Your performance</div>
          <h1 className="mr-title">My Results</h1>
          <p className="mr-sub">Every assessment you&apos;ve appeared in, with your scores.</p>
        </div>
      </div>

      {summary && (
        <div className="mr-metrics">
          {metric('Appeared', summary.appeared)}
          {metric('Qualified', summary.qualified)}
          {metric('Average', `${summary.avg_percent}%`)}
          {metric('Best', `${summary.best_percent}%`)}
        </div>
      )}

      {err && <div className="mr-error">{err}</div>}

      {loading ? (
        <div className="mr-empty">Loading your results…</div>
      ) : results.length === 0 ? (
        <div className="mr-empty">
          You haven&apos;t completed any assessments yet.
          <div style={{ marginTop: 12 }}><Link href="/self-assessment/app" className="mr-link-btn">Browse assessments →</Link></div>
        </div>
      ) : (
        <div className="mr-list">
          {results.map((r) => {
            const open = expanded === r.assessment_id;
            return (
              <div key={r.assessment_id} className="mr-card">
                <div className="mr-card-main">
                  <div className="mr-card-info">
                    <div className="mr-card-title">{r.title}</div>
                    <div className="mr-card-meta">
                      {r.attempts_count} attempt{r.attempts_count === 1 ? '' : 's'} · last on {fmtDate(r.last_attempt_at)} · pass mark {r.passing_score}%
                    </div>
                  </div>
                  <div className="mr-card-score">
                    <div className="mr-score-val">{r.best_score}<span className="mr-score-tot">/{r.total_marks}</span></div>
                    <div className="mr-score-pct">{r.best_percent}% best</div>
                  </div>
                  <div className="mr-card-side">
                    <span className={`mr-badge ${r.qualified ? 'ok' : 'no'}`}>{r.qualified ? 'Qualified' : 'Not qualified'}</span>
                    <div className="mr-card-actions">
                      {r.qualified && (
                        <button className="mr-cert" disabled={downloading === r.assessment_id} onClick={() => downloadCert(r.assessment_id)}>
                          {downloading === r.assessment_id ? 'Preparing…' : 'Certificate'}
                        </button>
                      )}
                      {r.attempts_count > 1 && (
                        <button className="mr-toggle" onClick={() => setExpanded(open ? null : r.assessment_id)}>
                          {open ? 'Hide attempts' : 'All attempts'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {open && r.attempts_count > 1 && (
                  <div className="mr-attempts">
                    {r.attempts.map((a, i) => (
                      <div key={a.attempt_id} className="mr-attempt">
                        <span className="mr-attempt-no">Attempt {r.attempts.length - i}</span>
                        <span className="mr-attempt-score">{a.score}/{a.total_marks} ({a.percent}%)</span>
                        <span className={`mr-attempt-res ${a.qualified ? 'ok' : 'no'}`}>{a.qualified ? 'Qualified' : 'Not qualified'}</span>
                        <span className="mr-attempt-date">{fmtDate(a.completed_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .mr-wrap { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f1f5f9; min-height: 100vh; padding: 30px 24px 56px; max-width: 980px; margin: 0 auto; }
  .mr-head { margin-bottom: 20px; }
  .mr-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #7c3aed; margin-bottom: 4px; }
  .mr-title { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; }
  .mr-sub { font-size: 14px; color: #64748b; margin: 4px 0 0; }
  .mr-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
  .mr-metric { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 14px; text-align: center; }
  .mr-metric-val { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1; }
  .mr-metric-lbl { font-size: 11.5px; color: #94a3b8; font-weight: 600; margin-top: 6px; }
  .mr-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; font-size: 14px; }
  .mr-empty { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 44px 20px; text-align: center; color: #64748b; font-size: 14px; }
  .mr-link-btn { display: inline-block; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; font-weight: 700; font-size: 13px; padding: 9px 18px; border-radius: 10px; text-decoration: none; }
  .mr-list { display: flex; flex-direction: column; gap: 12px; }
  .mr-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .mr-card-main { display: flex; align-items: center; gap: 16px; padding: 16px 18px; flex-wrap: wrap; }
  .mr-card-info { flex: 1; min-width: 180px; }
  .mr-card-title { font-size: 15.5px; font-weight: 700; color: #0f172a; }
  .mr-card-meta { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .mr-card-score { text-align: center; min-width: 84px; }
  .mr-score-val { font-size: 24px; font-weight: 800; color: #4f46e5; line-height: 1; }
  .mr-score-tot { font-size: 14px; color: #94a3b8; font-weight: 600; }
  .mr-score-pct { font-size: 11.5px; color: #64748b; margin-top: 3px; font-weight: 600; }
  .mr-card-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
  .mr-badge { font-size: 11.5px; font-weight: 700; padding: 3px 11px; border-radius: 100px; white-space: nowrap; }
  .mr-badge.ok { background: #dcfce7; color: #15803d; }
  .mr-badge.no { background: #fee2e2; color: #b91c1c; }
  .mr-card-actions { display: flex; gap: 8px; }
  .mr-cert { border: 1px solid #c7d2fe; background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 12.5px; padding: 6px 13px; border-radius: 9px; cursor: pointer; }
  .mr-cert:hover { background: #e0e7ff; } .mr-cert:disabled { opacity: .6; cursor: not-allowed; }
  .mr-toggle { border: 1px solid #e2e8f0; background: #fff; color: #475569; font-weight: 600; font-size: 12.5px; padding: 6px 13px; border-radius: 9px; cursor: pointer; }
  .mr-toggle:hover { background: #f1f5f9; }
  .mr-attempts { border-top: 1px solid #eef2f7; background: #f8fafc; padding: 8px 18px 12px; }
  .mr-attempt { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eef2f7; font-size: 13px; flex-wrap: wrap; }
  .mr-attempt:last-child { border-bottom: none; }
  .mr-attempt-no { font-weight: 700; color: #475569; min-width: 84px; }
  .mr-attempt-score { color: #0f172a; font-weight: 600; min-width: 110px; }
  .mr-attempt-res { font-size: 11.5px; font-weight: 700; padding: 2px 9px; border-radius: 100px; }
  .mr-attempt-res.ok { background: #dcfce7; color: #15803d; } .mr-attempt-res.no { background: #fee2e2; color: #b91c1c; }
  .mr-attempt-date { margin-left: auto; color: #94a3b8; font-size: 12px; }
  @media (max-width: 640px) { .mr-metrics { grid-template-columns: repeat(2, 1fr); } .mr-card-side { align-items: flex-start; width: 100%; } }
`;
