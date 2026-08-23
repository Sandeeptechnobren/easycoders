'use client';

import { useState } from 'react';

const BASE = 'https://api.easycoders.in/api';

/**
 * Post-assessment feedback, shown immediately after submitting and BEFORE the
 * certificate is offered.
 *
 * Deliberately short. This appears seconds after someone has finished a timed,
 * fullscreen-locked test — one required question and three optional ones is
 * about all the goodwill available. A long form here gets answered carelessly
 * or abandoned, and abandoning it now means abandoning the certificate too.
 *
 * The gate itself is enforced server-side (exportCertificate returns 403 with
 * code `feedback_required`). This component is how a taker satisfies it, not
 * the thing that enforces it.
 */

type Props = {
  attemptId: number;
  /** Called once feedback is stored, so the parent can reveal the certificate. */
  onDone: () => void;
};

const DIFFICULTY = [
  { value: 'too_easy', label: 'Too easy' },
  { value: 'just_right', label: 'Just right' },
  { value: 'too_hard', label: 'Too hard' },
];

export default function AssessmentFeedback({ attemptId, onDone }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (rating === 0) {
      setError('Please choose a rating first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const token = localStorage.getItem('assessment_token');
      const res = await fetch(`${BASE}/assessment/attempts/${attemptId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          difficulty,
          would_recommend: recommend,
          comments: comments.trim() || null,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(j?.message || 'Could not save your feedback. Please try again.');
        return;
      }
      onDone();
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fb">
      <h2 className="fb-title">One last thing</h2>
      <p className="fb-sub">
        Tell us how that went — it takes a few seconds, and your certificate is ready right after.
      </p>

      <div className="fb-block">
        <label className="fb-label">
          How was your overall experience? <span className="fb-req">required</span>
        </label>
        <div
          className="fb-stars"
          role="radiogroup"
          aria-label="Overall experience, 1 to 5"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} out of 5`}
              className={`fb-star ${(hover || rating) >= n ? 'on' : ''}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => { setRating(n); setError(''); }}
            >
              <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
                <path
                  d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"
                  fill="currentColor"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="fb-block">
        <label className="fb-label">How difficult was it?</label>
        <div className="fb-chips">
          {DIFFICULTY.map((d) => (
            <button
              key={d.value}
              type="button"
              className={`fb-chip ${difficulty === d.value ? 'sel' : ''}`}
              aria-pressed={difficulty === d.value}
              onClick={() => setDifficulty(difficulty === d.value ? null : d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fb-block">
        <label className="fb-label">Would you recommend this assessment?</label>
        <div className="fb-chips">
          <button
            type="button"
            className={`fb-chip ${recommend === true ? 'sel' : ''}`}
            aria-pressed={recommend === true}
            onClick={() => setRecommend(recommend === true ? null : true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`fb-chip ${recommend === false ? 'sel' : ''}`}
            aria-pressed={recommend === false}
            onClick={() => setRecommend(recommend === false ? null : false)}
          >
            No
          </button>
        </div>
      </div>

      <div className="fb-block">
        <label className="fb-label" htmlFor="fb-comments">Anything you would change?</label>
        <textarea
          id="fb-comments"
          className="fb-text"
          rows={3}
          maxLength={1000}
          placeholder="Optional — question clarity, timing, difficulty, anything at all."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
        <span className="fb-count">{comments.length}/1000</span>
      </div>

      {error && <p className="fb-error">{error}</p>}

      <button type="button" className="fb-submit" disabled={busy} onClick={submit}>
        {busy ? 'Saving…' : 'Submit feedback and continue'}
      </button>
    </div>
  );
}
