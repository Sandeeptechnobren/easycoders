'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './studentManager.module.css';
import { fetchWithAuth } from '@/lib/api';
import { useFeeVisibility, maskAmount, FeeToggle } from '@/lib/feeMask';

/* ──────────────────────────────────────────────────────────────────────────
 * <StudentDetailManager> — enrolled-student (users.role=3) detail + management.
 *
 * Shared by the admin, HR and trainer student-detail pages so all three stay
 * in lock-step. Talks to the /admin/students/* endpoints. `canManage` gates
 * every write surface (credentials, payments, attendance, marks): admin + HR
 * get full management; trainers get a read-only view.
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type Crumb = { label: string; href?: string };

type Profile = {
  enrollment_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  city?: string | null;
  state?: string | null;
  highest_qualification?: string | null;
  total_fee?: number | null;
  paid_amount?: number | null;
  due_amount?: number | null;
  next_due_date?: string | null;
};

type Payment = {
  id: number;
  amount: number;
  payment_date: string;
  payment_mode?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
};

type Mark = {
  id: number;
  title: string;
  score: number;
  max_score: number;
  remark?: string | null;
  marked_at?: string | null;
};

type AttendanceRow = {
  id: number;
  date: string;
  status: string;
};

type StudentDetails = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: number | string;
  enrolment_id?: string | null;
  profile?: Profile | null;
  batch?: string | null;
  course?: string | null;
  fees?: { total_fee: number; paid: number; due: number; next_due_date?: string | null };
  payments?: Payment[];
  marks?: Mark[];
  attendance?: AttendanceRow[];
};

function isActive(s: StudentDetails['status'] | undefined | null): boolean {
  return s === 1 || s === '1' || String(s ?? '').toLowerCase() === 'active';
}

type Props = {
  studentId: string;
  canManage: boolean;
  backHref: string;
  crumbs: Crumb[];
};

export default function StudentDetailManager({ studentId, canManage, backHref, crumbs }: Props) {
  const id = studentId;

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [payForm, setPayForm] = useState({ amount: '', payment_date: '', payment_mode: 'Cash', reference_id: '', remarks: '' });
  const [payBusy, setPayBusy] = useState(false);

  const [attDate, setAttDate] = useState('');
  const [attStatus, setAttStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [attBusy, setAttBusy] = useState(false);

  const [markBusy, setMarkBusy] = useState(false);
  const [markForm, setMarkForm] = useState({ title: '', score: '', max_score: '100', remark: '' });

  const [credData, setCredData] = useState<{ enrollment_id?: string; email?: string; password?: string; expires_at?: string } | null>(null);
  const [credAvailable, setCredAvailable] = useState(false);
  const [credBusy, setCredBusy] = useState(false);
  const [credReveal, setCredReveal] = useState(false);
  const [credCopied, setCredCopied] = useState(false);

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const json = await fetchWithAuth(`${BASE}/admin/students/${encodeURIComponent(id)}`);
      setStudent(json.data || null);
    } catch (e: unknown) {
      setStudent(null);
      setError(e instanceof Error && e.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    try {
      const json = await fetchWithAuth(`${BASE}/admin/students/${encodeURIComponent(id)}/credentials`);
      setCredData(json?.data || null);
      setCredAvailable(true);
    } catch {
      setCredData(null);
      setCredAvailable(false);
    }
  };

  const regeneratePassword = async () => {
    if (!confirm('Issue a new temporary password for this student? They will be asked to change it on next login.')) return;
    try {
      setCredBusy(true);
      const json = await fetchWithAuth(`${BASE}/admin/students/${encodeURIComponent(id)}/regenerate-password`, { method: 'POST' });
      setCredData(json?.data || null);
      setCredAvailable(true);
      setCredReveal(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not regenerate the password.');
    } finally {
      setCredBusy(false);
    }
  };

  const copyCreds = async () => {
    if (!credData) return;
    const text = `Enrolment ID: ${credData.enrollment_id || '—'}\nEmail: ${credData.email || ''}\nTemporary password: ${credData.password || ''}`;
    try { await navigator.clipboard.writeText(text); setCredCopied(true); setTimeout(() => setCredCopied(false), 1600); } catch { /* clipboard blocked */ }
  };

  useEffect(() => {
    if (!id) return;
    loadStudent();
    if (canManage) loadCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canManage]);

  const fees = student?.fees;
  const totalFee = Number(fees?.total_fee ?? student?.profile?.total_fee ?? 0);
  const paidAmount = Number(fees?.paid ?? student?.profile?.paid_amount ?? 0);
  const dueAmount = Number(fees?.due ?? Math.max(0, totalFee - paidAmount));
  const nextDueDate = (fees?.next_due_date || student?.profile?.next_due_date || '') as string;
  const [feesVisible] = useFeeVisibility();
  const inr = (n: number | undefined | null) => maskAmount(n, feesVisible);
  const payments = useMemo(() => student?.payments ?? [], [student]);
  const marks = useMemo(() => student?.marks ?? [], [student]);
  const attendance = useMemo(() => student?.attendance ?? [], [student]);

  const addPayment = async () => {
    if (!student) return;
    try {
      setPayBusy(true);
      await fetchWithAuth(`${BASE}/admin/students/${student.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payForm.amount),
          payment_date: payForm.payment_date,
          payment_mode: payForm.payment_mode || null,
          reference_id: payForm.reference_id || null,
          remarks: payForm.remarks || null,
        }),
      });
      setPayForm({ amount: '', payment_date: '', payment_mode: 'Cash', reference_id: '', remarks: '' });
      await loadStudent();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not record the payment.');
    } finally {
      setPayBusy(false);
    }
  };

  const deletePayment = async (paymentId: number) => {
    if (!confirm('Delete this payment?')) return;
    try {
      setPayBusy(true);
      await fetchWithAuth(`${BASE}/admin/students/payments/${paymentId}`, { method: 'DELETE' });
      await loadStudent();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not delete the payment.');
    } finally {
      setPayBusy(false);
    }
  };

  const markAttendance = async () => {
    if (!student || !attDate) return;
    try {
      setAttBusy(true);
      await fetchWithAuth(`${BASE}/admin/students/${student.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_date: attDate, status: attStatus }),
      });
      setAttDate('');
      await loadStudent();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not save attendance.');
    } finally {
      setAttBusy(false);
    }
  };

  const addMark = async () => {
    if (!student || !markForm.title || !markForm.score) return;
    try {
      setMarkBusy(true);
      await fetchWithAuth(`${BASE}/admin/students/${student.id}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: markForm.title,
          score: Number(markForm.score),
          max_score: Number(markForm.max_score || 100),
          remark: markForm.remark || null,
        }),
      });
      setMarkForm({ title: '', score: '', max_score: '100', remark: '' });
      await loadStudent();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not save the mark.');
    } finally {
      setMarkBusy(false);
    }
  };

  const active = isActive(student?.status);

  return (
    <div className={styles.wrap}>

      {/* ── Topbar ── */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <nav className={styles.crumbs}>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <span key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {c.href && !last
                    ? <Link href={c.href} className={styles.crumbLink}>{c.label}</Link>
                    : <span className={styles.crumbNow}>{c.label}</span>}
                  {!last && <span className={styles.crumbSep}>/</span>}
                </span>
              );
            })}
          </nav>
          <h1 className={styles.pageTitle}>Student Details</h1>
          <p className={styles.pageSub}>
            {canManage ? 'Profile, credentials, fees, attendance and marks' : 'Profile, fees, attendance and marks (read-only)'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FeeToggle />
          <Link href={backHref} className={styles.backBtn}>← Back</Link>
        </div>
      </header>

      {loading && (
        <div className={styles.pageBody}>
          <div className={styles.skCard}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={styles.skRow} style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className={styles.pageBody}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠</div>
            <div className={styles.emptyTitle}>Could not load student</div>
            <div className={styles.emptyText}>{error}</div>
            <Link href="/login" className={styles.emptyAction}>Go to Login →</Link>
          </div>
        </div>
      )}

      {!loading && !error && student && (
        <div className={styles.pageBody}>

          {/* Row 1: Profile (+ credentials when manageable) */}
          <div className={canManage ? styles.row2 : styles.card} style={canManage ? undefined : { padding: 0, border: 'none', background: 'transparent' }}>

            {/* Profile card */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Student Profile</span>
                <span className={`${styles.statusPill} ${active ? styles.pillGreen : styles.pillRed}`}>
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.profileHero}>
                <div className={styles.avatarLg}>{(student.name?.[0] || 'S').toUpperCase()}</div>
                <div>
                  <div className={styles.heroName}>{student.name}</div>
                  <div className={styles.heroId} style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>
                    {student.enrolment_id || student.profile?.enrollment_id || `ID #${student.id}`}
                  </div>
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.fieldGrid}>
                <div className={styles.field}><span className={styles.fieldKey}>Email</span><span className={styles.fieldVal}>{student.email}</span></div>
                <div className={styles.field}><span className={styles.fieldKey}>Phone</span><span className={styles.fieldVal}>{student.phone || '—'}</span></div>
                <div className={styles.field}><span className={styles.fieldKey}>Course</span><span className={styles.fieldVal}>{student.course || '—'}</span></div>
                <div className={styles.field}><span className={styles.fieldKey}>Batch</span><span className={styles.fieldVal}>{student.batch || '—'}</span></div>
                {student.profile?.gender && <div className={styles.field}><span className={styles.fieldKey}>Gender</span><span className={styles.fieldVal}>{student.profile.gender}</span></div>}
                {student.profile?.date_of_birth && <div className={styles.field}><span className={styles.fieldKey}>Date of Birth</span><span className={styles.fieldVal}>{String(student.profile.date_of_birth).slice(0, 10)}</span></div>}
                {student.profile?.guardian_name && <div className={styles.field}><span className={styles.fieldKey}>Guardian</span><span className={styles.fieldVal}>{student.profile.guardian_name}{student.profile.guardian_phone ? ` · ${student.profile.guardian_phone}` : ''}</span></div>}
                {(student.profile?.city || student.profile?.state) && <div className={styles.field}><span className={styles.fieldKey}>Location</span><span className={styles.fieldVal}>{[student.profile?.city, student.profile?.state].filter(Boolean).join(', ')}</span></div>}
                {student.profile?.highest_qualification && <div className={styles.field}><span className={styles.fieldKey}>Qualification</span><span className={styles.fieldVal}>{student.profile.highest_qualification}</span></div>}
              </div>
            </div>

            {/* Login credentials card — manage only */}
            {canManage && (
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Login Credentials</span>
                  <span className={styles.cardSub}>Student dashboard access</span>
                </div>
                {credAvailable && credData ? (
                  <>
                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <span className={styles.fieldKey}>Enrolment ID</span>
                        <span className={styles.fieldVal} style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{credData.enrollment_id || '—'}</span>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldKey}>Email</span>
                        <span className={styles.fieldVal}>{credData.email}</span>
                      </div>
                      <div className={styles.field}>
                        <span className={styles.fieldKey}>Temporary password</span>
                        <span className={styles.fieldVal} style={{ fontFamily: 'ui-monospace, Menlo, monospace', color: '#B97A0F', fontWeight: 700 }}>
                          {credReveal ? credData.password : '•'.repeat(Math.max(8, (credData.password || '').length))}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      <button type="button" className={styles.primaryBtn} onClick={() => setCredReveal((v) => !v)}>{credReveal ? 'Hide' : 'Reveal'}</button>
                      <button type="button" className={styles.primaryBtn} onClick={copyCreds} disabled={!credReveal}>{credCopied ? 'Copied!' : 'Copy'}</button>
                      <button type="button" className={styles.deleteBtn} onClick={regeneratePassword} disabled={credBusy}>{credBusy ? 'Working…' : 'Regenerate'}</button>
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, lineHeight: 1.5 }}>
                      The temporary password stays readable until the student changes it (or for 7 days). Regenerate to issue a fresh one.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: '#4A5568', margin: '4px 0 14px', lineHeight: 1.5 }}>
                      No active temporary password. Either the student has set their own, or the 7-day window has passed.
                    </p>
                    <button type="button" className={styles.primaryBtn} onClick={regeneratePassword} disabled={credBusy}>
                      {credBusy ? 'Working…' : 'Issue a new temporary password'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Finance summary */}
          <div className={styles.feeRow}>
            <div className={styles.feeStat}>
              <div className={styles.feeLabel}>Total Fee</div>
              <div className={styles.feeVal}>{inr(totalFee)}</div>
            </div>
            <div className={styles.feeDivider} />
            <div className={styles.feeStat}>
              <div className={styles.feeLabel}>Paid</div>
              <div className={`${styles.feeVal} ${styles.feeGreen}`}>{inr(paidAmount)}</div>
            </div>
            <div className={styles.feeDivider} />
            <div className={styles.feeStat}>
              <div className={styles.feeLabel}>Due</div>
              <div className={`${styles.feeVal} ${dueAmount > 0 ? styles.feeRed : styles.feeGreen}`}>{inr(dueAmount)}</div>
            </div>
            {nextDueDate && (
              <>
                <div className={styles.feeDivider} />
                <div className={styles.feeStat}>
                  <div className={styles.feeLabel}>Next Due Date</div>
                  <div className={styles.feeVal}>{String(nextDueDate).slice(0, 10)}</div>
                </div>
              </>
            )}
          </div>

          {/* Row 3: Payments */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Fees &amp; Payments</span>
              <span className={styles.cardSub}>{canManage ? 'Record payments & track dues' : 'Payment history'}</span>
            </div>

            {canManage && (
              <>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Amount (₹)</label>
                    <input className={styles.input} type="number" placeholder="0" value={payForm.amount}
                      onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Payment Date</label>
                    <input className={styles.input} type="date" value={payForm.payment_date}
                      onChange={(e) => setPayForm((p) => ({ ...p, payment_date: e.target.value }))} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Mode</label>
                    <select className={styles.input} value={payForm.payment_mode}
                      onChange={(e) => setPayForm((p) => ({ ...p, payment_mode: e.target.value }))}>
                      <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Reference ID</label>
                    <input className={styles.input} placeholder="Optional" value={payForm.reference_id}
                      onChange={(e) => setPayForm((p) => ({ ...p, reference_id: e.target.value }))} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Remarks</label>
                    <input className={styles.input} placeholder="Optional" value={payForm.remarks}
                      onChange={(e) => setPayForm((p) => ({ ...p, remarks: e.target.value }))} />
                  </div>
                  <div className={styles.formField} style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'flex-end' }}>
                    <button className={styles.primaryBtn} onClick={addPayment}
                      disabled={payBusy || !payForm.amount || !payForm.payment_date} type="button">
                      {payBusy ? 'Saving…' : '+ Add Payment'}
                    </button>
                  </div>
                </div>
                <div className={styles.divider} />
              </>
            )}

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th><th>Remarks</th>
                    {canManage && <th style={{ textAlign: 'right' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {payments.length ? payments.map((p) => (
                    <tr key={p.id}>
                      <td>{String(p.payment_date).slice(0, 10)}</td>
                      <td className={styles.tdBold}>{inr(p.amount)}</td>
                      <td>{p.payment_mode || '—'}</td>
                      <td className={styles.tdSub}>{p.reference_id || '—'}</td>
                      <td className={styles.tdSub}>{p.remarks || '—'}</td>
                      {canManage && (
                        <td style={{ textAlign: 'right' }}>
                          <button className={styles.deleteBtn} type="button" disabled={payBusy} onClick={() => deletePayment(p.id)}>Delete</button>
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={canManage ? 6 : 5} className={styles.emptyRow}>No payments recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 4: Attendance + Marks */}
          <div className={styles.row2}>

            {/* Attendance */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Attendance</span>
                <span className={styles.cardSub}>{canManage ? 'Mark daily attendance' : 'Recent attendance'}</span>
              </div>
              {canManage && (
                <div className={styles.formStack}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Date</label>
                    <input className={styles.input} type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Status</label>
                    <div className={styles.toggleRow}>
                      <button type="button" className={`${styles.toggleBtn} ${attStatus === 'PRESENT' ? styles.toggleActive : ''}`} onClick={() => setAttStatus('PRESENT')}>Present</button>
                      <button type="button" className={`${styles.toggleBtn} ${attStatus === 'ABSENT' ? styles.toggleAbsent : ''}`} onClick={() => setAttStatus('ABSENT')}>Absent</button>
                    </div>
                  </div>
                  <button className={styles.primaryBtn} type="button" disabled={attBusy || !attDate} onClick={markAttendance}>
                    {attBusy ? 'Saving…' : 'Save Attendance'}
                  </button>
                </div>
              )}

              {attendance.length > 0 ? (
                <>
                  {canManage && <div className={styles.divider} />}
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {attendance.slice(0, 8).map((a) => (
                          <tr key={a.id}>
                            <td>{String(a.date).slice(0, 10)}</td>
                            <td>
                              <span className={`${styles.pill} ${String(a.status).toUpperCase() === 'PRESENT' ? styles.pillGreen : styles.pillAmber}`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (!canManage && <p className={styles.emptyText} style={{ marginTop: 4 }}>No attendance recorded yet.</p>)}
            </div>

            {/* Marks */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Marks</span>
                <span className={styles.cardSub}>{canManage ? 'Record test & assignment marks' : 'Recorded marks'}</span>
              </div>
              {canManage && (
                <div className={styles.formStack}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Title</label>
                    <input className={styles.input} placeholder="e.g. Module 1 Test" value={markForm.title}
                      onChange={(e) => setMarkForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className={styles.row2Inline}>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Score</label>
                      <input className={styles.input} type="number" placeholder="0" value={markForm.score}
                        onChange={(e) => setMarkForm((p) => ({ ...p, score: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Max Score</label>
                      <input className={styles.input} type="number" placeholder="100" value={markForm.max_score}
                        onChange={(e) => setMarkForm((p) => ({ ...p, max_score: e.target.value }))} />
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Remark</label>
                    <input className={styles.input} placeholder="Optional" value={markForm.remark}
                      onChange={(e) => setMarkForm((p) => ({ ...p, remark: e.target.value }))} />
                  </div>
                  <button className={styles.primaryBtn} type="button" disabled={markBusy || !markForm.title || !markForm.score} onClick={addMark}>
                    {markBusy ? 'Saving…' : 'Save Marks'}
                  </button>
                </div>
              )}

              {marks.length > 0 ? (
                <>
                  {canManage && <div className={styles.divider} />}
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Title</th><th>Score</th><th>Date</th></tr></thead>
                      <tbody>
                        {marks.slice(0, 8).map((m) => (
                          <tr key={m.id}>
                            <td>
                              <div className={styles.tdBold}>{m.title}</div>
                              {m.remark && <div className={styles.tdSub}>{m.remark}</div>}
                            </td>
                            <td className={styles.tdBold}>{Number(m.score)}/{Number(m.max_score)}</td>
                            <td className={styles.tdSub}>{m.marked_at ? String(m.marked_at).slice(0, 10) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (!canManage && <p className={styles.emptyText} style={{ marginTop: 4 }}>No marks recorded yet.</p>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
