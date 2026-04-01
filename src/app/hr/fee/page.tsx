'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './fee.module.css';
import RoleGuard from '@/components/RoleGuard';
import {
  searchStudents,
  getStudentDetails,
  addPayment,
} from '../../../components/allApis';

export default function FeeDetails() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_mode: 'cash' });

  // ✅ FIX: track whether the user just selected a student
  const justSelected = useRef(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      // ✅ Skip the search if selection just happened
      if (justSelected.current) {
        justSelected.current = false;
        return;
      }
      if (search.length < 2) { setStudents([]); return; }
      const res = await searchStudents(search);
      setStudents(res);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSelect = async (student: any) => {
    // ✅ Set flag BEFORE updating search to suppress the upcoming useEffect
    justSelected.current = true;

    setSearch(student.name);
    setStudents([]);        // close dropdown immediately
    setLoading(true);
    setSelected(null);
    setProfile(null);

    try {
      const res = await getStudentDetails(student.id);
      setSelected(res.student);
      setProfile(res.profile);
      setPayments(res.payments || []);
    } catch {
      alert('Failed to load student');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentForm.amount) return alert('Enter amount');
    setLoading(true);
    try {
      await addPayment({
        user_id: selected.id,
        amount: Number(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
      });
      const res = await getStudentDetails(selected.id);
      setProfile(res.profile);
      setPayments(res.payments);
      setLastPayment({
        amount: paymentForm.amount,
        mode: paymentForm.payment_mode,
        date: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
        balance: res.profile.due_amount,
      });
      setShowModal(true);
      setPaymentForm({ amount: '', payment_mode: 'cash' });
    } catch {
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const initials = selected?.name
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??';

  const paidPct = profile
    ? Math.min(100, Math.round((profile.paid_amount / profile.total_fee) * 100))
    : 0;

  const modeLabel: Record<string, string> = {
    cash: 'Cash', upi: 'UPI', netbanking: 'Net Banking',
  };

  return (
    <RoleGuard allowedRoles={[1, 2, 4]}>
      <div className={styles.wrap}>

        <div className={styles.crumbs}>
          <span className={styles.crumbLink}>Admin</span>
          <span className={styles.crumbSep}>/</span>
          <span className={styles.crumbNow}>Fee Management</span>
        </div>
        <h1 className={styles.title}>Fee Management</h1>

        {/* ── Search ── */}
        <div className={styles.searchWrap}>
          <div className={styles.searchInner}>
            <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M10.5 10.5l3 3" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search student by name or email…"
              value={search}
              onChange={(e) => {
                // ✅ If user manually types again after selecting, reset the flag
                justSelected.current = false;
                setSearch(e.target.value);
                // Clear selected student if user clears/changes the input
                if (selected && e.target.value !== selected.name) {
                  setSelected(null);
                  setProfile(null);
                  setPayments([]);
                }
              }}
            />
            {/* ✅ Clear button appears after selection */}
            {search && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  justSelected.current = false;
                  setSearch('');
                  setStudents([]);
                  setSelected(null);
                  setProfile(null);
                  setPayments([]);
                }}
              >
                ✕
              </button>
            )}
          </div>

          {students.length > 0 && (
            <div className={styles.dropdown}>
              {students.map((s) => (
                <div key={s.id} className={styles.dropItem} onClick={() => handleSelect(s)}>
                  <div>
                    <div className={styles.dropName}>{s.name}</div>
                    <div className={styles.dropEmail}>{s.email}</div>
                  </div>
                  <div className={styles.dropEnroll}>{s.enrollment_id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && !selected && (
          <div className={styles.stateBox}>
            <div className={styles.loadingDots}>
              <span /><span /><span />
            </div>
            <div style={{ marginTop: 8 }}>Loading student details…</div>
          </div>
        )}

        {/* ── Student Content ── */}
        {selected && profile && (
          <>
            <div className={styles.studentHeader}>
              <div className={styles.avatar}>{initials}</div>
              <div>
                <div className={styles.studentName}>{selected.name}</div>
                <div className={styles.studentMeta}>{selected.email} · {selected.phone}</div>
                <div className={styles.enrollTag}>{profile.enrollment_id}</div>
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Total Fee</div>
                <div className={styles.metricVal}>
                  ₹{Number(profile.total_fee).toLocaleString('en-IN')}
                </div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${paidPct}%` }} />
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Amount Paid</div>
                <div className={`${styles.metricVal} ${styles.paid}`}>
                  ₹{Number(profile.paid_amount).toLocaleString('en-IN')}
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Balance Due</div>
                <div className={`${styles.metricVal} ${styles.due}`}>
                  ₹{Number(profile.due_amount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardIco}>👤</div>
                <div>
                  <div className={styles.cardTitle}>Student Information</div>
                  <div className={styles.cardSub}>Enrollment & course details</div>
                </div>
              </div>
              <div className={styles.infoRows}>
                {[
                  ['Course', profile.course?.name],
                  ['College', profile.college?.name],
                  ['Phone', selected.phone],
                  ['Email', selected.email],
                ].map(([k, v]) => (
                  <div key={k} className={styles.infoRow}>
                    <span className={styles.infoK}>{k}</span>
                    <span className={styles.infoV}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardIco}>💳</div>
                <div>
                  <div className={styles.cardTitle}>Add Payment</div>
                  <div className={styles.cardSub}>Record a new fee installment</div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.form2}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Amount <span className={styles.req}>*</span>
                    </label>
                    <input
                      className={styles.input}
                      type="number"
                      placeholder="Enter amount"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, amount: e.target.value }))
                      }
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>
                      Payment Mode <span className={styles.req}>*</span>
                    </label>
                    <select
                      className={styles.input}
                      value={paymentForm.payment_mode}
                      onChange={(e) =>
                        setPaymentForm((p) => ({ ...p, payment_mode: e.target.value }))
                      }
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                </div>
                <button className={styles.btnSubmit} onClick={handlePayment} disabled={loading}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {loading ? 'Processing…' : 'Add Payment'}
                </button>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardIco}>📋</div>
                <div>
                  <div className={styles.cardTitle}>Payment History</div>
                  <div className={styles.cardSub}>
                    {payments.length} transaction{payments.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className={styles.amtCell}>
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span className={`${styles.modePill} ${styles[p.payment_mode] ?? ''}`}>
                            {modeLabel[p.payment_mode] ?? p.payment_mode}
                          </span>
                        </td>
                        <td className={styles.dateCell}>{p.payment_date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={styles.statusPill}>✓ Received</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── Success Modal ── */}
        {showModal && lastPayment && (
          <div className={styles.modalBg}>
            <div className={styles.modal}>
              <div className={styles.modalTop}>
                <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
                <div className={styles.checkRing}>✓</div>
                <h2 className={styles.modalHeading}>Payment Received!</h2>
                <p className={styles.modalSub}>Transaction recorded successfully</p>
              </div>
              <div className={styles.modalBody}>
                {[
                  ['Amount', `₹${Number(lastPayment.amount).toLocaleString('en-IN')}`],
                  ['Mode', modeLabel[lastPayment.mode] ?? lastPayment.mode],
                  ['Date & Time', lastPayment.date],
                  ['Balance After', lastPayment.balance > 0
                    ? `₹${Number(lastPayment.balance).toLocaleString('en-IN')} remaining`
                    : 'Fully paid'],
                ].map(([k, v]) => (
                  <div key={k} className={styles.mRow}>
                    <span className={styles.mK}>{k}</span>
                    <span
                      className={styles.mV}
                      style={k === 'Balance After'
                        ? { color: lastPayment.balance > 0 ? '#d97706' : '#059669' }
                        : undefined}
                    >
                      {v}
                    </span>
                  </div>
                ))}
                <button className={styles.dlBtn}>⬇ Download Receipt</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}