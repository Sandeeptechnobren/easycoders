// 'use client';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';
// import RoleGuard from '@/components/RoleGuard';
// import styles from './student-details.module.css';
// // type Student = {
// //   id: string;
// //   name: string;
// //   email: string;
// //   phone: string;
// //   course: string;
// //   status: 'Active' | 'Inactive';
// //   joinedAt: string;
// //   address: string;
// //   score: number;
// //   notes?: string;
// // };
// type Student = {
//   status: 'success' | 'error';
//   data: {
//     id: number;
//     name: string;
//     email: string;
//     phone: string;
//     status: number; // 1/0
//     assessments_attempts: Array<{
//       id: number;
//       user_id: number;
//       assessment_id: number;
//       score: number;
//       status: string; // "completed"
//       certificate_code: string;
//       assessment?: {
//         id: number;
//         title: string;
//       };
//     }>;
//   };
// };
// export default function HrStudentDetailsPage() {
//   const params = useParams();
//   const id = String(params?.id || '');
//   const [student, setStudent] = useState<Student | null>(null);
//   const [assessment, setAssessment] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   useEffect(() => {
//     const fetchStudent = async () => {
//       try {
//         setLoading(true);
//         setError('');
//         const token = localStorage.getItem('token');
//         if (!token) throw new Error('Unauthorized');
//         const res = await fetch(
//           `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(id)}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               Accept: 'application/json',
//             },
//           }
//         );
//         if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
//         if (!res.ok) throw new Error('Not found');
//         const json = await res.json();
//         setStudent(json.data?.data || null);
//         setAssessment(json.data?.data?.assessments_attempts || null);
//       } catch (e: any) {
//         setStudent(null);
//         setError(
//           e?.message === 'Unauthorized'
//             ? 'Session expired. Please login again.'
//             : 'Student not found or failed to load.'
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (id) fetchStudent();
//   }, [id]);
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
//           <div className={styles.right}>
//             <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
//               ← Back
//             </Link>
//           </div>
//         </header>
//         <section className={styles.card}>
//           {loading && (
//             <div className={styles.skeletonWrap}>
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//             </div>
//           )}
//           {!loading && error && (
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
//           )}
//           {!loading && !error && student && (
//             <div className={styles.detailsCard}>
//               <div className={styles.topRow}>
//                 <div className={styles.identity}>
//                   <div className={styles.avatar} aria-hidden="true">
//                     {(student?.data?.name?.[0] || 'S').toUpperCase()}
//                   </div>
//                   <div className={styles.identityText}>
//                     <div className={styles.name}>{student?.data?.name}</div>
//                     <div className={styles.idLine}>
//                       Student ID: <b>{student?.data?.id}</b>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className={styles.divider} />
//               <div className={styles.grid}>
//                 <div className={styles.field}>
//                   <span className={styles.k}>Email</span>
//                   <span className={styles.v} title={student?.data?.email}>
//                     {student?.data?.email}
//                   </span>
//                 </div>
//                 <div className={styles.field}>
//                   <span className={styles.k}>Phone</span>
//                   <span className={styles.v} title={student?.data?.phone}>
//                     {student?.data?.phone}
//                   </span>
//                 </div>
//               </div>
//               {/* {student?.data?.notes && (
//                 <>
//                   <div className={styles.divider} />
//                   <div className={styles.notes}>
//                     <div className={styles.notesTitle}>HR Notes</div>
//                     <p className={styles.notesText}>{student?.data?.notes}</p>
//                   </div>
//                 </>
//               )} */}
//             </div>
//           )}
//         </section>
//         <section className={styles.card}>
//             {loading && (
//               <div className={styles.skeletonWrap}>
//                 <div className={styles.skRow} />
//                 <div className={styles.skRow} />
//                 <div className={styles.skRow} />
//                 <div className={styles.skRow} />
//                 <div className={styles.skRow} />
//               </div>
//             )}
//             {!loading && error && (
//               <div className={`${styles.state} ${styles.error}`}>
//                 <div className={styles.stateTitle}>Could not load student</div>
//                 <div className={styles.stateText}>{error}</div>
//                 <div className={styles.stateActions}>
//                   <Link href="/login" className={`${styles.btn} ${styles.small}`}>
//                     Go to Login →
//                   </Link>
//                   <Link href="/hr/students" className={`${styles.btn} ${styles.small}`}>
//                     Back to Students
//                   </Link>
//                 </div>
//               </div>
//             )}
//           {!loading && !error && student && (
//             <div className={styles.detailsCard}>
//               <div className={styles.topRow}>
//                 <div className={styles.identity}>
//                   <div className={styles.identityText}>
//                     <div className={styles.name}>Assessment Details</div>
//                   </div>
//                 </div>
//               </div>
//               <div className={styles.divider} />
//               <div className={styles.grid}>
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>Assessment</th>
//                     <th>Status</th>
//                     <th>Score</th>
//                     <th>Certificate</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {student?.data?.assessments_attempts?.length ? (
//                     student?.data?.assessments_attempts.map((a) => (
//                       <tr key={a.id}>
//                         <td>
//                           <div style={{ fontWeight: 800 }}>
//                             {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
//                           </div>
//                           <div style={{ fontSize: 12, opacity: 0.7 }}>
//                             Attempt ID: {a.id}
//                           </div>
//                         </td>

