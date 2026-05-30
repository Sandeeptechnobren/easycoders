'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import api from '@/lib/axios';
import Loader from '../../loader/page';

// ─── Types ──────────────────────────────────────────────────────────────────
type TicketResponse = {
  id: number;
  message: string;
  responder?: { id: number; name: string; role: string };
  created_at: string;
};
type Ticket = {
  id: number;
  ticket_id: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | string;
  priority?: string;
  task_category?: number;
  category?: { id: number; name: string };
  assignedTo?: { id: number; name: string };
  responses?: TicketResponse[];
  created_at: string;
  closed_at?: string;
};

// ─── Status display ─────────────────────────────────────────────────────────
// Five-state lifecycle (locked-in plan): open → assigned → in_progress →
// resolved → closed. The previous version collapsed everything to
// "Open / Resolved" which was misleading.
const STATUS_DISPLAY: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  open:         { label: 'Open',        icon: '🟡', bg: '#fffbeb', color: '#b45309' },
  assigned:     { label: 'Assigned',    icon: '🔵', bg: '#eff6ff', color: '#1d4ed8' },
  in_progress:  { label: 'In Progress', icon: '⏳', bg: '#e0f2fe', color: '#0369a1' },
  resolved:     { label: 'Resolved',    icon: '✨', bg: '#f0fdf4', color: '#15803d' },
  closed:       { label: 'Closed',      icon: '✅', bg: '#f1f5f9', color: '#475569' },
};
const statusFor = (s?: string) => STATUS_DISPLAY[s || ''] || { label: s || '—', icon: '·', bg: '#f1f5f9', color: '#475569' };

const formatDateTime = (s?: string) => {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return s; }
};
const formatDate = (s?: string) => {
  if (!s) return '';
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
};

