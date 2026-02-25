// 'use client';
// import RoleGuard from '@/components/RoleGuard';
// import Link from 'next/link';
// import { useEffect, useMemo, useState } from 'react';
// import styles from './enrollmentRequests.module.css';
// import { fetchWithAuth } from '@/lib/api';
// type ReqRow = {
//   id: number;
//   course_id?: number;
//   college?: string;
//   name: string;
//   email: string;
//   phone_number: string;
//   payment_method?: string;
//   transaction_number?: string;
//   created_at?: string;
// };
// export default function EnrollmentRequestsPage() {
//   const [rows, setRows] = useState<ReqRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [selected, setSelected] = useState<ReqRow | null>(null);
//   const [busy, setBusy] = useState(false);
//   const [convertResult, setConvertResult] = useState<any>(null);
//   const [form, setForm] = useState({
//     total_fee: '',
//     first_payment_amount: '',
//     first_payment_date: '',
//     next_due_date: '',
//   });
//   const [openDirect, setOpenDirect] = useState(false);
//   const [directBusy, setDirectBusy] = useState(false);
//   const [directResult, setDirectResult] = useState<any>(null);
//   const [directForm, setDirectForm] = useState({
//     name: '',
//     email: '',
//     phone_number: '',
//     course_id: '',
//     college: '',
//     total_fee: '',
//     first_payment_amount: '',
//     first_payment_date: '',
//     next_due_date: '',
//   });
//   const load = async () => {
//     try {
//       setLoading(true);
//       setError('');
//       const json = await fetchWithAuth(
//         'https://api.easycoders.in/projects/backend/public/api/admin/enrollmentRequests'
//       );
//       setRows(json.data || []);
//     } catch (e: any) {
//       setError(e?.message === 'Unauthorized' ? 'Session expired. Please login again.' : 'Failed to load requests');
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   };
//   useEffect(() => {
//     load();
//   }, []);
//   const filtered = useMemo(() => rows, [rows]);
//   const convert = async () => {
//     if (!selected) return;
//     try {
//       setBusy(true);
//       setConvertResult(null);
//       const payload = {
//         total_fee: Number(form.total_fee),
//         first_payment_amount: Number(form.first_payment_amount),
//         first_payment_date: form.first_payment_date,
//         next_due_date: form.next_due_date || null,
//       };
//       const json = await fetchWithAuth(
//         `https://api.easycoders.in/projects/backend/public/api/admin/enrollmentRequests/${selected.id}/convert`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         }
//       );
//       setConvertResult(json.data);
//       await load();
//     } catch (e: any) {
//       alert(e?.message || 'Conversion failed');
//     } finally {
//       setBusy(false);
//     }
//   };
//   const submitDirect = async () => {
//     try {
//       setDirectBusy(true);
//       setDirectResult(null);
//       const payload = {
//         name: directForm.name.trim(),
//         email: directForm.email.trim(),
//         phone_number: directForm.phone_number.trim(),
//         course_id: directForm.course_id ? Number(directForm.course_id) : null,
//         college: directForm.college.trim() || null,
//         total_fee: Number(directForm.total_fee),
//         first_payment_amount: Number(directForm.first_payment_amount),
//         first_payment_date: directForm.first_payment_date,
//         next_due_date: directForm.next_due_date || null,
//       };
//       const json = await fetchWithAuth(
//         `https://api.easycoders.in/projects/backend/public/api/admin/directAdmissions/convert`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(payload),
//         }
//       );
//       setDirectResult(json.data);
//       await load();
//     } catch (e: any) {
//       alert(e?.message || 'Direct admission failed');
//     } finally {
//       setDirectBusy(false);
//     }
//   };
//   const resetConvertModal = (r: ReqRow) => {
//     setSelected(r);
//     setConvertResult(null);
//     setForm({ total_fee: '', first_payment_amount: '', first_payment_date: '', next_due_date: '' });
//   };
//   const resetDirectModal = () => {
//     setOpenDirect(true);
//     setDirectResult(null);
//     setDirectForm({
//       name: '',
//       email: '',
//       phone_number: '',
//       course_id: '',
//       college: '',
//       total_fee: '',
//       first_payment_amount: '',
//       first_payment_date: '',
//       next_due_date: '',
//     });
//   };
//   const directValid =
//     directForm.name.trim() &&
//     directForm.email.trim() &&
//     directForm.phone_number.trim() &&
//     directForm.total_fee &&
//     directForm.first_payment_amount &&
//     directForm.first_payment_date;
//   return (
//   <RoleGuard allowedRoles={[1, 2, 4]}>
//   <div className={styles.wrap}>
//     <header className={styles.topbar}>
//       <div className={styles.left}>
//         <div className={styles.crumbs}>
//           <Link href="/admin" className={styles.crumbLink}>
//             Admin
//           </Link>
//           <span className={styles.crumbSep}>/</span>
//           <span className={styles.crumbNow}>Direct Admission</span>
//         </div>
//         <h1 className={styles.title}>Direct Student Admission</h1>
//         <p className={styles.subtitle}>
//           Create student accounts manually with fee structure
//         </p>
//       </div>

