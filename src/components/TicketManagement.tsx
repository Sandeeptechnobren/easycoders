'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import PermissionGuard from '@/components/PermissionGuard';
import { fetchWithAuth } from '@/lib/api';
import { useHasPermission } from '@/lib/permissions';
import styles from './ticketManagement.module.css';

const BASE = 'https://api.easycoders.in/api';

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
  category?: { id: number; name: string };
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
type Staff = { id: number; name: string; email?: string; role: string };

const ROLE_NAMES: Record<string, string> = {
  '1': 'Admin', 'admin': 'Admin', '2': 'HR', 'hr': 'HR',
  '3': 'Student', 'student': 'Student', '4': 'Trainer', 'trainer': 'Trainer',
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
const fmtStatus = (s: string) => (s || '').replace(/_/g, ' ');
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function TicketManagement() {
  const canAssign = useHasPermission(['manage_queries']); // admins/HR; trainers (respond_queries only) → false

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staff, setStaff]     = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [selected, setSelected]     = useState<Ticket | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deepHandled, setDeepHandled] = useState(false);

  const [assignUserId, setAssignUserId] = useState('');
  const [assignMsg, setAssignMsg]       = useState('');

  const [replyText, setReplyText]       = useState('');
  const [closeTicket, setCloseTicket]   = useState(false);
  const [markResolved, setMarkResolved] = useState(false);
  const [replying, setReplying]         = useState(false);
  const [replyMsg, setReplyMsg]         = useState('');

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus)   params.append('status',   filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      const res = await fetchWithAuth(`${BASE}/tickets?${params}`);
      const paginator = res.data;
      setTickets(Array.isArray(paginator) ? paginator : (paginator?.data ?? []));
    } catch (e: unknown) {
      setTickets([]);
      setLoadError(e instanceof Error ? e.message : 'Could not load tickets.');
    } finally { setLoading(false); }
  }, [filterStatus, filterPriority]);

  useEffect(() => { load(); }, [load]);

  // Eligible assignees (non-students). Only needed when the user can assign.
  useEffect(() => {
    if (!canAssign) return;
    (async () => {
      try {
        const res = await fetchWithAuth(`${BASE}/commanAPIs/users?limit=200`);
        const all = (res.data || []) as Staff[];
        setStaff(all.filter(u => !isStudentRole(u.role)));
      } catch { setStaff([]); }
    })();
  }, [canAssign]);

  const openById = useCallback(async (id: number) => {
    try {
      const res = await fetchWithAuth(`${BASE}/tickets/${id}`);
      const t = (res.data || null) as Ticket | null;
      setSelected(t);
      setAssignUserId(String(t?.assignedTo?.id || ''));
    } catch { /* ignore */ }
    setReplyText(''); setCloseTicket(false); setMarkResolved(false); setReplyMsg(''); setAssignMsg('');
    setShowDetail(true);
  }, []);

  // Deep-link: a notification routes here with ?ticket=<id> — auto-open it once.
  useEffect(() => {
    if (deepHandled || loading) return;
    const id = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ticket') : null;
    if (id) { setDeepHandled(true); openById(Number(id)); }
  }, [loading, deepHandled, openById]);

  const assignTicket = async () => {
    if (!selected || !assignUserId) return;
    setAssignMsg('');
    try {
      await fetchWithAuth(`${BASE}/tickets/${selected.id}/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: Number(assignUserId) }),
      });
      setAssignMsg('Assigned.');
      await openById(selected.id);
      load();
    } catch (e: unknown) { setAssignMsg(e instanceof Error ? e.message : 'Failed.'); }
  };

  const respond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    setReplying(true); setReplyMsg('');
    try {
      await fetchWithAuth(`${BASE}/tickets/${selected.id}/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText, close_ticket: closeTicket, mark_resolved: markResolved }),
      });
      const id = selected.id;
      setReplyText(''); setCloseTicket(false); setMarkResolved(false); setReplyMsg('Response sent.');
      await openById(id);
      load();
    } catch (e: unknown) { setReplyMsg(e instanceof Error ? e.message : 'Failed.'); }
    finally { setReplying(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(t =>
      [t.title, t.ticket_id, t.student?.name, t.student?.email, t.category?.name]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    );
  }, [tickets, query]);

  const openCount       = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length;
  const resolvedCount   = tickets.filter(t => t.status === 'resolved').length;

  return (
    <PermissionGuard requires={['manage_queries', 'respond_queries']} fallback={
      <div className={styles.fallback}>
        <h4>No access to tickets</h4>
        <p>You need <code>manage_queries</code> or <code>respond_queries</code>. Ask an admin to grant it from the Permissions page.</p>
      </div>
    }>
      <div className={styles.wrap}>
        <div className={styles.inner}>

          <div className={styles.header}>
            <div className={styles.eyebrow}>● Support</div>
            <h1 className={styles.title}>Tickets &amp; Queries</h1>
            <div className={styles.sub}>{canAssign ? 'Triage student support requests, assign a responder and reply.' : 'Respond to the tickets assigned to you.'}</div>
            {!canAssign && <div className={styles.note}>You&apos;re viewing the tickets assigned to you.</div>}
          </div>

          <div className={styles.stats}>
            {[
              { lbl: 'Open', val: openCount, c: '#E8A020', f: 'open' },
              { lbl: 'In Progress', val: inProgressCount, c: '#4338CA', f: 'in_progress' },
              { lbl: 'Resolved', val: resolvedCount, c: '#16a34a', f: 'resolved' },
              { lbl: 'Total', val: tickets.length, c: '#185fa5', f: '' },
            ].map(s => (
              <button key={s.lbl} className={styles.stat} style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }} onClick={() => setFilterStatus(s.f)}>
                <span className={styles.statBar} style={{ background: s.c }} />
                <div className={styles.statVal} style={{ color: s.c }}>{s.val}</div>
                <div className={styles.statLbl}>{s.lbl}</div>
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.search}>
              <span className={styles.searchIcon}>⌕</span>
              <input className={styles.searchIn} placeholder="Search by student, title, ticket ID, category…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <select className={styles.sel} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className={styles.sel} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={load}>Refresh</button>
          </div>

          {loadError && <div className={`${styles.alert} ${styles.alertErr}`}>{loadError}</div>}

          <div className={styles.panel}>
            {loading ? (
              <div className={styles.state}>Loading tickets…</div>
            ) : filtered.length === 0 ? (
              <div className={styles.state}>{tickets.length === 0 ? 'No tickets found.' : 'No tickets match your search/filters.'}</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ticket</th><th>Student</th><th>Title</th><th>Category</th>
                      <th>Priority</th><th>Status</th><th>Assigned To</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id}>
                        <td><span className={styles.code}>{t.ticket_id}</span></td>
                        <td><div className={styles.uName}>{t.student?.name || '—'}</div><div className={styles.uMail}>{t.student?.email}</div></td>
                        <td>{t.title}</td>
                        <td>{t.category?.name ? <span className={styles.catPill}>{t.category.name}</span> : <span className={styles.muted}>—</span>}</td>
                        <td><span className={`${styles.badge} ${styles[`pr_${t.priority}`] || ''}`}>{t.priority}</span></td>
                        <td><span className={`${styles.badge} ${styles[`st_${t.status}`] || ''}`}>{fmtStatus(t.status)}</span></td>
                        <td className={styles.muted}>{t.assignedTo?.name || <span style={{ color: '#94A3B8' }}>Unassigned</span>}</td>
                        <td className={styles.muted}>{fmtDate(t.created_at)}</td>
                        <td style={{ textAlign: 'right' }}><button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => openById(t.id)}>Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail modal ── */}
      {showDetail && selected && (
        <div className={styles.backdrop} onClick={() => setShowDetail(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <div>
                <h2 className={styles.mTitle}>{selected.title}</h2>
                <div className={styles.mSub}>{selected.ticket_id} · {selected.student?.name} · {selected.category?.name || 'General'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`${styles.badge} ${styles[`pr_${selected.priority}`] || ''}`}>{selected.priority}</span>
                <span className={`${styles.badge} ${styles[`st_${selected.status}`] || ''}`}>{fmtStatus(selected.status)}</span>
                <button className={styles.mClose} onClick={() => setShowDetail(false)} aria-label="Close">✕</button>
              </div>
            </div>

            <div className={styles.mBody}>
              {/* Conversation */}
              <div>
                <div className={styles.bubble}>
                  <div className={styles.bubbleHead}>
                    <span className={styles.bubbleName}>{selected.student?.name || 'Student'}</span>
                    <span className={styles.bubbleTime}>{fmtDate(selected.created_at)}</span>
                  </div>
                  <div className={styles.bubbleMsg}>{selected.description}</div>
                </div>

                {(selected.responses || []).map(r => {
                  const student = isStudentRole(r.responder?.role);
                  return (
                    <div key={r.id} className={`${styles.bubble} ${student ? '' : styles.bubbleStaff}`}>
                      <div className={styles.bubbleHead}>
                        <span className={styles.bubbleName}>
                          {r.responder?.name || 'Staff'}
                          {!student && <span className={styles.bubbleRole}>{roleLabel(r.responder?.role)}</span>}
                        </span>
                        <span className={styles.bubbleTime}>{(r.created_at || '').slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <div className={styles.bubbleMsg}>{r.message}</div>
                    </div>
                  );
                })}

                {selected.status !== 'closed' ? (
                  <form onSubmit={respond} className={styles.replyArea}>
                    {replyMsg && <div className={`${styles.alert} ${replyMsg.includes('sent') ? styles.alertOk : styles.alertErr}`}>{replyMsg}</div>}
                    <textarea className={styles.ta} rows={3} placeholder="Write a response…" value={replyText} onChange={e => setReplyText(e.target.value)} required />
                    <div className={styles.replyRow}>
                      <div className={styles.checks}>
                        <label className={styles.check}>
                          <input type="checkbox" checked={markResolved} onChange={e => { setMarkResolved(e.target.checked); if (e.target.checked) setCloseTicket(false); }} />
                          Mark as resolved
                        </label>
                        <label className={styles.check}>
                          <input type="checkbox" checked={closeTicket} onChange={e => { setCloseTicket(e.target.checked); if (e.target.checked) setMarkResolved(false); }} />
                          Close after response
                        </label>
                      </div>
                      <button type="submit" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} disabled={replying}>{replying ? 'Sending…' : 'Send response'}</button>
                    </div>
                  </form>
                ) : (
                  <div className={`${styles.alert}`} style={{ background: '#F1F5F9', color: '#475569' }}>This ticket is closed{selected.closed_at ? ` · ${fmtDate(selected.closed_at)}` : ''}.</div>
                )}
              </div>

              {/* Side */}
              <div className={styles.side}>
                <div className={styles.sideTitle}>Ticket info</div>
                {canAssign && (
                  <div style={{ marginBottom: 14 }}>
                    <div className={styles.metaKey} style={{ marginBottom: 6 }}>Assign to</div>
                    <div className={styles.assignRow}>
                      <select className={styles.sel} value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} · {roleLabel(s.role)}</option>)}
                      </select>
                      <button className={`${styles.btn} ${styles.btnGold} ${styles.btnSm}`} onClick={assignTicket}>Assign</button>
                    </div>
                    {assignMsg && <div style={{ fontSize: 12, marginTop: 4, color: assignMsg === 'Assigned.' ? '#166534' : '#991B1B' }}>{assignMsg}</div>}
                  </div>
                )}
                <div className={styles.metaRow}><span className={styles.metaKey}>Student</span><span>{selected.student?.name || '—'}</span></div>
                <div className={styles.metaRow}><span className={styles.metaKey}>Email</span><span style={{ fontSize: 12 }}>{selected.student?.email || '—'}</span></div>
                <div className={styles.metaRow}><span className={styles.metaKey}>Assigned</span><span>{selected.assignedTo?.name || 'Unassigned'}</span></div>
                <div className={styles.metaRow}><span className={styles.metaKey}>Responses</span><span>{(selected.responses || []).length}</span></div>
                <div className={styles.metaRow}><span className={styles.metaKey}>Opened</span><span>{fmtDate(selected.created_at)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
