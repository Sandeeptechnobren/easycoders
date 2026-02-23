// // 'use client';

// // import Link from 'next/link';
// // import { useEffect, useState } from 'react';
// // import { useParams } from 'next/navigation';
// // import RoleGuard from '@/components/RoleGuard';
// // import styles from './student-details.module.css';

// // type AssessmentAttempt = {
// //   id: number;
// //   user_id: number;
// //   assessment_id: number;
// //   score: number;
// //   status: string; // "completed"
// //   certificate_code: string;
// //   assessment?: {
// //     id: number;
// //     title: string;
// //   };
// // };

// // type StudentData = {
// //   id: number;
// //   name: string;
// //   email: string;
// //   phone: string;
// //   status: number; // 1/0
// //   assessments_attempts: AssessmentAttempt[];
// // };

// // type StudentDetailsApiResponse = {
// //   status: 'success' | 'error';
// //   data: StudentData | null;
// // };

// // export default function HrStudentDetailsPage() {
// //   const params = useParams();
// //   const id = String(params?.id || '');

// //   const [student, setStudent] = useState<StudentData | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');

// //   useEffect(() => {
// //     const fetchStudent = async () => {
// //       try {
// //         setLoading(true);
// //         setError('');

// //         const token = localStorage.getItem('token');
// //         if (!token) throw new Error('Unauthorized');

// //         const res = await fetch(
// //           `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(
// //             id
// //           )}`,
// //           {
// //             headers: {
// //               Authorization: `Bearer ${token}`,
// //               Accept: 'application/json',
// //             },
// //           }
// //         );

// //         if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
// //         if (!res.ok) throw new Error('Not found');

// //         const json: StudentDetailsApiResponse = await res.json();
// //         setStudent(json.data || null);
// //       } catch (e: any) {
// //         setStudent(null);
// //         setError(
// //           e?.message === 'Unauthorized'
// //             ? 'Session expired. Please login again.'
// //             : 'Student not found or failed to load.'
// //         );
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     if (id) fetchStudent();
// //   }, [id]);

// //   const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';

// //   return (
// //     <RoleGuard allowedRoles={[2]}>
// //       <div className={styles.wrap}>
// //         {/* Header */}
// //         <header className={styles.topbar}>
// //           <div className={styles.left}>
// //             <div className={styles.crumbs}>
// //               <Link href="/hr" className={styles.crumbLink}>
// //                 HR
// //               </Link>
// //               <span className={styles.crumbSep}>/</span>
// //               <Link href="/hr/students" className={styles.crumbLink}>
// //                 Students
// //               </Link>
// //               <span className={styles.crumbSep}>/</span>
// //               <span className={styles.crumbNow}>Details</span>
// //             </div>

// //             <h1 className={styles.title}>Student Details</h1>
// //             <p className={styles.subtitle}>Complete profile information for HR review.</p>
// //           </div>

// //           <div className={styles.right}>
// //             <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
// //               ← Back
// //             </Link>
// //           </div>
// //         </header>

// //         {/* Global states (only once) */}
// //         {loading && (
// //           <section className={styles.card}>
// //             <div className={styles.skeletonWrap}>
// //               <div className={styles.skRow} />
// //               <div className={styles.skRow} />
// //               <div className={styles.skRow} />
// //               <div className={styles.skRow} />
// //               <div className={styles.skRow} />
// //             </div>
// //           </section>
// //         )}

// //         {!loading && error && (
// //           <section className={styles.card}>
// //             <div className={`${styles.state} ${styles.error}`}>
// //               <div className={styles.stateTitle}>Could not load student</div>
// //               <div className={styles.stateText}>{error}</div>
// //               <div className={styles.stateActions}>
// //                 <Link href="/login" className={`${styles.btn} ${styles.small}`}>
// //                   Go to Login →
// //                 </Link>
// //                 <Link href="/hr/students" className={`${styles.btn} ${styles.small}`}>
// //                   Back to Students
// //                 </Link>
// //               </div>
// //             </div>
// //           </section>
// //         )}

// //         {/* Main content */}
// //         {!loading && !error && student && (
// //           <>
// //             {/* Student Info */}
// //             <section className={styles.card}>
// //               <div className={styles.detailsCard}>
// //                 <div className={styles.topRow}>
// //                   <div className={styles.identity}>
// //                     <div className={styles.avatar} aria-hidden="true">
// //                       {(student.name?.[0] || 'S').toUpperCase()}
// //                     </div>

