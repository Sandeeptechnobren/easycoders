// 'use client';
// import Link from 'next/link';
// import RoleGuard from '@/components/RoleGuard';
// import styles from './students.module.css';
// import { useEffect, useMemo, useState } from 'react';
// type Student = {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   course: string;
//   status: 'Active' | 'Inactive';
//   joinedAt: string;
//   address: string;
//   score: number;
// };
// type College = {
//   id:string;
//   college_name:string;
//   address:string;
// }
// export default function HrStudentsPage() {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [loadingStudents, setLoadingStudents] = useState(true);
//   const [loadingColleges, setLoadingColleges] = useState(true);
//   const loading = loadingStudents || loadingColleges;
//   const [query, setQuery] = useState('');
//   const [status, setStatus] = useState<'All' | Student['status']>('All');
//   const [course, setCourse] = useState<'All' | string>('All');
//   const [error, setError] = useState('');
//   const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
//   const [colleges, setColleges]= useState<College[]>([]);
//   useEffect(() => {
//     const fetchStudents = async () => {   
//       try {
//         setLoadingStudents(true);
//         setError('');
//         const token = localStorage.getItem('token');
//         if (!token) throw new Error('Unauthorized');
//         const url = 'https://api.easycoders.in/projects/backend/public/api/hr/students' +(selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');
//         const res = await fetch(
//           url,
//           {
//             method:'GET',
//             headers: {
//               Accept: 'application/json',
//               // 'Content-Type': 'application/json',
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
//         const json = await res.json();
//         setStudents(json.data || []);

//       } catch (e: any) {
//         setError(
//           e?.message === 'Unauthorized'
//             ? 'Session expired. Please login again.'
//             : 'Failed to load students'
//         );
//       } finally {
//         setLoadingStudents(false);
//       }
//     };
//     fetchStudents();
//   }, [selectedCollegeID]);

//   useEffect(()=>{
//     fetchColleges();
//   }, []);
//   const fetchColleges = async () => {
//     try{
//       setLoadingColleges(true);
//       const res = await fetch('https://api.easycoders.in/projects/backend/public/api/collegeList');
//       if (res.ok) {
//         const json = await res.json();
//         setColleges(json.data || []);
//       } else {
//         throw new Error('Failed to fetch colleges');
//       }
//     }
//     catch(e){
//       console.log("error fetching colleges", e);
//     }
//     finally{
//       setLoadingColleges(false);
//     }

//   }
//   const courseOptions = useMemo(() => {
//     const unique = Array.from(new Set(students.map((s) => s.course))).sort();
//     return ['All', ...unique];
//   }, [students]);
//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return students.filter((s) => {
//       const matchesQuery =
//         !q ||
//         [s.name, s.email, s.phone, s.course, s.status, s.joinedAt, s.address]
//           .filter(Boolean)
//           .some((v) => String(v).toLowerCase().includes(q));
//       const matchesStatus = status === 'All' ? true : s.status === status;
//       const matchesCourse = course === 'All' ? true : s.course === course;
//       return matchesQuery && matchesStatus && matchesCourse;
//     });
//   }, [students, query, status, course]);
//   const stats = useMemo(() => {
//     const total = students.length;
//     const active = students.filter((s) => s.status === 'Active').length;
//     const inactive = total - active;
//     return { total, active, inactive };
//   }, [students]);

//   return (
//     <RoleGuard allowedRoles={[2]}>
//       <div className={styles.wrap}>
//         {/* Header */}
//         <header className={styles.topbar}>
//           <div className={styles.left}>
//             <div className={styles.crumbs}>
//               <Link href="/hr" className={styles.crumbLink}>
//                 HR
//               </Link>
//               <span className={styles.crumbSep}>/</span>
//               <span className={styles.crumbNow}>Students</span>
//             </div>

//             <h1 className={styles.title}>Students Directory</h1>
//             <p className={styles.subtitle}>
//               Search, filter, and open a student profile to view complete details.
//             </p>
//           </div>

//           <div className={styles.right}>
//             <div className={styles.miniStats}>
//               <div className={styles.mini}>
//                 <div className={styles.miniLabel}>Total</div>
//                 <div className={styles.miniValue}>{stats.total}</div>
//               </div>
//               <div className={styles.mini}>
//                 <div className={styles.miniLabel}>Active</div>
//                 <div className={styles.miniValue}>{stats.active}</div>
//               </div>
//               <div className={styles.mini}>
//                 <div className={styles.miniLabel}>Inactive</div>
//                 <div className={styles.miniValue}>{stats.inactive}</div>
//               </div>
//             </div>