export default function StudentTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal state
  const [addTicketPopup, setAddTicketPopup] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [title, setTitle]                   = useState('');
  const [task_category, setTaskCategory]    = useState('');
  const [description, setDescription]       = useState('');
  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Detail modal state
  const [detail, setDetail]             = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText]       = useState('');
  const [replying, setReplying]         = useState(false);
  const [replyMsg, setReplyMsg]         = useState('');
  const [acting, setActing]             = useState(false);
  const [actionMsg, setActionMsg]       = useState('');

  // ── Data loaders ────────────────────────────────────────────────────────
  const fetchTickets = () => {
    setLoading(true);
    api.get('/student/myTickets')
      .then(res => setTickets(res.data?.data ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  // Deep-link from a notification: /students/tickets?ticket=<id> → open it once.
  useEffect(() => {
    const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ticket') : null;
    if (!id) return;
    setDetailLoading(true);
    api.get(`/tickets/${id}`)
      .then(res => { const full = res.data?.data ?? res.data; if (full) setDetail(full); })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    api.get('/getTaskCategories')
      .then(res => setTaskCategories(res.data?.data ?? []))
      .catch(() => setTaskCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // ── Create ──────────────────────────────────────────────────────────────
  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    api.post('/student/createMyTicket', { title, description, task_category })
      .then(() => {
        fetchTickets();
        setAddTicketPopup(false);
        setTitle(''); setTaskCategory(''); setDescription('');
      })
      .finally(() => setSubmitting(false));
  };

  // ── Open detail ─────────────────────────────────────────────────────────
  const openDetail = async (t: Ticket) => {
    setDetail(t);
    setReplyText(''); setReplyMsg(''); setActionMsg('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/tickets/${t.id}`);
      const full = res.data?.data ?? res.data;
      if (full) setDetail(full);
    } catch {/* keep the row-level data */}
    finally { setDetailLoading(false); }
  };

  const refreshDetail = async () => {
    if (!detail) return;
    try {
      const res = await api.get(`/tickets/${detail.id}`);
      const full = res.data?.data ?? res.data;
      if (full) setDetail(full);
    } catch {}
    fetchTickets();
  };

  // ── Reply (student-side respond) ─────────────────────────────────────────
  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !replyText.trim()) return;
    setReplying(true); setReplyMsg('');
    try {
      await api.post(`/tickets/${detail.id}/respond`, { message: replyText });
      setReplyText('');
      setReplyMsg('Reply sent.');
      await refreshDetail();
    } catch (e: any) {
      setReplyMsg(e?.response?.data?.message || e?.message || 'Failed to send reply.');
    } finally { setReplying(false); }
  };

  // ── Reopen (student on resolved ticket) ──────────────────────────────────
  const reopen = async () => {
    if (!detail) return;
    if (!confirm('Reopen this ticket? It will go back to the admin queue for reassignment.')) return;
    setActing(true); setActionMsg('');
    try {
      await api.post(`/tickets/${detail.id}/reopen`);
      setActionMsg('Ticket reopened.');
      await refreshDetail();
    } catch (e: any) {
      setActionMsg(e?.response?.data?.message || e?.message || 'Reopen failed.');
    } finally { setActing(false); }
  };

  // ── Confirm close (student on resolved ticket) ───────────────────────────
  const confirmClose = async () => {
    if (!detail) return;
    if (!confirm('Mark this ticket as resolved and close it? You can still raise a new ticket if you need more help.')) return;
    setActing(true); setActionMsg('');
    try {
      await api.post(`/tickets/${detail.id}/student-close`);
      setActionMsg('Ticket closed. Thanks!');
      await refreshDetail();
    } catch (e: any) {
      setActionMsg(e?.response?.data?.message || e?.message || 'Close failed.');
    } finally { setActing(false); }
  };

  if (loading || loadingCategories) return <Loader />;

  // Stats — five-state aware
  const openCount     = tickets.filter(t => t.status === 'open').length;
  const inFlight      = tickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const closedCount   = tickets.filter(t => t.status === 'closed').length;

  return (
    <RoleGuard allowedRoles={[3]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .tkp * { box-sizing: border-box; margin: 0; padding: 0; }
        .tkp {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #f1f5f9; min-height: 100vh; padding: 32px 24px 48px;
        }

        /* Header */
        .tkp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .tkp-title-row { display: flex; align-items: center; gap: 13px; margin-bottom: 4px; }
        .tkp-icon { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#2563eb,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .tkp-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .tkp-sub { font-size: 13px; color: #64748b; margin-left: 55px; }
        .tkp-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #2563eb; color: #fff; border: none; border-radius: 11px;
          padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background 0.15s, transform 0.12s;
          white-space: nowrap; align-self: flex-start;
        }
        .tkp-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
        .tkp-btn:active { transform: scale(0.98); }
        .tkp-btn-plus { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; }

        /* Stats */
        .tkp-stats { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
        .tkp-stat { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; min-width: 130px; }
        .tkp-stat-ico { font-size: 20px; }
        .tkp-stat-val { font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1; }
        .tkp-stat-lbl { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* Table card */
        .tkp-card { background: #fff; border-radius: 18px; border: 1px solid #e2e8f0; overflow: hidden; }
        .tkp-table { width: 100%; border-collapse: collapse; }
        .tkp-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .tkp-table th { padding: 11px 16px; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
        .tkp-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background .12s; cursor: pointer; }
        .tkp-table tbody tr:last-child { border-bottom: none; }
        .tkp-table tbody tr:hover { background: #f8fafc; }
        .tkp-table td { padding: 14px 16px; vertical-align: middle; }

        .tkp-num { width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #64748b; }
        .tkp-tid { font-size: 12px; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 7px; padding: 3px 9px; display: inline-block; }
        .tkp-ticket-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .tkp-desc { font-size: 12px; color: #64748b; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tkp-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .tkp-date { font-size: 12px; color: #94a3b8; }
        .tkp-open-link { font-size: 11px; color: #2563eb; font-weight: 700; }

        /* Empty */
        .tkp-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
        .tkp-empty-ico { width: 72px; height: 72px; border-radius: 20px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px; }
        .tkp-empty-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .tkp-empty-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; }
        .tkp-empty-cta { margin-top: 20px; display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }

        /* Modal overlay */
        .tkp-modal-bg {
          position: fixed; inset: 0; background: rgba(15,23,42,0.65);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; padding: 24px;
        }
        .tkp-modal {
          background: #fff; border-radius: 20px; width: 100%; max-width: 720px;
          max-height: calc(100vh - 48px);
          overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          animation: slideUp 0.2s ease;
          display: flex; flex-direction: column;
        }
        .tkp-modal-sm { max-width: 540px; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .tkp-modal-head {
          padding: 18px 24px; border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
        }
        .tkp-modal-title { font-size: 16px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .tkp-modal-title-ico { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
        .tkp-modal-title-text { min-width: 0; }
        .tkp-modal-title-text .t1 { font-size: 14px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tkp-modal-title-text .t2 { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
        .tkp-close { width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #64748b; transition: background .15s; flex-shrink: 0; }
        .tkp-close:hover { background: #e2e8f0; }
        .tkp-modal-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex: 1; }
        .tkp-modal-foot {
          padding: 14px 24px; border-top: 1px solid #f1f5f9;
          display: flex; justify-content: flex-end; gap: 10px;
          background: #fafafa;
          flex-wrap: wrap;
        }

        /* Thread */
        .tkp-msg { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
        .tkp-msg.staff { background: #eff6ff; border-color: #bfdbfe; }
        .tkp-msg.student { background: #fafafa; }
        .tkp-msg-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; gap: 8px; flex-wrap: wrap; }
        .tkp-msg-author { font-size: 13px; font-weight: 700; color: #0f172a; }
        .tkp-msg-role { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; background: #dbeafe; color: #1d4ed8; margin-left: 6px; }
        .tkp-msg-when { font-size: 11px; color: #94a3b8; }
        .tkp-msg-body { font-size: 13px; color: #334155; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }

        /* Form bits */
        .tkp-field { display: flex; flex-direction: column; gap: 6px; }
        .tkp-label { font-size: 12px; font-weight: 700; color: #374151; }
        .tkp-input, .tkp-select, .tkp-textarea {
          width: 100%; padding: 10px 13px; border: 1px solid #e2e8f0;
          border-radius: 10px; font-size: 13px; color: #1e293b;
          font-family: inherit; outline: none; background: #fff;
          transition: border-color .15s, box-shadow .15s;
        }
        .tkp-input:focus, .tkp-select:focus, .tkp-textarea:focus {
          border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(37,99,235,.08);
        }
        .tkp-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }
        .tkp-select { appearance: none; cursor: pointer; }

        .tkp-cancel {
          padding: 9px 18px; border: 1px solid #e2e8f0; border-radius: 10px;
          background: #fff; font-size: 13px; font-weight: 600; color: #64748b;
          cursor: pointer; font-family: inherit; transition: background .15s;
        }
        .tkp-cancel:hover { background: #f1f5f9; }
        .tkp-submit {
          padding: 9px 22px; background: #2563eb; border: none; border-radius: 10px;
          font-size: 13px; font-weight: 700; color: #fff; cursor: pointer;
          font-family: inherit; transition: background .15s, transform .12s;
          display: inline-flex; align-items: center; gap: 7px;
        }
        .tkp-submit:hover { background: #1d4ed8; }
        .tkp-submit:active { transform: scale(0.98); }
        .tkp-submit:disabled { background: #93c5fd; cursor: not-allowed; }
        .tkp-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .tkp-action-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .tkp-action {
          padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 700;
          cursor: pointer; font-family: inherit; border: 1px solid;
          transition: background .15s, transform .12s;
        }
        .tkp-action:active { transform: scale(0.98); }
        .tkp-action.reopen { border-color: #f59e0b; color: #b45309; background: #fffbeb; }
        .tkp-action.reopen:hover { background: #fef3c7; }
        .tkp-action.close-ok { border-color: #16a34a; color: #15803d; background: #f0fdf4; }
        .tkp-action.close-ok:hover { background: #dcfce7; }
        .tkp-action:disabled { opacity: .5; cursor: not-allowed; }

        .tkp-alert { padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
        .tkp-alert.ok  { background: #f0fdf4; color: #15803d; }
        .tkp-alert.err { background: #fef2f2; color: #b91c1c; }

        .tkp-meta-line { font-size: 12px; color: #64748b; }
        .tkp-meta-line strong { color: #0f172a; font-weight: 700; }
      `}</style>

      <div className="tkp">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div className="tkp-header">
            <div>
              <div className="tkp-title-row">
                <div className="tkp-icon">🎫</div>
                <div className="tkp-title">My Support Tickets</div>
              </div>
              <div className="tkp-sub">Raise tickets, view trainer responses, and reopen if needed</div>
            </div>
            <button className="tkp-btn" onClick={() => setAddTicketPopup(true)}>
              <span className="tkp-btn-plus">+</span>
              Raise Ticket
            </button>
          </div>

          {/* Stats — 4 meaningful buckets */}
          <div className="tkp-stats">
            <div className="tkp-stat">
              <span className="tkp-stat-ico">🎫</span>
              <div><div className="tkp-stat-val">{tickets.length}</div><div className="tkp-stat-lbl">Total</div></div>
            </div>
            <div className="tkp-stat">
              <span className="tkp-stat-ico">🟡</span>
              <div><div className="tkp-stat-val" style={{ color: '#d97706' }}>{openCount}</div><div className="tkp-stat-lbl">Open</div></div>
            </div>
            <div className="tkp-stat">
              <span className="tkp-stat-ico">⏳</span>
              <div><div className="tkp-stat-val" style={{ color: '#0369a1' }}>{inFlight}</div><div className="tkp-stat-lbl">In Progress</div></div>
            </div>
            <div className="tkp-stat">
              <span className="tkp-stat-ico">✨</span>
              <div><div className="tkp-stat-val" style={{ color: '#15803d' }}>{resolvedCount}</div><div className="tkp-stat-lbl">Resolved</div></div>
            </div>
            <div className="tkp-stat">
              <span className="tkp-stat-ico">✅</span>
              <div><div className="tkp-stat-val" style={{ color: '#475569' }}>{closedCount}</div><div className="tkp-stat-lbl">Closed</div></div>
            </div>
          </div>

          {/* Table */}
          <div className="tkp-card">
            {tickets.length === 0 ? (
              <div className="tkp-empty">
                <div className="tkp-empty-ico">📭</div>
                <div className="tkp-empty-title">No tickets raised yet</div>
                <div className="tkp-empty-desc">Need help from your trainer? Raise a support ticket and we'll get back to you.</div>
                <button className="tkp-empty-cta" onClick={() => setAddTicketPopup(true)}>
                  + Raise your first ticket
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tkp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Ticket ID</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Raised On</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, index) => {
                      const s = statusFor(ticket.status);
                      return (
                        <tr key={ticket.id} onClick={() => openDetail(ticket)}>
                          <td><div className="tkp-num">{index + 1}</div></td>
                          <td><span className="tkp-tid">#{ticket.ticket_id}</span></td>
                          <td><div className="tkp-ticket-title">{ticket.title}</div></td>
                          <td><div className="tkp-desc">{ticket.description}</div></td>
                          <td>
                            <span className="tkp-pill" style={{ background: s.bg, color: s.color }}>
                              <span>{s.icon}</span> {s.label}
                            </span>
                          </td>
                          <td><div className="tkp-date">{formatDate(ticket.created_at)}</div></td>
                          <td><span className="tkp-open-link">Open ›</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Create Modal ── */}
      {addTicketPopup && (
        <div className="tkp-modal-bg" onClick={() => setAddTicketPopup(false)}>
          <div className="tkp-modal tkp-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="tkp-modal-head">
              <div className="tkp-modal-title">
                <div className="tkp-modal-title-ico">🎫</div>
                Raise Support Ticket
              </div>
              <button className="tkp-close" onClick={() => setAddTicketPopup(false)}>✕</button>
            </div>
            <form onSubmit={handleTicketSubmit} style={{ display: 'contents' }}>
              <div className="tkp-modal-body">
                <div className="tkp-field">
                  <label className="tkp-label">Ticket Title</label>
                  <input className="tkp-input" placeholder="Short, clear description of your issue"
                    value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="tkp-field">
                  <label className="tkp-label">Category</label>
                  <select className="tkp-select" value={task_category}
                    onChange={e => setTaskCategory(e.target.value)} required>
                    <option value="">Select a category</option>
                    {taskCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="tkp-field">
                  <label className="tkp-label">Description</label>
                  <textarea className="tkp-textarea"
                    placeholder="Describe your issue in detail so your trainer can help you faster..."
                    value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
              </div>
              <div className="tkp-modal-foot">
                <button type="button" className="tkp-cancel" onClick={() => setAddTicketPopup(false)}>Cancel</button>
                <button type="submit" className="tkp-submit" disabled={submitting}>
                  {submitting ? <><span className="tkp-spinner" /> Submitting...</> : '🎫 Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Detail Modal (thread + reply + reopen/confirm-close) ── */}
      {detail && (
        <div className="tkp-modal-bg" onClick={() => setDetail(null)}>
          <div className="tkp-modal" onClick={e => e.stopPropagation()}>

            <div className="tkp-modal-head">
              <div className="tkp-modal-title">
                <div className="tkp-modal-title-ico">🎫</div>
                <div className="tkp-modal-title-text">
                  <div className="t1">{detail.title}</div>
                  <div className="t2">#{detail.ticket_id} · raised {formatDate(detail.created_at)}</div>
                </div>
              </div>
              <button className="tkp-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div className="tkp-modal-body">
              {/* Status + assignee + category */}
              <div className="tkp-meta-line">
                Status: <span className="tkp-pill" style={{ background: statusFor(detail.status).bg, color: statusFor(detail.status).color, marginLeft: 4 }}>
                  {statusFor(detail.status).icon} {statusFor(detail.status).label}
                </span>
                {detail.assignedTo && (
                  <span style={{ marginLeft: 14 }}>Assigned to: <strong>{detail.assignedTo.name}</strong></span>
                )}
                {detail.category && (
                  <span style={{ marginLeft: 14 }}>Category: <strong>{detail.category.name}</strong></span>
                )}
              </div>

              {/* Original message */}
              <div className="tkp-msg student">
                <div className="tkp-msg-head">
                  <span className="tkp-msg-author">You</span>
                  <span className="tkp-msg-when">{formatDateTime(detail.created_at)}</span>
                </div>
                <div className="tkp-msg-body">{detail.description}</div>
              </div>

              {/* Thread */}
              {detailLoading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading conversation…</div>}

              {(detail.responses || []).map(r => {
                const isStudent = String(r.responder?.role ?? '').toLowerCase() === 'student' || String(r.responder?.role ?? '') === '3';
                return (
                  <div key={r.id} className={`tkp-msg ${isStudent ? 'student' : 'staff'}`}>
                    <div className="tkp-msg-head">
                      <div>
                        <span className="tkp-msg-author">{isStudent ? 'You' : (r.responder?.name || 'Staff')}</span>
                        {!isStudent && r.responder?.role && (
                          <span className="tkp-msg-role">{String(r.responder.role).replace(/^\w/, c => c.toUpperCase())}</span>
                        )}
                      </div>
                      <span className="tkp-msg-when">{formatDateTime(r.created_at)}</span>
                    </div>
                    <div className="tkp-msg-body">{r.message}</div>
                  </div>
                );
              })}

              {(detail.responses || []).length === 0 && !detailLoading && (
                <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>
                  Waiting for a staff response…
                </div>
              )}

              {/* Inline alerts */}
              {replyMsg && <div className={`tkp-alert ${replyMsg.includes('sent') ? 'ok' : 'err'}`}>{replyMsg}</div>}
              {actionMsg && <div className={`tkp-alert ${actionMsg.includes('failed') || actionMsg.includes('Failed') ? 'err' : 'ok'}`}>{actionMsg}</div>}

              {/* Reply form (any non-closed state) */}
              {detail.status !== 'closed' && (
                <form onSubmit={submitReply} className="tkp-field">
                  <label className="tkp-label">Add a reply</label>
                  <textarea className="tkp-textarea"
                    placeholder="Type your reply…"
                    value={replyText} onChange={e => setReplyText(e.target.value)} required />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="tkp-submit" disabled={replying || !replyText.trim()}>
                      {replying ? <><span className="tkp-spinner" /> Sending…</> : 'Send Reply'}
                    </button>
                  </div>
                </form>
              )}

              {/* Resolved-state actions */}
              {detail.status === 'resolved' && (
                <div className="tkp-action-row">
                  <button className="tkp-action reopen" onClick={reopen} disabled={acting}>
                    🔄 Reopen Ticket
                  </button>
                  <button className="tkp-action close-ok" onClick={confirmClose} disabled={acting}>
                    ✅ Mark as Solved (Close)
                  </button>
                </div>
              )}

              {detail.status === 'closed' && (
                <div className="tkp-alert ok">
                  This ticket is closed. Closed on {formatDate(detail.closed_at) || '—'}.
                  Need more help? Raise a new ticket.
                </div>
              )}
            </div>

            <div className="tkp-modal-foot">
              <button className="tkp-cancel" onClick={() => setDetail(null)}>Close</button>
            </div>

          </div>
        </div>
      )}
    </RoleGuard>
  );
}
