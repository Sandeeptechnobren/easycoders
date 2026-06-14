'use client';

import RoleGuard from '@/components/RoleGuard';
import { useCallback, useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/code-review — Coding submission review (hybrid grading)
 *
 * Lists every coding answer for the chosen assessment. Auto-graded answers
 * arrive with a provisional score + per-test results; open / free-form answers
 * arrive ungraded. Pick a submission to read the code, see the auto result and
 * set / override the marks — which recomputes that attempt's total score.
 *
 *   GET  /api/assessment/admin/coding-submissions?assessment_id=…
 *   POST /api/assessment/admin/coding-submissions/{answerId}/grade { marks_awarded }
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type RunCase = { id: number; hidden: boolean; passed: boolean; weight: number };
type RunMeta = {
  status?: string;
  reason?: string;
  language?: string;
  passed_count?: number;
  total_count?: number;
  cases?: RunCase[];
};
type Submission = {
  answer_id: number;
  attempt_id: number;
  question_id: number;
  question_text: string;
  marks: number;
  code_grading: 'auto' | 'manual';
  code: string | null;
  language: string | null;
  marks_awarded: number | null;
  is_correct: boolean | null;
  review_status: string | null;
  run_meta: RunMeta | null;
  completed_at: string | null;
  student: { id: number; name: string; email: string } | null;
};
type Assessment = { id: number; title: string };
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const statusMeta: Record<string, { label: string; cls: string }> = {
  reviewed:       { label: 'Reviewed',       cls: 'st-green' },
  auto_graded:    { label: 'Auto-graded',    cls: 'st-blue' },
  pending_review: { label: 'Needs review',   cls: 'st-amber' },
};

export default function CodeReviewAdmin() {
  const [assessments, setAssessments]   = useState<Assessment[]>([]);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [rows, setRows]                 = useState<Submission[]>([]);
  const [state, setState]               = useState<LoadState>('idle');
  const [errorMsg, setErrorMsg]         = useState('');
  const [selected, setSelected]         = useState<Submission | null>(null);
  const [markInput, setMarkInput]       = useState('');
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState('');

  useEffect(() => {
    fetchWithAuth(`${BASE}/assessment/admin/list`)
      .then(j => setAssessments(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setAssessments([]));
  }, []);

  const load = useCallback(() => {
    if (!assessmentId) { setRows([]); setState('idle'); setSelected(null); return; }
    setState('loading'); setErrorMsg(''); setSelected(null);
    fetchWithAuth(`${BASE}/assessment/admin/coding-submissions?assessment_id=${assessmentId}`)
      .then(j => { setRows(Array.isArray(j?.data) ? j.data : []); setState('ready'); })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : 'Failed to load submissions.');
        setRows([]); setState('error');
      });
  }, [assessmentId]);

  useEffect(() => { load(); }, [load]);

  const openReview = (s: Submission) => {
    setSelected(s);
    setMarkInput(s.marks_awarded != null ? String(s.marks_awarded) : '');
    setSaveMsg('');
  };

  const saveGrade = async () => {
    if (!selected) return;
    const val = Number(markInput);
    if (Number.isNaN(val) || val < 0 || val > selected.marks) {
      setSaveMsg(`Enter a mark between 0 and ${selected.marks}.`);
      return;
    }
    setSaving(true); setSaveMsg('');
    try {
      const j = await fetchWithAuth(`${BASE}/assessment/admin/coding-submissions/${selected.answer_id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks_awarded: val }),
      });
      setSaveMsg(`Saved. Attempt score is now ${j?.data?.attempt_score ?? '—'}.`);
      // Reflect the change locally + refresh the list.
      setRows(prev => prev.map(r => r.answer_id === selected.answer_id
        ? { ...r, marks_awarded: val, review_status: 'reviewed' } : r));
      setSelected(s => s ? { ...s, marks_awarded: val, review_status: 'reviewed' } : s);
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Failed to save.');
    } finally { setSaving(false); }
  };

  const pending = rows.filter(r => (r.review_status ?? '') === 'pending_review').length;

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Code Review"
        description="Review and score coding answers. Auto-graded answers come pre-scored from the test cases; open / free-form answers come in ungraded. Set or override the marks here — it recomputes the student's attempt score."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Code Review' },
        ]}
      >
        <style jsx>{`
          .toolbar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
          .toolbar select {
            background: #fff; border: 1px solid #E5E9F2; border-radius: 10px; padding: 8px 12px;
            font-family: inherit; font-size: 13px; color: #0B1B3A; outline: none; min-width: 240px;
          }
          .toolbar select:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.16); }
          .toolbar-lbl { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94A3B8; padding: 12px 14px; border-bottom: 1px solid #E5E9F2; }
          tbody td { padding: 12px 14px; border-bottom: 1px solid #F1F4F9; color: #0B1B3A; vertical-align: middle; }
          tbody tr:hover td { background: #F8FAFD; }
          .uname { font-weight: 600; }
          .umail { font-size: 12px; color: #4A5568; }
          .qtext { color: #4A5568; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .lang { font-family: ui-monospace, monospace; font-size: 12px; background: #F4F6FB; border: 1px solid #E5E9F2; padding: 2px 8px; border-radius: 6px; }
          .marks { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; }
          .st { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; letter-spacing: 0.03em; }
          .st-green { background: #DCFCE7; color: #166534; }
          .st-blue  { background: #DBEAFE; color: #1D4ED8; }
          .st-amber { background: #FEF3C7; color: #92660D; }
          .st-gray  { background: #F1F5F9; color: #64748B; }
          .reviewBtn { background: #0B1B3A; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
          .reviewBtn:hover { background: #E8A020; color: #0B1B3A; }

          .detail { border: 1px solid #E5E9F2; border-radius: 14px; padding: 18px; margin-bottom: 18px; background: #FAFBFD; }
          .detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
          .detail-q { font-size: 14px; color: #0B1B3A; font-weight: 600; white-space: pre-wrap; }
          .closeX { background: transparent; border: none; cursor: pointer; color: #94A3B8; font-size: 20px; line-height: 1; }
          .cases { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
          .case { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; }
          .case.pass { background: #DCFCE7; color: #166534; }
          .case.fail { background: #FEE2E2; color: #991B1B; }
          .codeBox { background: #0b1020; color: #e2e8f0; border-radius: 10px; padding: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; white-space: pre-wrap; word-break: break-word; max-height: 360px; overflow: auto; margin: 6px 0 14px; }
          .gradeRow { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
          .gradeRow input { width: 110px; border: 1px solid #E5E9F2; border-radius: 8px; padding: 8px 10px; font-size: 14px; }
          .gradeRow input:focus { outline: none; border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.16); }
          .saveBtn { background: #166534; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; }
          .saveBtn:disabled { opacity: 0.6; cursor: not-allowed; }
          .saveMsg { font-size: 13px; color: #4A5568; }
        `}</style>

        <AdminPanel
          title="Coding submissions"
          subtitle={state === 'ready' ? `${rows.length} submission${rows.length === 1 ? '' : 's'}${pending ? ` · ${pending} need review` : ''}` : undefined}
          toolbar={
            <div className="toolbar">
              <span className="toolbar-lbl">Assessment</span>
              <select value={assessmentId} onChange={e => setAssessmentId(e.target.value)} aria-label="Choose assessment">
                <option value="">— Select an assessment —</option>
                {assessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          }
        >
          {/* Review detail */}
          {selected && (
            <div className="detail">
              <div className="detail-head">
                <div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {selected.student?.name || '—'} · {selected.student?.email || ''} · <span className="lang">{selected.language || 'unknown'}</span> · {selected.code_grading === 'manual' ? 'Open / free-form' : 'Auto-graded'}
                  </div>
                  <div className="detail-q">{selected.question_text}</div>
                </div>
                <button className="closeX" onClick={() => setSelected(null)} aria-label="Close">×</button>
              </div>

              {selected.run_meta?.cases && selected.run_meta.cases.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: '#4A5568' }}>
                    Auto result: <strong>{selected.run_meta.passed_count ?? 0}/{selected.run_meta.total_count ?? selected.run_meta.cases.length}</strong> test cases passed
                  </div>
                  <div className="cases">
                    {selected.run_meta.cases.map((c, i) => (
                      <span key={c.id ?? i} className={`case ${c.passed ? 'pass' : 'fail'}`}>
                        Case {i + 1}{c.hidden ? ' (hidden)' : ''}: {c.passed ? '✓' : '✗'}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {selected.run_meta?.reason === 'execution_unavailable' && (
                <div style={{ fontSize: 12, color: '#92660D', marginBottom: 8 }}>
                  The code runner was unavailable at submit time — this answer was left for manual grading.
                </div>
              )}

              <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '6px 0 2px' }}>Submitted code</div>
              <pre className="codeBox">{selected.code || '(no code submitted)'}</pre>

              <div className="gradeRow">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0B1B3A' }}>Marks (0–{selected.marks}):</span>
                <input type="number" min={0} max={selected.marks} value={markInput} onChange={e => setMarkInput(e.target.value)} />
                <button className="saveBtn" disabled={saving} onClick={saveGrade}>{saving ? 'Saving…' : 'Save grade'}</button>
                {saveMsg && <span className="saveMsg">{saveMsg}</span>}
              </div>
            </div>
          )}

          {state === 'idle'    && <AdminState kind="empty" message="Choose an assessment to review its coding submissions." />}
          {state === 'loading' && <AdminState kind="loading" message="Loading submissions…" />}
          {state === 'error'   && <AdminState kind="error" message={errorMsg || 'Failed to load.'} />}
          {state === 'ready' && rows.length === 0 && (
            <AdminState kind="empty" message="No coding submissions for this assessment yet." />
          )}

          {state === 'ready' && rows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Question</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Marks</th>
                    <th style={{ textAlign: 'right' }}>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const sm = statusMeta[r.review_status ?? ''] ?? { label: r.review_status || '—', cls: 'st-gray' };
                    return (
                      <tr key={r.answer_id}>
                        <td>
                          <div className="uname">{r.student?.name || '—'}</div>
                          <div className="umail">{r.student?.email || ''}</div>
                        </td>
                        <td><div className="qtext" title={r.question_text}>{r.question_text}</div></td>
                        <td><span className="lang">{r.language || '—'}</span></td>
                        <td><span className={`st ${sm.cls}`}>{sm.label}</span></td>
                        <td><span className="marks">{r.marks_awarded != null ? r.marks_awarded : '—'}</span> <span style={{ color: '#94A3B8', fontSize: 12 }}>/ {r.marks}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="reviewBtn" onClick={() => openReview(r)}>Review</button>
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