//             <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
//               Refresh
//             </Link>
//             <br/>
//           </div>
//         </header>
//         <section className={styles.filters}>
//           <select 
//             name="college" 
//             id="college-select"
//             value={selectedCollegeID}
//             onChange={(e)=>{
//               const val = e.target.value;
//               setSelectedCollegeID(val);
//               localStorage.setItem('college_id', val);
//             }}>
//             <option value="">All Colleges</option>
//             {colleges.map((c) => (
//               <option key={c.id} value={c.id}>
//                 {c.college_name}
//               </option>
//             ))}
//           </select>
//         </section>
//         <section className={styles.card}>
//           {loading && (
//             <div className={styles.skeletonWrap}>
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//               <div className={styles.skRow} />
//             </div>
//           )}

//           {!loading && error && (
//             <div className={`${styles.state} ${styles.error}`}>
//               <div className={styles.stateTitle}>Could not load students</div>
//               <div className={styles.stateText}>{error}</div>
//               <div style={{ marginTop: 12 }}>
//                 <Link href="/login" className={`${styles.btn} ${styles.small}`}>
//                   Go to Login →
//                 </Link>
//               </div>
//             </div>
//           )}

//           {!loading && !error && filtered.length === 0 && (
//             <div className={styles.state}>
//               <div className={styles.stateTitle}>No results</div>
//               <div className={styles.stateText}>Try changing search text or filters.</div>
//             </div>
//           )}

//           {!loading && !error && filtered.length > 0 && (
//             <div className={styles.tableWrap}>
//               {/* Desktop Table */}
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>Student</th>
//                     <th>Email</th>
//                     <th>Phone Number</th>
//                     <th style={{ textAlign: 'right' }}>Action</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {filtered.map((s) => (
//                     <tr key={s.id}>
//                       <td>
//                         <div className={styles.studentCell}>
//                           <div className={styles.avatar}>
//                             {(s.name?.[0] || 'S').toUpperCase()}
//                           </div>
//                           <div className={styles.studentMeta}>
//                             <div className={styles.studentName} title={s.name}>
//                               {s.name}
//                             </div>
//                             <div
//                               className={styles.studentSub}
//                               title={`${s.email} • ${s.phone}`}
//                             >
//                               {s.email} • {s.phone}
//                             </div>
//                           </div>
//                         </div>
//                       </td>

//                       <td>
//                         <div className={styles.muted} title={s.email}>
//                           {s.email}
//                         </div>
//                       </td>

//                       <td>
//                         <span className={`${styles.pill} ${styles.neutral}`} title={s.phone}>
//                           {s.phone}
//                         </span>
//                       </td>

//                       <td style={{ textAlign: 'right' }}>
//                         <Link
//                           className={`${styles.btn} ${styles.small}`}
//                           href={`/hr/students/${s.id}`}
//                         >
//                           View →
//                         </Link>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//               <div className={styles.mobileList}>
//                 {filtered.map((s) => (
//                   <Link key={s.id} href={`/hr/students/${s.id}`} className={styles.mCard}>
//                     <div className={styles.mTop}>
//                       <div className={styles.mLeft}>
//                         <div className={styles.avatar}>
//                           {(s.name?.[0] || 'S').toUpperCase()}
//                         </div>
//                         <div className={styles.mText}>
//                           <div className={styles.studentName} title={s.name}>
//                             {s.name}
//                           </div>
//                           <div className={styles.studentSub} title={s.email}>
//                             {s.email}
//                           </div>
//                         </div>
//                       </div>

//                       <span
//                         className={`${styles.pill} ${
//                           s.status === 'Active' ? styles.ok : styles.bad
//                         }`}
//                       >
//                         {s.status}
//                       </span>
//                     </div>

//                     <div className={styles.mGrid}>
//                       <div>
//                         <span className={styles.k}>Phone</span>
//                         <span className={styles.v} title={s.phone}>
//                           {s.phone}
//                         </span>
//                       </div>
//                     </div>