//                         <td>
//                           <span
//                             className={`${styles.pill} ${
//                               a.status === 'completed' ? styles.ok : styles.neutral
//                             }`}
//                           >
//                             {a.status}
//                           </span>
//                         </td>

//                         <td>{a.score}</td>

//                         <td>
//                           {a.certificate_code ? (
//                             <span className={`${styles.pill} ${styles.neutral}`}>
//                               {a.certificate_code}
//                             </span>
//                           ) : (
//                             <span style={{ opacity: 0.7 }}>—</span>
//                           )}
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={4} style={{ padding: 14, opacity: 0.75 }}>
//                         No assessment attempts found.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//               </div>
//               {/* {student.notes && (
//                 <>
//                   <div className={styles.divider} />
//                   <div className={styles.notes}>
//                     <div className={styles.notesTitle}>HR Notes</div>
//                     <p className={styles.notesText}>{student.notes}</p>
//                   </div>
//                 </>
//               )} */}
//             </div>
//           )}
//         </section>
//       </div>
//     </RoleGuard>
//   );
// }
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import styles from './student-details.module.css';

type AssessmentAttempt = {
  id: number;
  user_id: number;
  assessment_id: number;
  score: number;
  status: string; // "completed"
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
};

type StudentDetailsApiResponse = {
  status: 'success' | 'error';
  data: StudentData | null;
};

export default function HrStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Unauthorized');

        const res = await fetch(
          `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(
            id
          )}`,
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
        setStudent(json.data || null);
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

    if (id) fetchStudent();
  }, [id]);

  const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';

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

          <div className={styles.right}>
            <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
              ← Back
            </Link>
          </div>
        </header>

        {/* Global states (only once) */}
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

        {/* Main content */}
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

                  <span
                    className={`${styles.pill} ${
                      student.status === 1 ? styles.ok : styles.bad
                    }`}
                  >
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

            {/* Assessment Details */}
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
                    <thead style={{}}>
                      <tr style={{ textAlign: 'left', color: '#000000' }}>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Certificate</th>
                      </tr>
                    </thead>
<br />
                    <tbody>
                      {student.assessments_attempts?.length ? (
                        student.assessments_attempts.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <div style={{ fontWeight: 800 }}>
                                {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
                              </div>
                              <div style={{ fontSize: 12, opacity: 0.7 }}>
                                Attempt ID: {a.id}
                              </div>
                            </td>

                            <td>
                              <span
                                className={`${styles.pill} ${
                                  a.status === 'completed' ? styles.ok : styles.neutral
                                }`}
                              >
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