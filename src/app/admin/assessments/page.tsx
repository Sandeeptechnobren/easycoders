'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { CODING_LANG_LIST } from '@/lib/codingLangs';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Assessment = {
  id: number;
  title: string;
  description?: string;
  status: string;
  is_paid: boolean;
  amount?: number;
  passing_score?: number;
  duration_minutes?: number;
  max_attempts?: number;
  retake_wait_hours?: number;
  expiry_date?: string;
  instructions?: string;
  questions_count?: number;
};
type TestCase = { id?: number; stdin: string; expected_output: string; is_hidden: boolean; weight: number };
type Question = {
  id: number;
  question_text: string;
  question_type: string;
  marks: number;
  difficulty: string;
  explanation?: string;
  options?: Option[];
  starter_code?: string;
  languages?: string[];
  code_grading?: 'auto' | 'manual';
  test_cases?: TestCase[];
  schema_sql?: string;
  expected_sql?: string;
  order_matters?: boolean;
};
type Option = { id: number; option_text: string; is_correct: boolean };

type QForm = {
  question_text: string;
  question_type: string;
  marks: string;
  difficulty: string;
  explanation: string;
  options: { option_text: string; is_correct: boolean }[];
  code_grading: 'auto' | 'manual';
  languages: string[];
  starter_code: string;
  test_cases: { stdin: string; expected_output: string; is_hidden: boolean; weight: string }[];
  schema_sql: string;
  expected_sql: string;
  order_matters: boolean;
};

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Create/Edit assessment
  const [showAssessModal, setShowAssessModal] = useState(false);
  const [editAssess, setEditAssess] = useState<Assessment | null>(null);
  const [assessForm, setAssessForm] = useState({
    title: '', description: '', status: 'draft', is_paid: false,
    amount: '', passing_score: '40', duration_minutes: '60',
    max_attempts: '3', retake_wait_hours: '72', expiry_date: '', instructions: '',
  });
  const [assessSaving, setAssessSaving] = useState(false);
  const [assessMsg, setAssessMsg] = useState('');

  // Questions
  const [showQModal, setShowQModal] = useState(false);
  const [managingAssess, setManagingAssess] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qTab, setQTab] = useState<'list' | 'add' | 'csv'>('list');
  const [qForm, setQForm] = useState<QForm>({
    question_text: '', question_type: 'mcq', marks: '1', difficulty: 'easy',
    explanation: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
    code_grading: 'auto',
    languages: ['python'],
    starter_code: '',
    test_cases: [{ stdin: '', expected_output: '', is_hidden: false, weight: '1' }],
    schema_sql: '',
    expected_sql: '',
    order_matters: false,
  });
  const [qSaving, setQSaving] = useState(false);
  const [qMsg, setQMsg] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvMsg, setCsvMsg] = useState('');
  const [csvUploading, setCsvUploading] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  // Payment mark
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ user_id: '', assessment_id: '', amount: '', payment_mode: 'cash', notes: '' });
  const [payMsg, setPayMsg] = useState('');
  const [paySaving, setPaySaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const res = await fetchWithAuth(`${BASE}/assessment/admin/list${params}`);
      setAssessments(res.data?.data || res.data || []);
    } catch {} finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditAssess(null);
    setAssessForm({ title: '', description: '', status: 'draft', is_paid: false, amount: '', passing_score: '40', duration_minutes: '60', max_attempts: '3', retake_wait_hours: '72', expiry_date: '', instructions: '' });
    setAssessMsg(''); setShowAssessModal(true);
  };

  const openEdit = (a: Assessment) => {
    setEditAssess(a);
    setAssessForm({
      title: a.title, description: a.description || '', status: a.status,
      is_paid: !!a.is_paid, amount: String(a.amount || ''),
      passing_score: String(a.passing_score || 40),
      duration_minutes: String(a.duration_minutes || 60),
      max_attempts: String(a.max_attempts || 3),
      retake_wait_hours: String(a.retake_wait_hours || 72),
      expiry_date: a.expiry_date?.slice(0, 10) || '',
      instructions: a.instructions || '',
    });
    setAssessMsg(''); setShowAssessModal(true);
  };

  const saveAssess = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssessSaving(true); setAssessMsg('');
    try {
      const payload = {
        ...assessForm,
        is_paid: assessForm.is_paid,
        amount: assessForm.amount ? Number(assessForm.amount) : undefined,
        passing_score: Number(assessForm.passing_score),
        duration_minutes: Number(assessForm.duration_minutes),
        max_attempts: Number(assessForm.max_attempts),
        retake_wait_hours: Number(assessForm.retake_wait_hours),
        expiry_date: assessForm.expiry_date || undefined,
      };
      if (editAssess) {
        await fetchWithAuth(`${BASE}/assessment/admin/${editAssess.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth(`${BASE}/assessment/admin`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      setShowAssessModal(false); load();
    } catch (e: any) { setAssessMsg(e.message || 'Failed.'); } finally { setAssessSaving(false); }
  };

  const deleteAssess = async (id: number) => {
    if (!confirm('Delete this assessment?')) return;
    try {
      await fetchWithAuth(`${BASE}/assessment/admin/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  // Activate (publish) / deactivate (back to draft) straight from the card,
  // via the existing adminUpdate endpoint. Optimistic flip with revert on error.
  const toggleStatus = async (a: Assessment) => {
    const next = a.status === 'published' ? 'draft' : 'published';
    setTogglingId(a.id);
    setAssessments(prev => prev.map(x => (x.id === a.id ? { ...x, status: next } : x)));
    try {
      await fetchWithAuth(`${BASE}/assessment/admin/${a.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch (e: unknown) {
      setAssessments(prev => prev.map(x => (x.id === a.id ? { ...x, status: a.status } : x)));
      alert(e instanceof Error ? e.message : 'Failed to update status.');
    } finally { setTogglingId(null); }
  };

  const EMPTY_Q: QForm = {
    question_text: '', question_type: 'mcq', marks: '1', difficulty: 'easy', explanation: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
    code_grading: 'auto',
    languages: ['python'],
    starter_code: '',
    test_cases: [{ stdin: '', expected_output: '', is_hidden: false, weight: '1' }],
    schema_sql: '',
    expected_sql: '',
    order_matters: false,
  };
  const resetQForm = () => { setQForm(EMPTY_Q); setEditingQuestionId(null); };

  // ── Coding-form field helpers ──
  const toggleLanguage = (key: string) =>
    setQForm(f => ({
      ...f,
      languages: f.languages.includes(key) ? f.languages.filter(l => l !== key) : [...f.languages, key],
    }));
  const updateTestCase = (idx: number, patch: Partial<QForm['test_cases'][number]>) =>
    setQForm(f => ({ ...f, test_cases: f.test_cases.map((tc, i) => (i === idx ? { ...tc, ...patch } : tc)) }));
  const addTestCase = () =>
    setQForm(f => ({ ...f, test_cases: [...f.test_cases, { stdin: '', expected_output: '', is_hidden: false, weight: '1' }] }));
  const removeTestCase = (idx: number) =>
    setQForm(f => ({ ...f, test_cases: f.test_cases.filter((_, i) => i !== idx) }));

  // Admin question list — uses the dedicated admin endpoint (the old code hit
  // the STUDENT endpoint /assessment/{id}, which hides answers and returns
  // nothing for a draft assessment, so the list always looked empty).
  const loadQuestions = async (assessmentId: number) => {
    try {
      const res = await fetchWithAuth(`${BASE}/assessment/admin/${assessmentId}/questions`);
      setQuestions(Array.isArray(res?.data) ? res.data : []);
    } catch { setQuestions([]); }
  };

  const openQuestions = async (a: Assessment) => {
    setManagingAssess(a);
    setQTab('list'); setQMsg(''); setQuestions([]); resetQForm();
    setShowQModal(true);
    await loadQuestions(a.id);
  };

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingAssess) return;
    setQSaving(true); setQMsg('');
    const isCoding = qForm.question_type === 'coding';
    const isSql = qForm.question_type === 'sql';
    const payload: Record<string, unknown> = {
      question_text: qForm.question_text,
      question_type: qForm.question_type,
      marks: Number(qForm.marks),
      difficulty: qForm.difficulty,
      explanation: qForm.explanation,
      options: (isCoding || isSql) ? undefined : qForm.options.filter(o => o.option_text.trim()),
    };
    if (isSql) {
      payload.code_grading = qForm.code_grading;
      payload.starter_code = qForm.starter_code;
      payload.schema_sql = qForm.schema_sql;
      payload.expected_sql = qForm.expected_sql;
      payload.order_matters = qForm.order_matters;
    }
    if (isCoding) {
      payload.code_grading = qForm.code_grading;
      payload.languages = qForm.languages.length ? qForm.languages : ['python'];
      payload.starter_code = qForm.starter_code;
      // Test cases only matter in auto mode; clear them for open/manual.
      payload.test_cases = qForm.code_grading === 'auto'
        ? qForm.test_cases
            .filter(tc => tc.stdin.trim() !== '' || tc.expected_output.trim() !== '')
            .map(tc => ({
              stdin: tc.stdin,
              expected_output: tc.expected_output,
              is_hidden: tc.is_hidden,
              weight: Number(tc.weight) || 1,
            }))
        : [];
    }
    try {
      if (editingQuestionId) {
        await fetchWithAuth(`${BASE}/assessment/admin/questions/${editingQuestionId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        setQMsg('Question updated.');
      } else {
        await fetchWithAuth(`${BASE}/assessment/${managingAssess.id}/questions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        setQMsg('Question added.');
      }
      resetQForm();
      await loadQuestions(managingAssess.id);
      setQTab('list');
    } catch (e: unknown) {
      setQMsg(e instanceof Error ? e.message : 'Failed.');
    } finally { setQSaving(false); }
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    const opts = (q.options && q.options.length)
      ? q.options.map(o => ({ option_text: o.option_text, is_correct: !!o.is_correct }))
      : [{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }];
    while (opts.length < 2) opts.push({ option_text: '', is_correct: false });
    const tcs = (q.test_cases && q.test_cases.length)
      ? q.test_cases.map(t => ({
          stdin: t.stdin ?? '',
          expected_output: t.expected_output ?? '',
          is_hidden: !!t.is_hidden,
          weight: String(t.weight ?? 1),
        }))
      : [{ stdin: '', expected_output: '', is_hidden: false, weight: '1' }];
    setQForm({
      question_text: q.question_text,
      question_type: q.question_type,
      marks: String(q.marks ?? 1),
      difficulty: q.difficulty ?? 'easy',
      explanation: q.explanation ?? '',
      options: opts,
      code_grading: (q.code_grading as 'auto' | 'manual') ?? 'auto',
      languages: (Array.isArray(q.languages) && q.languages.length) ? q.languages : ['python'],
      starter_code: q.starter_code ?? '',
      test_cases: tcs,
      schema_sql: q.schema_sql ?? '',
      expected_sql: q.expected_sql ?? '',
      order_matters: !!q.order_matters,
    });
    setQMsg(''); setQTab('add');
  };

  const deleteQuestion = async (id: number) => {
    if (!managingAssess) return;
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await fetchWithAuth(`${BASE}/assessment/admin/questions/${id}`, { method: 'DELETE' });
      await loadQuestions(managingAssess.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Delete failed.');
    }
  };

  const uploadCsv = async () => {
    if (!csvFile || !managingAssess) return;
    setCsvUploading(true); setCsvMsg('');
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/assessment/${managingAssess.id}/questions/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Upload failed');
      setCsvMsg(json.message || 'Uploaded.');
      setCsvFile(null);
      if (csvRef.current) csvRef.current.value = '';
      await loadQuestions(managingAssess.id);
      setQTab('list');
    } catch (e: any) { setCsvMsg(e.message || 'Upload failed.'); } finally { setCsvUploading(false); }
  };

  const markPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaySaving(true); setPayMsg('');
    try {
      await fetchWithAuth(`${BASE}/assessment/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(payForm.user_id),
          assessment_id: Number(payForm.assessment_id),
          amount: payForm.amount ? Number(payForm.amount) : undefined,
          payment_mode: payForm.payment_mode,
          notes: payForm.notes,
        }),
      });
      setPayMsg('Payment marked.');
      setPayForm({ user_id: '', assessment_id: '', amount: '', payment_mode: 'cash', notes: '' });
    } catch (e: any) { setPayMsg(e.message || 'Failed.'); } finally { setPaySaving(false); }
  };

  const updateOptionCorrect = (idx: number, val: boolean) => {
    if (qForm.question_type === 'mcq') {
      // MCQ: only one correct
      setQForm(f => ({ ...f, options: f.options.map((o, i) => ({ ...o, is_correct: i === idx ? val : false })) }));
    } else {
      setQForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, is_correct: val } : o) }));
    }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Assessment Management</h3>
              <p className="text-muted mb-0">Create and manage self-assessment tests</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary" onClick={() => { setShowPayModal(true); setPayMsg(''); }}>
                Mark Payment
              </button>
              <button className="btn btn-primary" onClick={openCreate}>+ New Assessment</button>
            </div>
          </div>

          {/* Filter */}
          <div className="d-flex gap-3 mb-4">
            <select className="form-select" style={{ maxWidth: 200 }} value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button className="btn btn-outline-secondary" onClick={load}>Refresh</button>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : (
            <>
              <style>{`
                .ax-card { background:#fff; border:1px solid #e7ecf3; border-radius:16px; height:100%; display:flex; flex-direction:column; overflow:hidden; transition:box-shadow .18s ease, transform .18s ease, border-color .18s ease; }
                .ax-card:hover { box-shadow:0 12px 30px rgba(11,27,58,0.1); transform:translateY(-2px); border-color:#d6deea; }
                .ax-accent { height:4px; }
                .ax-accent.published { background:#16a34a; } .ax-accent.draft { background:#E8A020; } .ax-accent.archived { background:#94a3b8; }
                .ax-body { padding:18px 18px 16px; display:flex; flex-direction:column; flex:1; }
                .ax-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:12px; }
                .ax-title { font-size:16px; font-weight:800; color:#0B1B3A; margin:0; line-height:1.3; }
                .ax-status { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; padding:3px 10px; border-radius:100px; white-space:nowrap; }
                .ax-status.published { background:#dcfce7; color:#15803d; } .ax-status.draft { background:#fef3c7; color:#92590b; } .ax-status.archived { background:#f1f5f9; color:#64748b; }
                .ax-chips { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:12px; }
                .ax-chip { font-size:12px; font-weight:600; padding:4px 10px; border-radius:8px; background:#f1f5f9; color:#475569; border:1px solid #e7ecf3; }
                .ax-chip.paid { background:#fef3c7; color:#92590b; border-color:#fde68a; } .ax-chip.free { background:#dcfce7; color:#15803d; border-color:#bbf7d0; }
                .ax-meta { font-size:12.5px; color:#94a3b8; display:flex; flex-wrap:wrap; gap:4px 14px; margin-bottom:14px; }
                .ax-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:auto; }
                .ax-btn { font-size:13px; font-weight:700; padding:8px 14px; border-radius:9px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:5px; border:1px solid transparent; transition:filter .15s ease, background .15s ease; }
                .ax-edit { background:#eef2ff; color:#4338ca; border-color:#c7d2fe; } .ax-edit:hover { background:#e0e7ff; }
                .ax-ghost { background:#fff; color:#334155; border-color:#d8dee9; } .ax-ghost:hover { background:#f1f5f9; }
                .ax-stats { background:#0B1B3A; color:#fff; } .ax-stats:hover { filter:brightness(1.18); color:#fff; }
                .ax-del { background:#fff; color:#dc2626; border-color:#fecaca; } .ax-del:hover { background:#fef2f2; }
              `}</style>
              <div className="row g-3">
                {assessments.length === 0 ? (
                  <div className="card p-5 text-center text-muted">No assessments yet.</div>
                ) : assessments.map(a => (
                  <div key={a.id} className="col-md-6 col-xl-4">
                    <div className="ax-card">
                      <div className={`ax-accent ${a.status}`} />
                      <div className="ax-body">
                        <div className="ax-top">
                          <h5 className="ax-title">{a.title}</h5>
                          <span className={`ax-status ${a.status}`}>{a.status}</span>
                        </div>
                        <div className="ax-chips">
                          <span className={`ax-chip ${a.is_paid ? 'paid' : 'free'}`}>{a.is_paid ? `Paid ₹${a.amount}` : 'Free'}</span>
                          <span className="ax-chip">{a.questions_count ?? 0} Questions</span>
                          <span className="ax-chip">Pass {a.passing_score ?? 40}%</span>
                          {a.duration_minutes ? <span className="ax-chip">{a.duration_minutes} min</span> : null}
                        </div>
                        <div className="ax-meta">
                          {a.max_attempts ? <span>Max attempts: {a.max_attempts}</span> : null}
                          {a.retake_wait_hours ? <span>Wait: {a.retake_wait_hours}h</span> : null}
                          {a.expiry_date ? <span>Expires: {a.expiry_date.slice(0, 10)}</span> : null}
                        </div>
                        <div className="form-check form-switch mb-3">
                          <input className="form-check-input" type="checkbox" role="switch"
                            id={`pub-${a.id}`} style={{ cursor: 'pointer' }}
                            checked={a.status === 'published'}
                            disabled={togglingId === a.id}
                            onChange={() => toggleStatus(a)} />
                          <label className="form-check-label small" htmlFor={`pub-${a.id}`} style={{ cursor: 'pointer' }}>
                            {togglingId === a.id
                              ? 'Updating…'
                              : a.status === 'published'
                                ? 'Active — visible to students'
                                : 'Inactive — hidden from students'}
                          </label>
                        </div>
                        <div className="ax-actions">
                          <button className="ax-btn ax-edit" onClick={() => openEdit(a)}>Edit</button>
                          <button className="ax-btn ax-ghost" onClick={() => openQuestions(a)}>Questions</button>
                          <Link href={`/admin/assessments/${a.id}/stats`} className="ax-btn ax-stats">Statistics</Link>
                          <button className="ax-btn ax-del" onClick={() => deleteAssess(a.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Create / Edit Assessment Modal (navy/gold, 2-column) ── */}
      {showAssessModal && (
        <div className="am-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowAssessModal(false); }}>
          <style jsx>{`
            .am-backdrop {
              position: fixed; inset: 0; z-index: 1050;
              background: rgba(7, 18, 42, 0.55); backdrop-filter: blur(2px);
              display: flex; align-items: center; justify-content: center;
              padding: 20px; animation: am-fade 0.18s ease;
              font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
            }
            @keyframes am-fade { from { opacity: 0; } to { opacity: 1; } }
            .am-card {
              background: #ffffff; border-radius: 20px; width: 100%; max-width: 820px;
              max-height: 92vh; display: flex; flex-direction: column; overflow: hidden;
              box-shadow: 0 24px 60px rgba(7, 18, 42, 0.45);
              animation: am-rise 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2);
            }
            @keyframes am-rise { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { .am-backdrop, .am-card { animation: none; } }
            .am-head {
              display: flex; align-items: center; justify-content: space-between;
              padding: 20px 26px 16px; border-bottom: 1px solid #F1F4F9;
            }
            .am-eyebrow {
              display: inline-flex; align-items: center; gap: 7px;
              font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
              color: #B97A0F; margin-bottom: 6px;
            }
            .am-eyebrow::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #E8A020; }
            .am-title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #0B1B3A; margin: 0; letter-spacing: -0.01em; }
            .am-close { background: transparent; border: none; cursor: pointer; color: #94A3B8; padding: 6px; border-radius: 8px; line-height: 0; transition: background 0.15s, color 0.15s; }
            .am-close:hover { background: #F4F6FB; color: #0B1B3A; }
            .am-body { padding: 22px 26px; overflow-y: auto; flex: 1; }
            .am-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            @media (max-width: 720px) { .am-grid { grid-template-columns: 1fr; gap: 18px; } }
            .am-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
            .am-col-title {
              font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
              color: #94A3B8; padding-bottom: 8px; border-bottom: 1px solid #F1F4F9; margin: 0;
            }
            .am-fld { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
            .am-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .am-lbl { font-size: 12px; font-weight: 600; color: #4A5568; }
            .am-req { color: #B97A0F; }
            .am-in {
              background: #ffffff; border: 1px solid #E5E9F2; border-radius: 10px;
              padding: 10px 12px; font-family: inherit; font-size: 13px; color: #0B1B3A;
              outline: none; width: 100%; box-sizing: border-box;
              transition: border-color 0.18s ease, box-shadow 0.18s ease;
            }
            .am-in:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.16); }
            textarea.am-in { resize: vertical; }
            .am-check { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 500; color: #0B1B3A; cursor: pointer; padding-top: 2px; }
            .am-check input { width: 16px; height: 16px; accent-color: #E8A020; cursor: pointer; }
            .am-alert { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 18px; }
            .am-foot { display: flex; gap: 10px; justify-content: flex-end; padding: 16px 26px; border-top: 1px solid #F1F4F9; background: #FAFBFD; }
            .am-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 22px; border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 700; border: 1px solid transparent; cursor: pointer; transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease; }
            .am-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .am-btn-ghost { background: #ffffff; color: #4A5568; border-color: #E5E9F2; }
            .am-btn-ghost:hover { border-color: #E8A020; color: #0B1B3A; }
            .am-btn-primary { background: #0B1B3A; color: #ffffff; }
            .am-btn-primary:hover:not(:disabled) { background: #E8A020; color: #0B1B3A; }
          `}</style>
          <div className="am-card" role="dialog" aria-modal="true" aria-labelledby="am-title">
            <div className="am-head">
              <div>
                <div className="am-eyebrow">Easy Assess</div>
                <h2 className="am-title" id="am-title">{editAssess ? 'Edit Assessment' : 'New Assessment'}</h2>
              </div>
              <button type="button" className="am-close" onClick={() => setShowAssessModal(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <form onSubmit={saveAssess} style={{ display: 'contents' }}>
              <div className="am-body">
                {assessMsg && <div className="am-alert">{assessMsg}</div>}
                <div className="am-grid">
                  {/* LEFT — content */}
                  <div className="am-col">
                    <p className="am-col-title">Content</p>
                    <div className="am-fld">
                      <label className="am-lbl">Title <span className="am-req">*</span></label>
                      <input className="am-in" required value={assessForm.title}
                        onChange={e => setAssessForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="am-fld">
                      <label className="am-lbl">Description</label>
                      <textarea className="am-in" rows={5} value={assessForm.description}
                        placeholder="Shown on the assessment card and intro screen."
                        onChange={e => setAssessForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="am-fld">
                      <label className="am-lbl">Instructions</label>
                      <textarea className="am-in" rows={6} value={assessForm.instructions}
                        placeholder="Instructions shown to students before starting…"
                        onChange={e => setAssessForm(f => ({ ...f, instructions: e.target.value }))} />
                    </div>
                  </div>

                  {/* RIGHT — settings */}
                  <div className="am-col">
                    <p className="am-col-title">Settings</p>
                    <div className="am-fld">
                      <label className="am-lbl">Status</label>
                      <select className="am-in" value={assessForm.status}
                        onChange={e => setAssessForm(f => ({ ...f, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="am-row2">
                      <div className="am-fld">
                        <label className="am-lbl">Passing Score (%)</label>
                        <input type="number" min={1} max={100} className="am-in" value={assessForm.passing_score}
                          onChange={e => setAssessForm(f => ({ ...f, passing_score: e.target.value }))} />
                      </div>
                      <div className="am-fld">
                        <label className="am-lbl">Duration (minutes)</label>
                        <input type="number" min={5} className="am-in" value={assessForm.duration_minutes}
                          onChange={e => setAssessForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                      </div>
                    </div>
                    <div className="am-row2">
                      <div className="am-fld">
                        <label className="am-lbl">Max Attempts</label>
                        <input type="number" min={1} className="am-in" value={assessForm.max_attempts}
                          onChange={e => setAssessForm(f => ({ ...f, max_attempts: e.target.value }))} />
                      </div>
                      <div className="am-fld">
                        <label className="am-lbl">Retake Wait (hours)</label>
                        <input type="number" min={0} className="am-in" value={assessForm.retake_wait_hours}
                          onChange={e => setAssessForm(f => ({ ...f, retake_wait_hours: e.target.value }))} />
                      </div>
                    </div>
                    <div className="am-fld">
                      <label className="am-lbl">Expiry Date</label>
                      <input type="date" className="am-in" value={assessForm.expiry_date}
                        onChange={e => setAssessForm(f => ({ ...f, expiry_date: e.target.value }))} />
                    </div>
                    <label className="am-check">
                      <input type="checkbox" checked={assessForm.is_paid}
                        onChange={e => setAssessForm(f => ({ ...f, is_paid: e.target.checked }))} />
                      Paid Assessment
                    </label>
                    {assessForm.is_paid ? (
                      <div className="am-fld">
                        <label className="am-lbl">Amount (₹)</label>
                        <input type="number" min={0} className="am-in" value={assessForm.amount}
                          onChange={e => setAssessForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="am-foot">
                <button type="button" className="am-btn am-btn-ghost" onClick={() => setShowAssessModal(false)}>Cancel</button>
                <button type="submit" className="am-btn am-btn-primary" disabled={assessSaving}>
                  {assessSaving ? 'Saving…' : editAssess ? 'Update assessment' : 'Create assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Questions Modal ── */}
      {showQModal && managingAssess && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">Questions — {managingAssess.title}</h5>
                  <small className="text-muted">{questions.length} questions</small>
                </div>
                <button className="btn-close" onClick={() => setShowQModal(false)} />
              </div>
              <div className="modal-body">
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item"><button className={`nav-link ${qTab === 'list' ? 'active' : ''}`} onClick={() => setQTab('list')}>Question List</button></li>
                  <li className="nav-item"><button className={`nav-link ${qTab === 'add' ? 'active' : ''}`} onClick={() => setQTab('add')}>Add Manually</button></li>
                  <li className="nav-item"><button className={`nav-link ${qTab === 'csv' ? 'active' : ''}`} onClick={() => setQTab('csv')}>CSV Upload</button></li>
                </ul>

                {/* List */}
                {qTab === 'list' && (
                  <div>
                    {questions.length === 0 ? (
                      <p className="text-muted text-center py-4">No questions yet. Add manually or upload CSV.</p>
                    ) : questions.map((q, i) => (
                      <div key={q.id} className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between mb-2 gap-3">
                          <div className="fw-semibold">Q{i + 1}. {q.question_text}</div>
                          <div className="d-flex gap-2 flex-shrink-0 align-items-start">
                            <span className="badge bg-secondary">{q.question_type}</span>
                            <span className="badge bg-light text-dark border">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                            <span className="badge bg-light text-dark border">{q.difficulty}</span>
                          </div>
                        </div>
                        {q.options && q.options.length > 0 && (
                          <div className="ms-3">
                            {q.options.map((opt, oi) => (
                              <div key={opt.id} className={`small ${opt.is_correct ? 'text-success fw-semibold' : 'text-muted'}`}>
                                {String.fromCharCode(65 + oi)}. {opt.option_text} {opt.is_correct && '✓'}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.question_type === 'coding' && (
                          <div className="ms-3 small text-muted">
                            <div>Mode: <strong>{q.code_grading === 'manual' ? 'Open / free-form (manual review)' : 'Auto-graded'}</strong></div>
                            {q.languages && q.languages.length > 0 && <div>Languages: {q.languages.join(', ')}</div>}
                            {q.code_grading !== 'manual' && <div>{q.test_cases?.length ?? 0} test case{(q.test_cases?.length ?? 0) === 1 ? '' : 's'}</div>}
                          </div>
                        )}
                        {q.explanation && <div className="small text-muted mt-2 fst-italic">Explanation: {q.explanation}</div>}
                        <div className="d-flex gap-2 mt-2 pt-2 border-top">
                          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEditQuestion(q)}>Edit</button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteQuestion(q.id)}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add manually */}
                {qTab === 'add' && (
                  <form onSubmit={saveQuestion}>
                    {editingQuestionId && (
                      <div className="d-flex justify-content-between align-items-center mb-3 p-2 rounded bg-light border">
                        <span className="fw-semibold small">Editing question #{editingQuestionId}</span>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { resetQForm(); setQTab('list'); }}>Cancel edit</button>
                      </div>
                    )}
                    {qMsg && <div className={`alert ${(qMsg.includes('added') || qMsg.includes('updated')) ? 'alert-success' : 'alert-danger'}`}>{qMsg}</div>}
                    <div className="row g-3 mb-3">
                      <div className="col-12">
                        <label className="form-label">Question *</label>
                        <textarea className="form-control" rows={3} required value={qForm.question_text}
                          onChange={e => setQForm(f => ({ ...f, question_text: e.target.value }))} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Type</label>
                        <select className="form-select" value={qForm.question_type}
                          onChange={e => setQForm(f => ({ ...f, question_type: e.target.value }))}>
                          <option value="mcq">MCQ (single correct)</option>
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="coding">Coding</option>
                          <option value="sql">SQL / DBMS</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Marks</label>
                        <input type="number" min={1} className="form-control" value={qForm.marks}
                          onChange={e => setQForm(f => ({ ...f, marks: e.target.value }))} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Difficulty</label>
                        <select className="form-select" value={qForm.difficulty}
                          onChange={e => setQForm(f => ({ ...f, difficulty: e.target.value }))}>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    {qForm.question_type !== 'coding' && qForm.question_type !== 'sql' && (
                      <div className="mb-3">
                        <label className="form-label">Options <small className="text-muted">(check correct answer{qForm.question_type === 'multiple_choice' ? 's' : ''})</small></label>
                        {qForm.options.map((opt, idx) => (
                          <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                            <span className="text-muted small" style={{ width: 20 }}>{String.fromCharCode(65 + idx)}.</span>
                            <input className="form-control form-control-sm" placeholder={`Option ${idx + 1}`}
                              value={opt.option_text}
                              onChange={e => setQForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, option_text: e.target.value } : o) }))} />
                            <input type={qForm.question_type === 'mcq' ? 'radio' : 'checkbox'}
                              className="form-check-input"
                              name="correct-option"
                              checked={opt.is_correct}
                              onChange={e => updateOptionCorrect(idx, e.target.checked)} />
                            <label className="small text-muted">Correct</label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Coding-question authoring ── */}
                    {qForm.question_type === 'coding' && (
                      <div className="mb-3 p-3 rounded border bg-light">
                        {/* Grading mode */}
                        <label className="form-label fw-semibold">Grading mode</label>
                        <div className="d-flex flex-column flex-md-row gap-2 mb-3">
                          <label className={`flex-fill border rounded p-2 d-flex gap-2 align-items-start ${qForm.code_grading === 'auto' ? 'border-primary bg-white' : ''}`} style={{ cursor: 'pointer' }}>
                            <input type="radio" className="form-check-input mt-1" name="code-grading"
                              checked={qForm.code_grading === 'auto'}
                              onChange={() => setQForm(f => ({ ...f, code_grading: 'auto' }))} />
                            <span>
                              <span className="fw-semibold d-block small">Auto-graded</span>
                              <span className="text-muted" style={{ fontSize: 12 }}>Define test cases — scored instantly, trainer can override.</span>
                            </span>
                          </label>
                          <label className={`flex-fill border rounded p-2 d-flex gap-2 align-items-start ${qForm.code_grading === 'manual' ? 'border-primary bg-white' : ''}`} style={{ cursor: 'pointer' }}>
                            <input type="radio" className="form-check-input mt-1" name="code-grading"
                              checked={qForm.code_grading === 'manual'}
                              onChange={() => setQForm(f => ({ ...f, code_grading: 'manual' }))} />
                            <span>
                              <span className="fw-semibold d-block small">Open / free-form</span>
                              <span className="text-muted" style={{ fontSize: 12 }}>Student codes freely — a trainer reviews and scores it.</span>
                            </span>
                          </label>
                        </div>

                        {/* Languages */}
                        <label className="form-label fw-semibold">Allowed languages</label>
                        <div className="d-flex flex-wrap gap-3 mb-3">
                          {CODING_LANG_LIST.map(l => (
                            <label key={l.key} className="d-flex gap-2 align-items-center small" style={{ cursor: 'pointer' }}>
                              <input type="checkbox" className="form-check-input"
                                checked={qForm.languages.includes(l.key)}
                                onChange={() => toggleLanguage(l.key)} />
                              {l.label}
                            </label>
                          ))}
                        </div>
                        {qForm.languages.length === 0 && (
                          <div className="text-danger small mb-2">Pick at least one language (defaults to Python otherwise).</div>
                        )}

                        {/* Starter code */}
                        <label className="form-label fw-semibold">Starter code <small className="text-muted fw-normal">(optional — pre-fills the editor)</small></label>
                        <textarea className="form-control mb-3" rows={5} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}
                          placeholder="// Optional boilerplate shown to the student"
                          value={qForm.starter_code}
                          onChange={e => setQForm(f => ({ ...f, starter_code: e.target.value }))} />

                        {/* Test cases (auto mode only) */}
                        {qForm.code_grading === 'auto' && (
                          <div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <label className="form-label fw-semibold mb-0">Test cases <small className="text-muted fw-normal">(input → expected output)</small></label>
                              <button type="button" className="btn btn-sm btn-outline-primary" onClick={addTestCase}>+ Add case</button>
                            </div>
                            <div className="alert alert-secondary small py-2 px-3">
                              Output is matched on trimmed text. Mark a case <strong>Hidden</strong> to use it for grading without showing it to the student. Visible (non-hidden) cases double as the &ldquo;Run&rdquo; samples.
                            </div>
                            {qForm.test_cases.map((tc, idx) => (
                              <div key={idx} className="border rounded p-2 mb-2 bg-white">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="small fw-semibold text-muted">Case {idx + 1}</span>
                                  <div className="d-flex gap-3 align-items-center">
                                    <label className="d-flex gap-1 align-items-center small mb-0" style={{ cursor: 'pointer' }}>
                                      <input type="checkbox" className="form-check-input" checked={tc.is_hidden}
                                        onChange={e => updateTestCase(idx, { is_hidden: e.target.checked })} />
                                      Hidden
                                    </label>
                                    <div className="d-flex gap-1 align-items-center small">
                                      Weight
                                      <input type="number" min={1} className="form-control form-control-sm" style={{ width: 64 }}
                                        value={tc.weight}
                                        onChange={e => updateTestCase(idx, { weight: e.target.value })} />
                                    </div>
                                    {qForm.test_cases.length > 1 && (
                                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeTestCase(idx)}>Remove</button>
                                    )}
                                  </div>
                                </div>
                                <div className="row g-2">
                                  <div className="col-md-6">
                                    <label className="text-muted small">Input (stdin)</label>
                                    <textarea className="form-control form-control-sm" rows={2} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                                      value={tc.stdin}
                                      onChange={e => updateTestCase(idx, { stdin: e.target.value })} />
                                  </div>
                                  <div className="col-md-6">
                                    <label className="text-muted small">Expected output</label>
                                    <textarea className="form-control form-control-sm" rows={2} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                                      value={tc.expected_output}
                                      onChange={e => updateTestCase(idx, { expected_output: e.target.value })} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── SQL / DBMS-question authoring ── */}
                    {qForm.question_type === 'sql' && (
                      <div className="mb-3 p-3 rounded border bg-light">
                        <label className="form-label fw-semibold">Grading mode</label>
                        <div className="d-flex flex-column flex-md-row gap-2 mb-3">
                          <label className={`flex-fill border rounded p-2 d-flex gap-2 align-items-start ${qForm.code_grading === 'auto' ? 'border-primary bg-white' : ''}`} style={{ cursor: 'pointer' }}>
                            <input type="radio" className="form-check-input mt-1" name="sql-grading" checked={qForm.code_grading === 'auto'} onChange={() => setQForm(f => ({ ...f, code_grading: 'auto' }))} />
                            <span><span className="fw-semibold d-block small">Auto-graded</span><span className="text-muted" style={{ fontSize: 12 }}>Compare the student&rsquo;s query result to the expected query&rsquo;s — scored instantly.</span></span>
                          </label>
                          <label className={`flex-fill border rounded p-2 d-flex gap-2 align-items-start ${qForm.code_grading === 'manual' ? 'border-primary bg-white' : ''}`} style={{ cursor: 'pointer' }}>
                            <input type="radio" className="form-check-input mt-1" name="sql-grading" checked={qForm.code_grading === 'manual'} onChange={() => setQForm(f => ({ ...f, code_grading: 'manual' }))} />
                            <span><span className="fw-semibold d-block small">Open / free-form</span><span className="text-muted" style={{ fontSize: 12 }}>Student writes SQL freely — a trainer reviews and scores it.</span></span>
                          </label>
                        </div>

                        <label className="form-label fw-semibold">Setup schema <small className="text-muted fw-normal">(DDL + seed data; shown to the student, run before their query)</small></label>
                        <textarea className="form-control mb-3" rows={6} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
                          placeholder={"CREATE TABLE employees (id INTEGER, name TEXT, salary INTEGER);\nINSERT INTO employees VALUES (1,'Asha',60000),(2,'Ravi',50000);"}
                          value={qForm.schema_sql} onChange={e => setQForm(f => ({ ...f, schema_sql: e.target.value }))} />

                        <label className="form-label fw-semibold">Starter query <small className="text-muted fw-normal">(optional — pre-fills the editor)</small></label>
                        <textarea className="form-control mb-3" rows={2} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
                          placeholder="SELECT ..." value={qForm.starter_code} onChange={e => setQForm(f => ({ ...f, starter_code: e.target.value }))} />

                        {qForm.code_grading === 'auto' && (
                          <>
                            <div className="alert alert-secondary small py-2 px-3">
                              The student&rsquo;s query is graded by running it on the setup schema and comparing its result set to the expected query below. Row order is ignored unless you tick &ldquo;order matters&rdquo;.
                            </div>
                            <label className="form-label fw-semibold">Expected query (answer key) <small className="text-muted fw-normal">(not shown to the student)</small></label>
                            <textarea className="form-control mb-2" rows={3} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
                              placeholder="SELECT name FROM employees WHERE salary > 55000;"
                              value={qForm.expected_sql} onChange={e => setQForm(f => ({ ...f, expected_sql: e.target.value }))} />
                            <label className="d-flex gap-2 align-items-center small" style={{ cursor: 'pointer' }}>
                              <input type="checkbox" className="form-check-input" checked={qForm.order_matters} onChange={e => setQForm(f => ({ ...f, order_matters: e.target.checked }))} />
                              Row order matters (the question requires an ORDER BY)
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Explanation <small className="text-muted">(shown after attempt)</small></label>
                      <textarea className="form-control" rows={2} value={qForm.explanation}
                        onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={qSaving}>
                      {qSaving
                        ? (editingQuestionId ? 'Updating…' : 'Adding…')
                        : (editingQuestionId ? 'Update Question' : 'Add Question')}
                    </button>
                  </form>
                )}

                {/* CSV Upload */}
                {qTab === 'csv' && (
                  <div style={{ maxWidth: 600 }}>
                    {csvMsg && <div className={`alert ${csvMsg.includes('ploaded') || csvMsg.includes('successfully') ? 'alert-success' : 'alert-danger'}`}>{csvMsg}</div>}
                    <div className="alert alert-info small">
                      <strong>CSV Format:</strong> question_text, type (mcq/multiple_choice/coding), option1, option2, option3, option4, correct_index (1-4)
                      <br />Example: <code>What is PHP?,mcq,Hypertext Preprocessor,Python,JavaScript,Java,1</code>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Upload CSV File</label>
                      <input type="file" className="form-control" accept=".csv,.txt" ref={csvRef}
                        onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                    </div>
                    <button className="btn btn-primary" onClick={uploadCsv} disabled={!csvFile || csvUploading}>
                      {csvUploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowQModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark Payment Modal ── */}
      {showPayModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Mark Assessment Payment</h5>
                <button className="btn-close" onClick={() => setShowPayModal(false)} />
              </div>
              <form onSubmit={markPayment}>
                <div className="modal-body">
                  {payMsg && <div className={`alert ${payMsg.includes('marked') ? 'alert-success' : 'alert-danger'}`}>{payMsg}</div>}
                  <div className="mb-3">
                    <label className="form-label">User ID *</label>
                    <input type="number" className="form-control" required value={payForm.user_id}
                      onChange={e => setPayForm(f => ({ ...f, user_id: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assessment *</label>
                    <select className="form-select" required value={payForm.assessment_id}
                      onChange={e => setPayForm(f => ({ ...f, assessment_id: e.target.value }))}>
                      <option value="">— Select Assessment —</option>
                      {assessments.filter(a => a.is_paid).map(a => (
                        <option key={a.id} value={a.id}>{a.title} (₹{a.amount})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount Paid</label>
                    <input type="number" min={0} className="form-control" value={payForm.amount}
                      onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Mode</label>
                    <select className="form-select" value={payForm.payment_mode}
                      onChange={e => setPayForm(f => ({ ...f, payment_mode: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="waived">Waived</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={2} value={payForm.notes}
                      onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={paySaving}>
                    {paySaving ? 'Saving...' : 'Mark as Paid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
