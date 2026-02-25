// 'use client';

// import RoleGuard from '@/components/RoleGuard';
// import Link from 'next/link';
// import { useEffect, useMemo, useState } from 'react';
// import styles from './enrollmentRequests.module.css';
// import { fetchWithAuth } from '@/lib/api';

// type EnrollmentRequest = {
//   id: number;
//   course_id: number | null;
//   college: string | null;
//   name: string;
//   email: string;
//   phone_number: string;
//   payment_method?: string | null;
//   transaction_number?: string | null;
//   created_at?: string;
// };

// export default function AdminEnrollmentRequestsPage() {
//   const [rows, setRows] = useState<EnrollmentRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Convert modal state
//   const [open, setOpen] = useState(false);
//   const [activeReq, setActiveReq] = useState<EnrollmentRequest | null>(null);

//   const [totalFee, setTotalFee] = useState('');
//   const [firstPayment, setFirstPayment] = useState('');
//   const [paymentMode, setPaymentMode] = useState('Cash');
//   const [referenceId, setReferenceId] = useState('');
//   const [nextDueDate, setNextDueDate] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [successCreds, setSuccessCreds] = useState<{ enrollment_id: string; password: string } | null>(null);

//   const load = async () => {
//     try {
//       setLoading(true);
//       setError('');
//       const json = await fetchWithAuth('https://api.easycoders.in/projects/backend/public/api/admin/enrollment-requests');
//       // Laravel paginator
//       setRows(json?.data?.data ?? json?.data ?? []);
//     } catch (e: any) {
//       setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load enrollment requests');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { load(); }, []);

//   const openConvert = (r: EnrollmentRequest) => {
//     setActiveReq(r);
//     setTotalFee('');
//     setFirstPayment('');
//     setPaymentMode('Cash');
//     setReferenceId(r.transaction_number || '');
//     setNextDueDate('');
//     setSuccessCreds(null);
//     setOpen(true);
//   };

//   const convertNow = async () => {
//     if (!activeReq) return;
//     try {
//       setSubmitting(true);
//       setSuccessCreds(null);

//       const payload = {
//         total_fee: Number(totalFee || 0),
//         first_payment_amount: Number(firstPayment || 0),
//         payment_mode: paymentMode || null,
//         reference_id: referenceId || null,
//         next_due_date: nextDueDate,
//         remarks: 'Converted from enrollment request',
//       };

//       const json = await fetchWithAuth(
//         `https://api.easycoders.in/projects/backend/public/api/admin/enrollment-requests/${activeReq.id}/convert`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         }
//       );

//       setSuccessCreds({
//         enrollment_id: json?.data?.enrollment_id,
//         password: json?.data?.temporary_password,
//       });

//       // Refresh list after conversion
//       await load();
//     } catch (e: any) {
//       setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : (e?.message || 'Conversion failed'));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <RoleGuard allowedRoles={[1]}>
//       <div className={styles.wrap}>
//         <header className={styles.topbar}>
//           <div className={styles.left}>
//             <div className={styles.crumbs}>
//               <Link href="/admin" className={styles.crumbLink}>Admin</Link>
//               <span className={styles.crumbSep}>/</span>
//               <span className={styles.crumbNow}>Enrollment Requests</span>
//             </div>
//             <h1 className={styles.title}>Enrollment Requests</h1>
//             <p className={styles.subtitle}>Convert approved requests into Student accounts with fees & first installment.</p>
//           </div>

//           <div className={styles.right}>
//             <button className={`${styles.btn} ${styles.primary}`} onClick={load} type="button">
//               Refresh
//             </button>
//           </div>
//         </header>

//         <section className={styles.card}>
//           {loading && <div className={styles.state}>Loading…</div>}
//           {!loading && error && (
//             <div className={`${styles.state} ${styles.error}`}>
//               <div className={styles.stateTitle}>Could not load</div>
//               <div className={styles.stateText}>{error}</div>
//             </div>
//           )}

//           {!loading && !error && rows.length === 0 && (
//             <div className={styles.state}>
//               <div className={styles.stateTitle}>No requests</div>
//               <div className={styles.stateText}>All caught up 🎉</div>
//             </div>
//           )}

