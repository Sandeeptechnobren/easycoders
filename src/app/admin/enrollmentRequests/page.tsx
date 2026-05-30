'use client';

import RoleGuard from '@/components/RoleGuard';
import { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';
import styles from './enrollmentRequests.module.css';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/enrollmentRequests — Applications inbox.
 *
 * Public applications (Summer-Training popup / course "Apply") POST to
 * /api/addenrollmentrequest with status=pending. Admin reviews each request
 * with ALL submitted details (incl. the course), then APPROVES — which mints a
 * real student (reusing the admission flow: User role 3 + profile + enrolment
 * id + 7-day temp password + optional first payment + optional batch) and
 * returns credentials — or REJECTS with a reason.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  const d = (x as { data?: unknown } | null)?.data;
  if (Array.isArray(d)) return d as T[];
  const dd = (d as { data?: unknown } | null)?.data;
  if (Array.isArray(dd)) return dd as T[];
  return [];
}
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const payLabel = (m?: string) => (m === 'office' ? 'Pay at office' : m === 'qr' ? 'QR / UPI' : (m || '—'));

type ReqRow = {
  id: number;
  course_id?: number;
  course?: { id: number; title?: string };
  college?: string;
  name: string;
  email: string;
  phone_number: string;
  payment_method?: string;
  transaction_number?: string;
  status?: string;
  rejected_reason?: string;
  created_at?: string;
};
type Batch = { id: number; name: string; status?: string };
type Cred = { enrollment_id: string; email: string; password: string; expires_at?: string };

const STATUSES = ['pending', 'approved', 'rejected'];
const today = () => new Date().toISOString().slice(0, 10);

