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
  const [directResult, setDirectResult] =
    useState<AdmissionResponse | null>(null);

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
        'https://api.easycoders.in/projects/backend/public/api/courses'
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
        'https://api.easycoders.in/projects/backend/public/api/collegeList'
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
        college_id: directForm.college_id
          ? Number(directForm.college_id)
          : null,
        total_fee: Number(directForm.total_fee),
        payment_amount: Number(directForm.payment_amount),
        payment_mode: directForm.payment_mode,
        reference_id:
          directForm.payment_mode === 'CASH'
            ? null
            : directForm.reference_id,
      };

      const json = await fetchWithAuth(
        'https://api.easycoders.in/projects/backend/public/api/directAdmission',
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
    (directForm.payment_mode === 'CASH' ||
      directForm.reference_id);

  return (
    <RoleGuard allowedRoles={[1, 2, 4]}>
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <div className={styles.crumbs}>
              <Link href="/admin" className={styles.crumbLink}>
                Admin
              </Link>
              <span className={styles.crumbSep}>/</span>
              <span className={styles.crumbNow}>Direct Admission</span>
            </div>
            <h1 className={styles.title}>Direct Student Admission</h1>
          </div>
        </header>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>Student Details</div>

          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Full Name"
              value={directForm.name}
              onChange={(e)=>setDirectForm(p=>({...p,name:e.target.value}))}
            />

            <input className={styles.input} placeholder="Email"
              value={directForm.email}
              onChange={(e)=>setDirectForm(p=>({...p,email:e.target.value}))}
            />

            <input className={styles.input} placeholder="Phone Number"
              value={directForm.phone_number}
              onChange={(e)=>setDirectForm(p=>({...p,phone_number:e.target.value}))}
            />
            <select
              className={styles.input}
              value={directForm.college_id}
              onChange={(e)=>
                setDirectForm(p=>({...p,college_id:e.target.value}))
              }
            >
              <option value="">
                {collegeLoading ? "Loading Colleges..." : "Select College"}
              </option>
              {colleges.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.college_name}
                </option>
              ))}
            </select>
            <select
              className={styles.input}
              value={directForm.course_id}
              onChange={(e)=>handleCourseChange(e.target.value)}
            >
              <option value="">
                {courseLoading ? "Loading Courses..." : "Select Course"}
              </option>
              {courses.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.category.name} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.sectionTitle}>Payment Details</div>

          <div className={styles.formGrid}>
            <input className={styles.input} type="number"
              placeholder="Total Fee"
              value={directForm.total_fee}
              onChange={(e)=>setDirectForm(p=>({...p,total_fee:e.target.value}))}
            />

            <input className={styles.input} type="number"
              placeholder="Payment Amount"
              value={directForm.payment_amount}
              onChange={(e)=>setDirectForm(p=>({...p,payment_amount:e.target.value}))}
            />

            <select className={styles.input}
              value={directForm.payment_mode}
              onChange={(e)=>setDirectForm(p=>({
                ...p,
                payment_mode:e.target.value,
                reference_id:''
              }))}
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="NET BANKING">NET BANKING</option>
            </select>

            {directForm.payment_mode!=='CASH' && (
              <input className={styles.input}
                placeholder="Transaction ID"
                value={directForm.reference_id}
                onChange={(e)=>setDirectForm(p=>({...p,reference_id:e.target.value}))}
              />
            )}
          </div>
          <div >
            <button
              className={`${styles.btn} ${styles.primary}`}
              onClick={submitDirect}
              disabled={directBusy || !directValid}
            >
              {directBusy ? 'Creating…' : 'Create Admission'}
            </button>
          </div>
        </section>
        {showSuccess && directResult && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHead}>
                <div className={styles.modalTitle}>
                  Admission Successful
                </div>
                <button
                  className={styles.x}
                  onClick={() => setShowSuccess(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.successIcon}>✓</div>

                <div className={styles.strong}>
                  Student Account Created Successfully
                </div>

                <div className={styles.modalInfo}>
                  <div>
                    <b>Enrollment ID:</b> {directResult.enrollment_id}
                  </div>
                  <div>
                    <b>Email:</b> {directResult.email}
                  </div>
                  <div>
                    <b>Password:</b> {directResult.password}
                  </div>
                </div>

                {directResult.receipt_url && (
                  <button
                    className={`${styles.btn} ${styles.primary} ${styles.downloadBtn}`}
                    onClick={() =>
                      window.open(directResult.receipt_url, '_blank')
                    }
                  >
                    Download Receipt
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


