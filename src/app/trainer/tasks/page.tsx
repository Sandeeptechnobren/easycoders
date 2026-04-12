'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Task = {
  id: number;
  title: string;
  description: string;
  batch?: { id: number; name: string };
  category?: { id: number; name: string };
  due_date?: string;
  status: string;
  priority: string;
  submissions?: Submission[];
};
type Submission = {
  id: number;
  student?: { id: number; name: string; email: string };
  status: string;
  notes?: string;
  approved_at?: string;
};

const priorityColor: Record<string, string> = {
  high: 'bg-danger', medium: 'bg-warning text-dark', low: 'bg-success',
};

export default function TrainerTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markStatus, setMarkStatus] = useState('completed');
  const [markNotes, setMarkNotes] = useState('');
  const [markMsg, setMarkMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/tasks`);
      setTasks(res.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTask = async (t: Task) => {
    setSelected(t);
    setSubmissions([]);
    setMarkMsg('');
    setMarkingId(null);
    setShowDetail(true);
    setLoadingSubs(true);
    try {
      const res = await fetchWithAuth(`${BASE}/tasks/${t.id}/submissions`);
      setSubmissions(res.data || []);
    } catch {} finally { setLoadingSubs(false); }
  };

  const markComplete = async (studentId: number) => {
    if (!selected) return;
    setMarkMsg('');
    try {
      await fetchWithAuth(`${BASE}/tasks/${selected.id}/students/${studentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: markStatus, notes: markNotes }),
      });
      setMarkMsg(`Marked as ${markStatus}.`);
      setMarkingId(null);
      // Refresh submissions
      const res = await fetchWithAuth(`${BASE}/tasks/${selected.id}/submissions`);
      setSubmissions(res.data || []);
    } catch (e: any) { setMarkMsg(e.message || 'Failed.'); }
  };

  const submissionStatusColor: Record<string, string> = {
    pending: 'bg-warning text-dark',
    completed: 'bg-info',
    approved: 'bg-success',
    rejected: 'bg-danger',
  };

  // All students in the task's batch that haven't submitted
  const submittedIds = new Set(submissions.map(s => s.student?.id));

  return (
    <RoleGuard allowedRoles={[4]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Batch Tasks</h3>
              <p className="text-muted mb-0">Review and mark student task submissions</p>
            </div>
            <button className="btn btn-outline-secondary" onClick={load}>Refresh</button>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="card p-5 text-center text-muted">No tasks assigned to your batches yet.</div>
          ) : (
            <div className="row g-3">
              {tasks.map(t => (
                <div key={t.id} className="col-md-6 col-xl-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0">{t.title}</h5>
                        <span className={`badge ${priorityColor[t.priority] || 'bg-secondary'}`}>{t.priority}</span>
                      </div>
                      <p className="text-muted small mb-2">{t.description?.slice(0, 100)}{t.description?.length > 100 ? '...' : ''}</p>
                      <div className="small text-muted mb-1">Batch: {t.batch?.name || '—'}</div>
                      {t.due_date && <div className="small text-muted mb-3">Due: {t.due_date.slice(0, 10)}</div>}
                      <button className="btn btn-sm btn-outline-primary w-100" onClick={() => openTask(t)}>
                        View Submissions
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {showDetail && selected && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">{selected.title}</h5>
                  <small className="text-muted">Batch: {selected.batch?.name || '—'}</small>
                </div>
                <button className="btn-close" onClick={() => setShowDetail(false)} />
              </div>
              <div className="modal-body">
                {markMsg && <div className={`alert py-2 ${markMsg.includes('arked') ? 'alert-success' : 'alert-danger'}`}>{markMsg}</div>}

                <p className="text-muted">{selected.description}</p>

                <h6 className="fw-semibold mb-3">Student Submissions ({submissions.length})</h6>

                {loadingSubs ? (
                  <div className="text-center py-3 text-muted">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="alert alert-info">No submissions yet. Students show their work offline to you, then you mark it here.</div>
                ) : (
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Notes</th>
                        <th>Approved At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub.id}>
                          <td>
                            <div className="fw-semibold">{sub.student?.name || '—'}</div>
                            <small className="text-muted">{sub.student?.email}</small>
                          </td>
                          <td>
                            <span className={`badge ${submissionStatusColor[sub.status] || 'bg-secondary'}`}>{sub.status}</span>
                          </td>
                          <td className="small text-muted">{sub.notes || '—'}</td>
                          <td className="small text-muted">{sub.approved_at?.slice(0, 10) || '—'}</td>
                          <td>
                            {markingId === sub.student?.id ? (
                              <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
                                <select className="form-select form-select-sm" value={markStatus}
                                  onChange={e => setMarkStatus(e.target.value)}>
                                  <option value="completed">Completed</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                <input className="form-control form-control-sm" placeholder="Notes (optional)"
                                  value={markNotes} onChange={e => setMarkNotes(e.target.value)} />
                                <div className="d-flex gap-1">
                                  <button className="btn btn-sm btn-success flex-fill"
                                    onClick={() => markComplete(sub.student!.id)}>Save</button>
                                  <button className="btn btn-sm btn-secondary" onClick={() => setMarkingId(null)}>X</button>
                                </div>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-outline-primary"
                                onClick={() => { setMarkingId(sub.student?.id || null); setMarkNotes(sub.notes || ''); setMarkStatus(sub.status === 'pending' ? 'completed' : sub.status); }}>
                                {sub.status === 'pending' ? 'Mark Complete' : 'Update'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Mark for a student not yet in submissions */}
                <div className="mt-4 border-top pt-3">
                  <h6 className="fw-semibold mb-2">Mark for Student (by ID)</h6>
                  <p className="text-muted small">If a student showed you their work offline but has no submission record yet, enter their user ID to mark it.</p>
                  <ManualMarkForm taskId={selected.id} onDone={async () => {
                    const res = await fetchWithAuth(`${BASE}/tasks/${selected.id}/submissions`);
                    setSubmissions(res.data || []);
                  }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}

function ManualMarkForm({ taskId, onDone }: { taskId: number; onDone: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState('completed');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await fetchWithAuth(`${BASE}/tasks/${taskId}/students/${studentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      setMsg('Marked.');
      setStudentId(''); setNotes('');
      onDone();
    } catch (e: any) { setMsg(e.message || 'Failed.'); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="d-flex gap-2 flex-wrap align-items-end">
      {msg && <div className={`w-100 alert py-1 ${msg === 'Marked.' ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
      <div>
        <label className="form-label small">Student ID</label>
        <input type="number" className="form-control form-control-sm" style={{ width: 120 }} required
          value={studentId} onChange={e => setStudentId(e.target.value)} />
      </div>
      <div>
        <label className="form-label small">Status</label>
        <select className="form-select form-select-sm" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div>
        <label className="form-label small">Notes</label>
        <input className="form-control form-control-sm" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Mark'}
      </button>
    </form>
  );
}