export default function EnrollmentRequestsPage() {
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selected, setSelected] = useState<ReqRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalErr, setModalErr] = useState('');
  const [cred, setCred] = useState<Cred | null>(null);
  const [copied, setCopied] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [form, setForm] = useState({ total_fee: '', first_payment_amount: '', first_payment_date: today(), next_due_date: '', batch_id: '' });

  const load = async () => {
    try {
      setLoading(true); setError('');
      const json = await fetchWithAuth(`${BASE}/admin/enrollment-requests`);
      setRows(asArray<ReqRow>(json));
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load requests.');
      setRows([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fetchWithAuth(`${BASE}/batches`).then(r => setBatches(asArray<Batch>(r))).catch(() => setBatches([]));
  }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => (r.status || 'pending') === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      const st = r.status || 'pending';
      const matchStatus = !statusFilter || st === statusFilter;
      const matchQuery = !q || [r.name, r.email, r.phone_number, r.course?.title].filter(Boolean).some(v => String(v).toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [rows, query, statusFilter]);

  const openReview = (r: ReqRow) => {
    setSelected(r);
    setModalErr(''); setCred(null); setRejecting(false); setRejectReason('');
    setForm({ total_fee: '', first_payment_amount: '', first_payment_date: today(), next_due_date: '', batch_id: '' });
  };
  const closeModal = () => { setSelected(null); setCred(null); };

  const approve = async () => {
    if (!selected) return;
    if (!form.total_fee) { setModalErr('Enter the total fee.'); return; }
    setBusy(true); setModalErr('');
    try {
      const json = await fetchWithAuth(`${BASE}/admin/enrollment-requests/${selected.id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_fee: Number(form.total_fee),
          first_payment_amount: form.first_payment_amount ? Number(form.first_payment_amount) : 0,
          first_payment_date: form.first_payment_date || today(),
          next_due_date: form.next_due_date || null,
          batch_id: form.batch_id ? Number(form.batch_id) : null,
        }),
      });
      setCred(json?.data?.credentials ?? null);
      await load();
    } catch (e: unknown) { setModalErr(e instanceof Error ? e.message : 'Approval failed.'); } finally { setBusy(false); }
  };

  const reject = async () => {
    if (!selected) return;
    setBusy(true); setModalErr('');
    try {
      await fetchWithAuth(`${BASE}/admin/enrollment-requests/${selected.id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || null }),
      });
      await load();
      closeModal();
    } catch (e: unknown) { setModalErr(e instanceof Error ? e.message : 'Could not reject.'); } finally { setBusy(false); }
  };

  const copyCred = async () => {
    if (!cred) return;
    try {
      await navigator.clipboard.writeText(`EasyCoders student login\nEnrolment ID: ${cred.enrollment_id}\nEmail: ${cred.email}\nTemporary password: ${cred.password}\nLogin: https://easycoders.in/`);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  };

  const STAT_CARDS = [
    { key: 'total', label: 'Total', val: stats.total, color: '#185fa5' },
    { key: 'pending', label: 'Pending', val: stats.pending, color: '#E8A020' },
    { key: 'approved', label: 'Approved', val: stats.approved, color: '#16a34a' },
    { key: 'rejected', label: 'Rejected', val: stats.rejected, color: '#dc2626' },
  ];

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <AdminSection
        eyebrow="Easy Coders · Operations"
        title="Enrollment Requests"
        description="Applications submitted from the website (popup or a course page). Review each one and approve to enrol the student, or reject it."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Enrollment Requests' },
        ]}
      >
        <div className={styles.stats}>
          {STAT_CARDS.map(s => (
            <button key={s.key} className={styles.stat} style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }}
              onClick={() => setStatusFilter(s.key === 'total' ? '' : s.key)}>
              <span className={styles.statBar} style={{ background: s.color }} />
              <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
              <div className={styles.statLbl}>{s.label}</div>
            </button>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchIn} placeholder="Search by name, email, phone, course…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <select className={styles.filterSel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
        </div>

        <div className={styles.panel}>
          {loading ? (
            <div className={styles.state}>Loading requests…</div>
          ) : error ? (
            <div className={styles.state}><div className={styles.stateTitle}>Could not load</div>{error}</div>
          ) : filtered.length === 0 ? (
            <div className={styles.state}>
              <div className={styles.stateTitle}>{rows.length === 0 ? 'No enrollment requests yet' : 'No requests match your filters'}</div>
              {rows.length === 0 ? 'Applications from the website popup or a course page will appear here.' : 'Try clearing the search or status filter.'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Applicant</th><th>Course</th><th>Phone</th><th>College</th><th>Payment</th><th>Applied</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const st = r.status || 'pending';
                      return (
                        <tr key={r.id}>
                          <td><div className={styles.uName}>{r.name}</div><div className={styles.uMail}>{r.email}</div></td>
                          <td className={styles.muted}>{r.course?.title || (r.course_id ? `Course #${r.course_id}` : '—')}</td>
                          <td className={styles.muted}>{r.phone_number || '—'}</td>
                          <td className={styles.muted}>{r.college || '—'}</td>
                          <td>
                            <span className={styles.payPill}>{payLabel(r.payment_method)}</span>
                            <div className={styles.mono} style={{ marginTop: 4 }} title="Transaction number">
                              <span style={{ color: '#94A3B8' }}>Txn: </span>{r.transaction_number || '—'}
                            </div>
                          </td>
                          <td className={styles.muted}>{fmtDate(r.created_at)}</td>
                          <td><span className={`${styles.badge} ${styles[`st_${st}`] || ''}`}>{st}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button className={`${styles.btn} ${st === 'pending' ? styles.btnPrimary : styles.btnGhost} ${styles.btnSm}`} onClick={() => openReview(r)}>
                              {st === 'pending' ? 'Review →' : 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className={styles.mobileList}>
                {filtered.map(r => {
                  const st = r.status || 'pending';
                  return (
                    <div key={r.id} className={styles.mCard}>
                      <div className={styles.mTopRow}>
                        <div><div className={styles.uName}>{r.name}</div><div className={styles.uMail}>{r.email}</div></div>
                        <span className={`${styles.badge} ${styles[`st_${st}`] || ''}`}>{st}</span>
                      </div>
                      <div className={styles.mMeta}>
                        <div>Course: {r.course?.title || '—'}</div>
                        <div>Phone: {r.phone_number || '—'} · {r.college || '—'}</div>
                        <div>Payment: {payLabel(r.payment_method)} · Txn: {r.transaction_number || '—'}</div>
                        <div>Applied: {fmtDate(r.created_at)}</div>
                      </div>
                      <button className={`${styles.btn} ${st === 'pending' ? styles.btnPrimary : styles.btnGhost} ${styles.btnSm}`} onClick={() => openReview(r)}>
                        {st === 'pending' ? 'Review →' : 'View'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </AdminSection>

      {/* ── Review / Approve modal ── */}
      {selected && (
        <div className={styles.backdrop} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.mTop}>
              <h2 className={styles.mTitle}>{cred ? 'Student enrolled' : 'Review application'}</h2>
              <button className={styles.mClose} onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <div className={styles.mBody}>
              {cred ? (
                <>
                  <div className={styles.okBanner}>✓ {selected.name} is now an EasyCoders student. Share the login below.</div>
                  <div className={styles.cred}><span className={styles.credLbl}>Enrolment ID</span><span className={styles.credVal}>{cred.enrollment_id}</span></div>
                  <div className={styles.cred}><span className={styles.credLbl}>Email</span><span className={styles.credVal}>{cred.email}</span></div>
                  <div className={styles.cred}><span className={styles.credLbl}>Temporary password</span><span className={`${styles.credVal} ${styles.pw}`}>{cred.password}</span></div>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, lineHeight: 1.5 }}>The temporary password works until the student changes it (re-fetchable from their profile for 7 days). No email is sent automatically.</p>
                </>
              ) : (
                <>
                  {/* Submitted details */}
                  <div className={styles.sumGrid}>
                    <div><div className={styles.sKey}>Applicant</div><div className={styles.sVal}>{selected.name}</div></div>
                    <div><div className={styles.sKey}>Course</div><div className={styles.sVal}>{selected.course?.title || (selected.course_id ? `#${selected.course_id}` : '—')}</div></div>
                    <div><div className={styles.sKey}>Email</div><div className={styles.sVal}>{selected.email}</div></div>
                    <div><div className={styles.sKey}>Phone</div><div className={styles.sVal}>{selected.phone_number || '—'}</div></div>
                    <div><div className={styles.sKey}>College</div><div className={styles.sVal}>{selected.college || '—'}</div></div>
                    <div><div className={styles.sKey}>Applied</div><div className={styles.sVal}>{fmtDate(selected.created_at)}</div></div>
                    <div><div className={styles.sKey}>Payment method</div><div className={styles.sVal}>{payLabel(selected.payment_method)}</div></div>
                    <div><div className={styles.sKey}>Transaction no.</div><div className={styles.sVal}>{selected.transaction_number || '—'}</div></div>
                  </div>

                  {modalErr && <div className={`${styles.alert} ${styles.alertErr}`}>{modalErr}</div>}

                  {selected.status === 'approved' ? (
                    <div style={{ color: '#166534', fontSize: 13 }}>This request was already approved and the student account created.</div>
                  ) : selected.status === 'rejected' ? (
                    <div style={{ color: '#991B1B', fontSize: 13 }}>This request was rejected.{selected.rejected_reason ? ` Reason: ${selected.rejected_reason}` : ''}</div>
                  ) : rejecting ? (
                    <div className={styles.fld}>
                      <label className={styles.fLbl}>Reason for rejection (optional)</label>
                      <textarea className={styles.fIn} style={{ height: 'auto', minHeight: 64 }} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="e.g. Duplicate / incomplete payment" />
                    </div>
                  ) : (
                    <>
                      <div className={styles.sectionLbl}>Fee plan &amp; enrolment</div>
                      <div className={styles.fGrid}>
                        <div className={styles.fld}>
                          <label className={styles.fLbl}>Total fee (₹)<span className={styles.req}> *</span></label>
                          <input className={styles.fIn} type="number" value={form.total_fee} placeholder="e.g. 14000" onChange={e => setForm(f => ({ ...f, total_fee: e.target.value }))} />
                        </div>
                        <div className={styles.fld}>
                          <label className={styles.fLbl}>First payment (₹)</label>
                          <input className={styles.fIn} type="number" value={form.first_payment_amount} placeholder="amount paid now" onChange={e => setForm(f => ({ ...f, first_payment_amount: e.target.value }))} />
                        </div>
                        <div className={styles.fld}>
                          <label className={styles.fLbl}>Payment date</label>
                          <input className={styles.fIn} type="date" value={form.first_payment_date} onChange={e => setForm(f => ({ ...f, first_payment_date: e.target.value }))} />
                        </div>
                        <div className={styles.fld}>
                          <label className={styles.fLbl}>Next due date</label>
                          <input className={styles.fIn} type="date" value={form.next_due_date} onChange={e => setForm(f => ({ ...f, next_due_date: e.target.value }))} />
                        </div>
                        <div className={`${styles.fld} ${styles.full}`}>
                          <label className={styles.fLbl}>Assign to batch (optional)</label>
                          <select className={styles.fIn} value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}>
                            <option value="">— No batch yet —</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}{b.status ? ` · ${b.status}` : ''}</option>)}
                          </select>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, lineHeight: 1.5 }}>
                        Approving creates the student login (a temporary password is generated){form.first_payment_amount ? `, records ₹${form.first_payment_amount} as their first payment` : ''}.
                      </p>
                    </>
                  )}
                </>
              )}
            </div>

            <div className={styles.mFooter}>
              {cred ? (
                <>
                  <button className={`${styles.btn} ${styles.btnGold}`} onClick={copyCred}>{copied ? 'Copied!' : 'Copy credentials'}</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={closeModal}>Done</button>
                </>
              ) : (selected.status === 'approved' || selected.status === 'rejected') ? (
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={closeModal}>Close</button>
              ) : rejecting ? (
                <>
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setRejecting(false)} disabled={busy}>Back</button>
                  <button className={`${styles.btn} ${styles.btnDanger}`} onClick={reject} disabled={busy}>{busy ? 'Rejecting…' : 'Confirm reject'}</button>
                </>
              ) : (
                <>
                  <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setRejecting(true)} disabled={busy}>Reject</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={approve} disabled={busy || !form.total_fee}>{busy ? 'Approving…' : 'Approve & enrol'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
