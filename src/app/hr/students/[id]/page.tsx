'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import RoleGuard from '@/components/RoleGuard';
import styles from './student-details.module.css';

type InterestOption = { id: number; interest: string };
type StudentInterest = {
  id: number;
  assessment_user_id: number;
  interest_status: { id: number; interest: string } | null;
  call_response: string | null;
};
type AssessmentAttempt = {
  id: number;
  user_id: number;
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
  course: string;
  year: number;
  status: number;
  assessments_attempts: AssessmentAttempt[];
  interest: StudentInterest | null;
};
type StudentDetailsApiResponse = { status: 'success' | 'error'; data: StudentData | null };
type InterestsApiResponse = { status: number | string; data: InterestOption[] };

const INTEREST_META: Record<string, { color: string; bg: string; border: string }> = {
  'Interested':      { color: '#065f46', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)'  },
  'Not Interested':  { color: '#991b1b', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  'Call Back Later': { color: '#78350f', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)'  },
  'Not Reachable':   { color: '#3730a3', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)'  },
  'Not Set':         { color: '#475569', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)' },
};

export default function HrStudentDetailsPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedInterestId, setSelectedInterestId] = useState<string>('');
  const [updatingInterest, setUpdatingInterest] = useState(false);
  const [updatingCourse, setUpdatingCourse] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const getToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem('token') || '');

  useEffect(() => {
    if (student) {
      setSelectedCourse(student.course || '');
      setSelectedYear(String(student.year ?? ''));
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
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );
      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      if (!res.ok) throw new Error('Not found');
      const json: StudentDetailsApiResponse = await res.json();
      const data = json.data || null;
      setStudent(data);
      const currentId = data?.interest?.interest_status?.id;
      setSelectedInterestId(currentId ? String(currentId) : '');
    } catch (e: any) {
      setStudent(null);
      setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Student not found or failed to load.');
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
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error('Failed');
      const json: InterestsApiResponse = await res.json();
      setInterestOptions(json.data || []);
    } catch { setInterestOptions([]); }
    finally { setLoadingInterests(false); }
  };

  useEffect(() => {
    if (!id) return;
    fetchStudent();
    fetchInterestOptions();
  }, [id]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const updateCourse = async () => {
    const token = getToken();
    try {
      setUpdatingCourse(true);
      const res = await fetch(
        `https://api.easycoders.in/projects/backend/public/api/hr/updateStudent/${encodeURIComponent(id)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ course: selectedCourse, year: selectedYear }),
        }
      );
      const data = await res.json();
      if (data.status) { flash('Course updated successfully'); fetchStudent(); }
    } catch (err) { console.error(err); }
    finally { setUpdatingCourse(false); }
  };

  const updateStudentInterest = async () => {
    const token = getToken();
    try {
      setUpdatingInterest(true);
      if (!token) throw new Error('Unauthorized');
      if (!student?.id) throw new Error('Student not loaded');
      if (!selectedInterestId) { alert('Please select an interest status.'); return; }
      const res = await fetch(
        'https://api.easycoders.in/projects/backend/public/api/hr/assessmentUser/updateInterestStatus',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessment_user_id: student.id, interest_status: Number(selectedInterestId) }),
        }
      );
      if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
      if (!res.ok) throw new Error('Failed to update interest');
      flash('Interest status updated');
      await fetchStudent();
    } catch (e: any) {
      alert(e?.message === 'Unauthorized' ? 'Session expired.' : 'Failed to update interest status.');
    } finally { setUpdatingInterest(false); }
  };

  const currentInterestLabel = useMemo(() => student?.interest?.interest_status?.interest || 'Not Set', [student]);
  const callResponse = useMemo(() => {
    const v = student?.interest?.call_response;
    return v === null || v === undefined || String(v).trim() === '' ? '—' : String(v);
  }, [student]);
  const interestMeta = INTEREST_META[currentInterestLabel] ?? INTEREST_META['Not Set'];
  const studentStatusLabel = student?.status === 1 ? 'Active' : 'Inactive';

  return (
    <RoleGuard allowedRoles={[2]}>
      <div className={styles.wrap}>

        {/* ── SUCCESS TOAST ── */}
        {successMsg && (
          <div className={styles.toast}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* ── TOPBAR ── */}
        <header className={styles.topbar}>
          <div className={styles.topbarInner}>
            <div className={styles.topLeft}>
              <nav className={styles.crumbs}>
                <Link href="/hr" className={styles.crumbLink}>HR</Link>
                <span className={styles.crumbSep}>/</span>
                <Link href="/hr/students" className={styles.crumbLink}>Students</Link>
                <span className={styles.crumbSep}>/</span>
                <span className={styles.crumbNow}>Details</span>
              </nav>
              <h1 className={styles.title}>Student Details</h1>
              <p className={styles.subtitle}>Complete profile information for HR review.</p>
            </div>

            <Link href="/hr/students" className={styles.btnBack}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Students
            </Link>
          </div>
        </header>

        {/* ── LOADING ── */}
        {loading && (
          <div className={styles.loadGrid}>
            <div className={styles.skCard} />
            <div className={styles.skCard} style={{ animationDelay: '120ms' }} />
            <div className={styles.skCard} style={{ animationDelay: '240ms', gridColumn: '1 / -1' }} />
          </div>
        )}

        {/* ── ERROR ── */}
        {!loading && error && (
          <div className={styles.errorWrap}>
            <div className={styles.errorIcon}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className={styles.stateTitle}>Could not load student</div>
            <div className={styles.stateText}>{error}</div>
            <div className={styles.stateActions}>
              <Link href="/login" className={styles.btnPrimary}>Go to Login</Link>
              <Link href="/hr/students" className={styles.btnGhost}>Back to Students</Link>
            </div>
          </div>
        )}

        {/* ── MAIN ── */}
        {!loading && !error && student && (
          <div className={styles.mainGrid}>

            {/* ── LEFT COLUMN ── */}
            <div className={styles.leftCol}>

              {/* Profile Card */}
              <div className={styles.card}>
                <div className={styles.profileHead}>
                  <div className={styles.avatarLg}>
                    {(student.name?.[0] || 'S').toUpperCase()}
                  </div>
                  <div className={styles.profileInfo}>
                    <div className={styles.profileName}>{student.name}</div>
                    <div className={styles.profileId}>Student ID · <span className={styles.mono}>#{student.id}</span></div>
                  </div>
                  <span className={`${styles.statusBadge} ${student.status === 1 ? styles.statusActive : styles.statusInactive}`}>
                    <span className={styles.statusDot} />
                    {studentStatusLabel}
                  </span>
                </div>

                <div className={styles.divider} />

                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <span className={styles.fieldKey}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Email
                    </span>
                    <span className={styles.fieldVal}>{student.email}</span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldKey}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      Phone
                    </span>
                    <span className={`${styles.fieldVal} ${styles.mono}`}>{student.phone || '—'}</span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldKey}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                      </svg>
                      Course
                    </span>
                    <span className={styles.fieldVal}>{student.course || '—'}</span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldKey}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Year
                    </span>
                    <span className={styles.fieldVal}>
                      {student.year === 0 ? 'Passout' : student.year ? `Year ${student.year}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interest Status Card */}
              <div className={styles.card}>
                <div className={styles.cardLabel}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  Call Feedback &amp; Interest
                </div>

                <div className={styles.interestCurrent}>
                  <span className={styles.interestCurrentLabel}>Current Status</span>
                  <span
                    className={styles.interestBadge}
                    style={{ color: interestMeta.color, background: interestMeta.bg, borderColor: interestMeta.border }}
                  >
                    <span className={styles.interestDot} style={{ background: interestMeta.color }} />
                    {currentInterestLabel}
                  </span>
                </div>

                {callResponse !== '—' && (
                  <div className={styles.callResponseBox}>
                    <span className={styles.callResponseLabel}>Call Response</span>
                    <p className={styles.callResponseText}>{callResponse}</p>
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.cardLabel} style={{ marginBottom: 10 }}>Update Interest</div>
                <div className={styles.updateRow}>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.select}
                      value={selectedInterestId}
                      onChange={(e) => setSelectedInterestId(e.target.value)}
                      disabled={loadingInterests || loading}
                    >
                      <option value="">{loadingInterests ? 'Loading…' : 'Select status…'}</option>
                      {interestOptions.map((opt) => (
                        <option key={opt.id} value={String(opt.id)}>{opt.interest}</option>
                      ))}
                    </select>
                    <svg className={styles.selectChev} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    type="button"
                    onClick={updateStudentInterest}
                    disabled={updatingInterest || loading || !selectedInterestId}
                  >
                    {updatingInterest ? (
                      <><span className={styles.spinner} /> Saving…</>
                    ) : 'Save'}
                  </button>
                </div>
              </div>

              {/* Update Course Card */}
              <div className={styles.card}>
                <div className={styles.cardLabel}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                  Update Course &amp; Year
                </div>

                <div className={styles.courseGrid}>
                  <div>
                    <label className={styles.inputLabel}>Course</label>
                    <div className={styles.selectWrap}>
                      <select className={styles.select} value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                        <option value="">Select course…</option>
                        <option value="B-Tech">B-Tech</option>
                        <option value="B.C.A.">B.C.A.</option>
                        <option value="M.C.A.">M.C.A.</option>
                        <option value="Diploma">Diploma</option>
                      </select>
                      <svg className={styles.selectChev} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <label className={styles.inputLabel}>Year</label>
                    <div className={styles.selectWrap}>
                      <select className={styles.select} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="">Select year…</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="0">Passout</option>
                      </select>
                      <svg className={styles.selectChev} width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  className={styles.btnPrimary}
                  style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}
                  onClick={updateCourse}
                  disabled={!selectedCourse || !selectedYear || updatingCourse}
                  type="button"
                >
                  {updatingCourse ? (
                    <><span className={styles.spinner} /> Updating…</>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── RIGHT COLUMN: ASSESSMENTS ── */}
            <div className={styles.rightCol}>
              <div className={styles.card} style={{ height: '100%' }}>
                <div className={styles.cardLabel}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  Assessment Attempts
                  <span className={styles.cardCount}>{student.assessments_attempts?.length ?? 0}</span>
                </div>

                <div className={styles.divider} />

                {!student.assessments_attempts?.length ? (
                  <div className={styles.emptyAssessments}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ opacity: 0.3 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                    </svg>
                    <p>No assessment attempts found</p>
                  </div>
                ) : (
                  <div className={styles.assessmentList}>
                    {student.assessments_attempts.map((a, i) => (
                      <div key={a.id} className={styles.assessmentRow}>
                        <div className={styles.assessmentIndex}>{i + 1}</div>
                        <div className={styles.assessmentBody}>
                          <div className={styles.assessmentTitle}>
                            {a.assessment?.title ?? `Assessment #${a.assessment_id}`}
                          </div>
                          <div className={styles.assessmentMeta}>
                            Attempt ID <span className={styles.mono}>#{a.id}</span>
                          </div>
                        </div>
                        <div className={styles.assessmentRight}>
                          <div className={styles.scoreBox}>
                            <span className={styles.scoreVal}>{a.score}</span>
                            <span className={styles.scoreLabel}>pts</span>
                          </div>
                          <span className={`${styles.statusChip} ${a.status === 'completed' ? styles.chipDone : styles.chipPending}`}>
                            {a.status}
                          </span>
                          {a.certificate_code && (
                            <span className={styles.certChip}>
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                              </svg>
                              {a.certificate_code}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </RoleGuard>
  );
}