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
  assessment_user_id: number;
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
  course: string;
  year: number;
  status: number; // 1/0
  assessments_attempts: AssessmentAttempt[];
  interest: StudentInterest | null;
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
  const [selectedCourse, setSelectedCourse] = useState(student?.course || '');
  const [selectedYear, setSelectedYear] = useState(student?.year || '');
  const [selectedInterestId, setSelectedInterestId] = useState<string>('');
  const [updatingInterest, setUpdatingInterest] = useState(false);
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const getToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem('token') || '');
  useEffect(() => {
    if (student) {
      setSelectedCourse(student.course);
      setSelectedYear(student.year);
    }
  }, [student]);
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
  }, [id]);

  const currentInterestLabel = useMemo(() => {
    return student?.interest?.interest_status?.interest || '—';
  }, [student]);

  const callResponse = useMemo(() => {
    const v = student?.interest?.call_response;
    return v === null || v === undefined || String(v).trim() === '' ? '—' : String(v);
  }, [student]);

  const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';
  const updateCourse = async () => {
    const token = getToken();
    try {
      const res = await fetch(`https://api.easycoders.in/projects/backend/public/api/hr/updateStudent/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
        body: JSON.stringify({
          course: selectedCourse,
          year: selectedYear
        }),
      });

      const data = await res.json();


      if (data.status) {
        alert('Updated Successfully');
        fetchStudent(); // refresh UI
      }

    } catch (err) {
      console.error(err);
    }
  };
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
          <div
            className={styles.right}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
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
                <div className={styles.divider} />
              {/* <div className={styles.grid}>
                <div className={styles.field}>
                  <span className={styles.k}>Course</span>
                  <span className={styles.v} title={student.course}>
                                    {student.course}
                &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;                   
                  <select
                    className={styles.input}
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    style={{
                    height: 38,
                    borderRadius: 10,
                    padding: '0 10px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'white',
                    minWidth: 190,
                  }}
                  >
                    <option value="">Select Course</option>
                    <option value="B-Tech">B-Tech</option>
                    <option value="B.C.A.">B.C.A.</option>
                    <option value="M.C.A.">M.C.A.</option>
                    <option value="M.C.A.">M.C.A.</option>
                  </select>
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.k}>Year</span>
                  <span className={styles.v} title={student.phone}>
                                    {student.year}
                                  &nbsp;&nbsp;&nbsp;  &nbsp;&nbsp;&nbsp;  
                  <select
                    className={styles.input}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                     style={{
                    height: 38,
                    borderRadius: 10,
                    padding: '0 10px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'white',
                    minWidth: 190,
                  }}
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="0">Passout</option>
                  </select>
                  </span>
                </div>

                <button
                  onClick={updateCourse}
                  className={`${styles.btn} ${styles.primary}`}
                >
                  Update Course
                </button>

              </div> */}
              <div className={styles.grid}>

  {/* COURSE */}
  <div className={styles.field}>
    <span className={styles.k}>Course</span>

    <select
      className={styles.input}
      value={selectedCourse}
      onChange={(e) => setSelectedCourse(e.target.value)}
       style={{
                    height: 38,
                    borderRadius: 10,
                    padding: '0 10px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'white',
                    minWidth: 190,
                  }}
    >
      <option value="">Select Course</option>
      <option value="B-Tech">B-Tech</option>
      <option value="B.C.A.">B.C.A.</option>
      <option value="M.C.A.">M.C.A.</option>
      <option value="Diploma">Diploma</option>
    </select>
  </div>

  {/* YEAR */}
  <div className={styles.field}>
    <span className={styles.k}>Year</span>

    <select
      className={styles.input}
      value={selectedYear}
      onChange={(e) => setSelectedYear(e.target.value)}
       style={{
                    height: 38,
                    borderRadius: 10,
                    padding: '0 10px',
                    border: '1px solid rgba(0,0,0,0.12)',
                    background: 'white',
                    minWidth: 190,
                  }}
    >
      <option value="">Select Year</option>
      <option value="1">1st Year</option>
      <option value="2">2nd Year</option>
      <option value="3">3rd Year</option>
      <option value="4">4th Year</option>
      <option value="0">Passout</option>
    </select>
  </div>

  <button
    onClick={updateCourse}
    disabled={!selectedCourse || !selectedYear || updatingCourse}
    className={`${styles.btn} ${styles.primary}`}
  >
    {updatingCourse ? 'Updating…' : 'Update Course'}
  </button>

</div>
              </div>
            </section>
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