//       <div className={styles.right}>
//         <button
//           className={`${styles.btn} ${styles.primary}`}
//           onClick={submitDirect}
//           disabled={directBusy || !directValid}
//         >
//           {directBusy ? 'Creating…' : 'Create Admission'}
//         </button>
//       </div>
//     </header>

//     {/* FORM CARD */}
//     <section className={styles.card}>
      
//       <div className={styles.sectionTitle}>Student Details</div>

//       <div className={styles.formGrid}>
//         <input
//           className={styles.input}
//           placeholder="Full Name"
//           value={directForm.name}
//           onChange={(e) => setDirectForm((p) => ({ ...p, name: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           placeholder="Email"
//           value={directForm.email}
//           onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           placeholder="Phone Number"
//           value={directForm.phone_number}
//           onChange={(e) => setDirectForm((p) => ({ ...p, phone_number: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           placeholder="College"
//           value={directForm.college}
//           onChange={(e) => setDirectForm((p) => ({ ...p, college: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           placeholder="Course ID"
//           type="number"
//           value={directForm.course_id}
//           onChange={(e) => setDirectForm((p) => ({ ...p, course_id: e.target.value }))}
//         />
//       </div>

//       <div className={styles.sectionTitle} style={{ marginTop: 18 }}>
//         Fee Details
//       </div>

//       <div className={styles.formGrid}>
//         <input
//           className={styles.input}
//           placeholder="Total Fee"
//           type="number"
//           value={directForm.total_fee}
//           onChange={(e) => setDirectForm((p) => ({ ...p, total_fee: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           placeholder="First Payment"
//           type="number"
//           value={directForm.first_payment_amount}
//           onChange={(e) => setDirectForm((p) => ({ ...p, first_payment_amount: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           type="date"
//           value={directForm.first_payment_date}
//           onChange={(e) => setDirectForm((p) => ({ ...p, first_payment_date: e.target.value }))}
//         />

//         <input
//           className={styles.input}
//           type="date"
//           value={directForm.next_due_date}
//           onChange={(e) => setDirectForm((p) => ({ ...p, next_due_date: e.target.value }))}
//         />
//       </div>

//       {directResult && (
//         <div className={styles.resultBox}>
//           <div className={styles.strong}>Student Created ✅</div>

//           <div className={styles.dim}>
//             Enrollment ID: <b>{directResult.enrollment_id}</b>
//           </div>

//           <div className={styles.dim}>
//             Email: <b>{directResult.email}</b>
//           </div>

//           <div className={styles.dim}>
//             Password: <b>{directResult.password}</b>
//           </div>

//           <div className={styles.dim}>
//             Student must change password on first login.
//           </div>
//         </div>
//       )}

//     </section>
//   </div>
// </RoleGuard>
//   );
// }
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
  category: {
    name: string;
  };
};