// //                     <div className={styles.identityText}>
// //                       <div className={styles.name}>{student.name}</div>
// //                       <div className={styles.idLine}>
// //                         Student ID: <b>{student.id}</b>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <span
// //                     className={`${styles.pill} ${
// //                       student.status === 1 ? styles.ok : styles.bad
// //                     }`}
// //                   >
// //                     {studentStatusLabel}
// //                   </span>
// //                 </div>

// //                 <div className={styles.divider} />

// //                 <div className={styles.grid}>
// //                   <div className={styles.field}>
// //                     <span className={styles.k}>Email</span>
// //                     <span className={styles.v} title={student.email}>
// //                       {student.email}
// //                     </span>
// //                   </div>

// //                   <div className={styles.field}>
// //                     <span className={styles.k}>Phone</span>
// //                     <span className={styles.v} title={student.phone}>
// //                       {student.phone}
// //                     </span>
// //                   </div>
// //                 </div>
// //               </div>
// //             </section>

// //             {/* Assessment Details */}
// //             <section className={styles.card}>
// //               <div className={styles.detailsCard}>
// //                 <div className={styles.topRow}>
// //                   <div className={styles.identityText}>
// //                     <div className={styles.name}>Assessment Details</div>
// //                   </div>
// //                 </div>

// //                 <div className={styles.divider} />

// //                 <div className={styles.tableWrap}>
// //                   <table className={styles.table}>
// //                     <thead style={{marginBottom: 8}}>
// //                       <tr style={{ textAlign: 'left', color: '#000000' }}>
// //                         <th>Title</th>
// //                         <th>Status</th>
// //                         <th>Score</th>
// //                         <th>Certificate</th>
// //                       </tr>
// //                     </thead>

// //                     <tbody>
// //                       {student.assessments_attempts?.length ? (
// //                         student.assessments_attempts.map((a) => (
// //                           <tr key={a.id}>
// //                             <td>
// //                               <div style={{ fontWeight: 800 }}>
// //                                 {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
// //                               </div>
// //                               <div style={{ fontSize: 12, opacity: 0.7 }}>
// //                                 Attempt ID: {a.id}
// //                               </div>
// //                             </td>

// //                             <td>
// //                               <span
// //                                 className={`${styles.pill} ${
// //                                   a.status === 'completed' ? styles.ok : styles.neutral
// //                                 }`}
// //                               >
// //                                 {a.status}
// //                               </span>
// //                             </td>

// //                             <td>{a.score}</td>

// //                             <td>
// //                               {a.certificate_code ? (
// //                                 <span className={`${styles.pill} ${styles.neutral}`}>
// //                                   {a.certificate_code}
// //                                 </span>
// //                               ) : (
// //                                 <span style={{ opacity: 0.7 }}>—</span>
// //                               )}
// //                             </td>
// //                           </tr>
// //                         ))
// //                       ) : (
// //                         <tr>
// //                           <td colSpan={4} style={{ padding: 14, opacity: 0.75 }}>
// //                             No assessment attempts found.
// //                           </td>
// //                         </tr>
// //                       )}
// //                     </tbody>
// //                   </table>
// //                 </div>
// //               </div>
// //             </section>
// //           </>
// //         )}
// //       </div>
// //     </RoleGuard>
// //   );
// // }
// 'use client';

// import Link from 'next/link';
// import { useEffect, useMemo, useState } from 'react';
// import { useParams } from 'next/navigation';
// import RoleGuard from '@/components/RoleGuard';
// import styles from './student-details.module.css';

// type InterestOption = {
//   id: number;
//   interest: string;
// };

// type AttemptInterest = {
//   id: number;
//   assessment_user_id: number;
//   interest_status?: InterestOption;
//   call_response?: string | null;
// };

// type AssessmentAttempt = {
//   id: number;
//   user_id: number;
//   assessment_id: number;
//   score: number;
//   status: string;
//   certificate_code: string;
//   assessment?: {
//     id: number;
//     title: string;
//   };
//   interest?: AttemptInterest | null;
// };

// type StudentData = {
//   id: number;
//   name: string;
//   email: string;
//   phone: string;
//   status: number;
//   assessments_attempts: AssessmentAttempt[];
// };

// type StudentDetailsApiResponse = {
//   status: 'success' | 'error';
//   data: StudentData | null;
// };

// type InterestsApiResponse = {
//   status: number | string;
//   data: InterestOption[];
// };

