'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/api';

/* ──────────────────────────────────────────────────────────────────────────
 * Student feedback for one assessment.
 *
 * Opened from the Feedback action on an assessment card. The SUMMARY leads,
 * because that is what an admin acts on — one angry one-star comment is noise,
 * an average of 2.1 across forty responses is a problem with the paper.
 *
 * The average comes from the server across ALL rows, not from the loaded page:
 * computing it client-side would silently report the average of whatever
 * twenty rows happened to be visible.
 * ────────────────────────────────────────────────────────────────────────── */

type Item = {
  id: number;
  rating: number;
  difficulty: string | null;
  would_recommend: boolean | null;
  comments: string | null;
  created_at: string | null;
  student: { name: string; email: string | null };
  attempt: { id: number; score: number | null; completed_at: string | null };
};

type Summary = {
  responses: number;
  average_rating: number;
  rating_breakdown: Record<string, number>;
  difficulty: Record<string, number>;
  recommend_yes: number;
  recommend_no: number;
  with_comments: number;
};

type Payload = {
  assessment: { id: number; title: string; total_marks: number | null };
  summary: Summary;
  items: Item[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

const DIFF_LABEL: Record<string, string> = {
  too_easy: 'Too easy',
  just_right: 'Just right',
  too_hard: 'Too hard',
};

const Stars = ({ n }: { n: number }) => (
  <span className="fbm-stars" aria-label={`${n} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className={i <= n ? 'on' : ''}>★</span>
    ))}
  </span>
);

export default function AssessmentFeedbackModal({
  assessmentId,
  title,
  onClose,
}: {
  assessmentId: number;
  title: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [commentsOnly, setCommentsOnly] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ page: String(page), per_page: '20' });
      if (rating) qs.set('rating', String(rating));
      if (commentsOnly) qs.set('with_comments', '1');
      const json = await fetchWithAuth(`${BASE}/assessment/admin/${assessmentId}/feedback?${qs}`);
      setData(json?.data ?? null);
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'Unauthorized'
          ? 'Your session expired, or you lack permission to view feedback.'
          : e instanceof Error ? e.message : 'Could not load feedback.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assessmentId, page, rating, commentsOnly]);

  useEffect(() => { load(); }, [load]);

  /* Escape closes, like every other modal on this page. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const s = data?.summary;
  const maxBar = s ? Math.max(1, ...Object.values(s.rating_breakdown)) : 1;

  return (
    <div className="fbm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fbm-card" role="dialog" aria-modal="true" aria-label={`Feedback for ${title}`}>
        <div className="fbm-head">
          <div>
            <div className="fbm-eyebrow">Student feedback</div>
            <h3 className="fbm-title">{title}</h3>
          </div>
          <button type="button" className="fbm-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="fbm-body">
          {error && <div className="fbm-error">{error}</div>}

          {loading && !data ? (
            <p className="fbm-muted">Loading feedback…</p>
          ) : s && s.responses === 0 && !rating && !commentsOnly ? (
            <div className="fbm-empty">
              <p className="fbm-empty-t">No feedback yet</p>
              <p className="fbm-muted">
                Students are asked for feedback right after they submit this assessment, before
                their certificate is issued. Responses will appear here.
              </p>
            </div>
          ) : s ? (
            <>
              {/* ── Summary ─────────────────────────────────────────── */}
              <div className="fbm-summary">
                <div className="fbm-avg">
                  <div className="fbm-avg-num">{s.average_rating || '—'}</div>
                  <Stars n={Math.round(s.average_rating)} />
                  <div className="fbm-muted fbm-sm">{s.responses} response{s.responses === 1 ? '' : 's'}</div>
                </div>

                <div className="fbm-bars">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = s.rating_breakdown[String(star)] ?? 0;
                    return (
                      <div key={star} className="fbm-bar-row">
                        <span className="fbm-bar-lbl">{star}★</span>
                        <span className="fbm-bar-track">
                          <span className="fbm-bar-fill" style={{ width: `${(count / maxBar) * 100}%` }} />
                        </span>
                        <span className="fbm-bar-n">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="fbm-facts">
                  <div className="fbm-fact">
                    <span className="fbm-fact-lbl">Difficulty</span>
                    <span className="fbm-fact-val">
                      {(['too_easy', 'just_right', 'too_hard'] as const)
                        .filter((k) => (s.difficulty[k] ?? 0) > 0)
                        .map((k) => `${DIFF_LABEL[k]} ${s.difficulty[k]}`)
                        .join(' · ') || '—'}
                    </span>
                  </div>
                  <div className="fbm-fact">
                    <span className="fbm-fact-lbl">Would recommend</span>
                    <span className="fbm-fact-val">
                      {s.recommend_yes + s.recommend_no === 0
                        ? '—'
                        : `${Math.round((s.recommend_yes / (s.recommend_yes + s.recommend_no)) * 100)}% (${s.recommend_yes} of ${s.recommend_yes + s.recommend_no})`}
                    </span>
                  </div>
                  <div className="fbm-fact">
                    <span className="fbm-fact-lbl">With comments</span>
                    <span className="fbm-fact-val">{s.with_comments}</span>
                  </div>
                </div>
              </div>

              {/* ── Filters ─────────────────────────────────────────── */}
              <div className="fbm-filters">
                <button
                  type="button"
                  className={`fbm-chip ${rating === null ? 'sel' : ''}`}
                  onClick={() => { setRating(null); setPage(1); }}
                >
                  All ratings
                </button>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`fbm-chip ${rating === star ? 'sel' : ''}`}
                    onClick={() => { setRating(rating === star ? null : star); setPage(1); }}
                  >
                    {star}★
                  </button>
                ))}
                <button
                  type="button"
                  className={`fbm-chip ${commentsOnly ? 'sel' : ''}`}
                  onClick={() => { setCommentsOnly(!commentsOnly); setPage(1); }}
                >
                  With comments only
                </button>
              </div>

              {/* ── Responses ───────────────────────────────────────── */}
              {data && data.items.length === 0 ? (
                <p className="fbm-muted">No responses match that filter.</p>
              ) : (
                <ul className="fbm-list">
                  {data?.items.map((f) => (
                    <li key={f.id} className="fbm-item">
                      <div className="fbm-item-top">
                        <Stars n={f.rating} />
                        <span className="fbm-item-who">
                          {f.student.name}
                          {f.student.email ? <span className="fbm-muted"> · {f.student.email}</span> : null}
                        </span>
                        <span className="fbm-item-date">{f.created_at?.slice(0, 16) ?? ''}</span>
                      </div>
                      <div className="fbm-item-tags">
                        {f.difficulty && <span className="fbm-tag">{DIFF_LABEL[f.difficulty] ?? f.difficulty}</span>}
                        {f.would_recommend !== null && (
                          <span className={`fbm-tag ${f.would_recommend ? 'yes' : 'no'}`}>
                            {f.would_recommend ? 'Would recommend' : 'Would not recommend'}
                          </span>
                        )}
                        {f.attempt.score !== null && (
                          <span className="fbm-tag">Scored {f.attempt.score}{data?.assessment.total_marks ? ` / ${data.assessment.total_marks}` : ''}</span>
                        )}
                      </div>
                      {f.comments && <p className="fbm-item-comment">{f.comments}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {data && data.pagination.last_page > 1 && (
                <div className="fbm-pager">
                  <button type="button" className="fbm-chip" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                  <span className="fbm-muted fbm-sm">Page {data.pagination.current_page} of {data.pagination.last_page}</span>
                  <button type="button" className="fbm-chip" disabled={page >= data.pagination.last_page} onClick={() => setPage(page + 1)}>Next</button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