export default function DirectAdmissionPage() {

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);

  const [directBusy, setDirectBusy] = useState(false);
  const [directResult, setDirectResult] = useState<any>(null);

  const [directForm, setDirectForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    course_id: '',
    college: '',
    total_fee: '',
    first_payment_amount: '',
    first_payment_date: '',
    next_due_date: '',
  });

  // ================= LOAD COURSES =================
  const loadCourses = async () => {
    try {
      setCourseLoading(true);

      const res = await fetchWithAuth(
        "https://api.easycoders.in/projects/backend/public/api/courses"
      );

      setCourses(res || []);
    } catch {
      alert("Failed to load courses");
    } finally {
      setCourseLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // ================= COURSE CHANGE =================
  const handleCourseChange = (id: string) => {
    const course = courses.find((c) => c.id === Number(id));

    setDirectForm((p) => ({
      ...p,
      course_id: id,
      total_fee: course ? course.discounted_price : "",
    }));
  };

  // ================= SUBMIT =================
  const submitDirect = async () => {
    try {
      setDirectBusy(true);
      setDirectResult(null);

      const payload = {
        name: directForm.name.trim(),
        email: directForm.email.trim(),
        phone_number: directForm.phone_number.trim(),
        course_id: Number(directForm.course_id),
        college: directForm.college.trim() || null,
        total_fee: Number(directForm.total_fee),
        first_payment_amount: Number(directForm.first_payment_amount),
        first_payment_date: directForm.first_payment_date,
        next_due_date: directForm.next_due_date || null,
      };

      const json = await fetchWithAuth(
        `https://api.easycoders.in/projects/backend/public/api/admin/directAdmissions/convert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      setDirectResult(json.data);

    } catch (e: any) {
      alert(e?.message || 'Admission failed');
    } finally {
      setDirectBusy(false);
    }
  };

  const directValid =
    directForm.name.trim() &&
    directForm.email.trim() &&
    directForm.phone_number.trim() &&
    directForm.course_id &&
    directForm.total_fee &&
    directForm.first_payment_amount &&
    directForm.first_payment_date;

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
            <p className={styles.subtitle}>
              Create student account with course and fee details
            </p>
          </div>

          <div className={styles.right}>
            <button
              className={`${styles.btn} ${styles.primary}`}
              onClick={submitDirect}
              disabled={directBusy || !directValid}
            >
              {directBusy ? 'Creating…' : 'Create Admission'}
            </button>
          </div>
        </header>

        <section className={styles.card}>

          <div className={styles.sectionTitle}>Student Details</div>

          <div className={styles.formGrid}>
            <input
              className={styles.input}
              placeholder="Full Name"
              value={directForm.name}
              onChange={(e) => setDirectForm((p) => ({ ...p, name: e.target.value }))}
            />

            <input
              className={styles.input}
              placeholder="Email"
              value={directForm.email}
              onChange={(e) => setDirectForm((p) => ({ ...p, email: e.target.value }))}
            />

            <input
              className={styles.input}
              placeholder="Phone Number"
              value={directForm.phone_number}
              onChange={(e) => setDirectForm((p) => ({ ...p, phone_number: e.target.value }))}
            />

            <input
              className={styles.input}
              placeholder="College"
              value={directForm.college}
              onChange={(e) => setDirectForm((p) => ({ ...p, college: e.target.value }))}
            />

            {/* COURSE DROPDOWN */}
            <select
              className={styles.input}
              value={directForm.course_id}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">
                {courseLoading ? "Loading Courses..." : "Select Course"}
              </option>

              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category.name} - {c.title} ({c.duration})
                </option>
              ))}
            </select>

          </div>

          <div className={styles.sectionTitle} style={{ marginTop: 18 }}>
            Fee Details
          </div>

          <div className={styles.formGrid}>
            <input
              className={styles.input}
              placeholder="Total Fee"
              type="number"
              readOnly
              value={directForm.total_fee}
            />

            <input
              className={styles.input}
              placeholder="First Payment"
              type="number"
              value={directForm.first_payment_amount}
              onChange={(e) =>
                setDirectForm((p) => ({
                  ...p,
                  first_payment_amount: e.target.value,
                }))
              }
            />

            <input
              className={styles.input}
              type="date"
              value={directForm.first_payment_date}
              onChange={(e) =>
                setDirectForm((p) => ({
                  ...p,
                  first_payment_date: e.target.value,
                }))
              }
            />

            <input
              className={styles.input}
              type="date"
              value={directForm.next_due_date}
              onChange={(e) =>
                setDirectForm((p) => ({
                  ...p,
                  next_due_date: e.target.value,
                }))
              }
            />
          </div>

          {directResult && (
            <div className={styles.resultBox}>
              <div className={styles.strong}>Student Created ✅</div>

              <div className={styles.dim}>
                Enrollment ID: <b>{directResult.enrollment_id}</b>
              </div>

              <div className={styles.dim}>
                Email: <b>{directResult.email}</b>
              </div>

              <div className={styles.dim}>
                Password: <b>{directResult.password}</b>
              </div>

              <div className={styles.dim}>
                Student must change password on first login.
              </div>
            </div>
          )}

        </section>
      </div>
    </RoleGuard>
  );
}