// export default function HrStudentDetailsPage() {
//   const params = useParams();
//   const id = String(params?.id || '');

//   const [student, setStudent] = useState<StudentData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
//   const [loadingInterests, setLoadingInterests] = useState(false);
//   const [selectedInterestId, setSelectedInterestId] = useState<string>('');
//   const [updatingInterest, setUpdatingInterest] = useState(false);
//   const token = useMemo(() => {
//     if (typeof window === 'undefined') return '';
//     return localStorage.getItem('token') || '';
//   }, []);
//   const currentInterest = useMemo(() => {
//     const attempts = student?.assessments_attempts || [];
//     const firstWithInterest = attempts.find((a) => a.interest?.interest_status?.interest);
//     return firstWithInterest?.interest?.interest_status?.interest || '—';
//   }, [student]);
//   const currentInterestId = useMemo(() => {
//     const attempts = student?.assessments_attempts || [];
//     const firstWithInterest = attempts.find((a) => a.interest?.interest_status?.id);
//     return firstWithInterest?.interest?.interest_status?.id;
//   }, [student]);

//   const callResponse = useMemo(() => {
//     const attempts = student?.assessments_attempts || [];
//     const firstWithCall = attempts.find((a) => a.interest?.call_response !== undefined);
//     const v = firstWithCall?.interest?.call_response;
//     return v === null || v === undefined || String(v).trim() === '' ? '—' : String(v);
//   }, [student]);

//   const fetchStudent = async () => {
//     try {
//       setLoading(true);
//       setError('');

//       if (!token) throw new Error('Unauthorized');

//       const res = await fetch(
//         `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(id)}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: 'application/json',
//           },
//         }
//       );

//       if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
//       if (!res.ok) throw new Error('Not found');

//       const json: StudentDetailsApiResponse = await res.json();
//       const data = json.data || null;

//       setStudent(data);
//       const attempts = data?.assessments_attempts || [];
//       const firstWithInterestId = attempts.find((a) => a.interest?.interest_status?.id)?.interest
//         ?.interest_status?.id;

//       if (firstWithInterestId && !selectedInterestId) {
//         setSelectedInterestId(String(firstWithInterestId));
//       }
//     } catch (e: any) {
//       setStudent(null);
//       setError(
//         e?.message === 'Unauthorized'
//           ? 'Session expired. Please login again.'
//           : 'Student not found or failed to load.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchInterestOptions = async () => {
//     try {
//       setLoadingInterests(true);
//       if (!token) return;

//       const res = await fetch(
//         'https://api.easycoders.in/projects/backend/public/api/hr/student/interests',
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: 'application/json',
//           },
//         }
//       );

//       if (!res.ok) throw new Error('Failed to load interest options');

//       const json: InterestsApiResponse = await res.json();
//       setInterestOptions(json.data || []);
//     } catch (e) {
//       setInterestOptions([]);
//     } finally {
//       setLoadingInterests(false);
//     }
//   };

//   useEffect(() => {
//     if (!id) return;
//     fetchStudent();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id, token]);

//   useEffect(() => {
//     if (!token) return;
//     fetchInterestOptions();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [token]);

//   // Ensure dropdown follows current interest once data loads
//   useEffect(() => {
//     if (!currentInterestId) return;
//     setSelectedInterestId((prev) => prev || String(currentInterestId));
//   }, [currentInterestId]);

//   const updateStudentInterest = async () => {
//     try {
//       setUpdatingInterest(true);

//       if (!token) throw new Error('Unauthorized');
//       if (!student?.id) throw new Error('Student not loaded');

//       if (!selectedInterestId) {
//         alert('Please select an interest status.');
//         return;
//       }
//       const body = {
//         assessment_user_id: student.id,
//         interest_status: Number(selectedInterestId),
//       };

//       const res = await fetch(
//         'https://api.easycoders.in/projects/backend/public/api/hr/assessmentUser/updateInterestStatus',
//         {
//           method: 'POST',
//           headers: {
//             Authorization: `Bearer ${token}`,
//             Accept: 'application/json',
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(body),
//         }
//       );

