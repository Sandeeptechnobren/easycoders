'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Batch = {
  id: number;
  name: string;
  course?: { id: number; name: string };
  start_date: string;
  end_date: string;
  status: string;
  trainers?: { id: number; name: string }[];
  students_count?: number;
};
type Course = { id: number; name: string };
type User = { id: number; name: string; email: string; role: string };

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [managingBatch, setManagingBatch] = useState<Batch | null>(null);
  const [batchStudents, setBatchStudents] = useState<User[]>([]);

  const [form, setForm] = useState({
    name: '', course_id: '', start_date: '', end_date: '',
    status: 'upcoming', trainer_ids: [] as number[],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [batchRes, courseRes] = await Promise.all([
        fetchWithAuth(`${BASE}/batches`),
        fetchWithAuth(`${BASE}/courses`),
      ]);
      setBatches(batchRes.data || []);
      setCourses(courseRes.data || courseRes || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load trainers on modal open
  const openCreate = async () => {
    setEditBatch(null);
    setForm({ name: '', course_id: '', start_date: '', end_date: '', status: 'upcoming', trainer_ids: [] });
    setMsg('');
    if (!trainers.length) {
      const res = await fetchWithAuth(`${BASE}/commanAPIs/users?role=trainer`).catch(() => ({ data: [] }));
      setTrainers(res.data || []);
    }
    setShowModal(true);
  };

  const openEdit = async (b: Batch) => {
    setEditBatch(b);
    setForm({
      name: b.name,
      course_id: String(b.course?.id || ''),
      start_date: b.start_date?.slice(0, 10) || '',
      end_date: b.end_date?.slice(0, 10) || '',
      status: b.status,
      trainer_ids: (b.trainers || []).map(t => t.id),
    });
    setMsg('');
    if (!trainers.length) {
      const res = await fetchWithAuth(`${BASE}/commanAPIs/users?role=trainer`).catch(() => ({ data: [] }));
      setTrainers(res.data || []);
    }
    setShowModal(true);
  };

  const saveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const payload = { ...form, course_id: form.course_id ? Number(form.course_id) : undefined };
      if (editBatch) {
        await fetchWithAuth(`${BASE}/batches/${editBatch.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        setMsg('Batch updated.');
      } else {
        await fetchWithAuth(`${BASE}/batches`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        setMsg('Batch created.');
      }
      setShowModal(false);
      load();
    } catch (e: any) { setMsg(e.message || 'Failed.'); } finally { setSaving(false); }
  };

  const deleteBatch = async (id: number) => {
    if (!confirm('Delete this batch?')) return;
    try {
      await fetchWithAuth(`${BASE}/batches/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) { alert(e.message || 'Delete failed.'); }
  };

  const openStudents = async (b: Batch) => {
    setManagingBatch(b);
    setBatchStudents([]);
    setShowStudentModal(true);
    // Load full batch detail (with students)
    try {
      const res = await fetchWithAuth(`${BASE}/batches/${b.id}`);
      const detail = res.data || {};
      setBatchStudents(detail.students || []);
    } catch {}
    // Load all students if not loaded
    if (!allStudents.length) {
      // Pull REAL enrolled students (users.role=3) so batch membership writes a
      // valid users.id into batch_students. (Was /hr/students = assessment-takers.)
      const res = await fetchWithAuth(`${BASE}/admin/students`).catch(() => ({ data: [] }));
      setAllStudents(res.data || []);
    }
  };

  const addStudent = async (studentId: number) => {
    if (!managingBatch) return;
    try {
      await fetchWithAuth(`${BASE}/batches/${managingBatch.id}/students`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: [studentId] }),
      });
      const res = await fetchWithAuth(`${BASE}/batches/${managingBatch.id}`);
      setBatchStudents((res.data || {}).students || []);
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const removeStudent = async (studentId: number) => {
    if (!managingBatch || !confirm('Remove student from batch?')) return;
    try {
      await fetchWithAuth(`${BASE}/batches/${managingBatch.id}/students/${studentId}`, { method: 'DELETE' });
      setBatchStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const toggleTrainer = (id: number) => {
    setForm(f => ({
      ...f,
      trainer_ids: f.trainer_ids.includes(id)
        ? f.trainer_ids.filter(t => t !== id)
        : [...f.trainer_ids, id],
    }));
  };

  const batchStudentIds = new Set(batchStudents.map(s => s.id));
  const availableStudents = allStudents.filter(s => !batchStudentIds.has(s.id));

  const statusColor: Record<string, string> = {
    upcoming: 'bg-info', active: 'bg-success', completed: 'bg-secondary', cancelled: 'bg-danger'
  };

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Batches</h3>
              <p className="text-muted mb-0">Manage training batches, trainers and students</p>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>+ New Batch</button>
          </div>

          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : batches.length === 0 ? (
            <div className="card p-5 text-center text-muted">No batches yet. Create your first batch.</div>
          ) : (
            <div className="row g-3">
              {batches.map(b => (
                <div key={b.id} className="col-md-6 col-xl-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0">{b.name}</h5>
                        <span className={`badge ${statusColor[b.status] || 'bg-secondary'} text-capitalize`}>{b.status}</span>
                      </div>
                      {b.course && <div className="text-muted small mb-2">Course: {b.course.name}</div>}
                      <div className="small text-muted mb-1">
                        {b.start_date?.slice(0, 10)} → {b.end_date?.slice(0, 10)}
                      </div>
                      <div className="small mb-1">
                        <strong>Trainers:</strong>{' '}
                        {(b.trainers || []).length ? b.trainers!.map(t => t.name).join(', ') : <span className="text-muted">None</span>}
                      </div>
                      <div className="small mb-3">
                        <strong>Students:</strong> {b.students_count ?? '—'}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(b)}>Edit</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openStudents(b)}>Students</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteBatch(b.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editBatch ? 'Edit Batch' : 'Create Batch'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={saveBatch}>
                <div className="modal-body">
                  {msg && <div className={`alert ${msg.includes('ailed') ? 'alert-danger' : 'alert-success'}`}>{msg}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Batch Name *</label>
                      <input className="form-control" required value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Course</label>
                      <select className="form-select" value={form.course_id}
                        onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}>
                        <option value="">— Select Course —</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-control" value={form.start_date}
                        onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-control" value={form.end_date}
                        onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status}
                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        <option value="upcoming">Upcoming</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Trainers</label>
                      <div className="d-flex flex-wrap gap-2">
                        {trainers.map(t => (
                          <div
                            key={t.id}
                            className={`border rounded px-3 py-1 small d-flex align-items-center gap-1 ${form.trainer_ids.includes(t.id) ? 'border-primary bg-primary text-white' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleTrainer(t.id)}
                          >
                            <input type="checkbox" className="form-check-input m-0" readOnly
                              checked={form.trainer_ids.includes(t.id)} />
                            {t.name}
                          </div>
                        ))}
                        {trainers.length === 0 && <span className="text-muted small">No trainers found</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editBatch ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Management Modal ── */}
      {showStudentModal && managingBatch && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Students — {managingBatch.name}</h5>
                <button className="btn-close" onClick={() => setShowStudentModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 className="fw-semibold mb-3">In This Batch ({batchStudents.length})</h6>
                    {batchStudents.length === 0
                      ? <p className="text-muted">No students yet.</p>
                      : batchStudents.map(s => (
                          <div key={s.id} className="d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-2">
                            <div>
                              <div className="fw-semibold">{s.name}</div>
                              <small className="text-muted">{s.email}</small>
                            </div>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => removeStudent(s.id)}>Remove</button>
                          </div>
                        ))
                    }
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-semibold mb-3">Add Students</h6>
                    <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                      {availableStudents.length === 0
                        ? <p className="text-muted">All students already added.</p>
                        : availableStudents.map(s => (
                            <div key={s.id} className="d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-2">
                              <div>
                                <div className="fw-semibold">{s.name}</div>
                                <small className="text-muted">{s.email}</small>
                              </div>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => addStudent(s.id)}>Add</button>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowStudentModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
