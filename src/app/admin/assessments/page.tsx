'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

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
  questions_count?: number;
};
type Question = {
  id: number;
  question_text: string;
  question_type: string;
  marks: number;
  difficulty: string;
  explanation?: string;
  options?: Option[];
};
type Option = { id: number; option_text: string; is_correct: boolean };

const statusColor: Record<string, string> = {
  draft: 'bg-warning text-dark', published: 'bg-success', archived: 'bg-secondary',
};

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

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
  const [qForm, setQForm] = useState({
    question_text: '', question_type: 'mcq', marks: '1', difficulty: 'easy',
    explanation: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
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
      is_paid: a.is_paid, amount: String(a.amount || ''),
      passing_score: String(a.passing_score || 40),
      duration_minutes: String(a.duration_minutes || 60),
      max_attempts: String(a.max_attempts || 3),
      retake_wait_hours: String(a.retake_wait_hours || 72),
      expiry_date: a.expiry_date?.slice(0, 10) || '',
      instructions: '',
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

  const EMPTY_Q = {
    question_text: '', question_type: 'mcq', marks: '1', difficulty: 'easy', explanation: '',
    options: [
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  };
  const resetQForm = () => { setQForm(EMPTY_Q); setEditingQuestionId(null); };

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
    const payload = {
      question_text: qForm.question_text,
      question_type: qForm.question_type,
      marks: Number(qForm.marks),
      difficulty: qForm.difficulty,
      explanation: qForm.explanation,
      options: qForm.question_type !== 'coding' ? qForm.options.filter(o => o.option_text.trim()) : undefined,
    };
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
    setQForm({
      question_text: q.question_text,
      question_type: q.question_type,
      marks: String(q.marks ?? 1),
      difficulty: q.difficulty ?? 'easy',
      explanation: q.explanation ?? '',
      options: opts,
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
            <div className="row g-3">
              {assessments.length === 0 ? (
                <div className="card p-5 text-center text-muted">No assessments yet.</div>
              ) : assessments.map(a => (
                <div key={a.id} className="col-md-6 col-xl-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0">{a.title}</h5>
                        <span className={`badge ${statusColor[a.status] || 'bg-secondary'}`}>{a.status}</span>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className={`badge ${a.is_paid ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {a.is_paid ? `Paid ₹${a.amount}` : 'Free'}
                        </span>
                        <span className="badge bg-light text-dark border">{a.questions_count ?? 0} Questions</span>
                        <span className="badge bg-light text-dark border">Pass: {a.passing_score ?? 40}%</span>
                        {a.duration_minutes && <span className="badge bg-light text-dark border">{a.duration_minutes} min</span>}
                      </div>
                      <div className="small text-muted mb-3">
                        {a.max_attempts && <span className="me-2">Max attempts: {a.max_attempts}</span>}
                        {a.retake_wait_hours && <span>Wait: {a.retake_wait_hours}h</span>}
                        {a.expiry_date && <div>Expires: {a.expiry_date.slice(0, 10)}</div>}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(a)}>Edit</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openQuestions(a)}>Questions</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAssess(a.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Assessment Modal ── */}
      {showAssessModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editAssess ? 'Edit Assessment' : 'New Assessment'}</h5>
                <button className="btn-close" onClick={() => setShowAssessModal(false)} />
              </div>
              <form onSubmit={saveAssess}>
                <div className="modal-body">
                  {assessMsg && <div className="alert alert-danger">{assessMsg}</div>}
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Title *</label>
                      <input className="form-control" required value={assessForm.title}
                        onChange={e => setAssessForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows={2} value={assessForm.description}
                        onChange={e => setAssessForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={assessForm.status}
                        onChange={e => setAssessForm(f => ({ ...f, status: e.target.value }))}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Passing Score (%)</label>
                      <input type="number" min={1} max={100} className="form-control" value={assessForm.passing_score}
                        onChange={e => setAssessForm(f => ({ ...f, passing_score: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Duration (minutes)</label>
                      <input type="number" min={5} className="form-control" value={assessForm.duration_minutes}
                        onChange={e => setAssessForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Max Attempts</label>
                      <input type="number" min={1} className="form-control" value={assessForm.max_attempts}
                        onChange={e => setAssessForm(f => ({ ...f, max_attempts: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Retake Wait (hours)</label>
                      <input type="number" min={0} className="form-control" value={assessForm.retake_wait_hours}
                        onChange={e => setAssessForm(f => ({ ...f, retake_wait_hours: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Expiry Date</label>
                      <input type="date" className="form-control" value={assessForm.expiry_date}
                        onChange={e => setAssessForm(f => ({ ...f, expiry_date: e.target.value }))} />
                    </div>
                    <div className="col-md-3">
                      <div className="form-check mt-4">
                        <input type="checkbox" className="form-check-input" id="is-paid"
                          checked={assessForm.is_paid}
                          onChange={e => setAssessForm(f => ({ ...f, is_paid: e.target.checked }))} />
                        <label className="form-check-label" htmlFor="is-paid">Paid Assessment</label>
                      </div>
                    </div>
                    {assessForm.is_paid && (
                      <div className="col-md-4">
                        <label className="form-label">Amount (₹)</label>
                        <input type="number" min={0} className="form-control" value={assessForm.amount}
                          onChange={e => setAssessForm(f => ({ ...f, amount: e.target.value }))} />
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label">Instructions</label>
                      <textarea className="form-control" rows={3} value={assessForm.instructions}
                        onChange={e => setAssessForm(f => ({ ...f, instructions: e.target.value }))}
                        placeholder="Instructions shown to students before starting..." />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssessModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={assessSaving}>
                    {assessSaving ? 'Saving...' : editAssess ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
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

                    {qForm.question_type !== 'coding' && (
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
