'use client';

import { useEffect, useState, useCallback } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

// ─── Types ──────────────────────────────────────────────────────────────────
type Ticket = {
  id: number;
  ticket_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  student?: { id: number; name: string; email: string };
  assignedTo?: { id: number; name: string };
  responses?: TicketResponse[];
  created_at: string;
  closed_at?: string;
};
type TicketResponse = {
  id: number;
  message: string;
  responder?: { id: number; name: string; role: string };
  created_at: string;
};
type Staff = { id: number; name: string; email?: string; phone?: string; role: string };

// ─── Helpers ────────────────────────────────────────────────────────────────
// Map both numeric ('1'..'4') and string ('admin'/'hr'/'student'/'trainer')
// role values to a human label. Duplicates the helper in
// AttendanceManagement; will dedupe to a shared module in a later cleanup.
const ROLE_NAMES: Record<string, string> = {
  '1': 'Admin',   'admin':   'Admin',
  '2': 'HR',      'hr':      'HR',
  '3': 'Student', 'student': 'Student',
  '4': 'Trainer', 'trainer': 'Trainer',
};
const roleLabel = (role?: string | number | null): string => {
  if (role === null || role === undefined || role === '') return '—';
  const key = String(role).trim().toLowerCase();
  return ROLE_NAMES[key] || (key.charAt(0).toUpperCase() + key.slice(1));
};
const isStudentRole = (role?: string | number | null): boolean => {
  const key = String(role ?? '').trim().toLowerCase();
  return key === 'student' || key === '3';
};

const statusColor: Record<string, string> = {
  open:         'bg-warning text-dark',
  assigned:     'bg-primary',
  in_progress:  'bg-info',
  resolved:     'bg-success',
  closed:       'bg-secondary',
};
const priorityColor: Record<string, string> = {
  low: 'bg-success', medium: 'bg-warning text-dark', high: 'bg-danger',
};
const formatStatus = (s: string) => (s || '').replace(/_/g, ' ');

