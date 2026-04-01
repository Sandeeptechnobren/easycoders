'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import styles from './student-details.module.css';
import { fetchWithAuth } from '@/lib/api';
import { normalizeInterestLabel, interestClass } from '@/lib/interest';

type InterestOption = { id: number; interest: string };

type StudentDetails = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: number;
  assessments_attempts: Array<{
    id: number;
    assessment_id: number;
    score: number;
    status: string;
    certificate_code: string;
    assessment?: { id: number; title: string };
  }>;
  interest: null | {
    id: number;
    assessment_user_id: number;
    interest_status?: { id: number; interest: string };
    call_response?: string | null;
  };
};

type Payment = {
  id: number;
  amount: number;
  payment_date: string;
  payment_mode?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
};

export default function AdminStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyInterest, setBusyInterest] = useState(false);
  const [error, setError] = useState('');

  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [callResponse, setCallResponse] = useState('');

  const [totalFee, setTotalFee] = useState<number>(0);
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_date: '',
    payment_mode: 'Cash',
    reference_id: '',
    remarks: '',
  });
  const [payBusy, setPayBusy] = useState(false);

  const [attDate, setAttDate] = useState('');
  const [attStatus, setAttStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [attBusy, setAttBusy] = useState(false);

  const [markBusy, setMarkBusy] = useState(false);
  const [markForm, setMarkForm] = useState({ title: '', score: '', max_score: '100', remark: '' });

  const loadStudent = async () => {
    try {
      setLoading(true);
      setError('');
      const json = await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(id)}`
      );
      setStudent(json.data || null);
      setCallResponse(json.data?.interest?.call_response || '');
    } catch (e: any) {
      setStudent(null);
      setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  const loadInterestOptions = async () => {
    try {
      const json = await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/hr/student/interests`
      );
      setInterestOptions(json.data || []);
    } catch {
      setInterestOptions([]);
    }
  };

  const loadFinance = async () => {
    try {
      const json = await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/admin/students/${encodeURIComponent(id)}`
      );
      const prof = json?.data?.profile;
      setTotalFee(Number(prof?.total_fee ?? 0));
      setNextDueDate(prof?.next_due_date ? String(prof.next_due_date).slice(0, 10) : '');
      setPayments(json?.data?.payments || []);
    } catch {
      setPayments([]);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadStudent();
    loadInterestOptions();
    loadFinance();
  }, [id]);

  const interestLabel = useMemo(
    () => normalizeInterestLabel(student?.interest?.interest_status?.interest),
    [student]
  );

  const paidAmount = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments]);
  const dueAmount = useMemo(() => Math.max(0, Number(totalFee || 0) - paidAmount), [totalFee, paidAmount]);

  const updateInterest = async (interest_status_id: number) => {
    if (!student) return;
    try {
      setBusyInterest(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/hr/assessmentUser/updateInterestStatus`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessment_user_id: student.id,
            interest_status: interest_status_id,
            call_response: callResponse || null,
          }),
        }
      );
      await loadStudent();
    } catch (e: any) {
      setError(e?.message === 'Unauthorized' ? 'Session expired.' : 'Failed to update interest');
    } finally {
      setBusyInterest(false);
    }
  };

  const addPayment = async () => {
    if (!student) return;
    try {
      setPayBusy(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/students/${student.id}/payments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(payForm.amount),
            payment_date: payForm.payment_date,
            payment_mode: payForm.payment_mode || null,
            reference_id: payForm.reference_id || null,
            remarks: payForm.remarks || null,
          }),
        }
      );
      setPayForm({ amount: '', payment_date: '', payment_mode: 'Cash', reference_id: '', remarks: '' });
      await loadFinance();
    } catch {
    } finally {
      setPayBusy(false);
    }
  };

  const deletePayment = async (paymentId: number) => {
    if (!confirm('Delete this payment?')) return;
    try {
      setPayBusy(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/payments/${paymentId}`,
        { method: 'DELETE' }
      );
      await loadFinance();
    } catch {
    } finally {
      setPayBusy(false);
    }
  };

  const markAttendance = async () => {
    if (!student || !attDate) return;
    try {
      setAttBusy(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/students/${student.id}/attendance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_date: attDate, status: attStatus }),
        }
      );
      setAttDate('');
    } catch {
    } finally {
      setAttBusy(false);
    }
  };

  const addMark = async () => {
    if (!student || !markForm.title || !markForm.score) return;
    try {
      setMarkBusy(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/students/${student.id}/marks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: markForm.title,
            score: Number(markForm.score),
            max_score: Number(markForm.max_score || 100),
            remark: markForm.remark || null,
          }),
        }
      );
      setMarkForm({ title: '', score: '', max_score: '100', remark: '' });
      alert('Marks saved');
    } catch {
    } finally {
      setMarkBusy(false);
    }
  };

  const interestAccent: Record<string, string> = {
    'Interested': '#639922',
    'Not Interested': '#E24B4A',
    'Call Back Later': '#EF9F27',
    'Not Reachable': '#888780',
    'Not Set': '#7F77DD',
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className={styles.wrap}>

        {/* ── Topbar ── */}
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <nav className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>Admin</Link>
              <span className={styles.crumbSep}>/</span>
              <Link href="/admin/students" className={styles.crumbLink}>Students</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Details</span>
            </nav>
            <h1 className={styles.pageTitle}>Student Details</h1>
            <p className={styles.pageSub}>Profile, interest, assessments and finance</p>
          </div>
          <Link href="/admin/students" className={styles.backBtn}>← Back</Link>
        </header>

        {/* ── Loading ── */}
        {loading && (
          <div className={styles.pageBody}>
            <div className={styles.skCard}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.skRow} style={{ animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Error ── */}
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

        {/* ── Main content ── */}
        {!loading && !error && student && (
          <div className={styles.pageBody}>

            {/* Row 1: Profile + Interest */}
            <div className={styles.row2}>

              {/* Profile card */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Student Profile</span>
                  <span className={`${styles.statusPill} ${student.status === 1 ? styles.pillGreen : styles.pillRed}`}>
                    {student.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className={styles.profileHero}>
                  <div className={styles.avatarLg}>
                    {(student.name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.heroName}>{student.name}</div>
                    <div className={styles.heroId}>ID #{student.id}</div>
                  </div>
                </div>
                <div className={styles.divider} />
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <span className={styles.fieldKey}>Email</span>
                    <span className={styles.fieldVal}>{student.email}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldKey}>Phone</span>
                    <span className={styles.fieldVal}>{student.phone}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldKey}>Interest Status</span>
                    <span className={`${styles.pill} ${styles[interestClass(interestLabel)]}`}>{interestLabel}</span>
                  </div>
                  {student.interest?.call_response && (
                    <div className={styles.field}>
                      <span className={styles.fieldKey}>Last Call Note</span>
                      <span className={styles.fieldVal}>{student.interest.call_response}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Interest update card */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Update Interest</span>
                  {busyInterest && <span className={styles.busyBadge}>Saving…</span>}
                </div>
                <div className={styles.fieldKey} style={{ marginBottom: 6 }}>Call Response Note</div>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Enter call response or notes…"
                  value={callResponse}
                  onChange={(e) => setCallResponse(e.target.value)}
                />
                <div className={styles.divider} />
                <div className={styles.fieldKey} style={{ marginBottom: 10 }}>Set Status</div>
                <div className={styles.interestBtns}>
                  {interestOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={styles.interestBtn}
                      disabled={busyInterest}
                      onClick={() => updateInterest(opt.id)}
                      style={{ borderLeftColor: interestAccent[opt.interest] || '#d1d5db' }}
                    >
                      <span
                        className={styles.interestDot}
                        style={{ background: interestAccent[opt.interest] || '#d1d5db' }}
                      />
                      {opt.interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Finance summary */}
            <div className={styles.feeRow}>
              <div className={styles.feeStat}>
                <div className={styles.feeLabel}>Total Fee</div>
                <div className={styles.feeVal}>₹{totalFee.toLocaleString()}</div>
              </div>
              <div className={styles.feeDivider} />
              <div className={styles.feeStat}>
                <div className={styles.feeLabel}>Paid</div>
                <div className={`${styles.feeVal} ${styles.feeGreen}`}>₹{paidAmount.toLocaleString()}</div>
              </div>
              <div className={styles.feeDivider} />
              <div className={styles.feeStat}>
                <div className={styles.feeLabel}>Due</div>
                <div className={`${styles.feeVal} ${dueAmount > 0 ? styles.feeRed : styles.feeGreen}`}>
                  ₹{dueAmount.toLocaleString()}
                </div>
              </div>
              {nextDueDate && (
                <>
                  <div className={styles.feeDivider} />
                  <div className={styles.feeStat}>
                    <div className={styles.feeLabel}>Next Due Date</div>
                    <div className={styles.feeVal}>{nextDueDate}</div>
                  </div>
                </>
              )}
            </div>

            {/* Row 3: Assessments */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Assessment Attempts</span>
                <span className={styles.cardSub}>Certificates & scores</span>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.assessments_attempts?.length ? (
                      student.assessments_attempts.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div className={styles.tdBold}>{a.assessment?.title ?? `Assessment #${a.assessment_id}`}</div>
                            <div className={styles.tdSub}>Attempt #{a.id}</div>
                          </td>
                          <td>
                            <span className={`${styles.pill} ${a.status === 'completed' ? styles.pillGreen : styles.pillAmber}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className={styles.tdBold}>{a.score}</td>
                          <td>
                            {a.certificate_code
                              ? <span className={`${styles.pill} ${styles.pillBlue}`}>{a.certificate_code}</span>
                              : <span className={styles.tdSub}>—</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className={styles.emptyRow}>No attempts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Row 4: Payments */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Fees & Payments</span>
                <span className={styles.cardSub}>Installments & due tracking</span>
              </div>

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
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
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

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Reference</th>
                      <th>Remarks</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length ? payments.map((p) => (
                      <tr key={p.id}>
                        <td>{p.payment_date}</td>
                        <td className={styles.tdBold}>₹{Number(p.amount).toLocaleString()}</td>
                        <td>{p.payment_mode || '—'}</td>
                        <td className={styles.tdSub}>{p.reference_id || '—'}</td>
                        <td className={styles.tdSub}>{p.remarks || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className={styles.deleteBtn} type="button" disabled={payBusy}
                            onClick={() => deletePayment(p.id)}>Delete</button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className={styles.emptyRow}>No payments recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Row 5: Attendance + Marks */}
            <div className={styles.row2}>

              {/* Attendance */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Attendance</span>
                  <span className={styles.cardSub}>Mark daily attendance</span>
                </div>
                <div className={styles.formStack}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Date</label>
                    <input className={styles.input} type="date" value={attDate}
                      onChange={(e) => setAttDate(e.target.value)} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Status</label>
                    <div className={styles.toggleRow}>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${attStatus === 'PRESENT' ? styles.toggleActive : ''}`}
                        onClick={() => setAttStatus('PRESENT')}
                      >Present</button>
                      <button
                        type="button"
                        className={`${styles.toggleBtn} ${attStatus === 'ABSENT' ? styles.toggleAbsent : ''}`}
                        onClick={() => setAttStatus('ABSENT')}
                      >Absent</button>
                    </div>
                  </div>
                  <button className={styles.primaryBtn} type="button"
                    disabled={attBusy || !attDate} onClick={markAttendance}>
                    {attBusy ? 'Saving…' : 'Save Attendance'}
                  </button>
                </div>
              </div>

              {/* Marks */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardTitle}>Marks</span>
                  <span className={styles.cardSub}>Add assessment marks</span>
                </div>
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
                  <button className={styles.primaryBtn} type="button"
                    disabled={markBusy || !markForm.title || !markForm.score} onClick={addMark}>
                    {markBusy ? 'Saving…' : 'Save Marks'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}