'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../../loader/page';

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTicketPopup, setAddTicketPopup] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [task_category, setTaskCategory] = useState('');
  const [description, setDescription] = useState('');

  const [taskCategories, setTaskCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchTickets = () => {
    setLoading(true);
    api.get('/student/myTickets')
      .then(res => setTickets(res.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    api.get('/getTaskCategories')
      .then(res => setTaskCategories(res.data?.data ?? []))
      .finally(() => setLoadingCategories(false));
  }, []);

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

  if (loading || loadingCategories) return <Loader />;

  const openCount   = tickets.filter(t => t.status === 'open').length;
  const closedCount = tickets.filter(t => t.status !== 'open').length;

  return (
    <>
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
        .tkp-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background .12s; }
        .tkp-table tbody tr:last-child { border-bottom: none; }
        .tkp-table tbody tr:hover { background: #f8fafc; }
        .tkp-table td { padding: 14px 16px; vertical-align: middle; }

        .tkp-num { width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #64748b; }
        .tkp-tid { font-size: 12px; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 7px; padding: 3px 9px; display: inline-block; }
        .tkp-ticket-title { font-size: 13px; font-weight: 700; color: #0f172a; }
        .tkp-desc { font-size: 12px; color: #64748b; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tkp-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .tkp-date { font-size: 12px; color: #94a3b8; }

        /* Empty */
        .tkp-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 24px; text-align: center; }
        .tkp-empty-ico { width: 72px; height: 72px; border-radius: 20px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 16px; }
        .tkp-empty-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .tkp-empty-desc { font-size: 13px; color: #94a3b8; line-height: 1.6; }
        .tkp-empty-cta { margin-top: 20px; display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }

        /* Modal overlay — inline block, not fixed */
        .tkp-modal-bg {
          position: fixed; inset: 0; background: rgba(15,23,42,0.65);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; padding: 24px;
        }
        .tkp-modal {
          background: #fff; border-radius: 20px; width: 100%; max-width: 540px;
          overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .tkp-modal-head {
          padding: 22px 24px 18px; border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center; justify-content: space-between;
        }
        .tkp-modal-title { font-size: 17px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; }
        .tkp-modal-title-ico { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg,#2563eb,#7c3aed); display: flex; align-items: center; justify-content: center; font-size: 15px; }
        .tkp-close { width: 30px; height: 30px; border-radius: 8px; background: #f1f5f9; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #64748b; transition: background .15s; }
        .tkp-close:hover { background: #e2e8f0; }
        .tkp-modal-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; }
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
        .tkp-input::placeholder, .tkp-textarea::placeholder { color: #cbd5e1; }
        .tkp-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
        .tkp-select { appearance: none; cursor: pointer; }
        .tkp-modal-foot {
          padding: 16px 24px; border-top: 1px solid #f1f5f9;
          display: flex; justify-content: flex-end; gap: 10px;
          background: #fafafa;
        }
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
          display: flex; align-items: center; gap: 7px;
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
              <div className="tkp-sub">Raise and track your support requests</div>
            </div>
            <button className="tkp-btn" onClick={() => setAddTicketPopup(true)}>
              <span className="tkp-btn-plus">+</span>
              Raise Ticket
            </button>
          </div>

          {/* Stats */}
          <div className="tkp-stats">
            <div className="tkp-stat">
              <span className="tkp-stat-ico">🎫</span>
              <div><div className="tkp-stat-val">{tickets.length}</div><div className="tkp-stat-lbl">Total tickets</div></div>
            </div>
            <div className="tkp-stat">
              <span className="tkp-stat-ico">🟡</span>
              <div><div className="tkp-stat-val" style={{ color: '#d97706' }}>{openCount}</div><div className="tkp-stat-lbl">Open</div></div>
            </div>
            <div className="tkp-stat">
              <span className="tkp-stat-ico">✅</span>
              <div><div className="tkp-stat-val" style={{ color: '#16a34a' }}>{closedCount}</div><div className="tkp-stat-lbl">Resolved</div></div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket, index) => (
                      <tr key={ticket.id}>
                        <td><div className="tkp-num">{index + 1}</div></td>
                        <td><span className="tkp-tid">#{ticket.ticket_id}</span></td>
                        <td><div className="tkp-ticket-title">{ticket.title}</div></td>
                        <td><div className="tkp-desc">{ticket.description}</div></td>
                        <td>
                          <span
                            className="tkp-pill"
                            style={ticket.status === 'open'
                              ? { background: '#fffbeb', color: '#b45309' }
                              : { background: '#f0fdf4', color: '#15803d' }
                            }
                          >
                            {ticket.status === 'open' ? '🟡' : '✅'}
                            {ticket.status === 'open' ? 'Open' : 'Resolved'}
                          </span>
                        </td>
                        <td>
                          <div className="tkp-date">
                            {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal */}
      {addTicketPopup && (
        <div className="tkp-modal-bg" onClick={() => setAddTicketPopup(false)}>
          <div className="tkp-modal" onClick={e => e.stopPropagation()}>

            <div className="tkp-modal-head">
              <div className="tkp-modal-title">
                <div className="tkp-modal-title-ico">🎫</div>
                Raise Support Ticket
              </div>
              <button className="tkp-close" onClick={() => setAddTicketPopup(false)}>✕</button>
            </div>

            <form onSubmit={handleTicketSubmit}>
              <div className="tkp-modal-body">

                <div className="tkp-field">
                  <label className="tkp-label">Ticket Title</label>
                  <input
                    className="tkp-input"
                    placeholder="Short, clear description of your issue"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="tkp-field">
                  <label className="tkp-label">Category</label>
                  <select
                    className="tkp-select"
                    value={task_category}
                    onChange={e => setTaskCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    {taskCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="tkp-field">
                  <label className="tkp-label">Description</label>
                  <textarea
                    className="tkp-textarea"
                    placeholder="Describe your issue in detail so your trainer can help you faster..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>

              </div>

              <div className="tkp-modal-foot">
                <button type="button" className="tkp-cancel" onClick={() => setAddTicketPopup(false)}>
                  Cancel
                </button>
                <button type="submit" className="tkp-submit" disabled={submitting}>
                  {submitting
                    ? <><span className="tkp-spinner" /> Submitting...</>
                    : '🎫 Submit Ticket'
                  }
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}