
// 'use client';

// import { useEffect, useState } from 'react';
// import styles from './fee.module.css';
// import RoleGuard from '@/components/RoleGuard';
// import {
//   searchStudents,
//   getStudentDetails,
//   addPayment, } from '../../../components/allApis';


// export default function FeeDetails() {
//   const [search, setSearch] = useState('');
//   const [students, setStudents] = useState<any[]>([]);
//   const [selected, setSelected] = useState<any>(null);
//   const [profile, setProfile] = useState<any>(null);
//   const [payments, setPayments] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);

//   const [paymentForm, setPaymentForm] = useState({
//     amount: '',
//     payment_mode: 'cash',
//   });

//   // 🔍 SEARCH
//   useEffect(() => {
//     const delay = setTimeout(async () => {
//       if (search.length < 2) {
//         setStudents([]);
//         return;
//       }

//       const res = await searchStudents(search);
//       setStudents(res);
//     }, 400);

//     return () => clearTimeout(delay);
//   }, [search]);

//   // 👤 SELECT STUDENT
//   const handleSelect = async (student: any) => {
//     setSearch(student.name);
//     setStudents([]);
//     setLoading(true);

//     try {
//       const res = await getStudentDetails(student.id);

//       setSelected(res.student);
//       setProfile(res.profile);
//       setPayments(res.payments || []);
//     } catch {
//       alert('Failed to load student');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 💰 ADD PAYMENT
//   const handlePayment = async () => {
//     if (!paymentForm.amount) return alert('Enter amount');

//     setLoading(true);

//     try {
//       await addPayment({
//         user_id: selected.id,
//         amount: Number(paymentForm.amount),
//         payment_mode: paymentForm.payment_mode,
//       });

//       // 🔁 REFRESH
//       const res = await getStudentDetails(selected.id);
//       setProfile(res.profile);
//       setPayments(res.payments);

//       setPaymentForm({
//         amount: '',
//         payment_mode: 'cash',
//       });
//     } catch {
//       alert('Payment failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <RoleGuard allowedRoles={[1, 2, 4]}>
//       <div className={styles.wrap}>
//         <h1 className={styles.title}>Update Student Details</h1>

//         {/* SEARCH */}
//         <div className={styles.searchBox}>
//           <input
//             className={styles.input}
//             placeholder="Search student..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />

//           {students.length > 0 && (
//             <div className={styles.dropdown}>
//               {students.map((s) => (
//                 <div
//                   key={s.id}
//                   className={styles.dropdownItem}
//                   onClick={() => handleSelect(s)}
//                 >
//                   <div className={styles.name}>{s.name}</div>
//                   <div className={styles.email}>{s.email}</div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* LOADING */}
//         {loading && <div className={styles.state}>Loading...</div>}

//         {/* STUDENT DETAILS */}
//         {selected && profile && !loading && (
//           <div className={styles.card}>
//             <h3 className={styles.sectionTitle}>Student Info</h3>

//             <div className={styles.infoGrid}>
//               <div><b>Name:</b> {selected.name}</div>
//               <div><b>Email:</b> {selected.email}</div>
//               <div><b>Phone:</b> {selected.phone}</div>
//               <div><b>Enrollment:</b> {profile.enrollment_id}</div>
//               <div><b>Course:</b> {profile.course.name}</div>
//               <div><b>College:</b> {profile.college.name}</div>
//             </div>

//             <hr />

//             <div className={styles.feeBox}>
//               <div>Total: ₹{profile.total_fee}</div>
//               <div>Paid: ₹{profile.paid_amount}</div>
//               <div className={styles.due}>
//                 Due: ₹{profile.due_amount}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* PAYMENT */}
//         {selected && (
//           <div className={styles.card}>
//             <h3 className={styles.sectionTitle}>Add Payment</h3>

//             <div className={styles.formGrid}>
//               <input
//                 className={styles.input}
//                 type="number"
//                 placeholder="Amount"
//                 value={paymentForm.amount}
//                 onChange={(e) =>
//                   setPaymentForm((p) => ({
//                     ...p,
//                     amount: e.target.value,
//                   }))
//                 }
//               />

//               <select
//                 className={styles.input}
//                 value={paymentForm.payment_mode}
//                 onChange={(e) =>
//                   setPaymentForm((p) => ({
//                     ...p,
//                     payment_mode: e.target.value,
//                   }))
//                 }
//               >
//                 <option value="cash">CASH</option>
//                 <option value="upi">UPI</option>
//                 <option value="netbanking">NET BANKING</option>
//               </select>
//             </div>

//             <button
//               className={`${styles.btn} ${styles.primary}`}
//               onClick={handlePayment}
//             >
//               {loading ? 'Processing...' : 'Add Payment'}
//             </button>
//           </div>
//         )}

