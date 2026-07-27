'use client';
import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import styles from './enrollmentRequests.module.css';
import { fetchWithAuth } from '@/lib/api';
import Dropdown from '@/components/ui/Dropdown/Dropdown';

const BASE = 'https://api.easycoders.in/api';

type Course = {
  id: number;
  title: string;
  discounted_price: string;
  duration: string;
  category: { name: string };
};
type Batch = {
  id: number;
  name: string;
};
type College = {
  id: number;
  college_name: string;
};
type AdmissionResponse = {
  user_id: number;
  enrollment_id: string;
  email: string;
  password: string;
  receipt_url: string;
};
// Matches /commanAPIs/users?role=student response shape
type EnrolledStudent = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: number | boolean;
  created_at: string;
  profile?: {
    batch?: {
      name: string;
    };
  };
};

export default function DirectAdmissionPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches,setBatches] = useState<Batch[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [directBusy, setDirectBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [directResult, setDirectResult] = useState<AdmissionResponse | null>(null);
  const [directForm, setDirectForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    course_id: '',
    college_id: '',
    total_fee: '',
    batch_id: '',
    payment_amount: '',
    payment_mode: 'CASH',
    reference_id: '',
  });

  // Enrolled students state
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  const loadCourses = async () => {
    try {
      setCourseLoading(true);
      const res = await fetchWithAuth(`${BASE}/courses`);
      setCourses(Array.isArray(res) ? res : res.data || []);
    } catch {
      alert('Failed to load courses');
    } finally {
      setCourseLoading(false);
    }
  };

const loadBatches = async () => {
  try {
    const res = await fetchWithAuth(`${BASE}/batches`);

    setBatches(res.data?.data || []); // ✅ CORRECT

  } catch {
    alert('Failed to load batches');
  }
};
  const loadColleges = async () => {
    try {
      setCollegeLoading(true);
      const res = await fetchWithAuth(`${BASE}/collegeList`);
      setColleges(res.data || []);
    } catch {
      alert('Failed to load colleges');
    } finally {
      setCollegeLoading(false);
    }
  };

  const loadStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      // ✅ Fetch students using role=student from commanAPIs
      const res = await fetchWithAuth(`${BASE}/commanAPIs/users?role=student`);
      // Response is paginated: { data: [...], pagination: {...} }
      const list = Array.isArray(res.data) ? res.data
        : Array.isArray(res) ? res
        : [];
      setStudents(list);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    loadColleges();
    loadStudents();
    loadBatches();
  }, [loadStudents]);

  const handleCourseChange = (id: string) => {
    const course = courses.find((c) => c.id === Number(id));
    setDirectForm((p) => ({
      ...p,
      course_id: id,
      total_fee: course ? course.discounted_price : '',
    }));
  };

  const submitDirect = async () => {
    try {
      setDirectBusy(true);
      setDirectResult(null);
      const payload = {
        name: directForm.name.trim(),
        email: directForm.email.trim(),
        phone_number: directForm.phone_number.trim(),
        course_id: Number(directForm.course_id),
        college_id: directForm.college_id ? Number(directForm.college_id) : null,
        total_fee: Number(directForm.total_fee),
        payment_amount: Number(directForm.payment_amount),
        payment_mode: directForm.payment_mode,
        reference_id: directForm.payment_mode === 'CASH' ? null : directForm.reference_id,
      };
      const json = await fetchWithAuth(`${BASE}/directAdmission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setDirectResult(json.data);
      setShowSuccess(true);
      // Reset form
      setDirectForm({
        name: '', email: '', phone_number: '', course_id: '', college_id: '',
        total_fee: '', batch_id: '', payment_amount: '', payment_mode: 'CASH', reference_id: '',
      });
      // Refresh student list
      loadStudents();
    } catch (e: any) {
      alert(e?.message || 'Admission failed');
    } finally {
      setDirectBusy(false);
    }
  };

  const directValid =
    directForm.name && directForm.email && directForm.phone_number &&
    directForm.course_id && directForm.total_fee && directForm.payment_amount &&
    (directForm.payment_mode === 'CASH' || directForm.reference_id);

  const totalFee = Number(directForm.total_fee) || 0;
  const payAmt = Number(directForm.payment_amount) || 0;
  const balance = totalFee - payAmt;
  const showFeeSummary = totalFee > 0 || payAmt > 0;
  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

  // Filter students by search
  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return !q
      || s.name?.toLowerCase().includes(q)
      || s.email?.toLowerCase().includes(q)
      || s.phone?.toLowerCase().includes(q);
  });

  const batchOptions = batches.map(b => ({
    label: b.name,
    value: b.id,
  }));



  return (
    <RoleGuard allowedRoles={[1, 2, 4]}>
      <div className={styles.wrap}>

        {/* ── Top Bar ── */}
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>Admin</Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Direct Admission</span>
            </div>
            <h1 className={styles.title}>Direct Student Admission</h1>
          </div>
          <div className={styles.right}>
            <div className={styles.badge}>
              <span className={styles.dot} />
              New Enrollment
            </div>
          </div>
        </header>

        {/* ── Tab switcher ── */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 24,
          borderBottom: '2px solid #e5e7eb', width: '100%',
        }}>
          {(['form', 'list'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 28px',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                color: activeTab === tab ? '#2563eb' : '#6b7280',
                marginBottom: -2,
                transition: 'all .15s',
              }}
            >
              {tab === 'form' ? '+ New Admission' : `📋 Enrolled Students${students.length ? ` (${students.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════
            TAB 1 — ADMISSION FORM
        ══════════════════════════════ */}
        {activeTab === 'form' && (
          <>
            {/* Progress Steps */}
            <div className={styles.progressBar}>
              {['Student Info'].map((step, i) => (
                <div key={step} className={`${styles.progStep} ${i === 0 ? styles.active : ''}`}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>

            {/* Student Info Card */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>👤</div>
                <div>
                  <div className={styles.cardTitle}>Student Information</div>
                  <div className={styles.cardSubtitle}>Personal details of the enrolling student</div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
                    <input className={styles.input} placeholder="e.g. Rahul Sharma"
                      value={directForm.name}
                      onChange={(e) => setDirectForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Email Address <span className={styles.req}>*</span></label>
                    <input className={styles.input} type="email" placeholder="student@email.com"
                      value={directForm.email}
                      onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone Number <span className={styles.req}>*</span></label>
                    <input className={styles.input} placeholder="+91 98765 43210"
                      value={directForm.phone_number}
                      onChange={(e) => setDirectForm((p) => ({ ...p, phone_number: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>College</label>
                    <select className={styles.input} value={directForm.college_id}
                      onChange={(e) => setDirectForm((p) => ({ ...p, college_id: e.target.value }))}>
                      <option value="">{collegeLoading ? 'Loading Colleges…' : '— Select College —'}</option>
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>{c.college_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Course Card */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>📚</div>
                <div>
                  <div className={styles.cardTitle}>Course Selection</div>
                  <div className={styles.cardSubtitle}>Choose the program for enrollment</div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <label className={styles.label}>Course <span className={styles.req}>*</span></label>
                  <select className={styles.input} value={directForm.course_id}
                    onChange={(e) => handleCourseChange(e.target.value)}>
                    <option value="">{courseLoading ? 'Loading Courses…' : '— Select a Course —'}</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.category.name} — {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.cardBody}>
<div className={styles.field}>
  <label className={styles.label}>
    Batch <span className={styles.req}>*</span>
  </label>

  <select
    className={styles.input}
    value={directForm.batch_id}
    onChange={(e) =>
      setDirectForm((p) => ({ ...p, batch_id: e.target.value }))
    }
  >
    <option value="">— Select a Batch —</option>

    {batches.map((b) => (
      <option key={b.id} value={b.id}>
        {b.name}
      </option>
    ))}
  </select>
  
{/* <Dropdown
  options={batchOptions}
  value={Number(directForm.batch_id) || ''}
  onChange={(val: any) =>
    setDirectForm(p => ({
      ...p,
      batch_id: String(val) // keep state consistent
    }))
  }
  placeholder="Select Batch"
/> */}
</div>
</div>
            </section>

            {/* Payment Card */}
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💳</div>
                <div>
                  <div className={styles.cardTitle}>Payment Details</div>
                  <div className={styles.cardSubtitle}>Fee and transaction information</div>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Total Fee <span className={styles.req}>*</span></label>
                    <input className={styles.input} type="number" placeholder="0.00"
                      value={directForm.total_fee}
                      onChange={(e) => setDirectForm((p) => ({ ...p, total_fee: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Payment Amount <span className={styles.req}>*</span></label>
                    <input className={styles.input} type="number" placeholder="0.00"
                      value={directForm.payment_amount}
                      onChange={(e) => setDirectForm((p) => ({ ...p, payment_amount: e.target.value }))} />
                  </div>
                </div>

                <div className={styles.modeGroup}>
                  <label className={styles.label}>Payment Mode <span className={styles.req}>*</span></label>
                  <div className={styles.modePills}>
                    {(['CASH', 'UPI', 'NET BANKING'] as const).map((mode) => (
                      <button key={mode}
                        className={`${styles.pill} ${directForm.payment_mode === mode ? styles.pillActive : ''}`}
                        onClick={() => setDirectForm((p) => ({ ...p, payment_mode: mode, reference_id: '' }))}>
                        {mode === 'CASH' ? '💵' : mode === 'UPI' ? '📲' : '🏦'} {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {directForm.payment_mode !== 'CASH' && (
                  <div className={styles.field} style={{ marginTop: 14 }}>
                    <label className={styles.label}>Transaction / Reference ID <span className={styles.req}>*</span></label>
                    <input className={styles.input} placeholder="Enter transaction reference"
                      value={directForm.reference_id}
                      onChange={(e) => setDirectForm((p) => ({ ...p, reference_id: e.target.value }))} />
                  </div>
                )}

                {showFeeSummary && (
                  <div className={styles.feeSummary}>
                    <span className={styles.feeLabel}>Fee Breakdown</span>
                    <div className={styles.feeValues}>
                      <div className={styles.feeItem}>
                        <div className={styles.feeVal}>{totalFee > 0 ? formatINR(totalFee) : '—'}</div>
                        <div className={styles.feeKey}>Course Fee</div>
                      </div>
                      <div className={styles.feeDivider} />
                      <div className={styles.feeItem}>
                        <div className={styles.feeVal}>{payAmt > 0 ? formatINR(payAmt) : '—'}</div>
                        <div className={styles.feeKey}>Paying Now</div>
                      </div>
                      <div className={styles.feeDivider} />
                      <div className={styles.feeItem}>
                        <div className={styles.feeVal} style={{ color: balance > 0 ? '#d97706' : '#059669' }}>
                          {totalFee > 0 && payAmt > 0 ? formatINR(Math.abs(balance)) : '—'}
                        </div>
                        <div className={styles.feeKey}>Balance</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Submit Bar */}
            <div className={styles.submitBar}>
              <div className={styles.submitHint}>
                All <strong>required fields</strong> must be filled to proceed
              </div>
              <button className={styles.btnSubmit} onClick={submitDirect}
                disabled={directBusy || !directValid}>
                {directBusy ? 'Creating…' : 'Create Admission'} <span className={styles.arrow}>→</span>
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════
            TAB 2 — ENROLLED STUDENTS LIST
        ══════════════════════════════ */}
        {activeTab === 'list' && (
          <section className={styles.card} style={{ padding: 0 }}>
            {/* List header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Enrolled Students</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {studentsLoading ? 'Loading…' : `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} found`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 14, color: '#9ca3af', pointerEvents: 'none',
                  }}>🔍</span>
                  <input
                    style={{
                      paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                      border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13,
                      outline: 'none', width: 220, color: '#111827',
                    }}
                    placeholder="Search name, email, phone…"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={loadStudents}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
                    background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    color: '#374151', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            {studentsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af', fontSize: 14 }}>
                Loading students…
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#6b7280', marginBottom: 4 }}>
                  No students found
                </div>
                <div style={{ fontSize: 13 }}>
                  {studentSearch ? 'Try a different search term.' : 'Create an admission above to get started.'}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['#', 'Student', 'Phone', 'Role', 'Status', 'Joined'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left', fontWeight: 600,
                          color: '#6b7280', fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.05em', borderBottom: '1px solid #f0f0f0',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => {
                      const isActive = s.is_active === 1 || s.is_active === true;
                      const date = s.created_at?.slice(0, 10) || '—';

                      return (
                        <tr key={s.id}
                          style={{ borderBottom: '1px solid #f9fafb', transition: 'background .1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* # */}
                          <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 12 }}>
                            #{s.id}
                          </td>
                          {/* Student name + email */}
                          <td style={{ padding: '14px 16px', minWidth: 200 }}>
                            <div style={{ fontWeight: 600, color: '#111827' }}>{s.name || '—'}</div>
                            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{s.email || '—'}</div>
                          </td>
                          {/* Phone */}
                          <td style={{ padding: '14px 16px', color: '#374151', fontSize: 13 }}>
                            {s.phone || '—'}
                          </td>
                          {/* Role */}
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                              fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                            }}>
                              {s.profile?.batch?.name ?? 'Not Assigned to any batch'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                              fontSize: 11, fontWeight: 600,
                              background: isActive ? '#f0fdf4' : '#fef2f2',
                              color: isActive ? '#059669' : '#dc2626',
                              border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
                            }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {/* Date joined */}
                          <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {date}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer count */}
                <div style={{
                  padding: '12px 20px', borderTop: '1px solid #f0f0f0',
                  fontSize: 12, color: '#9ca3af', textAlign: 'right',
                }}>
                  Showing {filteredStudents.length} of {students.length} students
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Success Modal ── */}
        {showSuccess && directResult && (
          <div className={styles.modalOverlay} onClick={() => setShowSuccess(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalTop}>
                <button className={styles.closeBtn} onClick={() => setShowSuccess(false)}>✕</button>
                <div className={styles.checkRing}>✓</div>
                <h2 className={styles.modalHeading}>Admission Created!</h2>
                <p className={styles.modalSub}>Student has been successfully enrolled</p>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Enrollment ID</span>
                  <span className={styles.infoTag}>{directResult.enrollment_id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Email</span>
                  <span className={styles.infoVal}>{directResult.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoKey}>Temp Password</span>
                  <span className={`${styles.infoVal} ${styles.mono}`}>{directResult.password}</span>
                </div>
                {directResult.receipt_url && (
                  <button className={styles.dlBtn}
                    onClick={() => window.open(directResult.receipt_url, '_blank')}>
                    ⬇ Download Receipt
                  </button>
                )}
                <button
                  onClick={() => { setShowSuccess(false); setActiveTab('list'); }}
                  style={{
                    marginTop: 10, width: '100%', padding: '10px 0',
                    borderRadius: 8, border: '1.5px solid #e5e7eb',
                    background: '#f9fafb', fontWeight: 600, fontSize: 14,
                    cursor: 'pointer', color: '#374151',
                  }}
                >
                  View Enrolled Students →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
// 'use client';
// import RoleGuard from '@/components/RoleGuard';
// import Link from 'next/link';
// import { useEffect, useState, useCallback } from 'react';
// import styles from './enrollmentRequests.module.css';
// import { fetchWithAuth } from '@/lib/api';
// import Dropdown from '@/components/ui/Dropdown/Dropdown';

// const BASE = 'https://api.easycoders.in/api';

// type Course = {
//   id: number;
//   title: string;
//   discounted_price: string;
//   duration: string;
//   category: { name: string };
// };
// type Batch = {
//   id: number;
//   name: string;
// };
// type College = {
//   id: number;
//   college_name: string;
// };
// type AdmissionResponse = {
//   user_id: number;
//   enrollment_id: string;
//   email: string;
//   password: string;
//   receipt_url: string;
// };
// type EnrolledStudent = {
//   id: number;
//   name: string;
//   email: string;
//   phone: string;
//   role: string;
//   is_active: number | boolean;
//   created_at: string;
//   profile?: {
//     batch?: {
//       name: string;
//     };
//   };
// };

// export default function DirectAdmissionPage() {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [batches, setBatches] = useState<Batch[]>([]);
//   const [colleges, setColleges] = useState<College[]>([]);
//   const [courseLoading, setCourseLoading] = useState(false);
//   const [collegeLoading, setCollegeLoading] = useState(false);
//   const [directBusy, setDirectBusy] = useState(false);
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [directResult, setDirectResult] = useState<AdmissionResponse | null>(null);
//   const [directForm, setDirectForm] = useState({
//     name: '',
//     email: '',
//     phone_number: '',
//     course_id: '',
//     college_id: '',
//     total_fee: '',
//     batch_id: '',
//     payment_amount: '',
//     payment_mode: 'CASH',
//     reference_id: '',
//   });

//   // Enrolled students state
//   const [students, setStudents] = useState<EnrolledStudent[]>([]);
//   const [studentsLoading, setStudentsLoading] = useState(false);
//   const [studentSearch, setStudentSearch] = useState('');
//   const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

//   const loadCourses = async () => {
//     try {
//       setCourseLoading(true);
//       const res = await fetchWithAuth(`${BASE}/courses`);
//       setCourses(Array.isArray(res) ? res : res.data || []);
//     } catch {
//       alert('Failed to load courses');
//     } finally {
//       setCourseLoading(false);
//     }
//   };

//   const loadBatches = async () => {
//     try {
//       const res = await fetchWithAuth(`${BASE}/batches`);
//       setBatches(res.data?.data || []);
//     } catch {
//       alert('Failed to load batches');
//     }
//   };

//   const loadColleges = async () => {
//     try {
//       setCollegeLoading(true);
//       const res = await fetchWithAuth(`${BASE}/collegeList`);
//       setColleges(res.data || []);
//     } catch {
//       alert('Failed to load colleges');
//     } finally {
//       setCollegeLoading(false);
//     }
//   };

//   const loadStudents = useCallback(async () => {
//     try {
//       setStudentsLoading(true);
//       const res = await fetchWithAuth(`${BASE}/commanAPIs/users?role=student`);
//       const list = Array.isArray(res.data) ? res.data
//         : Array.isArray(res) ? res
//         : [];
//       setStudents(list);
//     } catch {
//       setStudents([]);
//     } finally {
//       setStudentsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadCourses();
//     loadColleges();
//     loadStudents();
//     loadBatches();
//   }, [loadStudents]);

//   /* ── Dropdown option builders ── */

//   const courseOptions = courses.map((c) => ({
//     label: `${c.category.name} — ${c.title}`,
//     value: c.id,
//   }));

//   const batchOptions = batches.map((b) => ({
//     label: b.name,
//     value: b.id,
//   }));

//   const collegeOptions = colleges.map((c) => ({
//     label: c.college_name,
//     value: c.id,
//   }));

//   /* ── Handlers ── */

//   const handleCourseChange = (val: any) => {
//     const id = val ? String(val) : '';
//     const course = courses.find((c) => c.id === Number(id));
//     setDirectForm((p) => ({
//       ...p,
//       course_id: id,
//       total_fee: course ? course.discounted_price : '',
//     }));
//   };

//   const handleBatchChange = (val: any) => {
//     setDirectForm((p) => ({
//       ...p,
//       batch_id: val ? String(val) : '',
//     }));
//   };

//   const handleCollegeChange = (val: any) => {
//     setDirectForm((p) => ({
//       ...p,
//       college_id: val ? String(val) : '',
//     }));
//   };

//   const submitDirect = async () => {
//     try {
//       setDirectBusy(true);
//       setDirectResult(null);
//       const payload = {
//         name: directForm.name.trim(),
//         email: directForm.email.trim(),
//         phone_number: directForm.phone_number.trim(),
//         course_id: Number(directForm.course_id),
//         college_id: directForm.college_id ? Number(directForm.college_id) : null,
//         batch_id: directForm.batch_id ? Number(directForm.batch_id) : null,
//         total_fee: Number(directForm.total_fee),
//         payment_amount: Number(directForm.payment_amount),
//         payment_mode: directForm.payment_mode,
//         reference_id: directForm.payment_mode === 'CASH' ? null : directForm.reference_id,
//       };
//       const json = await fetchWithAuth(`${BASE}/directAdmission`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload),
//       });
//       setDirectResult(json.data);
//       setShowSuccess(true);
//       // Reset form
//       setDirectForm({
//         name: '', email: '', phone_number: '', course_id: '', college_id: '',
//         total_fee: '', batch_id: '', payment_amount: '', payment_mode: 'CASH', reference_id: '',
//       });
//       // Refresh student list
//       loadStudents();
//     } catch (e: any) {
//       alert(e?.message || 'Admission failed');
//     } finally {
//       setDirectBusy(false);
//     }
//   };

//   /* ── Validation — batch_id is now required ── */
//   const directValid =
//     directForm.name && directForm.email && directForm.phone_number &&
//     directForm.course_id && directForm.batch_id && directForm.total_fee &&
//     directForm.payment_amount &&
//     (directForm.payment_mode === 'CASH' || directForm.reference_id);

//   const totalFee = Number(directForm.total_fee) || 0;
//   const payAmt = Number(directForm.payment_amount) || 0;
//   const balance = totalFee - payAmt;
//   const showFeeSummary = totalFee > 0 || payAmt > 0;
//   const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

//   // Filter students by search
//   const filteredStudents = students.filter((s) => {
//     const q = studentSearch.toLowerCase();
//     return !q
//       || s.name?.toLowerCase().includes(q)
//       || s.email?.toLowerCase().includes(q)
//       || s.phone?.toLowerCase().includes(q);
//   });

//   return (
//     <RoleGuard allowedRoles={[1, 2, 4]}>
//       <div className={styles.wrap}>

//         {/* ── Top Bar ── */}
//         <header className={styles.topbar}>
//           <div className={styles.left}>
//             <div className={styles.crumbs}>
//               <Link href="/admin" className={styles.crumbLink}>Admin</Link>
//               <span className={styles.crumbSep}>/</span>
//               <span className={styles.crumbNow}>Direct Admission</span>
//             </div>
//             <h1 className={styles.title}>Direct Student Admission</h1>
//           </div>
//           <div className={styles.right}>
//             <div className={styles.badge}>
//               <span className={styles.dot} />
//               New Enrollment
//             </div>
//           </div>
//         </header>

//         {/* ── Tab switcher ── */}
//         <div style={{
//           display: 'flex', gap: 0, marginBottom: 24,
//           borderBottom: '2px solid #e5e7eb', width: '100%',
//         }}>
//           {(['form', 'list'] as const).map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               style={{
//                 padding: '10px 28px',
//                 fontWeight: 600,
//                 fontSize: 14,
//                 border: 'none',
//                 background: 'transparent',
//                 cursor: 'pointer',
//                 borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
//                 color: activeTab === tab ? '#2563eb' : '#6b7280',
//                 marginBottom: -2,
//                 transition: 'all .15s',
//               }}
//             >
//               {tab === 'form' ? '+ New Admission' : `📋 Enrolled Students${students.length ? ` (${students.length})` : ''}`}
//             </button>
//           ))}
//         </div>

//         {/* ══════════════════════════════
//             TAB 1 — ADMISSION FORM
//         ══════════════════════════════ */}
//         {activeTab === 'form' && (
//           <>
//             {/* Progress Steps */}
//             <div className={styles.progressBar}>
//               {['Student Info'].map((step, i) => (
//                 <div key={step} className={`${styles.progStep} ${i === 0 ? styles.active : ''}`}>
//                   <span className={styles.stepNum}>{i + 1}</span>
//                   {step}
//                 </div>
//               ))}
//             </div>

//             {/* Student Info Card */}
//             <section className={styles.card}>
//               <div className={styles.cardHeader}>
//                 <div className={styles.cardIcon}>👤</div>
//                 <div>
//                   <div className={styles.cardTitle}>Student Information</div>
//                   <div className={styles.cardSubtitle}>Personal details of the enrolling student</div>
//                 </div>
//               </div>
//               <div className={styles.cardBody}>
//                 <div className={styles.formGrid}>
//                   <div className={styles.field}>
//                     <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
//                     <input className={styles.input} placeholder="e.g. Rahul Sharma"
//                       value={directForm.name}
//                       onChange={(e) => setDirectForm((p) => ({ ...p, name: e.target.value }))} />
//                   </div>
//                   <div className={styles.field}>
//                     <label className={styles.label}>Email Address <span className={styles.req}>*</span></label>
//                     <input className={styles.input} type="email" placeholder="student@email.com"
//                       value={directForm.email}
//                       onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))} />
//                   </div>
//                   <div className={styles.field}>
//                     <label className={styles.label}>Phone Number <span className={styles.req}>*</span></label>
//                     <input className={styles.input} placeholder="+91 98765 43210"
//                       value={directForm.phone_number}
//                       onChange={(e) => setDirectForm((p) => ({ ...p, phone_number: e.target.value }))} />
//                   </div>
//                   <div className={styles.field}>
//                     <label className={styles.label}>College</label>
//                     <Dropdown
//                       options={collegeOptions}
//                       value={directForm.college_id ? Number(directForm.college_id) : undefined}
//                       onChange={handleCollegeChange}
//                       placeholder={collegeLoading ? 'Loading Colleges…' : 'Select College'}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Course Card */}
//             <section className={styles.card}>
//               <div className={styles.cardHeader}>
//                 <div className={styles.cardIcon}>📚</div>
//                 <div>
//                   <div className={styles.cardTitle}>Course Selection</div>
//                   <div className={styles.cardSubtitle}>Choose the program for enrollment</div>
//                 </div>
//               </div>
//               <div className={styles.cardBody}>
//                 <div className={styles.field}>
//                   <label className={styles.label}>Course <span className={styles.req}>*</span></label>
//                   <Dropdown
//                     options={courseOptions}
//                     value={directForm.course_id ? Number(directForm.course_id) : undefined}
//                     onChange={handleCourseChange}
//                     placeholder={courseLoading ? 'Loading Courses…' : 'Select a Course'}
//                   />
//                 </div>
//               </div>
//               <div className={styles.cardBody}>
//                 <div className={styles.field}>
//                   <label className={styles.label}>Batch <span className={styles.req}>*</span></label>
//                   <Dropdown
//                     options={batchOptions}
//                     value={directForm.batch_id ? Number(directForm.batch_id) : undefined}
//                     onChange={handleBatchChange}
//                     placeholder="Select Batch"
//                   />
//                 </div>
//               </div>
//             </section>

//             {/* Payment Card */}
//             <section className={styles.card}>
//               <div className={styles.cardHeader}>
//                 <div className={styles.cardIcon}>💳</div>
//                 <div>
//                   <div className={styles.cardTitle}>Payment Details</div>
//                   <div className={styles.cardSubtitle}>Fee and transaction information</div>
//                 </div>
//               </div>
//               <div className={styles.cardBody}>
//                 <div className={styles.formGrid}>
//                   <div className={styles.field}>
//                     <label className={styles.label}>Total Fee <span className={styles.req}>*</span></label>
//                     <input className={styles.input} type="number" placeholder="0.00"
//                       value={directForm.total_fee}
//                       onChange={(e) => setDirectForm((p) => ({ ...p, total_fee: e.target.value }))} />
//                   </div>
//                   <div className={styles.field}>
//                     <label className={styles.label}>Payment Amount <span className={styles.req}>*</span></label>
//                     <input className={styles.input} type="number" placeholder="0.00"
//                       value={directForm.payment_amount}
//                       onChange={(e) => setDirectForm((p) => ({ ...p, payment_amount: e.target.value }))} />
//                   </div>
//                 </div>

//                 <div className={styles.modeGroup}>
//                   <label className={styles.label}>Payment Mode <span className={styles.req}>*</span></label>
//                   <div className={styles.modePills}>
//                     {(['CASH', 'UPI', 'NET BANKING'] as const).map((mode) => (
//                       <button key={mode}
//                         className={`${styles.pill} ${directForm.payment_mode === mode ? styles.pillActive : ''}`}
//                         onClick={() => setDirectForm((p) => ({ ...p, payment_mode: mode, reference_id: '' }))}>
//                         {mode === 'CASH' ? '💵' : mode === 'UPI' ? '📲' : '🏦'} {mode}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {directForm.payment_mode !== 'CASH' && (
//                   <div className={styles.field} style={{ marginTop: 14 }}>
//                     <label className={styles.label}>Transaction / Reference ID <span className={styles.req}>*</span></label>
//                     <input className={styles.input} placeholder="Enter transaction reference"
//                       value={directForm.reference_id}
//                       onChange={(e) => setDirectForm((p) => ({ ...p, reference_id: e.target.value }))} />
//                   </div>
//                 )}

//                 {showFeeSummary && (
//                   <div className={styles.feeSummary}>
//                     <span className={styles.feeLabel}>Fee Breakdown</span>
//                     <div className={styles.feeValues}>
//                       <div className={styles.feeItem}>
//                         <div className={styles.feeVal}>{totalFee > 0 ? formatINR(totalFee) : '—'}</div>
//                         <div className={styles.feeKey}>Course Fee</div>
//                       </div>
//                       <div className={styles.feeDivider} />
//                       <div className={styles.feeItem}>
//                         <div className={styles.feeVal}>{payAmt > 0 ? formatINR(payAmt) : '—'}</div>
//                         <div className={styles.feeKey}>Paying Now</div>
//                       </div>
//                       <div className={styles.feeDivider} />
//                       <div className={styles.feeItem}>
//                         <div className={styles.feeVal} style={{ color: balance > 0 ? '#d97706' : '#059669' }}>
//                           {totalFee > 0 && payAmt > 0 ? formatINR(Math.abs(balance)) : '—'}
//                         </div>
//                         <div className={styles.feeKey}>Balance</div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </section>

//             {/* Submit Bar */}
//             <div className={styles.submitBar}>
//               <div className={styles.submitHint}>
//                 All <strong>required fields</strong> must be filled to proceed
//               </div>
//               <button className={styles.btnSubmit} onClick={submitDirect}
//                 disabled={directBusy || !directValid}>
//                 {directBusy ? 'Creating…' : 'Create Admission'} <span className={styles.arrow}>→</span>
//               </button>
//             </div>
//           </>
//         )}

//         {/* ══════════════════════════════
//             TAB 2 — ENROLLED STUDENTS LIST
//         ══════════════════════════════ */}
//         {activeTab === 'list' && (
//           <section className={styles.card} style={{ padding: 0 }}>
//             {/* List header */}
//             <div style={{
//               display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//               padding: '20px 24px', borderBottom: '1px solid #f0f0f0', flexWrap: 'wrap', gap: 12,
//             }}>
//               <div>
//                 <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Enrolled Students</div>
//                 <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
//                   {studentsLoading ? 'Loading…' : `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} found`}
//                 </div>
//               </div>
//               <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
//                 <div style={{ position: 'relative' }}>
//                   <span style={{
//                     position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
//                     fontSize: 14, color: '#9ca3af', pointerEvents: 'none',
//                   }}>🔍</span>
//                   <input
//                     style={{
//                       paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
//                       border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13,
//                       outline: 'none', width: 220, color: '#111827',
//                     }}
//                     placeholder="Search name, email, phone…"
//                     value={studentSearch}
//                     onChange={(e) => setStudentSearch(e.target.value)}
//                   />
//                 </div>
//                 <button
//                   onClick={loadStudents}
//                   style={{
//                     padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e5e7eb',
//                     background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
//                     color: '#374151', display: 'flex', alignItems: 'center', gap: 6,
//                   }}
//                 >
//                   ↻ Refresh
//                 </button>
//               </div>
//             </div>

//             {/* Table */}
//             {studentsLoading ? (
//               <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af', fontSize: 14 }}>
//                 Loading students…
//               </div>
//             ) : filteredStudents.length === 0 ? (
//               <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9ca3af' }}>
//                 <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
//                 <div style={{ fontWeight: 600, fontSize: 15, color: '#6b7280', marginBottom: 4 }}>
//                   No students found
//                 </div>
//                 <div style={{ fontSize: 13 }}>
//                   {studentSearch ? 'Try a different search term.' : 'Create an admission above to get started.'}
//                 </div>
//               </div>
//             ) : (
//               <div style={{ overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
//                   <thead>
//                     <tr style={{ background: '#f9fafb' }}>
//                       {['#', 'Student', 'Phone', 'Batch', 'Status', 'Joined'].map((h) => (
//                         <th key={h} style={{
//                           padding: '12px 16px', textAlign: 'left', fontWeight: 600,
//                           color: '#6b7280', fontSize: 11, textTransform: 'uppercase',
//                           letterSpacing: '0.05em', borderBottom: '1px solid #f0f0f0',
//                           whiteSpace: 'nowrap',
//                         }}>{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {filteredStudents.map((s) => {
//                       const isActive = s.is_active === 1 || s.is_active === true;
//                       const date = s.created_at?.slice(0, 10) || '—';

//                       return (
//                         <tr key={s.id}
//                           style={{ borderBottom: '1px solid #f9fafb', transition: 'background .1s' }}
//                           onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
//                           onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
//                         >
//                           <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 12 }}>
//                             #{s.id}
//                           </td>
//                           <td style={{ padding: '14px 16px', minWidth: 200 }}>
//                             <div style={{ fontWeight: 600, color: '#111827' }}>{s.name || '—'}</div>
//                             <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{s.email || '—'}</div>
//                           </td>
//                           <td style={{ padding: '14px 16px', color: '#374151', fontSize: 13 }}>
//                             {s.phone || '—'}
//                           </td>
//                           <td style={{ padding: '14px 16px' }}>
//                             <span style={{
//                               display: 'inline-block', padding: '3px 10px', borderRadius: 20,
//                               fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
//                               background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
//                             }}>
//                               {s.profile?.batch?.name ?? 'Not Assigned'}
//                             </span>
//                           </td>
//                           <td style={{ padding: '14px 16px' }}>
//                             <span style={{
//                               display: 'inline-block', padding: '3px 10px', borderRadius: 20,
//                               fontSize: 11, fontWeight: 600,
//                               background: isActive ? '#f0fdf4' : '#fef2f2',
//                               color: isActive ? '#059669' : '#dc2626',
//                               border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
//                             }}>
//                               {isActive ? 'Active' : 'Inactive'}
//                             </span>
//                           </td>
//                           <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>
//                             {date}
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>

//                 <div style={{
//                   padding: '12px 20px', borderTop: '1px solid #f0f0f0',
//                   fontSize: 12, color: '#9ca3af', textAlign: 'right',
//                 }}>
//                   Showing {filteredStudents.length} of {students.length} students
//                 </div>
//               </div>
//             )}
//           </section>
//         )}

//         {/* ── Success Modal ── */}
//         {showSuccess && directResult && (
//           <div className={styles.modalOverlay} onClick={() => setShowSuccess(false)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <div className={styles.modalTop}>
//                 <button className={styles.closeBtn} onClick={() => setShowSuccess(false)}>✕</button>
//                 <div className={styles.checkRing}>✓</div>
//                 <h2 className={styles.modalHeading}>Admission Created!</h2>
//                 <p className={styles.modalSub}>Student has been successfully enrolled</p>
//               </div>
//               <div className={styles.modalBody}>
//                 <div className={styles.infoRow}>
//                   <span className={styles.infoKey}>Enrollment ID</span>
//                   <span className={styles.infoTag}>{directResult.enrollment_id}</span>
//                 </div>
//                 <div className={styles.infoRow}>
//                   <span className={styles.infoKey}>Email</span>
//                   <span className={styles.infoVal}>{directResult.email}</span>
//                 </div>
//                 <div className={styles.infoRow}>
//                   <span className={styles.infoKey}>Temp Password</span>
//                   <span className={`${styles.infoVal} ${styles.mono}`}>{directResult.password}</span>
//                 </div>
//                 {directResult.receipt_url && (
//                   <button className={styles.dlBtn}
//                     onClick={() => window.open(directResult.receipt_url, '_blank')}>
//                     ⬇ Download Receipt
//                   </button>
//                 )}
//                 <button
//                   onClick={() => { setShowSuccess(false); setActiveTab('list'); }}
//                   style={{
//                     marginTop: 10, width: '100%', padding: '10px 0',
//                     borderRadius: 8, border: '1.5px solid #e5e7eb',
//                     background: '#f9fafb', fontWeight: 600, fontSize: 14,
//                     cursor: 'pointer', color: '#374151',
//                   }}
//                 >
//                   View Enrolled Students →
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </RoleGuard>
//   );
// }