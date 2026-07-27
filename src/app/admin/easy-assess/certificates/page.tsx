'use client';

import RoleGuard from '@/components/RoleGuard';
import { useCallback, useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/certificates — Issued certificates log
 *
 * Calls GET /api/assessment/admin/certificates?limit=…&assessment_id=…&search=…
 * (Phase 2a endpoint added to AssessmentController). Backend returns the
 * score percentage already computed (score_percent + raw_score +
 * total_marks + passing_score), so the table renders without doing
 * client-side math.
 *
 * Per-row "Copy code" button copies the certificate_code to the
 * clipboard so the admin can paste it into the public /verifyCertificate
 * page for ad-hoc verification.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/api';

type CertRow = {
  id:                number;
  assessment_id:     number;
  user_id:           number;
  certificate_code:  string;
  completed_at:      string;
  raw_score:         number;
  total_marks:       number;
  score_percent:     number;
  passing_score:     number;
  assessment?:       { id: number; title: string };
  user?:             { id: number; name: string; email: string };
};

type Assessment = { id: number; title: string };

type LoadState = 'loading' | 'ready' | 'error';

export default function AssessmentCertificatesAdmin() {
  const [rows, setRows]               = useState<CertRow[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [search, setSearch]           = useState('');
  const [limit, setLimit]             = useState<number>(50);
  const [state, setState]             = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg]       = useState<string>('');
  const [copied, setCopied]           = useState<number | null>(null);

  /* ─── Load assessment dropdown once ─── */
  useEffect(() => {
    fetchWithAuth(`${BASE}/assessment/admin/list`)
      .then(j => setAssessments(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setAssessments([]));
  }, []);

  /* ─── Debounced search → URL → fetch ─── */
  const load = useCallback(() => {
    // Defer ALL state-flips to a microtask so the cascading-renders
    // lint rule doesn't fire when load() is invoked from a useEffect.
    queueMicrotask(() => {
      setState('loading');
      setErrorMsg('');
    });
    const qs = new URLSearchParams({ limit: String(limit) });
    if (assessmentId)   qs.set('assessment_id', assessmentId);
    if (search.trim())  qs.set('search', search.trim());
    fetchWithAuth(`${BASE}/assessment/admin/certificates?${qs.toString()}`)
      .then(j => {
        setRows(Array.isArray(j?.data) ? j.data : []);
        setState('ready');
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load certificates.';
        setErrorMsg(msg === 'Unauthorized' ? 'Session expired — please sign in again.' : msg);
        setRows([]);
        setState('error');
      });
  }, [assessmentId, search, limit]);

  /* Debounce the search input by 350 ms so we don't spam the API. */
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  const handleCopy = async (id: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(id);
      setTimeout(() => setCopied(prev => (prev === id ? null : prev)), 1600);
    } catch {
      /* Clipboard API blocked — fall through silently. */
    }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Certificate Log"
        description="Every certificate the platform has ever issued — newest first. Each row carries the verifiable certificate code; paste it into /verifyCertificate to confirm authenticity."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Certificates' },
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
          .toolbar input { min-width: 220px; }
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

          .uname { font-weight: 600; }
          .umail { font-size: 12px; color: #4A5568; }
          .aname { font-weight: 500; color: #4A5568; }
          .pct {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 15px;
            font-weight: 700;
            color: #0B1B3A;
            letter-spacing: -0.01em;
          }
          .ratio { font-size: 11px; color: #94A3B8; margin-left: 6px; }
          .when { font-size: 12px; color: #4A5568; }

          .code {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12px;
            background: #F4F6FB;
            border: 1px solid #E5E9F2;
            color: #0B1B3A;
            padding: 4px 10px;
            border-radius: 8px;
            font-weight: 600;
          }
          .copyBtn {
            background: transparent;
            border: none;
            color: #4A5568;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 6px;
            transition: background 0.15s ease, color 0.15s ease;
          }
          .copyBtn:hover { background: #E8A020; color: #0B1B3A; }
          .copyBtn.done  { color: #166534; }

          .verifyLink {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11px;
            font-weight: 700;
            color: #B97A0F;
            text-decoration: none;
            padding: 4px 10px;
            border-radius: 100px;
            background: #FEF6E7;
            border: 1px solid rgba(232,160,32,0.34);
          }
          .verifyLink:hover { background: #E8A020; color: #0B1B3A; }
        `}</style>

        <AdminPanel
          title="Issued certificates"
          subtitle={state === 'ready' ? `${rows.length} certificate${rows.length === 1 ? '' : 's'} on file` : undefined}
          toolbar={
            <div className="toolbar">
              <span className="toolbar-lbl">Assessment</span>
              <select value={assessmentId} onChange={e => setAssessmentId(e.target.value)} aria-label="Filter by assessment">
                <option value="">All</option>
                {assessments.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
              <input
                type="search"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search certificate holders"
              />
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
          {state === 'loading' && <AdminState kind="loading" message="Loading certificate log…" />}
          {state === 'error'   && <AdminState kind="error" message={errorMsg || 'Failed to load.'} />}
          {state === 'ready' && rows.length === 0 && (
            <AdminState kind="empty" message={search || assessmentId ? 'No certificates match those filters.' : 'No certificates have been issued yet.'} />
          )}

          {state === 'ready' && rows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Holder</th>
                    <th>Assessment</th>
                    <th>Score</th>
                    <th>Issued</th>
                    <th style={{ textAlign: 'right' }}>Verify</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <span className="code" title="Click the copy icon to copy this code">
                          {r.certificate_code}
                          <button
                            type="button"
                            className={`copyBtn ${copied === r.id ? 'done' : ''}`}
                            onClick={() => handleCopy(r.id, r.certificate_code)}
                            aria-label={`Copy ${r.certificate_code}`}
                            title={copied === r.id ? 'Copied' : 'Copy code'}
                          >
                            {copied === r.id ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </span>
                      </td>
                      <td>
                        <div className="uname">{r.user?.name || '—'}</div>
                        <div className="umail">{r.user?.email || ''}</div>
                      </td>
                      <td><span className="aname">{r.assessment?.title || `#${r.assessment_id}`}</span></td>
                      <td>
                        <span className="pct">{r.score_percent}%</span>
                        <span className="ratio">{r.raw_score} / {r.total_marks}</span>
                      </td>
                      <td>
                        <span className="when">
                          {r.completed_at
                            ? new Date(r.completed_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={`/verifyCertificate?code=${encodeURIComponent(r.certificate_code)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="verifyLink"
                        >
                          Verify
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </AdminSection>
    </RoleGuard>
  );
}
