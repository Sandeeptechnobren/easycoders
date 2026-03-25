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

  // interest master list
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [callResponse, setCallResponse] = useState('');

  // Finance / payments (from admin backend APIs)
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

  // Attendance
  const [attDate, setAttDate] = useState('');
  const [attStatus, setAttStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [attBusy, setAttBusy] = useState(false);

  // Marks
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

  // Optional: load finance/payments from admin backend (if you built it)
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
      // If you haven't added admin/students/{id} backend yet, you can keep finance hidden.
      setPayments([]);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadStudent();
    loadInterestOptions();
    loadFinance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const interestLabel = useMemo(() => {
    return normalizeInterestLabel(student?.interest?.interest_status?.interest);
  }, [student]);

  const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';

  const paidAmount = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments]);
  const dueAmount = useMemo(() => Math.max(0, Number(totalFee || 0) - paidAmount), [totalFee, paidAmount]);

  const updateInterest = async (interest_status_id: number) => {
    if (!student) return;
    try {
      setBusyInterest(true);

      const body = {
        assessment_user_id: student.id, // your backend uses assessment_user_id = student id in your response
        interest_status: interest_status_id,
        call_response: callResponse || null,
      };

      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/hr/assessmentUser/updateInterestStatus`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      await loadStudent(); // refresh current status
    } catch (e: any) {
      setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to update interest');
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

  return (
    <RoleGuard allowedRoles={[1]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>Admin</Link>
              <span className={styles.crumbSep}>/</span>
              <Link href="/admin/students" className={styles.crumbLink}>Students</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Details</span>
            </div>

            <h1 className={styles.title}>Student Details</h1>
            <p className={styles.subtitle}>Profile, interest, assessments and finance.</p>
          </div>

          {/* TOP RIGHT: Back + Interest buttons (as you requested) */}
          <div className={styles.right}>
            <Link href="/admin/students" className={`${styles.btn} ${styles.primary}`}>
              ← Back
            </Link>

            <div className={styles.interestTop}>
              <div className={styles.interestBadge}>
                <span className={`${styles.pill} ${styles[interestClass(interestLabel)]}`}>
                  {interestLabel}
                </span>
              </div>

              <input
                className={styles.callInput}
                value={callResponse}
                onChange={(e) => setCallResponse(e.target.value)}
                placeholder="Call response (optional)"
              />

              <div className={styles.interestBtns}>
                {interestOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.btn} ${styles.small}`}
                    disabled={busyInterest}
                    onClick={() => updateInterest(opt.id)}
                    style={{
                      borderLeft: opt.interest === 'Interested'
                        ? '3px solid #22c55e'
                        : opt.interest === 'Not Interested'
                        ? '3px solid #ef4444'
                        : opt.interest === 'Call Back Later'
                        ? '3px solid #f59e0b'
                        : opt.interest === 'Not Reachable'
                        ? '3px solid #64748b'
                        : '3px solid #8b5cf6',
                    }}
                  >
                    {opt.interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {loading && (
          <section className={styles.card}>
            <div className={styles.skeletonWrap}>
              <div className={styles.skRow} /><div className={styles.skRow} /><div className={styles.skRow} />
              <div className={styles.skRow} /><div className={styles.skRow} />
            </div>
          </section>
        )}

        {!loading && error && (
          <section className={styles.card}>
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load student</div>
              <div className={styles.stateText}>{error}</div>
              <div className={styles.stateActions}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>Go to Login →</Link>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && student && (
          <>
            {/* Student info */}
            <section className={styles.card}>
              <div className={styles.detailsCard}>
                <div className={styles.topRow}>
                  <div className={styles.identity}>
                    <div className={styles.avatar} aria-hidden="true">
                      {(student.name?.[0] || 'S').toUpperCase()}
                    </div>
                    <div className={styles.identityText}>
                      <div className={styles.name}>{student.name}</div>
                      <div className={styles.idLine}>
                        Student ID: <b>{student.id}</b>
                      </div>
                    </div>
                  </div>

                  <span className={`${styles.pill} ${student.status === 1 ? styles.ok : styles.bad}`}>
                    {studentStatusLabel}
                  </span>
                </div>

                <div className={styles.divider} />

                <div className={styles.grid}>
                  <div className={styles.field}>
                    <span className={styles.k}>Email</span>
                    <span className={styles.v}>{student.email}</span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.k}>Phone</span>
                    <span className={styles.v}>{student.phone}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Assessments */}
            <section className={styles.card}>
              <div className={styles.detailsCard}>
                <div className={styles.sectionHead}>
                  <div>
                    <div className={styles.sectionTitle}>Assessment Details</div>
                    <div className={styles.sectionSub}>Attempts and certificates</div>
                  </div>
                </div>

                <div className={styles.divider} />

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
                              <div className={styles.strong}>
                                {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
                              </div>
                              <div className={styles.dim}>Attempt ID: {a.id}</div>
                            </td>
                            <td>
                              <span className={`${styles.pill} ${a.status === 'completed' ? styles.ok : styles.neutral}`}>
                                {a.status}
                              </span>
                            </td>
                            <td>{a.score}</td>
                            <td>
                              {a.certificate_code ? (
                                <span className={`${styles.pill} ${styles.neutral}`}>{a.certificate_code}</span>
                              ) : (
                                <span className={styles.dim}>—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className={styles.emptyRow}>No attempts found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Finance + Payments */}
            <section className={styles.card}>
              <div className={styles.detailsCard}>
                <div className={styles.sectionHead}>
                  <div>
                    <div className={styles.sectionTitle}>Fees & Payments</div>
                    <div className={styles.sectionSub}>Installments & due tracking</div>
                  </div>

                  <div className={styles.feeMini}>
                    <span className={styles.pill}>Total: ₹{totalFee}</span>
                    <span className={`${styles.pill} ${styles.ok}`}>Paid: ₹{paidAmount}</span>
                    <span className={`${styles.pill} ${styles.bad}`}>Due: ₹{dueAmount}</span>
                    {nextDueDate && <span className={`${styles.pill} ${styles.neutral}`}>Next Due: {nextDueDate}</span>}
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.formGrid}>
                  <input
                    className={styles.input}
                    type="number"
                    placeholder="Amount"
                    value={payForm.amount}
                    onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  />
                  <input
                    className={styles.input}
                    type="date"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm((p) => ({ ...p, payment_date: e.target.value }))}
                  />
                  <select
                    className={styles.input}
                    value={payForm.payment_mode}
                    onChange={(e) => setPayForm((p) => ({ ...p, payment_mode: e.target.value }))}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                  </select>
                  <input
                    className={styles.input}
                    placeholder="Reference ID"
                    value={payForm.reference_id}
                    onChange={(e) => setPayForm((p) => ({ ...p, reference_id: e.target.value }))}
                  />
                  <input
                    className={styles.input}
                    placeholder="Remarks"
                    value={payForm.remarks}
                    onChange={(e) => setPayForm((p) => ({ ...p, remarks: e.target.value }))}
                  />
                  <button
                    className={`${styles.btn} ${styles.primary}`}
                    onClick={addPayment}
                    disabled={payBusy || !payForm.amount || !payForm.payment_date}
                    type="button"
                  >
                    {payBusy ? 'Saving…' : 'Add Payment'}
                  </button>
                </div>

                <div className={styles.divider} />

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Mode</th>
                        <th>Ref</th>
                        <th>Remarks</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length ? (
                        payments.map((p) => (
                          <tr key={p.id}>
                            <td>{p.payment_date}</td>
                            <td>₹{p.amount}</td>
                            <td>{p.payment_mode || '—'}</td>
                            <td>{p.reference_id || '—'}</td>
                            <td>{p.remarks || '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className={`${styles.btn} ${styles.small}`}
                                type="button"
                                disabled={payBusy}
                                onClick={() => deletePayment(p.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={6} className={styles.emptyRow}>No payments yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Attendance + Marks */}
            <section className={styles.grid2}>
              <section className={styles.card}>
                <div className={styles.detailsCard}>
                  <div className={styles.sectionHead}>
                    <div>
                      <div className={styles.sectionTitle}>Attendance</div>
                      <div className={styles.sectionSub}>Mark daily attendance</div>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.formGrid2}>
                    <input
                      className={styles.input}
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                    />
                    <select
                      className={styles.input}
                      value={attStatus}
                      onChange={(e) => setAttStatus(e.target.value as any)}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                    </select>
                    <button
                      className={`${styles.btn} ${styles.primary}`}
                      type="button"
                      disabled={attBusy || !attDate}
                      onClick={markAttendance}
                    >
                      {attBusy ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.detailsCard}>
                  <div className={styles.sectionHead}>
                    <div>
                      <div className={styles.sectionTitle}>Marks</div>
                      <div className={styles.sectionSub}>Add assessment marks</div>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.formGrid2}>
                    <input
                      className={styles.input}
                      placeholder="Title (e.g. Module 1)"
                      value={markForm.title}
                      onChange={(e) => setMarkForm((p) => ({ ...p, title: e.target.value }))}
                    />
                    <input
                      className={styles.input}
                      type="number"
                      placeholder="Score"
                      value={markForm.score}
                      onChange={(e) => setMarkForm((p) => ({ ...p, score: e.target.value }))}
                    />
                    <input
                      className={styles.input}
                      type="number"
                      placeholder="Max"
                      value={markForm.max_score}
                      onChange={(e) => setMarkForm((p) => ({ ...p, max_score: e.target.value }))}
                    />
                    <input
                      className={styles.input}
                      placeholder="Remark (optional)"
                      value={markForm.remark}
                      onChange={(e) => setMarkForm((p) => ({ ...p, remark: e.target.value }))}
                    />
                    <button
                      className={`${styles.btn} ${styles.primary}`}
                      type="button"
                      disabled={markBusy || !markForm.title || !markForm.score}
                      onClick={addMark}
                    >
                      {markBusy ? 'Saving…' : 'Add Mark'}
                    </button>
                  </div>
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}