//       if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
//       if (!res.ok) throw new Error('Failed to update interest');
//       await fetchStudent();
//     } catch (e: any) {
//       alert(
//         e?.message === 'Unauthorized'
//           ? 'Session expired. Please login again.'
//           : 'Failed to update interest status.'
//       );
//     } finally {
//       setUpdatingInterest(false);
//     }
//   };
//   const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';
//   return (
//     <RoleGuard allowedRoles={[2]}>
//       <div className={styles.wrap}>
//         <header className={styles.topbar}>
//           <div className={styles.left}>
//             <div className={styles.crumbs}>
//               <Link href="/hr" className={styles.crumbLink}>
//                 HR
//               </Link>
//               <span className={styles.crumbSep}>/</span>
//               <Link href="/hr/students" className={styles.crumbLink}>
//                 Students
//               </Link>
//               <span className={styles.crumbSep}>/</span>
//               <span className={styles.crumbNow}>Details</span>
//             </div>

//             <h1 className={styles.title}>Student Details</h1>
//             <p className={styles.subtitle}>Complete profile information for HR review.</p>
//           </div>
//           <div className={styles.right} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
//             <div
//               style={{
//                 display: 'grid',
//                 gap: 6,
//                 padding: 10,
//                 borderRadius: 14,
//                 border: '1px solid rgba(0,0,0,0.10)',
//                 background: 'rgba(255,255,255,0.85)',
//                 minWidth: 320,
//               }}
//             >
//               <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
//                 <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.9 }}>
//                   Call Feedback / Interest
//                 </div>
//                 <span className={`${styles.pill} ${styles.neutral}`} style={{ fontSize: 11 }}>
//                   Current: {currentInterest}
//                 </span>
//               </div>

//               <div style={{ fontSize: 12, opacity: 0.75 }}>
//                 Call Response: <b>{callResponse}</b>
//               </div>

//               <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
//                 <select
//                   value={selectedInterestId}
//                   onChange={(e) => setSelectedInterestId(e.target.value)}
//                   disabled={loadingInterests || loading}
//                   style={{
//                     height: 38,
//                     borderRadius: 10,
//                     padding: '0 10px',
//                     border: '1px solid rgba(0,0,0,0.12)',
//                     background: 'white',
//                     minWidth: 190,
//                   }}
//                 >
//                   <option value="">{loadingInterests ? 'Loading...' : 'Select Interest'}</option>
//                   {interestOptions.map((opt) => (
//                     <option key={opt.id} value={String(opt.id)}>
//                       {opt.interest}
//                     </option>
//                   ))}
//                 </select>
//                 <button
//                   type="button"
//                   className={`${styles.btn} ${styles.small}`}
//                   onClick={updateStudentInterest}
//                   disabled={updatingInterest || loading || !selectedInterestId}
//                 >
//                   {updatingInterest ? 'Updating…' : 'Update'}
//                 </button>
//               </div>
//             </div>
//             <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
//               ← Back
//             </Link>
//           </div>
//         </header>
//         {loading && (
//           <section className={styles.card}>
//             <div className={styles.skeletonWrap}>
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//             </div>
//           </section>
//         )}

//         {!loading && error && (
//           <section className={styles.card}>
//             <div className={`${styles.state} ${styles.error}`}>
//               <div className={styles.stateTitle}>Could not load student</div>
//               <div className={styles.stateText}>{error}</div>
//               <div className={styles.stateActions}>
//                 <Link href="/login" className={`${styles.btn} ${styles.small}`}>
//                   Go to Login →
//                 </Link>
//                 <Link href="/hr/students" className={`${styles.btn} ${styles.small}`}>
//                   Back to Students
//                 </Link>
//               </div>
//             </div>
//           </section>
//         )}

//         {!loading && !error && student && (
//           <>
//             {/* Student Info */}
//             <section className={styles.card}>
//               <div className={styles.detailsCard}>
//                 <div className={styles.topRow}>
//                   <div className={styles.identity}>
//                     <div className={styles.avatar} aria-hidden="true">
//                       {(student.name?.[0] || 'S').toUpperCase()}
//                     </div>

//                     <div className={styles.identityText}>
//                       <div className={styles.name}>{student.name}</div>
//                       <div className={styles.idLine}>
//                         Student ID: <b>{student.id}</b>
//                       </div>
//                     </div>
//                   </div>

//                   <span className={`${styles.pill} ${student.status === 1 ? styles.ok : styles.bad}`}>
//                     {studentStatusLabel}
//                   </span>
//                 </div>

//                 <div className={styles.divider} />

//                 <div className={styles.grid}>
//                   <div className={styles.field}>
//                     <span className={styles.k}>Email</span>
//                     <span className={styles.v} title={student.email}>
//                       {student.email}
//                     </span>
//                   </div>

