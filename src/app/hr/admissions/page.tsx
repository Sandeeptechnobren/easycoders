'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { useFeeVisibility, maskAmount, FeeToggle } from '@/lib/feeMask';

const BASE = 'https://api.easycoders.in/api';

type Admission = {
  id: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  course?: { id: number; name: string };
  batch?: { id: number; name: string };
  total_fees: number;
  final_fees: number;
  payment_status: string;
  admission_status: string;
  created_at: string;
  installments?: Installment[];
  installments_sum_paid_amount?: number | string;
  cancelled_at?: string | null;
  refund_amount?: number | string | null;
  refund_mode?: string | null;
  refund_reason?: string | null;
  cancelled_by?: number | { id: number; name: string } | null;
};
type Installment = {
  id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_amount: number;
  status: string;
};
type Course = { id: number; name: string; amount?: number; is_free?: boolean };
type Batch = { id: number; name: string };
type Coupon = { id: number; code: string; discount_type: string; discount_value: number };

const statusColor: Record<string, string> = {
  pending: 'bg-warning text-dark',
  approved: 'bg-success',
  rejected: 'bg-danger',
  cancelled: 'bg-secondary',
};
const payColor: Record<string, string> = {
  pending: 'bg-warning text-dark',
  partial: 'bg-info',
  complete: 'bg-success',
};

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [feesVisible] = useFeeVisibility();

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Admission | null>(null);

  // Create form
  const [form, setForm] = useState({
    student_name: '', student_email: '', student_phone: '', college_name: '',
    course_id: '', batch_id: '', payment_method: 'cash',
    installment_count: 1, coupon_code: '',
  });
  const [couponInfo, setCouponInfo] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  // Installment pay
  const [payingInstall, setPayingInstall] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMsg, setPayMsg] = useState('');

  // Cancel admission (+ optional refund)
  const [showCancel, setShowCancel] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Admission | null>(null);
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMode, setRefundMode] = useState('cash');
  const [refundReason, setRefundReason] = useState('');
  const [cancelMsg, setCancelMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('search', search);
      const [admRes, courseRes, batchRes] = await Promise.all([
        fetchWithAuth(`${BASE}/admissions?${params}`),
        fetchWithAuth(`${BASE}/courses`),
        fetchWithAuth(`${BASE}/batches`),
      ]);
      setAdmissions(admRes.data?.data || admRes.data || []);
      setCourses(courseRes.data || courseRes || []);
      setBatches(batchRes.data || []);
    } catch {} finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (adm: Admission) => {
    try {
      const res = await fetchWithAuth(`${BASE}/admissions/${adm.id}`);
      setSelected(res.data || adm);
    } catch { setSelected(adm); }
    setShowDetail(true);
  };

  const verifyCoupon = async () => {
    setCouponMsg(''); setCouponInfo(null);
    if (!form.coupon_code) return;
    try {
      const res = await fetchWithAuth(`${BASE}/coupons/validate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.coupon_code, course_id: form.course_id || undefined }),
      });
      setCouponInfo(res.data);
      setCouponMsg(`Valid! ${res.data.discount_type === 'percentage' ? res.data.discount_value + '%' : '₹' + res.data.discount_value} off`);
    } catch (e: any) { setCouponMsg(e.message || 'Invalid coupon'); }
  };

  const handleCourseChange = (courseId: string) => {
    setForm(f => ({ ...f, course_id: courseId }));
    const c = courses.find(c => String(c.id) === courseId) || null;
    setSelectedCourse(c);
    setCouponInfo(null); setCouponMsg('');
  };

  const computeFees = () => {
    if (!selectedCourse) return { total: 0, discount: 0, final: 0 };
    const total = selectedCourse.amount || 0;
    if (!couponInfo) return { total, discount: 0, final: total };
    const discount = couponInfo.discount_type === 'percentage'
      ? Math.round(total * couponInfo.discount_value / 100)
      : couponInfo.discount_value;
    return { total, discount, final: Math.max(0, total - discount) };
  };
  const fees = computeFees();

  const createAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setCreateMsg('');
    try {
      await fetchWithAuth(`${BASE}/admissions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          course_id: form.course_id ? Number(form.course_id) : undefined,
          batch_id: form.batch_id ? Number(form.batch_id) : undefined,
          installment_count: form.installment_count,
        }),
      });
      setCreateMsg('Admission created successfully.');
      setShowCreate(false);
      load();
    } catch (e: any) { setCreateMsg(e.message || 'Failed to create.'); } finally { setSaving(false); }
  };

  const approveAdmission = async (id: number) => {
    try {
      await fetchWithAuth(`${BASE}/admissions/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admission_status: 'approved' }),
      });
      setShowDetail(false);
      load();
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const payInstallment = async () => {
    if (!selected || !payingInstall) return;
    setPayMsg('');
    try {
      await fetchWithAuth(`${BASE}/admissions/${selected.id}/installments/${payingInstall.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_amount: Number(payAmount) }),
      });
      setPayMsg('Payment recorded.');
      setPayAmount('');
      setPayingInstall(null);
      const res = await fetchWithAuth(`${BASE}/admissions/${selected.id}`);
      setSelected(res.data || selected);
    } catch (e: any) { setPayMsg(e.message || 'Failed.'); }
  };

  // ── Cancel admission helpers ──
  const paidOf = (a: Admission | null): number => {
    if (!a) return 0;
    if (a.installments?.length) return a.installments.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
    return Number(a.installments_sum_paid_amount || 0);
  };
  const isCancellable = (s: string) => s !== 'cancelled' && s !== 'rejected';
  const cancellerName = (a: Admission) => (a.cancelled_by && typeof a.cancelled_by === 'object') ? a.cancelled_by.name : '';

  const openCancel = (a: Admission) => {
    setCancelTarget(a);
    setIssueRefund(false);
    setRefundAmount(String(paidOf(a) || ''));
    setRefundMode('cash');
    setRefundReason('');
    setCancelMsg('');
    setShowCancel(true);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    const paid = paidOf(cancelTarget);
    const amt = Number(refundAmount);
    if (issueRefund && amt > paid) {
      setCancelMsg(`Refund can't exceed ₹${paid.toLocaleString()} (amount paid).`);
      return;
    }
    setCancelling(true); setCancelMsg('');
    try {
      const body: Record<string, unknown> = {};
      if (issueRefund && amt > 0) { body.refund_amount = amt; body.refund_mode = refundMode; }
      if (refundReason.trim()) body.refund_reason = refundReason.trim();
      await fetchWithAuth(`${BASE}/admissions/${cancelTarget.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setShowCancel(false); setShowDetail(false); setCancelTarget(null);
      load();
    } catch (e: any) { setCancelMsg(e.message || 'Could not cancel the admission.'); }
    finally { setCancelling(false); }
  };

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Admissions</h3>
              <p className="text-muted mb-0">Manage student admissions and fee installments</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <FeeToggle />
              <button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateMsg(''); }}>
                + New Admission
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="d-flex gap-3 mb-4 flex-wrap">
            <input type="text" className="form-control" style={{ maxWidth: 280 }} placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-select" style={{ maxWidth: 200 }} value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-outline-secondary" onClick={load}>Refresh</button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Batch</th>
                      <th>Fees</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.length === 0 ? (
                      <tr><td colSpan={9} className="text-center text-muted py-4">No admissions found.</td></tr>
                    ) : admissions.map(a => (
                      <tr key={a.id}>
                        <td className="text-muted small">{a.id}</td>
                        <td>
                          <div className="fw-semibold">{a.student_name}</div>
                          <small className="text-muted">{a.student_email}</small>
                        </td>
                        <td>{a.course?.name || '—'}</td>
                        <td>{a.batch?.name || '—'}</td>
                        <td>
                          <div>{maskAmount(a.final_fees, feesVisible)}</div>
                          {a.total_fees !== a.final_fees && <small className="text-muted text-decoration-line-through">{maskAmount(a.total_fees, feesVisible)}</small>}
                        </td>
                        <td><span className={`badge ${payColor[a.payment_status] || 'bg-secondary'}`}>{a.payment_status}</span></td>
                        <td><span className={`badge ${statusColor[a.admission_status] || 'bg-secondary'}`}>{a.admission_status}</span></td>
                        <td className="small text-muted">{a.created_at?.slice(0, 10)}</td>
                        <td className="text-nowrap">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openDetail(a)}>View</button>
                          {isCancellable(a.admission_status) && (
                            <button className="btn btn-sm btn-outline-danger ms-1" onClick={() => openCancel(a)}>Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Admission Modal ── */}
      {showCreate && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Admission</h5>
                <button className="btn-close" onClick={() => setShowCreate(false)} />
              </div>
              <form onSubmit={createAdmission}>
                <div className="modal-body">
                  {createMsg && <div className={`alert ${createMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>{createMsg}</div>}
                  <h6 className="fw-semibold text-muted mb-3">Student Details</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Full Name *</label>
                      <input className="form-control" required value={form.student_name}
                        onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input type="email" className="form-control" required value={form.student_email}
                        onChange={e => setForm(f => ({ ...f, student_email: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone *</label>
                      <input className="form-control" required value={form.student_phone}
                        onChange={e => setForm(f => ({ ...f, student_phone: e.target.value }))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">College Name</label>
                      <input className="form-control" value={form.college_name}
                        onChange={e => setForm(f => ({ ...f, college_name: e.target.value }))} />
                    </div>
                  </div>

                  <h6 className="fw-semibold text-muted mb-3">Course & Batch</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label">Course *</label>
                      <select className="form-select" required value={form.course_id}
                        onChange={e => handleCourseChange(e.target.value)}>
                        <option value="">— Select Course —</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Batch</label>
                      <select className="form-select" value={form.batch_id}
                        onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}>
                        <option value="">— No Batch —</option>
                        {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <h6 className="fw-semibold text-muted mb-3">Fee & Payment</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-5">
                      <label className="form-label">Coupon Code</label>
                      <div className="input-group">
                        <input className="form-control" placeholder="Enter code" value={form.coupon_code}
                          onChange={e => { setForm(f => ({ ...f, coupon_code: e.target.value })); setCouponInfo(null); setCouponMsg(''); }} />
                        <button type="button" className="btn btn-outline-secondary" onClick={verifyCoupon}>Apply</button>
                      </div>
                      {couponMsg && <small className={couponInfo ? 'text-success' : 'text-danger'}>{couponMsg}</small>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Payment Method</label>
                      <select className="form-select" value={form.payment_method}
                        onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Installments</label>
                      <input type="number" min={1} max={12} className="form-control" value={form.installment_count}
                        onChange={e => setForm(f => ({ ...f, installment_count: Number(e.target.value) }))} />
                    </div>
                  </div>

                  {selectedCourse && (
                    <div className="alert alert-info">
                      <div className="d-flex justify-content-between">
                        <span>Course Fee:</span><strong>₹{fees.total.toLocaleString()}</strong>
                      </div>
                      {fees.discount > 0 && (
                        <div className="d-flex justify-content-between text-success">
                          <span>Discount:</span><strong>- ₹{fees.discount.toLocaleString()}</strong>
                        </div>
                      )}
                      <div className="d-flex justify-content-between fw-bold border-top mt-2 pt-2">
                        <span>Final Fee:</span><span>₹{fees.final.toLocaleString()}</span>
                      </div>
                      {form.installment_count > 1 && (
                        <div className="d-flex justify-content-between text-muted small mt-1">
                          <span>Per Installment (~):</span>
                          <span>₹{Math.ceil(fees.final / form.installment_count).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Admission'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / Installment Modal ── */}
      {showDetail && selected && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Admission #{selected.id}</h5>
                <button className="btn-close" onClick={() => { setShowDetail(false); setPayingInstall(null); }} />
              </div>
              <div className="modal-body">
                {payMsg && <div className={`alert ${payMsg.includes('ecorded') ? 'alert-success' : 'alert-danger'} py-2`}>{payMsg}</div>}

                {/* Cancellation / refund summary */}
                {selected.admission_status === 'cancelled' && (
                  <div className="alert alert-secondary py-2">
                    <div className="fw-semibold mb-1">
                      Cancelled{selected.cancelled_at ? ` on ${String(selected.cancelled_at).slice(0, 10)}` : ''}
                      {cancellerName(selected) ? ` by ${cancellerName(selected)}` : ''}
                    </div>
                    {Number(selected.refund_amount) > 0 ? (
                      <div className="small">
                        Refund: <strong>{maskAmount(Number(selected.refund_amount), feesVisible)}</strong>
                        {selected.refund_mode ? ` · ${selected.refund_mode}` : ''}
                        {selected.refund_reason ? ` · ${selected.refund_reason}` : ''}
                      </div>
                    ) : (
                      <div className="small text-muted">
                        No refund issued.{selected.refund_reason ? ` ${selected.refund_reason}` : ''}
                      </div>
                    )}
                  </div>
                )}

                {/* Student info */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="text-muted small">Student</label>
                    <div className="fw-semibold">{selected.student_name}</div>
                    <div className="text-muted small">{selected.student_email} · {selected.student_phone}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="text-muted small">Course</label>
                    <div>{selected.course?.name || '—'}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="text-muted small">Batch</label>
                    <div>{selected.batch?.name || '—'}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="text-muted small">Total Fees</label>
                    <div>{maskAmount(selected.total_fees, feesVisible)}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="text-muted small">Final Fees</label>
                    <div className="fw-semibold">{maskAmount(selected.final_fees, feesVisible)}</div>
                  </div>
                  <div className="col-md-3">
                    <label className="text-muted small">Payment</label>
                    <div><span className={`badge ${payColor[selected.payment_status] || 'bg-secondary'}`}>{selected.payment_status}</span></div>
                  </div>
                  <div className="col-md-3">
                    <label className="text-muted small">Status</label>
                    <div><span className={`badge ${statusColor[selected.admission_status] || 'bg-secondary'}`}>{selected.admission_status}</span></div>
                  </div>
                </div>

                {/* Installments */}
                <h6 className="fw-semibold mb-3">Fee Installments</h6>
                {(!selected.installments || selected.installments.length === 0) ? (
                  <p className="text-muted">No installments.</p>
                ) : (
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr><th>#</th><th>Amount</th><th>Due Date</th><th>Paid</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {selected.installments.map(inst => (
                        <tr key={inst.id}>
                          <td>{inst.installment_number}</td>
                          <td>{maskAmount(inst.amount, feesVisible)}</td>
                          <td className="small">{inst.due_date?.slice(0, 10)}</td>
                          <td>{maskAmount(inst.paid_amount, feesVisible)}</td>
                          <td><span className={`badge ${inst.status === 'paid' ? 'bg-success' : inst.status === 'partial' ? 'bg-info' : inst.status === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'}`}>{inst.status}</span></td>
                          <td>
                            {inst.status !== 'paid' && (
                              payingInstall?.id === inst.id ? (
                                <div className="d-flex gap-1">
                                  <input type="number" className="form-control form-control-sm" style={{ width: 90 }}
                                    placeholder="Amount" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                                  <button className="btn btn-sm btn-success" onClick={payInstallment}>Pay</button>
                                  <button className="btn btn-sm btn-secondary" onClick={() => setPayingInstall(null)}>X</button>
                                </div>
                              ) : (
                                <button className="btn btn-sm btn-outline-success" onClick={() => { setPayingInstall(inst); setPayAmount(String(inst.amount - (inst.paid_amount || 0))); }}>
                                  Mark Paid
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                {isCancellable(selected.admission_status) && (
                  <button className="btn btn-outline-danger me-auto" onClick={() => openCancel(selected)}>
                    Cancel admission
                  </button>
                )}
                {selected.admission_status === 'pending' && (
                  <button className="btn btn-success" onClick={() => approveAdmission(selected.id)}>
                    Approve & Create Account
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => { setShowDetail(false); setPayingInstall(null); setPayMsg(''); }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Admission Modal ── */}
      {showCancel && cancelTarget && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel admission #{cancelTarget.id}</h5>
                <button className="btn-close" onClick={() => setShowCancel(false)} />
              </div>
              <div className="modal-body">
                {cancelMsg && <div className="alert alert-danger py-2">{cancelMsg}</div>}
                <p className="mb-2">
                  Cancel the admission for <strong>{cancelTarget.student_name}</strong>
                  {cancelTarget.course?.name ? <> · {cancelTarget.course.name}</> : null}.
                </p>
                <div className="alert alert-warning py-2 small mb-3">
                  This deactivates the student&apos;s account, drops them from their batch, and waives any unpaid installments. Reversible by reactivating the student.
                </div>
                <div className="d-flex justify-content-between small mb-3">
                  <span className="text-muted">Paid so far</span>
                  <strong>{maskAmount(paidOf(cancelTarget), feesVisible)}</strong>
                </div>

                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" id="issueRefundChk" checked={issueRefund}
                    onChange={e => setIssueRefund(e.target.checked)} />
                  <label className="form-check-label fw-semibold" htmlFor="issueRefundChk">Issue a refund</label>
                </div>

                {issueRefund && (
                  <div className="row g-2 mb-3">
                    <div className="col-7">
                      <label className="form-label small mb-1">Refund amount (₹)</label>
                      <input type="number" min={0} max={paidOf(cancelTarget)} className="form-control"
                        value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
                      <small className="text-muted">Up to {maskAmount(paidOf(cancelTarget), feesVisible)}</small>
                    </div>
                    <div className="col-5">
                      <label className="form-label small mb-1">Mode</label>
                      <select className="form-select" value={refundMode} onChange={e => setRefundMode(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="cheque">Cheque</option>
                        <option value="bank_transfer">Bank transfer</option>
                      </select>
                    </div>
                  </div>
                )}

                <label className="form-label small mb-1">Reason {issueRefund ? '' : '(optional)'}</label>
                <textarea className="form-control" rows={2} value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="Why is this admission being cancelled?" />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCancel(false)}>Keep admission</button>
                <button className="btn btn-danger" disabled={cancelling} onClick={confirmCancel}>
                  {cancelling
                    ? 'Cancelling…'
                    : (issueRefund && Number(refundAmount) > 0
                        ? `Cancel & refund ${maskAmount(Number(refundAmount), feesVisible)}`
                        : 'Cancel admission')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