//                     <div className={styles.mAction}>View Details →</div>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           )}
//         </section>
//       </div>
//      </RoleGuard>
//   );
// }
'use client';

import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import styles from './students.module.css';
import { useEffect, useMemo, useState } from 'react';

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

type Interest = {
  id: number;
  assessment_user_id: number;
  interest_status: {
    id: number;
    interest: string;
  } | null;
  call_response: string | null;
};

type Student = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  status: number | string; // 1/0 or "Active"/"Inactive"
  assessments_attempts?: AssessmentAttempt[];
  interest: Interest | null;
};

type College = {
  id: string | number;
  college_name: string;
  address: string;
};

type StudentsListApiResponse = {
  status: string;
  data: Student[];
};

function normalizeStudentStatus(s: Student['status']): 'Active' | 'Inactive' {
  if (s === 1 || s === '1' || s === 'Active') return 'Active';
  return 'Inactive';
}

function normalizeInterestLabel(interest: Student['interest']): string {
  const label = interest?.interest_status?.interest?.trim();
  if (!label) return 'Not Set';

  const l = label.toLowerCase();
  if (l === 'interested') return 'Interested';
  if (l === 'not interest' || l === 'not interested') return 'Not Interested';
  if (l === 'call back later') return 'Call Back Later';
  if (l === 'not reachable') return 'Not Reachable';

  return label; // fallback
}

function interestClassName(label: string) {
  switch (label) {
    case 'Interested':
      return styles.interested;
    case 'Not Interested':
      return styles.notInterested;
    case 'Call Back Later':
      return styles.callBackLater;
    case 'Not Reachable':
      return styles.notReachable;
    default:
      return styles.notSet;
  }
}