//                   <div className={styles.field}>
//                     <span className={styles.k}>Phone</span>
//                     <span className={styles.v} title={student.phone}>
//                       {student.phone}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Assessment Details (NO interest controls inside) */}
//             <section className={styles.card}>
//               <div className={styles.detailsCard}>
//                 <div className={styles.topRow}>
//                   <div className={styles.identityText}>
//                     <div className={styles.name}>Assessment Details</div>
//                   </div>
//                 </div>

//                 <div className={styles.divider} />

//                 <div className={styles.tableWrap}>
//                   <table className={styles.table}>
//                     <thead>
//                       <tr>
//                         <th>Title</th>
//                         <th>Status</th>
//                         <th>Score</th>
//                         <th>Certificate</th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {student.assessments_attempts?.length ? (
//                         student.assessments_attempts.map((a) => (
//                           <tr key={a.id}>
//                             <td>
//                               <div style={{ fontWeight: 800 }}>
//                                 {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
//                               </div>
//                               <div style={{ fontSize: 12, opacity: 0.7 }}>Attempt ID: {a.id}</div>
//                             </td>

//                             <td>
//                               <span
//                                 className={`${styles.pill} ${
//                                   a.status === 'completed' ? styles.ok : styles.neutral
//                                 }`}
//                               >
//                                 {a.status}
//                               </span>
//                             </td>

//                             <td>{a.score}</td>

//                             <td>
//                               {a.certificate_code ? (
//                                 <span className={`${styles.pill} ${styles.neutral}`}>
//                                   {a.certificate_code}
//                                 </span>
//                               ) : (
//                                 <span style={{ opacity: 0.7 }}>—</span>
//                               )}
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan={4} style={{ padding: 14, opacity: 0.75 }}>
//                             No assessment attempts found.
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </section>
//           </>
//         )}
//       </div>
//     </RoleGuard>
//   );
// }
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import styles from './student-details.module.css';

type InterestOption = {
  id: number;
  interest: string;
};

type StudentInterest = {
  id: number;
  assessment_user_id: number; // 21
  interest_status: {
    id: number;
    interest: string;
  } | null;
  call_response: string | null;
};

type AssessmentAttempt = {
  id: number;
  user_id: number;
  assessment_id: number;
  score: number;
  status: string;
  certificate_code: string;
  assessment?: {
    id: number;
    title: string;
  };
};

type StudentData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: number; // 1/0
  assessments_attempts: AssessmentAttempt[];
  interest: StudentInterest | null; // ✅ NEW (top-level)
};

type StudentDetailsApiResponse = {
  status: 'success' | 'error';
  data: StudentData | null;
};

type InterestsApiResponse = {
  status: number | string;
  data: InterestOption[];
};

