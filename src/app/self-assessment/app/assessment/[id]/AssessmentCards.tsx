
'use client';
import './assessmentApp.css';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Assessment = {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  level?: string;
  status: 'published' | 'completed';
  // Per-user attempt + retake state (from listAssessments)
  attempted?: boolean;
  passed?: boolean;
  raw_score?: number | null;
  total_marks?: number;
  score_percent?: number | null;
  passing_score?: number;
  can_retake?: boolean;
  retake_available_at?: string | null;
};

const API_BASE = 'https://api.easycoders.in/projects/backend/public/api';

/* Format a remaining-time gap (ms) as a compact countdown. */
function fmtRemaining(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function AssessmentCards() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  /* Per-card error state. When a download fails (403 score-too-low,
   * 404 no-attempt, network, etc.) we surface the backend message
   * inline under the card instead of behind a one-shot alert(). */
  const [downloadErrors, setDownloadErrors] = useState<Record<number, string>>({});
  // Ticks every second so retake countdowns update live and the button flips
  // to an enabled "Retake" the moment the wait window elapses.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const assessment_token = localStorage.getItem('assessment_token');
    if (!assessment_token) {
      router.replace('/self-assessment/login');
      return;
    }

    api
      .get('/assessment/list', {
        headers: { Authorization: `Bearer ${assessment_token}` },
      })
      .then(res => setAssessments(res.data?.data || []))
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('assessment_token');
          router.replace('/self-assessment/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  /* ────────────────────────────────────────────────────────────────────
   * Certificate download.
   *
   * Rewritten May 2026 to fix three issues:
   *  1. Was using the global axios instance — whose request interceptor
   *     adds `Authorization: Bearer ${localStorage.token}` (MAIN app token).
   *     For users logged into BOTH the main site and EasyAssess, this
   *     overrode the manually-set `assessment_token` and sent the wrong
   *     credential → silent 401. Now uses plain fetch() with explicit
   *     headers, bypassing the interceptor entirely.
   *  2. Backend now streams the PDF as binary instead of returning a
   *     JSON `{download_url}` pointing at /storage/certificates/...
   *     (the old approach 404'd in production because no `storage:link`
   *     symlink exists). We accept either shape — Blob if Content-Type
   *     is application/pdf, JSON otherwise — for backward compatibility.
   *  3. Errors were swallowed behind a generic "Failed to fetch certificate"
   *     alert. Now we surface the backend's actual JSON `message` field
   *     verbatim and persist it under the card.
   * ──────────────────────────────────────────────────────────────────── */
  const handleDownload = async (assessmentId: number) => {
    setDownloadingId(assessmentId);
    setDownloadErrors(prev => {
      const next = { ...prev };
      delete next[assessmentId];
      return next;
    });

    try {
      const assessment_token = localStorage.getItem('assessment_token');
      if (!assessment_token) {
        setDownloadErrors(p => ({ ...p, [assessmentId]: 'You need to sign in again to download the certificate.' }));
        router.replace('/self-assessment/login');
        return;
      }

      const res = await fetch(`${API_BASE}/assessment/certificate/${assessmentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${assessment_token}`,
          Accept: 'application/pdf, application/json',
        },
      });

      const contentType = res.headers.get('content-type') || '';

      /* ─── Non-2xx → surface the backend's JSON `message` ─── */
      if (!res.ok) {
        let msg = 'Could not download the certificate.';
        if (contentType.includes('application/json')) {
          try {
            const body = await res.json();
            if (body?.message) msg = String(body.message);
          } catch { /* not JSON after all */ }
        }
        if (res.status === 401) {
          localStorage.removeItem('assessment_token');
          router.replace('/self-assessment/login');
          return;
        }
        setDownloadErrors(p => ({ ...p, [assessmentId]: msg }));
        return;
      }

      /* ─── 2xx PDF stream → trigger download via anchor click ─── */
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const code = res.headers.get('x-certificate-code') || String(assessmentId);
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `easycoders-certificate-${code}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Free the object URL on the next tick so the browser has time to start the download.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }

      /* ─── 2xx JSON fallback (legacy backend shape) ─── */
      if (contentType.includes('application/json')) {
        const body = await res.json();
        if (body?.status === 'success' && body?.download_url) {
          window.open(body.download_url, '_blank', 'noopener,noreferrer');
          return;
        }
        setDownloadErrors(p => ({
          ...p,
          [assessmentId]: body?.message || 'Certificate is not ready yet. Please try again in a moment.',
        }));
        return;
      }

      /* ─── 2xx but unknown content type ─── */
      setDownloadErrors(p => ({ ...p, [assessmentId]: 'Unexpected response from server. Please try again.' }));
    } catch (error) {
      console.error('Certificate download error:', error);
      setDownloadErrors(p => ({
        ...p,
        [assessmentId]: 'Network error — please check your connection and try again.',
      }));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '15px' }}>
      Loading assessments…
    </div>
  );
  if (!assessments.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280', fontSize: '15px' }}>
      No active assessments available.
    </div>
  );

  return (
    <>
      <div className="assessmentGrid">
        {assessments.slice(0, visibleCount).map(item => {
          const isCompleted = item.status === 'completed';
          const downloadError = downloadErrors[item.id];
          const passed = !!item.passed;
          const retakeAt = item.retake_available_at ? new Date(item.retake_available_at).getTime() : null;
          // Eligible if the server said so, or the wait window has since elapsed (live).
          const canRetakeNow = !!item.can_retake || (retakeAt != null && now >= retakeAt);
          const countdown = retakeAt != null ? fmtRemaining(retakeAt - now) : '';

          return (
           <div key={item.id} className={`assessmentCard ${isCompleted ? 'completed' : ''}`}>

  {/* STATUS BADGE */}
  <div className={`statusBadge ${isCompleted ? 'done' : 'active'}`}>
    {isCompleted ? 'Completed' : 'Active'}
  </div>

  <h3>{item.title}</h3>

  <p className="assessmentDesc">
    {item.description || 'No description available.'}
  </p>

  <div className="assessmentMeta">
    {item.level && <span>🎯 {item.level}</span>}
    {item.duration && <span>⏱ {item.duration} mins</span>}
  </div>

  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', width: '100%' }}>
    {!isCompleted ? (
      <button
        className="startBtn"
        onClick={() => router.push(`/self-assessment/app/assessment/${item.id}`)}
        style={{ flex: 1, height: '38px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', cursor: 'pointer' }}
      >
        Start
      </button>
    ) : (
      <>
        <button className="startBtn" disabled
          style={{ flex: 1, height: '38px', background: '#9ca3af', color: '#fff', cursor: 'not-allowed' }}>
          Attempted
        </button>

        {passed ? (
          /* Passed → download the certificate. */
          <button
            onClick={() => handleDownload(item.id)}
            disabled={downloadingId === item.id}
            className="startBtn"
            style={{ flex: 1, height: '38px', background: '#22c55e', color: '#fff', cursor: downloadingId === item.id ? 'wait' : 'pointer' }}
          >
            {downloadingId === item.id ? 'Preparing…' : 'Download certificate'}
          </button>
        ) : canRetakeNow ? (
          /* Failed and the wait has elapsed → allow a retake. */
          <button
            onClick={() => router.push(`/self-assessment/app/assessment/${item.id}`)}
            className="startBtn"
            style={{ flex: 1, height: '38px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', cursor: 'pointer' }}
          >
            Retake assessment →
          </button>
        ) : (
          /* Failed but still inside the retake-wait window → live countdown,
             disabled (no certificate, no early retake). */
          <button
            disabled
            className="startBtn"
            style={{ flex: 1, height: '38px', background: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed' }}
            title={item.retake_available_at ? `Retake unlocks at ${new Date(item.retake_available_at).toLocaleString()}` : undefined}
          >
            Retake in {countdown}
          </button>
        )}
      </>
    )}
  </div>

  {/* Score summary for a completed-but-failed attempt (so the user knows
      where they stand without clicking anything). */}
  {isCompleted && !passed && item.score_percent != null && (
    <div role="status" style={{ marginTop: '10px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '12px', lineHeight: 1.5 }}>
      You scored <strong>{item.score_percent}%</strong> ({item.raw_score}/{item.total_marks}). You need <strong>{item.passing_score ?? 70}%</strong> to earn a certificate.
      {!canRetakeNow && countdown ? <> Retake available in <strong>{countdown}</strong>.</> : <> You can retake it now.</>}
    </div>
  )}

  {/* Certificate download error (only relevant on the passed → download path). */}
  {downloadError && (
    <div
      id={`cert-err-${item.id}`}
      role="alert"
      style={{ marginTop: '10px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '12px', lineHeight: 1.5 }}
    >
      {downloadError}
    </div>
  )}
</div>
          );
        })}
      </div>

      {visibleCount < assessments.length && (
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <button className="loadMoreBtn" onClick={() => setVisibleCount(v => v + 8)}>
            Load More
          </button>
        </div>
      )}
    </>
  );
}
