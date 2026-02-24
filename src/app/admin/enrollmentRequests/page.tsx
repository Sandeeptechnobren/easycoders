// // "use client";

// // import { useState, useEffect } from "react";
// // import api from "@/lib/axios";
// // import Loader from "@/app/loader/page";

// // // Define the type for an Enrollment
// // interface Enrollment {
// //     id: number;
// //     name: string;
// //     email: string;
// //     phone_number: string;
// //     college: string;
// //     course_name?: string; // Optional if backend returns it
// //     date: string;
// //     resolved: boolean;
// // }

// // export default function EnrollmentRequests() {
// //     const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
// //     const [loading, setLoading] = useState(true);

// //     // Fetch Data
// //     useEffect(() => {
// //         async function fetchEnrollments() {
// //             try {
// //                 const res = await api.get("/enrollmentRequests");
// //                 const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

// //                 const mappedData = data.map((item: any) => ({
// //                     id: item.id,
// //                     name: item.name,
// //                     email: item.email,
// //                     phone_number: item.phone_number,
// //                     college: item.college,
// //                     course_name: item.course?.title || item.course_name || "N/A",
// //                     date: item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date || 'N/A',
// //                     resolved: false
// //                 }));
// //                 setEnrollments(mappedData);
// //             } catch (error) {
// //                 console.error("Failed to fetch enrollments", error);
// //             } finally {
// //                 setLoading(false);
// //             }
// //         }
// //         fetchEnrollments();
// //     }, []);

// //     // Toggle Resolved Logic
// //     const handleToggleResolved = (id: number) => {
// //         setEnrollments(enrollments.map((enr) =>
// //             enr.id === id ? { ...enr, resolved: !enr.resolved } : enr
// //         ));
// //     };

// //     // Stats
// //     const totalEnrollments = enrollments.length;
// //     const todayCount = enrollments.filter(i => i.date === new Date().toLocaleDateString()).length;

// //     return (
// //         <div className="min-vh-100 d-flex flex-column" style={{ background: "#050505", color: "#e0e6ed", fontFamily: "'Inter', sans-serif" }}>

// //             <div className="container-fluid p-4 p-md-5 mb-auto">
// //                 {/* Header Section */}
// //                 <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
// //                     <div>
// //                         <h1 className="fw-bold display-5 mb-1"
// //                             style={{
// //                                 background: "linear-gradient(90deg, #00c2ff, #00ff9d)",
// //                                 WebkitBackgroundClip: "text",
// //                                 WebkitTextFillColor: "transparent",
// //                                 letterSpacing: "-1px"
// //                             }}>
// //                             Enrollment Requests
// //                         </h1>
// //                         <p className="text-secondary mb-0">Manage new course enrollment applications.</p>
// //                     </div>

// //                     {/* Stats Cards */}
// //                     <div className="d-flex gap-3">
// //                         <div className="px-4 py-3 rounded-4"
// //                             style={{ background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)" }}>
// //                             <span className="d-block text-info small text-uppercase fw-bold">Total Requests</span>
// //                             <span className="h3 fw-bold mb-0 text-white">{totalEnrollments}</span>
// //                         </div>
// //                         <div className="px-4 py-3 rounded-4"
// //                             style={{ background: "rgba(0,255,157,0.1)", border: "1px solid rgba(0,255,157,0.2)" }}>
// //                             <span className="d-block text-success small text-uppercase fw-bold">New Today</span>
// //                             <span className="h3 fw-bold mb-0 text-white">{todayCount}</span>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 {loading ? (
// //                     <Loader />
// //                 ) : enrollments.length > 0 ? (
// //                     <div className="table-responsive rounded-4 p-3"
// //                         style={{
// //                             background: "rgba(20, 20, 20, 0.6)",
// //                             backdropFilter: "blur(12px)",
// //                             border: "1px solid rgba(255, 255, 255, 0.08)",
// //                             boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
// //                         }}>
// //                         <table className="table table-dark table-hover align-middle mb-0" style={{ background: "transparent" }}>
// //                             <thead style={{ borderBottom: "1px solid rgba(0,194,255,0.3)" }}>
// //                                 <tr>
// //                                     <th className="py-3 ps-3 text-info">Date</th>
// //                                     <th className="py-3 text-info">Student Name</th>
// //                                     <th className="py-3 text-info">Course</th>
// //                                     <th className="py-3 text-info">Contact</th>
// //                                     <th className="py-3 text-info">College</th>
// //                                     <th className="py-3 text-end pe-3 text-info">Status</th>
// //                                 </tr>
// //                             </thead>
// //                             <tbody>
// //                                 {enrollments.map((enr) => (
// //                                     <tr key={enr.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
// //                                         <td className="ps-3 text-secondary">{enr.date}</td>
// //                                         <td className="fw-bold text-white">{enr.name}</td>
// //                                         <td className="text-info">{enr.course_name}</td>
// //                                         <td>
// //                                             <div className="d-flex flex-column">
// //                                                 <a href={`mailto:${enr.email}`} className="text-decoration-none text-white small mb-1">
// //                                                     {enr.email}
// //                                                 </a>
// //                                                 <span className="text-secondary small">{enr.phone_number}</span>
// //                                             </div>
// //                                         </td>
// //                                         <td className="text-secondary small">{enr.college}</td>
// //                                         <td className="text-end pe-3">
// //                                             <div className="d-flex align-items-center justify-content-end gap-3">
// //                                                 <div className="form-check form-switch m-0">
// //                                                     <input
// //                                                         className="form-check-input shadow-none"
// //                                                         type="checkbox"
// //                                                         role="switch"
// //                                                         checked={enr.resolved}
// //                                                         onChange={() => handleToggleResolved(enr.id)}
// //                                                         title={enr.resolved ? "Status: Resolved" : "Status: Pending"}
// //                                                         style={{
// //                                                             cursor: "pointer",
// //                                                             width: "40px",
// //                                                             height: "20px",
// //                                                             backgroundColor: enr.resolved ? "#00ff9d" : "#343a40",
// //                                                             borderColor: enr.resolved ? "#00ff9d" : "#495057",
// //                                                             transition: "0.3s ease"
// //                                                         }}
// //                                                     />
// //                                                 </div>
// //                                             </div>
// //                                         </td>
// //                                     </tr>
// //                                 ))}
// //                             </tbody>
// //                         </table>
// //                     </div>
// //                 ) : (
// //                     <div className="text-center py-5 text-muted">
// //                         <div className="mb-3 fs-1">📝</div>
// //                         <h4>No enrollment requests</h4>
// //                         <p>New student applications will appear here.</p>
// //                     </div>
// //                 )}
// //             </div>

// //         </div>
// //     );
// // }

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
    <RoleGuard allowedRoles={[1]}>
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