export default function HrStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  const [selectedInterestId, setSelectedInterestId] = useState<string>('');
  const [updatingInterest, setUpdatingInterest] = useState(false);

  const getToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem('token') || '');

  const fetchStudent = async () => {
    const token = getToken();
    try {
      setLoading(true);
      setError('');

      if (!token) throw new Error('Unauthorized');

      const res = await fetch(
        `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      if (!res.ok) throw new Error('Not found');

      const json: StudentDetailsApiResponse = await res.json();
      const data = json.data || null;

      setStudent(data);

      // Prefill dropdown with current interest id (if exists)
      const currentId = data?.interest?.interest_status?.id;
      if (currentId) setSelectedInterestId(String(currentId));
      else setSelectedInterestId('');
    } catch (e: any) {
      setStudent(null);
      setError(
        e?.message === 'Unauthorized'
          ? 'Session expired. Please login again.'
          : 'Student not found or failed to load.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchInterestOptions = async () => {
    const token = getToken();
    try {
      setLoadingInterests(true);
      if (!token) return;

      const res = await fetch(
        'https://api.easycoders.in/projects/backend/public/api/hr/student/interests',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) throw new Error('Failed to load interest options');
      const json: InterestsApiResponse = await res.json();
      setInterestOptions(json.data || []);
    } catch {
      setInterestOptions([]);
    } finally {
      setLoadingInterests(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchStudent();
    fetchInterestOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const currentInterestLabel = useMemo(() => {
    return student?.interest?.interest_status?.interest || '—';
  }, [student]);

  const callResponse = useMemo(() => {
    const v = student?.interest?.call_response;
    return v === null || v === undefined || String(v).trim() === '' ? '—' : String(v);
  }, [student]);

  const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';

  const updateStudentInterest = async () => {
    const token = getToken();
    try {
      setUpdatingInterest(true);

      if (!token) throw new Error('Unauthorized');
      if (!student?.id) throw new Error('Student not loaded');
      if (!selectedInterestId) {
        alert('Please select an interest status.');
        return;
      }

      // ✅ Your API expects: assessment_user_id + interest_status
      const payload = {
        assessment_user_id: student.id, // 21
        interest_status: Number(selectedInterestId), // 1..4
      };

      const res = await fetch(
        'https://api.easycoders.in/projects/backend/public/api/hr/assessmentUser/updateInterestStatus',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      if (!res.ok) throw new Error('Failed to update interest');

      await fetchStudent(); // refresh UI
    } catch (e: any) {
      alert(
        e?.message === 'Unauthorized'
          ? 'Session expired. Please login again.'
          : 'Failed to update interest status.'
      );
    } finally {
      setUpdatingInterest(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[2]}>
      <div className={styles.wrap}>
        {/* Header */}
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/hr" className={styles.crumbLink}>
                HR
              </Link>
              <span className={styles.crumbSep}>/</span>
              <Link href="/hr/students" className={styles.crumbLink}>
                Students
              </Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Details</span>
            </div>

            <h1 className={styles.title}>Student Details</h1>
            <p className={styles.subtitle}>Complete profile information for HR review.</p>
          </div>

          {/* RIGHT: Interest UI + Back button */}
          <div
            className={styles.right}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            {/* Interest box */}
            <div
              style={{
                display: 'grid',
                gap: 6,
                padding: 10,
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.10)',
                background: 'rgba(255,255,255,0.90)',
                minWidth: 320,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.9 }}>
                  Call Feedback / Interest
                </div>

                <span className={`${styles.pill} ${styles.neutral}`} style={{ fontSize: 11 }}>
                  Current: {currentInterestLabel}
                </span>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Call Response: <b>{callResponse}</b>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedInterestId}
                  onChange={(e) => setSelectedInterestId(e.target.value)}
                  disabled={loadingInterests || loading}
                  style={{
                    height: 38,
                    borderRadius: 10,
                    padding: '0 10px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'white',
                    minWidth: 190,
                  }}
                >
                  <option value="">{loadingInterests ? 'Loading...' : 'Select Interest'}</option>
                  {interestOptions.map((opt) => (
                    <option key={opt.id} value={String(opt.id)}>
                      {opt.interest}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className={`${styles.btn} ${styles.small}`}
                  onClick={updateStudentInterest}
                  disabled={updatingInterest || loading || !selectedInterestId}
                >
                  {updatingInterest ? 'Updating…' : 'Update'}
                </button>
              </div>
            </div>

            <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
              ← Back
            </Link>
          </div>
        </header>

        {/* States */}
        {loading && (
          <section className={styles.card}>
            <div className={styles.skeletonWrap}>
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
            </div>
          </section>
        )}

        {!loading && error && (
          <section className={styles.card}>
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load student</div>
              <div className={styles.stateText}>{error}</div>
              <div className={styles.stateActions}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>
                  Go to Login →
                </Link>
                <Link href="/hr/students" className={`${styles.btn} ${styles.small}`}>
                  Back to Students
                </Link>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && student && (
          <>
            {/* Student Info */}
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
                    <span className={styles.v} title={student.email}>
                      {student.email}
                    </span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.k}>Phone</span>
                    <span className={styles.v} title={student.phone}>
                      {student.phone}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Assessment Details (unchanged) */}
            <section className={styles.card}>
              <div className={styles.detailsCard}>
                <div className={styles.topRow}>
                  <div className={styles.identityText}>
                    <div className={styles.name}>Assessment Details</div>
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
                              <div style={{ fontWeight: 800 }}>
                                {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
                              </div>
                              <div style={{ fontSize: 12, opacity: 0.7 }}>Attempt ID: {a.id}</div>
                            </td>

                            <td>
                              <span className={`${styles.pill} ${a.status === 'completed' ? styles.ok : styles.neutral}`}>
                                {a.status}
                              </span>
                            </td>

                            <td>{a.score}</td>

                            <td>
                              {a.certificate_code ? (
                                <span className={`${styles.pill} ${styles.neutral}`}>
                                  {a.certificate_code}
                                </span>
                              ) : (
                                <span style={{ opacity: 0.7 }}>—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ padding: 14, opacity: 0.75 }}>
                            No assessment attempts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}