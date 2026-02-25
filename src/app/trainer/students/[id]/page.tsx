'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import styles from './student-details.module.css';
import { fetchWithAuth } from '@/lib/api';
type InterestOption = { id: number; interest: string };
type AssessmentAttempt = {
  id: number;
  assessment_id: number;
  score: number;
  status: string;
  certificate_code: string;
  assessment?: { id: number; title: string };
};

type StudentData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: number;
  assessments_attempts: AssessmentAttempt[];
  interest: null | {
    id: number;
    assessment_user_id: number;
    interest_status: null | { id: number; interest: string };
    call_response: string | null;
  };
};

type StudentDetailsApiResponse = {
  status: 'success' | 'error';
  data: StudentData | null;
};

export default function TrainerStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [student, setStudent] = useState<StudentData | null>(null);
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [selectedInterestId, setSelectedInterestId] = useState<string>('');
  const [callResponse, setCallResponse] = useState<string>('');

  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [attendanceStatus, setAttendanceStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');

  const [markTitle, setMarkTitle] = useState('');
  const [markScore, setMarkScore] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingInterest, setSavingInterest] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  const [error, setError] = useState('');

  const loadStudent = async () => {
    const json: StudentDetailsApiResponse = await fetchWithAuth(
      `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(id)}`
    );
    const s = json.data || null;
    setStudent(s);

    const currentInterestId = s?.interest?.interest_status?.id;
    setSelectedInterestId(currentInterestId ? String(currentInterestId) : '');
    setCallResponse(s?.interest?.call_response || '');
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [studentJson, interestJson] = await Promise.all([
          fetchWithAuth(
            `https://api.easycoders.in/projects/backend/public/api/hr/students/${encodeURIComponent(id)}`
          ),
          fetchWithAuth(
            `https://api.easycoders.in/projects/backend/public/api/hr/student/interests`
          ),
        ]);

        setStudent((studentJson as StudentDetailsApiResponse).data || null);
        setInterestOptions((interestJson as any).data || []);

        const currentInterestId = (studentJson as any)?.data?.interest?.interest_status?.id;
        setSelectedInterestId(currentInterestId ? String(currentInterestId) : '');
        setCallResponse((studentJson as any)?.data?.interest?.call_response || '');
      } catch (e: any) {
        setStudent(null);
        setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load student.');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';

  const currentInterestLabel = useMemo(() => {
    return student?.interest?.interest_status?.interest || 'Not Set';
  }, [student]);

  const saveInterest = async () => {
    if (!student) return;

    try {
      setSavingInterest(true);
      const assessmentUserId = student.id;
      await fetchWithAuth(
        'https://api.easycoders.in/projects/backend/public/api/hr/assessmentUser/updateInterestStatus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessment_user_id: assessmentUserId,
            interest_status: Number(selectedInterestId || 0),
            call_response: callResponse || null,
          }),
        }
      );

      await loadStudent();
      alert('Interest updated ✅');
    } catch (e: any) {
      alert(e?.message || 'Failed to update interest');
    } finally {
      setSavingInterest(false);
    }
  };

  const saveAttendance = async () => {
    if (!student) return;
    try {
      setSavingAttendance(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/students/${student.id}/attendance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendance_date: attendanceDate,
            status: attendanceStatus,
          }),
        }
      );
      alert('Attendance saved ✅');
    } catch (e: any) {
      alert(e?.message || 'Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const addMarks = async () => {
    if (!student) return;
    try {
      setSavingMarks(true);
      await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/students/${student.id}/marks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: markTitle,
            score: Number(markScore || 0),
            max_score: 100,
          }),
        }
      );
      setMarkTitle('');
      setMarkScore('');
      alert('Marks added ✅');
    } catch (e: any) {
      alert(e?.message || 'Failed to add marks');
    } finally {
      setSavingMarks(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[4]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/trainer" className={styles.crumbLink}>Trainer</Link>
              <span className={styles.crumbSep}>/</span>
              <Link href="/trainer/students" className={styles.crumbLink}>Students</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Details</span>
            </div>

            <h1 className={styles.title}>Student Details</h1>
            <p className={styles.subtitle}>Manage interest, attendance and performance.</p>
          </div>

          <div className={styles.right}>
            <Link href="/trainer/students" className={`${styles.btn} ${styles.primary}`}>
              ← Back
            </Link>
            <div className={styles.interestBox}>
              <div className={styles.interestLabel}>
                Current: <b>{currentInterestLabel}</b>
              </div>

              <select
                className={styles.select}
                value={selectedInterestId}
                onChange={(e) => setSelectedInterestId(e.target.value)}
              >
                <option value="">Select Interest</option>
                {interestOptions.map((opt) => (
                  <option key={opt.id} value={String(opt.id)}>
                    {opt.interest}
                  </option>
                ))}
              </select>

              <input
                className={styles.input}
                placeholder="Call response (optional)"
                value={callResponse}
                onChange={(e) => setCallResponse(e.target.value)}
              />

              <button
                className={`${styles.btn} ${styles.saveBtn}`}
                type="button"
                onClick={saveInterest}
                disabled={savingInterest || !selectedInterestId}
              >
                {savingInterest ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        </header>

        {loading && (
          <section className={styles.card}>
            <div className={styles.state}>Loading student…</div>
          </section>
        )}

        {!loading && error && (
          <section className={styles.card}>
            <div className={`${styles.state} ${styles.error}`}>{error}</div>
            <div style={{ marginTop: 12 }}>
              <Link href="/login" className={`${styles.btn} ${styles.small}`}>
                Go to Login →
              </Link>
            </div>
          </section>
        )}

        {!loading && !error && student && (
          <>
            <section className={styles.card}>
              <div className={styles.detailsCard}>
                <div className={styles.topRow}>
                  <div className={styles.identity}>
                    <div className={styles.avatar}>{(student.name?.[0] || 'S').toUpperCase()}</div>
                    <div className={styles.identityText}>
                      <div className={styles.name}>{student.name}</div>
                      <div className={styles.idLine}>Student ID: <b>{student.id}</b></div>
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
            <section className={styles.toolsGrid}>
              <section className={styles.card}>
                <div className={styles.cardTitle}>Attendance</div>
                <div className={styles.toolRow}>
                  <input className={styles.input} type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
                  <select className={styles.select} value={attendanceStatus} onChange={(e) => setAttendanceStatus(e.target.value as any)}>
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                  <button className={`${styles.btn} ${styles.primary}`} onClick={saveAttendance} disabled={savingAttendance}>
                    {savingAttendance ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </section>
              <section className={styles.card}>
                <div className={styles.cardTitle}>Add Marks</div>
                <div className={styles.toolRow}>
                  <input className={styles.input} placeholder="Title (eg. Weekly Test 1)" value={markTitle} onChange={(e) => setMarkTitle(e.target.value)} />
                  <input className={styles.input} placeholder="Score" type="number" value={markScore} onChange={(e) => setMarkScore(e.target.value)} />
                  <button className={`${styles.btn} ${styles.primary}`} onClick={addMarks} disabled={savingMarks || !markTitle || !markScore}>
                    {savingMarks ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </section>
            </section>
            <section className={styles.card}>
              <div className={styles.cardTitle}>Assessment Details</div>
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
                            <div style={{ fontWeight: 900 }}>
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
                        <td colSpan={4} style={{ padding: 14, opacity: 0.75 }}>
                          No assessment attempts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </RoleGuard>
  );
}