//           {!loading && !error && rows.length > 0 && (
//             <div className={styles.tableWrap}>
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>Student</th>
//                     <th>Contact</th>
//                     <th>Payment</th>
//                     <th style={{ textAlign: 'right' }}>Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rows.map((r) => (
//                     <tr key={r.id}>
//                       <td>
//                         <div className={styles.studentCell}>
//                           <div className={styles.avatar}>{(r.name?.[0] || 'S').toUpperCase()}</div>
//                           <div className={styles.studentMeta}>
//                             <div className={styles.studentName}>{r.name}</div>
//                             <div className={styles.studentSub}>Request ID: {r.id}</div>
//                           </div>
//                         </div>
//                       </td>
//                       <td>
//                         <div className={styles.muted}>{r.email}</div>
//                         <div className={styles.muted}>{r.phone_number}</div>
//                       </td>
//                       <td>
//                         <div className={styles.muted}>{r.payment_method || '—'}</div>
//                         <div className={styles.muted}>{r.transaction_number || '—'}</div>
//                       </td>
//                       <td style={{ textAlign: 'right' }}>
//                         <button className={`${styles.btn} ${styles.small}`} onClick={() => openConvert(r)} type="button">
//                           Convert →
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               {/* Simple mobile cards */}
//               <div className={styles.mobileList}>
//                 {rows.map((r) => (
//                   <div key={r.id} className={styles.mCard}>
//                     <div className={styles.mTop}>
//                       <div className={styles.mLeft}>
//                         <div className={styles.avatar}>{(r.name?.[0] || 'S').toUpperCase()}</div>
//                         <div className={styles.mText}>
//                           <div className={styles.studentName}>{r.name}</div>
//                           <div className={styles.studentSub}>{r.email}</div>
//                         </div>
//                       </div>
//                       <button className={`${styles.btn} ${styles.small}`} onClick={() => openConvert(r)} type="button">
//                         Convert →
//                       </button>
//                     </div>
//                     <div className={styles.mGrid}>
//                       <div><span className={styles.k}>Phone</span><span className={styles.v}>{r.phone_number}</span></div>
//                       <div><span className={styles.k}>Txn</span><span className={styles.v}>{r.transaction_number || '—'}</span></div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//             </div>
//           )}
//         </section>

//         {/* Convert Modal */}
//         {open && activeReq && (
//           <div className={styles.modalOverlay} onClick={() => !submitting && setOpen(false)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <div className={styles.modalHead}>
//                 <div>
//                   <div className={styles.modalTitle}>Convert to Student</div>
//                   <div className={styles.modalSub}>{activeReq.name} • {activeReq.email}</div>
//                 </div>
//                 <button className={styles.iconBtn} onClick={() => !submitting && setOpen(false)}>✕</button>
//               </div>

//               <div className={styles.form}>
//                 <div className={styles.field}>
//                   <label>Total Fee</label>
//                   <input value={totalFee} onChange={(e) => setTotalFee(e.target.value)} placeholder="e.g. 25000" />
//                 </div>

//                 <div className={styles.field}>
//                   <label>First Installment</label>
//                   <input value={firstPayment} onChange={(e) => setFirstPayment(e.target.value)} placeholder="e.g. 5000" />
//                 </div>

//                 <div className={styles.field}>
//                   <label>Payment Mode</label>
//                   <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
//                     <option>Cash</option>
//                     <option>UPI</option>
//                     <option>Card</option>
//                     <option>Bank Transfer</option>
//                   </select>
//                 </div>

//                 <div className={styles.field}>
//                   <label>Reference / Txn</label>
//                   <input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="Optional" />
//                 </div>

//                 <div className={styles.field}>
//                   <label>Next Due Date</label>
//                   <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
//                 </div>

//                 {successCreds && (
//                   <div className={styles.successBox}>
//                     <div><b>Enrollment ID:</b> {successCreds.enrollment_id}</div>
//                     <div><b>Temp Password:</b> {successCreds.password}</div>
//                     <div className={styles.successHint}>Show this to the student. They must change password on first login.</div>
//                   </div>
//                 )}

//                 <div className={styles.modalActions}>
//                   <button className={styles.btn} onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
//                   <button
//                     className={`${styles.btn} ${styles.primary}`}
//                     onClick={convertNow}
//                     disabled={submitting || !totalFee || !firstPayment || !nextDueDate}
//                   >
//                     {submitting ? 'Converting…' : 'Convert Student'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </RoleGuard>
//   );
// }
'use client';