export default function HrStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const loading = loadingStudents || loadingColleges;

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [course, setCourse] = useState<'All' | string>('All');

  const [error, setError] = useState('');
  const [selectedCollegeID, setSelectedCollegeID] = useState<string>('');
  const [colleges, setColleges] = useState<College[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoadingStudents(true);
        setError('');

        const token = localStorage.getItem('token');
        if (!token) throw new Error('Unauthorized');

        const url =
          'https://api.easycoders.in/projects/backend/public/api/hr/students' +
          (selectedCollegeID ? `?college_id=${encodeURIComponent(selectedCollegeID)}` : '');

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to load students');

        const json: StudentsListApiResponse = await res.json();
        setStudents(json.data || []);
      } catch (e: any) {
        setStudents([]);
        setError(
          e?.message === 'Unauthorized'
            ? 'Session expired. Please login again.'
            : 'Failed to load students'
        );
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedCollegeID]);

  useEffect(() => {
    fetchColleges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const res = await fetch('https://api.easycoders.in/projects/backend/public/api/collegeList');
      if (!res.ok) throw new Error('Failed to fetch colleges');
      const json = await res.json();
      setColleges(json.data || []);
    } catch (e) {
      console.log('error fetching colleges', e);
    } finally {
      setLoadingColleges(false);
    }
  };

  const courseOptions = useMemo(() => {
    const unique = Array.from(
      new Set((students || []).map((s: any) => s.course).filter(Boolean))
    ).sort();
    return ['All', ...unique];
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return students.filter((s: any) => {
      const interestLabel = normalizeInterestLabel(s.interest);
      const studentStatus = normalizeStudentStatus(s.status);

      const matchesQuery =
        !q ||
        [s.name, s.email, s.phone, s.course, studentStatus, interestLabel]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));

      const matchesStatus = status === 'All' ? true : studentStatus === status;
      const matchesCourse = course === 'All' ? true : String(s.course || '') === course;

      return matchesQuery && matchesStatus && matchesCourse;
    });
  }, [students, query, status, course]);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => normalizeStudentStatus(s.status) === 'Active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [students]);

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
              <span className={styles.crumbNow}>Students</span>
            </div>

            <h1 className={styles.title}>Students Directory</h1>
            <p className={styles.subtitle}>
              Search, filter, and open a student profile to view complete details.
            </p>
          </div>

          <div className={styles.right}>
            <div className={styles.miniStats}>
              <div className={styles.mini}>
                <div className={styles.miniLabel}>Total</div>
                <div className={styles.miniValue}>{stats.total}</div>
              </div>
              <div className={styles.mini}>
                <div className={styles.miniLabel}>Active</div>
                <div className={styles.miniValue}>{stats.active}</div>
              </div>
              <div className={styles.mini}>
                <div className={styles.miniLabel}>Inactive</div>
                <div className={styles.miniValue}>{stats.inactive}</div>
              </div>
            </div>

            <Link href="/hr/students" className={`${styles.btn} ${styles.primary}`}>
              Refresh
            </Link>
          </div>
        </header>

        {/* Filters */}
        <section className={styles.filters}>
          <select
            name="college"
            id="college-select"
            value={selectedCollegeID}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedCollegeID(val);
              localStorage.setItem('college_id', val);
            }}
          >
            <option value="">All Colleges</option>
            {colleges.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.college_name}
              </option>
            ))}
          </select>

          {/* Optional Search */}
          {/* <input
            className={styles.input}
            placeholder="Search name/email/phone/interest..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          /> */}

          {/* Optional Status Filter */}
          {/* <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className={styles.select}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select> */}

          {/* Optional Course Filter (if course exists) */}
          {/* <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className={styles.select}
          >
            {courseOptions.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Courses' : c}
              </option>
            ))}
          </select> */}
        </section>

        {/* Content */}
        <section className={styles.card}>
          {loading && (
            <div className={styles.skeletonWrap}>
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
              <div className={styles.skRow} />
            </div>
          )}

          {!loading && error && (
            <div className={`${styles.state} ${styles.error}`}>
              <div className={styles.stateTitle}>Could not load students</div>
              <div className={styles.stateText}>{error}</div>
              <div style={{ marginTop: 12 }}>
                <Link href="/login" className={`${styles.btn} ${styles.small}`}>
                  Go to Login →
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.state}>
              <div className={styles.stateTitle}>No results</div>
              <div className={styles.stateText}>Try changing search text or filters.</div>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.tableWrap}>
              {/* Desktop Table */}
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Interest</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((s: any) => {
                    const interestLabel = normalizeInterestLabel(s.interest);
                    const interestCls = interestClassName(interestLabel);

                    return (
                      <tr key={String(s.id)}>
                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.avatar}>
                              {(s.name?.[0] || 'S').toUpperCase()}
                            </div>
                            <div className={styles.studentMeta}>
                              <div className={styles.studentName} title={s.name}>
                                {s.name}
                              </div>
                              <div className={styles.studentSub} title={`${s.email} • ${s.phone}`}>
                                {s.email} • {s.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.muted} title={s.email}>
                            {s.email}
                          </div>
                        </td>

                        <td>
                          <span className={`${styles.pill} ${styles.neutral}`} title={s.phone}>
                            {s.phone}
                          </span>
                        </td>

                        <td>
                          <span className={`${styles.pill} ${interestCls}`}>
                            {interestLabel}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <Link className={`${styles.btn} ${styles.small}`} href={`/hr/students/${s.id}`}>
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className={styles.mobileList}>
                {filtered.map((s: any) => {
                  const interestLabel = normalizeInterestLabel(s.interest);
                  const interestCls = interestClassName(interestLabel);
                  const st = normalizeStudentStatus(s.status);

                  return (
                    <Link key={String(s.id)} href={`/hr/students/${s.id}`} className={styles.mCard}>
                      <div className={styles.mTop}>
                        <div className={styles.mLeft}>
                          <div className={styles.avatar}>
                            {(s.name?.[0] || 'S').toUpperCase()}
                          </div>
                          <div className={styles.mText}>
                            <div className={styles.studentName} title={s.name}>
                              {s.name}
                            </div>
                            <div className={styles.studentSub} title={s.email}>
                              {s.email}
                            </div>
                          </div>
                        </div>

                        <span className={`${styles.pill} ${st === 'Active' ? styles.ok : styles.bad}`}>
                          {st}
                        </span>
                      </div>

                      <div className={styles.mGrid}>
                        <div>
                          <span className={styles.k}>Phone</span>
                          <span className={styles.v} title={s.phone}>
                            {s.phone}
                          </span>
                        </div>

                        <div>
                          <span className={styles.k}>Interest</span>
                          <span className={`${styles.pill} ${interestCls}`}>
                            {interestLabel}
                          </span>
                        </div>
                      </div>

                      <div className={styles.mAction}>View Details →</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}