// ─── Component ──────────────────────────────────────────────────────────────
//
// Shared ticket-management surface. Mounted at both /admin/tickets and
// /hr/tickets. (Phase 3 will mount a slimmer view at /trainer/tickets.)
// Gated by the manage_queries permission, so any user the admin grants this
// to (role-wide via Spatie OR per-user via UserPermissionOverride) sees it.
export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff]     = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [selected, setSelected]     = useState<Ticket | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Assign
  const [assignUserId, setAssignUserId] = useState('');
  const [assignMsg, setAssignMsg]       = useState('');

  // Respond
  const [replyText, setReplyText]     = useState('');
  const [closeTicket, setCloseTicket] = useState(false);
  const [markResolved, setMarkResolved] = useState(false);
  const [replying, setReplying]       = useState(false);
  const [replyMsg, setReplyMsg]       = useState('');

  // ── Load ticket list ─────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus)   params.append('status',   filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      const res = await fetchWithAuth(`${BASE}/tickets?${params}`);
      const paginator = res.data;
      const list: Ticket[] = Array.isArray(paginator)
        ? paginator
        : (paginator?.data ?? []);
      setTickets(list);
    } catch (e: any) {
      setTickets([]);
      setLoadError(e?.message || 'Could not load tickets.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPriority]);

  useEffect(() => { load(); }, [load]);

  // ── Load eligible assignees (admin / HR / trainer — anyone non-student) ──
  // Previously this fetched ?role=hr which excluded trainers. Now we pull a
  // broader set and filter out students client-side so any staff member —
  // including trainers granted manage_queries — can be picked.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(`${BASE}/commanAPIs/users?limit=200`);
        const all = (res.data || []) as Staff[];
        const eligible = all.filter((u) => !isStudentRole(u.role));
        setStaff(eligible);
      } catch {
        setStaff([]);
      }
    })();
  }, []);

  const openDetail = async (t: Ticket) => {
    try {
      const res = await fetchWithAuth(`${BASE}/tickets/${t.id}`);
      setSelected(res.data || t);
    } catch {
      setSelected(t);
    }
    setReplyText(''); setCloseTicket(false); setMarkResolved(false); setReplyMsg(''); setAssignMsg('');
    setAssignUserId(String(t.assignedTo?.id || ''));
    setShowDetail(true);
  };

  const assignTicket = async () => {
    if (!selected || !assignUserId) return;
    setAssignMsg('');
    try {
      await fetchWithAuth(`${BASE}/tickets/${selected.id}/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: Number(assignUserId) }),
      });
      setAssignMsg('Assigned.');
      const res = await fetchWithAuth(`${BASE}/tickets/${selected.id}`);
      setSelected(res.data || selected);
      load();
    } catch (e: any) {
      setAssignMsg(e?.message || 'Failed.');
    }
  };

  const respond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    setReplying(true); setReplyMsg('');
    try {
      await fetchWithAuth(`${BASE}/tickets/${selected.id}/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          close_ticket:   closeTicket,
          mark_resolved:  markResolved,
        }),
      });
      setReplyText(''); setCloseTicket(false); setMarkResolved(false);
      setReplyMsg('Response sent.');
      const res = await fetchWithAuth(`${BASE}/tickets/${selected.id}`);
      setSelected(res.data || selected);
      load();
    } catch (e: any) {
      setReplyMsg(e?.message || 'Failed.');
    } finally {
      setReplying(false);
    }
  };

  const openCount       = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length;
  const resolvedCount   = tickets.filter(t => t.status === 'resolved').length;

  return (
    <PermissionGuard requires={['manage_queries', 'respond_queries']} fallback={
      <div className="container py-5 text-center">
        <h4 className="text-muted">No access to tickets</h4>
        <p className="text-muted small">
          You need either <code>manage_queries</code> or <code>respond_queries</code> to
          access this page. Ask an admin to grant it from the Permissions page.
        </p>
      </div>
    }>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div>
              <h3 className="fw-bold mb-1">Tickets / Queries</h3>
              <p className="text-muted mb-0">Manage student support requests</p>
            </div>
            <div className="d-flex gap-3">
              <div className="text-center">
                <div className="fw-bold fs-5 text-warning">{openCount}</div>
                <small className="text-muted">Open</small>
              </div>
              <div className="text-center">
                <div className="fw-bold fs-5 text-info">{inProgressCount}</div>
                <small className="text-muted">In Progress</small>
              </div>
              <div className="text-center">
                <div className="fw-bold fs-5 text-success">{resolvedCount}</div>
                <small className="text-muted">Resolved</small>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="d-flex gap-3 mb-4 flex-wrap">
            <select className="form-select" style={{ maxWidth: 200 }} value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="form-select" style={{ maxWidth: 200 }} value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className="btn btn-outline-secondary" onClick={load}>Refresh</button>
          </div>

          {loadError && (
            <div className="alert alert-danger py-2 small">{loadError}</div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center py-5 text-muted">Loading...</div>
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Ticket ID</th>
                      <th>Student</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr><td colSpan={8} className="text-center text-muted py-4">No tickets found.</td></tr>
                    ) : tickets.map(t => (
                      <tr key={t.id}>
                        <td><code className="small">{t.ticket_id}</code></td>
                        <td>
                          <div className="fw-semibold">{t.student?.name || '—'}</div>
                          <small className="text-muted">{t.student?.email}</small>
                        </td>
                        <td>{t.title}</td>
                        <td><span className={`badge ${priorityColor[t.priority] || 'bg-secondary'}`}>{t.priority}</span></td>
                        <td><span className={`badge ${statusColor[t.status] || 'bg-secondary'}`}>{formatStatus(t.status)}</span></td>
                        <td>{t.assignedTo?.name || <span className="text-muted">Unassigned</span>}</td>
                        <td className="small text-muted">{t.created_at?.slice(0, 10)}</td>
                        <td><button className="btn btn-sm btn-outline-primary" onClick={() => openDetail(t)}>Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ticket Detail Modal ── */}
      {showDetail && selected && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0">{selected.title}</h5>
                  <small className="text-muted">{selected.ticket_id} · {selected.student?.name}</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span className={`badge ${priorityColor[selected.priority]}`}>{selected.priority}</span>
                  <span className={`badge ${statusColor[selected.status]}`}>{formatStatus(selected.status)}</span>
                  <button className="btn-close" onClick={() => setShowDetail(false)} />
                </div>
              </div>
              <div className="modal-body">
                <div className="row g-4">

                  {/* Left: conversation */}
                  <div className="col-md-8">
                    {/* Original message */}
                    <div className="border rounded p-3 mb-3 bg-light">
                      <div className="d-flex justify-content-between mb-2">
                        <strong>{selected.student?.name}</strong>
                        <small className="text-muted">{selected.created_at?.slice(0, 10)}</small>
                      </div>
                      <p className="mb-0">{selected.description}</p>
                    </div>

                    {/* Responses */}
                    {(selected.responses || []).map(r => {
                      const isStudent = isStudentRole(r.responder?.role);
                      return (
                        <div key={r.id} className={`border rounded p-3 mb-3 ${isStudent ? 'bg-light' : 'border-primary bg-primary bg-opacity-5'}`}>
                          <div className="d-flex justify-content-between mb-2">
                            <div>
                              <strong>{r.responder?.name || 'Staff'}</strong>
                              {!isStudent && (
                                <span className="badge bg-primary ms-2 small">{roleLabel(r.responder?.role)}</span>
                              )}
                            </div>
                            <small className="text-muted">{r.created_at?.slice(0, 16)?.replace('T', ' ')}</small>
                          </div>
                          <p className="mb-0">{r.message}</p>
                        </div>
                      );
                    })}

                    {/* Reply form */}
                    {selected.status !== 'closed' && (
                      <form onSubmit={respond} className="mt-3">
                        {replyMsg && <div className={`alert py-2 ${replyMsg.includes('sent') ? 'alert-success' : 'alert-danger'}`}>{replyMsg}</div>}
                        <textarea className="form-control mb-2" rows={3} placeholder="Write a response..."
                          value={replyText} onChange={e => setReplyText(e.target.value)} required />
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div className="d-flex gap-3 flex-wrap">
                            <div className="form-check">
                              <input type="checkbox" className="form-check-input" id="mark-resolved"
                                checked={markResolved}
                                onChange={e => { setMarkResolved(e.target.checked); if (e.target.checked) setCloseTicket(false); }} />
                              <label className="form-check-label" htmlFor="mark-resolved" title="Status → Resolved. Student confirms or reopens.">
                                Mark as Resolved
                              </label>
                            </div>
                            <div className="form-check">
                              <input type="checkbox" className="form-check-input" id="close-ticket"
                                checked={closeTicket}
                                onChange={e => { setCloseTicket(e.target.checked); if (e.target.checked) setMarkResolved(false); }} />
                              <label className="form-check-label" htmlFor="close-ticket" title="Status → Closed immediately. Skip student-confirm step.">
                                Close ticket after response
                              </label>
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={replying}>
                            {replying ? 'Sending...' : 'Send Response'}
                          </button>
                        </div>
                      </form>
                    )}
                    {selected.status === 'closed' && (
                      <div className="alert alert-secondary">This ticket is closed. Closed at: {selected.closed_at?.slice(0, 10) || '—'}</div>
                    )}
                  </div>

                  {/* Right: meta */}
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-header fw-semibold">Ticket Info</div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label text-muted small">Assign To</label>
                          <div className="d-flex gap-2">
                            <select className="form-select form-select-sm" value={assignUserId}
                              onChange={e => setAssignUserId(e.target.value)}>
                              <option value="">— Unassigned —</option>
                              {staff.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} · {roleLabel(s.role)}
                                </option>
                              ))}
                            </select>
                            <button className="btn btn-sm btn-outline-primary" onClick={assignTicket}>
                              Assign
                            </button>
                          </div>
                          {assignMsg && <small className={assignMsg === 'Assigned.' ? 'text-success' : 'text-danger'}>{assignMsg}</small>}
                          {staff.length === 0 && (
                            <small className="text-muted d-block mt-1">No eligible staff loaded — refresh, or grant <code>manage_queries</code> to a trainer first.</small>
                          )}
                        </div>
                        <div className="mb-2">
                          <span className="text-muted small">Student: </span>
                          <span>{selected.student?.name}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted small">Email: </span>
                          <span className="small">{selected.student?.email}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted small">Priority: </span>
                          <span className={`badge ${priorityColor[selected.priority]}`}>{selected.priority}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted small">Status: </span>
                          <span className={`badge ${statusColor[selected.status]}`}>{formatStatus(selected.status)}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-muted small">Responses: </span>
                          <span>{(selected.responses || []).length}</span>
                        </div>
                        <div>
                          <span className="text-muted small">Opened: </span>
                          <span className="small">{selected.created_at?.slice(0, 10)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
