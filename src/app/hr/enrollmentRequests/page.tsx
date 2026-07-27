'use client';
import RoleGuard from '@/components/RoleGuard';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './enrollmentRequests.module.css';
import { fetchWithAuth } from '@/lib/api';

type Course = {
  id: number;
  title: string;
  discounted_price: string;
  duration: string;
  category: { name: string };
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

export default function DirectAdmissionPage() {
  const [courses, setCourses] = useState<Course[]>([]);
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
    payment_amount: '',
    payment_mode: 'CASH',
    reference_id: '',
  });

  const loadCourses = async () => {
    try {
      setCourseLoading(true);
      const res = await fetchWithAuth(
        'https://api.easycoders.in/api/courses'
      );
      setCourses(res || []);
    } catch {
      alert('Failed to load courses');
    } finally {
      setCourseLoading(false);
    }
  };

  const loadColleges = async () => {
    try {
      setCollegeLoading(true);
      const res = await fetchWithAuth(
        'https://api.easycoders.in/api/collegeList'
      );
      setColleges(res.data || []);
    } catch {
      alert('Failed to load colleges');
    } finally {
      setCollegeLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadColleges();
  }, []);

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
        reference_id:
          directForm.payment_mode === 'CASH' ? null : directForm.reference_id,
      };
      const json = await fetchWithAuth(
        'https://api.easycoders.in/api/directAdmission',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      setDirectResult(json.data);
      setShowSuccess(true);
    } catch (e: any) {
      alert(e?.message || 'Admission failed');
    } finally {
      setDirectBusy(false);
    }
  };

  const directValid =
    directForm.name &&
    directForm.email &&
    directForm.phone_number &&
    directForm.course_id &&
    directForm.total_fee &&
    directForm.payment_amount &&
    (directForm.payment_mode === 'CASH' || directForm.reference_id);

  const totalFee = Number(directForm.total_fee) || 0;
  const payAmt = Number(directForm.payment_amount) || 0;
  const balance = totalFee - payAmt;
  const showFeeSummary = totalFee > 0 || payAmt > 0;

  const formatINR = (n: number) =>
    '₹' + n.toLocaleString('en-IN');
  return (
    <RoleGuard allowedRoles={[1, 2, 4]}>
      <div className={styles.wrap}>
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
        <div className={styles.progressBar}>
          {['Student Info', 'Course & College', 'Payment', 'Confirm'].map((step, i) => (
            <div key={step} className={`${styles.progStep} ${i === 0 ? styles.active : ''}`}>
              <span className={styles.stepNum}>{i + 1}</span>
              {step}
            </div>
          ))}
        </div>
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
                <input
                  className={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  value={directForm.name}
                  onChange={(e) => setDirectForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email Address <span className={styles.req}>*</span></label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="student@email.com"
                  value={directForm.email}
                  onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone Number <span className={styles.req}>*</span></label>
                <input
                  className={styles.input}
                  placeholder="+91 98765 43210"
                  value={directForm.phone_number}
                  onChange={(e) => setDirectForm((p) => ({ ...p, phone_number: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>College</label>
                <select
                  className={styles.input}
                  value={directForm.college_id}
                  onChange={(e) => setDirectForm((p) => ({ ...p, college_id: e.target.value }))}
                >
                  <option value="">
                    {collegeLoading ? 'Loading Colleges…' : '— Select College —'}
                  </option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.college_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>
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
              <select
                className={styles.input}
                value={directForm.course_id}
                onChange={(e) => handleCourseChange(e.target.value)}
              >
                <option value="">
                  {courseLoading ? 'Loading Courses…' : '— Select a Course —'}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category.name} — {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
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
                <input
                  className={styles.input}
                  type="number"
                  placeholder="0.00"
                  value={directForm.total_fee}
                  onChange={(e) => setDirectForm((p) => ({ ...p, total_fee: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Payment Amount <span className={styles.req}>*</span></label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="0.00"
                  value={directForm.payment_amount}
                  onChange={(e) => setDirectForm((p) => ({ ...p, payment_amount: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.modeGroup}>
              <label className={styles.label}>
                Payment Mode <span className={styles.req}>*</span>
              </label>
              <div className={styles.modePills}>
                {(['CASH', 'UPI', 'NET BANKING'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`${styles.pill} ${directForm.payment_mode === mode ? styles.pillActive : ''}`}
                    onClick={() =>
                      setDirectForm((p) => ({ ...p, payment_mode: mode, reference_id: '' }))
                    }
                  >
                    {mode === 'CASH' ? '💵' : mode === 'UPI' ? '📲' : '🏦'} {mode}
                  </button>
                ))}
              </div>
            </div>

            {directForm.payment_mode !== 'CASH' && (
              <div className={styles.field} style={{ marginTop: 14 }}>
                <label className={styles.label}>
                  Transaction / Reference ID <span className={styles.req}>*</span>
                </label>
                <input
                  className={styles.input}
                  placeholder="Enter transaction reference"
                  value={directForm.reference_id}
                  onChange={(e) => setDirectForm((p) => ({ ...p, reference_id: e.target.value }))}
                />
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
                    <div
                      className={styles.feeVal}
                      style={{ color: balance > 0 ? '#d97706' : '#059669' }}
                    >
                      {totalFee > 0 && payAmt > 0 ? formatINR(Math.abs(balance)) : '—'}
                    </div>
                    <div className={styles.feeKey}>Balance</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        <div className={styles.submitBar}>
          <div className={styles.submitHint}>
            All <strong>required fields</strong> must be filled to proceed
          </div>
          <button
            className={styles.btnSubmit}
            onClick={submitDirect}
            disabled={directBusy || !directValid}
          >
            {directBusy ? 'Creating…' : 'Create Admission'} <span className={styles.arrow}>→</span>
          </button>
        </div>
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
                  <button
                    className={styles.dlBtn}
                    onClick={() => window.open(directResult.receipt_url, '_blank')}
                  >
                    ⬇ Download Receipt
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}