import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './enrollmentRequests.module.css'
import { fetchWithAuth } from '@/lib/api';

type ReqRow = {
  id: number;
  course_id?: number;
  college?: string;
  name: string;
  email: string;
  phone_number: string;
  payment_method?: string;
  transaction_number?: string;
  created_at?: string;
};

export default function EnrollmentRequestsPage() {
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<ReqRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [convertResult, setConvertResult] = useState<any>(null);

  const [form, setForm] = useState({
    total_fee: '',
    first_payment_amount: '',
    first_payment_date: '',
    next_due_date: '',
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const json = await fetchWithAuth(
        'https://api.easycoders.in/projects/backend/public/api/admin/enrollmentRequests'
      );
      setRows(json.data || []);
    } catch (e: any) {
      setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load requests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows, [rows]);

  const convert = async () => {
    if (!selected) return;
    try {
      setBusy(true);
      setConvertResult(null);

      const payload = {
        total_fee: Number(form.total_fee),
        first_payment_amount: Number(form.first_payment_amount),
        first_payment_date: form.first_payment_date,
        next_due_date: form.next_due_date || null,
      };

      const json = await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/admin/enrollmentRequests/${selected.id}/convert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      setConvertResult(json.data);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Conversion failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[1,2,4]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>Admin</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Enrollment Requests</span>
            </div>
            <h1 className={styles.title}>Enrollment Requests</h1>
            <p className={styles.subtitle}>Convert requests to Student accounts (Role = 3)</p>
          </div>

          <div className={styles.right}>
            <button className={`${styles.btn} ${styles.primary}`} onClick={load} type="button">
              Refresh
            </button>
          </div>
        </header>

        <section className={styles.card}>
          {loading && <div className={styles.state}>Loading…</div>}
          {!loading && error && <div className={`${styles.state} ${styles.error}`}>{error}</div>}

          {!loading && !error && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Phone</th>
                    <th>Txn</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className={styles.strong}>{r.name}</div>
                        <div className={styles.dim}>{r.email}</div>
                      </td>
                      <td>{r.phone_number}</td>
                      <td className={styles.dim}>{r.transaction_number || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={`${styles.btn} ${styles.small}`}
                          type="button"
                          onClick={() => {
                            setSelected(r);
                            setConvertResult(null);
                            setForm({ total_fee: '', first_payment_amount: '', first_payment_date: '', next_due_date: '' });
                          }}
                        >
                          Convert →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={4} className={styles.dim}>No requests found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Convert Modal */}
        {selected && (
          <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHead}>
                <div>
                  <div className={styles.modalTitle}>Convert to Student</div>
                  <div className={styles.dim}>{selected.name} • {selected.email}</div>
                </div>
                <button className={styles.x} onClick={() => setSelected(null)} type="button">✕</button>
              </div>

              <div className={styles.formGrid}>
                <input className={styles.input} placeholder="Total Fee" type="number"
                  value={form.total_fee} onChange={(e) => setForm((p) => ({ ...p, total_fee: e.target.value }))} />
                <input className={styles.input} placeholder="First Payment" type="number"
                  value={form.first_payment_amount} onChange={(e) => setForm((p) => ({ ...p, first_payment_amount: e.target.value }))} />
                <input className={styles.input} type="date"
                  value={form.first_payment_date} onChange={(e) => setForm((p) => ({ ...p, first_payment_date: e.target.value }))} />
                <input className={styles.input} type="date"
                  value={form.next_due_date} onChange={(e) => setForm((p) => ({ ...p, next_due_date: e.target.value }))} />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.btn} type="button" onClick={() => setSelected(null)}>Cancel</button>
                <button
                  className={`${styles.btn} ${styles.primary}`}
                  type="button"
                  disabled={busy || !form.total_fee || !form.first_payment_amount || !form.first_payment_date}
                  onClick={convert}
                >
                  {busy ? 'Converting…' : 'Convert'}
                </button>
              </div>

              {convertResult && (
                <div className={styles.resultBox}>
                  <div className={styles.strong}>Student Created ✅</div>
                  <div className={styles.dim}>Enrollment ID: <b>{convertResult.enrollment_id}</b></div>
                  <div className={styles.dim}>Email: <b>{convertResult.email}</b></div>
                  <div className={styles.dim}>Password: <b>{convertResult.password}</b></div>
                  <div className={styles.dim}>Student must change password on first login.</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}