//         {/* PAYMENT HISTORY */}
//         {payments.length > 0 && (
//           <div className={styles.card}>
//             <h3 className={styles.sectionTitle}>Payment History</h3>

//             {payments.map((p) => (
//               <div key={p.id} className={styles.paymentRow}>
//                 ₹{p.amount} | {p.payment_mode} | {p.payment_date}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </RoleGuard>
//   );
// }
'use client';

import { useEffect, useState } from 'react';
import styles from './fee.module.css';
import RoleGuard from '@/components/RoleGuard';
import {
  searchStudents,
  getStudentDetails,
  addPayment,
} from '../../../components/allApis';

export default function FeeDetails() {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [lastPayment, setLastPayment] = useState<any>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
  });

  // 🔍 SEARCH
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (search.length < 2) {
        setStudents([]);
        return;
      }

      const res = await searchStudents(search);
      setStudents(res);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  // 👤 SELECT
  const handleSelect = async (student: any) => {
    setSearch(student.name);
    setStudents([]);
    setLoading(true);

    const res = await getStudentDetails(student.id);

    setSelected(res.student);
    setProfile(res.profile);
    setPayments(res.payments || []);

    setLoading(false);
  };

  // 💰 PAYMENT
  const handlePayment = async () => {
    if (!paymentForm.amount) return alert('Enter amount');

    setLoading(true);

    await addPayment({
      user_id: selected.id,
      amount: Number(paymentForm.amount),
      payment_mode: paymentForm.payment_mode,
    });

    const res = await getStudentDetails(selected.id);

    setProfile(res.profile);
    setPayments(res.payments);

    setLastPayment({
      amount: paymentForm.amount,
      mode: paymentForm.payment_mode,
      date: new Date().toLocaleString(),
    });

    setShowModal(true);

    setPaymentForm({
      amount: '',
      payment_mode: 'cash',
    });

    setLoading(false);
  };

  return (
    <RoleGuard allowedRoles={[1, 2, 4]}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Fee Management</h1>

        {/* SEARCH */}
        <div className={styles.searchBox}>
          <input
            className={styles.input}
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {students.length > 0 && (
            <div className={styles.dropdown}>
              {students.map((s) => (
                <div
                  key={s.id}
                  className={styles.dropdownItem}
                  onClick={() => handleSelect(s)}
                >
                  <div className={styles.name}>{s.name}</div>
                  <div className={styles.email}>{s.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOADING */}
        {loading && <div className={styles.state}>Loading...</div>}

        {/* STUDENT */}
        {selected && profile && !loading && (
          <>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Student Info</h3>

              <div className={styles.infoGrid}>
                <div><b>Name:</b> {selected.name}</div>
                <div><b>Email:</b> {selected.email}</div>
                <div><b>Phone:</b> {selected.phone}</div>
                <div><b>Course:</b> {profile.course.name}</div>
                <div><b>College:</b> {profile.college.name}</div>
              </div>
            </div>

            {/* 💳 SUMMARY */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Fee Summary</h3>

              <div className={styles.feeBox}>
                <div>Total: ₹{profile.total_fee}</div>
                <div>Paid: ₹{profile.paid_amount}</div>
                <div className={styles.due}>
                  Due: ₹{profile.due_amount}
                </div>
              </div>
            </div>

            {/* 💰 PAYMENT */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Add Payment</h3>

              <div className={styles.formGrid}>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="Amount"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm((p) => ({
                      ...p,
                      amount: e.target.value,
                    }))
                  }
                />

                <select
                  className={styles.input}
                  value={paymentForm.payment_mode}
                  onChange={(e) =>
                    setPaymentForm((p) => ({
                      ...p,
                      payment_mode: e.target.value,
                    }))
                  }
                >
                  <option value="cash">CASH</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">NET BANKING</option>
                </select>
              </div>

              <button
                className={`${styles.btn} ${styles.primary}`}
                onClick={handlePayment}
              >
                {loading ? 'Processing...' : 'Add Payment'}
              </button>
            </div>

            {/* 📜 TABLE HISTORY */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>Payment History</h3>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>₹{p.amount}</td>
                        <td>{p.payment_mode}</td>
                        <td>{p.payment_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ✅ SUCCESS MODAL */}
        {showModal && lastPayment && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHead}>
                <div className={styles.modalTitle}>Payment Successful</div>
                <button className={styles.x} onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className={styles.successIcon}>✓</div>

              <div className={styles.modalBody}>
                ₹{lastPayment.amount} received successfully
              </div>

              <div className={styles.modalInfo}>
                <div><b>Mode:</b> {lastPayment.mode}</div>
                <div><b>Date:</b> {lastPayment.date}</div>
              </div>

              <button
                className={`${styles.btn} ${styles.primary} ${styles.downloadBtn}`}
              >
                Download Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}