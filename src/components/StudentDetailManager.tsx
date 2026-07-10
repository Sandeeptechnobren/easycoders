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

type Completion = {
  id: number;
  tech_field: string;
  duration_value: number;
  duration_unit: string;
  performance_grade: string;
  completed_on: string;
  status: string;
  certificate_code?: string | null;
  remarks?: string | null;
  course?: { id: number; title: string } | null;
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
  admission?: {
    id: number;
    admission_status: string;
    final_fees?: number;
    paid?: number;
    refund_amount?: number | string | null;
    cancelled_at?: string | null;
  } | null;
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

  // Cancel admission (+ optional refund)
  const [showCancel, setShowCancel] = useState(false);
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMode, setRefundMode] = useState('cash');
  const [refundReason, setRefundReason] = useState('');
  const [cancelMsg, setCancelMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Course completion certificates
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [ccForm, setCcForm] = useState({ tech_field: '', duration_value: '', duration_unit: 'months', performance_grade: '', completed_on: '', remarks: '' });
  const [ccBusy, setCcBusy] = useState(false);
  const [ccMsg, setCcMsg] = useState('');
  const [ccDownloading, setCcDownloading] = useState<number | null>(null);

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

  const loadCompletions = async () => {
    try {
      const json = await fetchWithAuth(`${BASE}/admin/students/${encodeURIComponent(id)}/course-completions`);
      setCompletions(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setCompletions([]);
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
    loadCompletions();
    if (canManage) loadCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, canManage]);

  // Close the cancel-admission modal on Escape.
  useEffect(() => {
    if (!showCancel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCancel(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCancel]);

  // Close the mark-complete modal on Escape.
  useEffect(() => {
    if (!showComplete) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowComplete(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showComplete]);

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

  // ── Cancel admission ──
  const admission = student?.admission ?? null;
  const admissionCancellable = !!admission && admission.admission_status !== 'cancelled' && admission.admission_status !== 'rejected';
  const admissionPaid = Number(admission?.paid ?? 0);

  const openCancel = () => {
    setIssueRefund(false);
    setRefundAmount(String(admissionPaid || ''));
    setRefundMode('cash');
    setRefundReason('');
    setCancelMsg('');
    setShowCancel(true);
  };
  const confirmCancel = async () => {
    if (!admission) return;
    const amt = Number(refundAmount);
    if (issueRefund && amt > admissionPaid) { setCancelMsg(`Refund can't exceed ${inr(admissionPaid)} (amount paid).`); return; }
    setCancelling(true); setCancelMsg('');
    try {
      const body: Record<string, unknown> = {};
      if (issueRefund && amt > 0) { body.refund_amount = amt; body.refund_mode = refundMode; }
      if (refundReason.trim()) body.refund_reason = refundReason.trim();
      await fetchWithAuth(`${BASE}/admissions/${admission.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setShowCancel(false);
      await loadStudent();
    } catch (e: unknown) { setCancelMsg(e instanceof Error ? e.message : 'Could not cancel the admission.'); }
    finally { setCancelling(false); }
  };

  // ── Course completion ──
  const openComplete = () => {
    const prefill = student?.course && student.course !== '—' ? student.course : '';
    setCcForm({ tech_field: prefill, duration_value: '', duration_unit: 'months', performance_grade: '', completed_on: new Date().toISOString().slice(0, 10), remarks: '' });
    setCcMsg('');
    setShowComplete(true);
  };
  const submitComplete = async () => {
    if (!student) return;
    if (!ccForm.tech_field.trim() || !ccForm.duration_value || !ccForm.performance_grade.trim()) {
      setCcMsg('Tech field, duration and grade are required.');
      return;
    }
    setCcBusy(true); setCcMsg('');
    try {
      await fetchWithAuth(`${BASE}/course-completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: student.id,
          tech_field: ccForm.tech_field.trim(),
          duration_value: Number(ccForm.duration_value),
          duration_unit: ccForm.duration_unit,
          performance_grade: ccForm.performance_grade.trim(),
          completed_on: ccForm.completed_on || null,
          remarks: ccForm.remarks.trim() || null,
        }),
      });
      setShowComplete(false);
      await loadCompletions();
    } catch (e: unknown) {
      setCcMsg(e instanceof Error ? e.message : 'Could not mark the course complete.');
    } finally {
      setCcBusy(false);
    }
  };
  const downloadCertificate = async (cid: number) => {
    setCcDownloading(cid);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${BASE}/course-completions/${cid}/certificate`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });
      if (!res.ok) throw new Error('Could not download the certificate.');
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="?([^"]+)"?/);
      const fname = m ? m[1] : `course-completion-${cid}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Download failed.');
    } finally {
      setCcDownloading(null);
    }
  };
  const revokeCompletion = async (cid: number) => {
    if (!confirm('Revoke this certificate? It will no longer verify as valid.')) return;
    try {
      await fetchWithAuth(`${BASE}/course-completions/${cid}`, { method: 'DELETE' });
      await loadCompletions();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not revoke the certificate.');
    }
  };

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

              {canManage && admission && (
                <>
                  <div className={styles.divider} />
                  {admissionCancellable ? (
                    <button type="button" className={styles.deleteBtn} onClick={openCancel}>Cancel admission</button>
                  ) : admission.admission_status === 'cancelled' ? (
                    <div style={{ fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                      Admission cancelled{admission.cancelled_at ? ` on ${String(admission.cancelled_at).slice(0, 10)}` : ''}{Number(admission.refund_amount) > 0 ? ` · refund ${inr(Number(admission.refund_amount))}` : ''}.
                    </div>
                  ) : null}
                </>
              )}
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

          {/* Row 5: Course completion & certificates */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Course Completion &amp; Certificates</span>
              <span className={styles.cardSub}>{canManage ? 'Mark an offline course complete & issue a certificate' : 'Issued certificates'}</span>
            </div>

            {canManage && (
              <>
                <button className={styles.primaryBtn} type="button" onClick={openComplete}>+ Mark course complete</button>
                <div className={styles.divider} />
              </>
            )}

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tech field</th><th>Duration</th><th>Grade</th><th>Completed</th><th>Status</th>
                    <th style={{ textAlign: 'right' }}>Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {completions.length ? completions.map((c) => (
                    <tr key={c.id}>
                      <td className={styles.tdBold}>
                        {c.tech_field}
                        {c.course?.title && c.course.title !== c.tech_field ? <div className={styles.tdSub}>{c.course.title}</div> : null}
                      </td>
                      <td>{c.duration_value} {c.duration_unit}</td>
                      <td>{c.performance_grade}</td>
                      <td className={styles.tdSub}>{String(c.completed_on).slice(0, 10)}</td>
                      <td>
                        <span className={`${styles.pill} ${c.status === 'issued' ? styles.pillGreen : styles.pillAmber}`}>{c.status}</span>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {c.status === 'issued' && (
                          <button className={styles.primaryBtn} type="button" disabled={ccDownloading === c.id} onClick={() => downloadCertificate(c.id)}>
                            {ccDownloading === c.id ? 'Preparing…' : 'Download'}
                          </button>
                        )}
                        {canManage && c.status === 'issued' && (
                          <button className={styles.deleteBtn} type="button" style={{ marginLeft: 8 }} onClick={() => revokeCompletion(c.id)}>Revoke</button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className={styles.emptyRow}>No course completions issued yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel admission modal ── */}
      {showCancel && admission && (
        <div onClick={() => setShowCancel(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7,18,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 30px 70px rgba(7,18,42,0.4)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #EEF1F7' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0B1B3A' }}>Cancel admission</div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              {cancelMsg && <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 12 }}>{cancelMsg}</div>}
              <p style={{ fontSize: 13.5, color: '#334155', margin: '0 0 12px', lineHeight: 1.6 }}>
                Cancel the admission for <strong>{student?.name}</strong>{student?.course ? <> · {student.course}</> : null}. This deactivates the account, drops the batch and waives any unpaid installments. Reversible by reactivating the student.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16 }}>
                <span style={{ color: '#64748B' }}>Paid so far</span><strong>{inr(admissionPaid)}</strong>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: '#0B1B3A', marginBottom: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={issueRefund} onChange={e => setIssueRefund(e.target.checked)} /> Issue a refund
              </label>
              {issueRefund && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label className={styles.formLabel}>Refund amount (₹)</label>
                    <input className={styles.input} type="number" min={0} max={admissionPaid} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} />
                  </div>
                  <div style={{ flex: 1.4 }}>
                    <label className={styles.formLabel}>Mode</label>
                    <select className={styles.input} value={refundMode} onChange={e => setRefundMode(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank transfer</option>
                    </select>
                  </div>
                </div>
              )}
              <label className={styles.formLabel}>Reason {issueRefund ? '' : '(optional)'}</label>
              <textarea className={styles.input} rows={2} value={refundReason} onChange={e => setRefundReason(e.target.value)}
                placeholder="Why is this admission being cancelled?" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #EEF1F7', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
              <button type="button" className={styles.primaryBtn} onClick={() => setShowCancel(false)}
                style={{ background: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}>Keep admission</button>
              <button type="button" className={styles.deleteBtn} disabled={cancelling} onClick={confirmCancel}>
                {cancelling ? 'Cancelling…' : (issueRefund && Number(refundAmount) > 0 ? `Cancel & refund ${inr(Number(refundAmount))}` : 'Cancel admission')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mark course complete modal ── */}
      {showComplete && student && (
        <div onClick={() => setShowComplete(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7,18,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true"
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 30px 70px rgba(7,18,42,0.4)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #EEF1F7' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0B1B3A' }}>Mark course complete</div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>Issue a Certificate of Completion for <strong>{student.name}</strong></div>
            </div>
            <div style={{ padding: '18px 22px' }}>
              {ccMsg && <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 10, padding: '9px 12px', fontSize: 13, marginBottom: 12 }}>{ccMsg}</div>}
              <div className={styles.formField} style={{ marginBottom: 12 }}>
                <label className={styles.formLabel}>Course / tech field</label>
                <input className={styles.input} value={ccForm.tech_field} placeholder="e.g. Full Stack Web Development"
                  onChange={(e) => setCcForm((p) => ({ ...p, tech_field: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1.4 }}>
                  <label className={styles.formLabel}>Duration</label>
                  <input className={styles.input} type="number" min={1} placeholder="e.g. 3" value={ccForm.duration_value}
                    onChange={(e) => setCcForm((p) => ({ ...p, duration_value: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Unit</label>
                  <select className={styles.input} value={ccForm.duration_unit}
                    onChange={(e) => setCcForm((p) => ({ ...p, duration_unit: e.target.value }))}>
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Performance grade</label>
                  <input className={styles.input} placeholder="e.g. A+ / Excellent" value={ccForm.performance_grade}
                    onChange={(e) => setCcForm((p) => ({ ...p, performance_grade: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Completed on</label>
                  <input className={styles.input} type="date" value={ccForm.completed_on}
                    onChange={(e) => setCcForm((p) => ({ ...p, completed_on: e.target.value }))} />
                </div>
              </div>
              <label className={styles.formLabel}>Remarks (optional)</label>
              <textarea className={styles.input} rows={2} value={ccForm.remarks}
                onChange={(e) => setCcForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Any note for the record" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #EEF1F7', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
              <button type="button" className={styles.primaryBtn} onClick={() => setShowComplete(false)}
                style={{ background: '#fff', color: '#475569', border: '1px solid #E2E8F0' }}>Cancel</button>
              <button type="button" className={styles.primaryBtn} disabled={ccBusy} onClick={submitComplete}>
                {ccBusy ? 'Issuing…' : 'Mark complete & issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
