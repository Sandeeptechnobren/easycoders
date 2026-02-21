// 'use client';
// import api from '@/lib/axios';
// import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
// export default function Registration() {
//   const [show, setShow] = useState(false);
//   const [courses, setCourses] = useState<any[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState('');
//   const [openForm, setOpenForm] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [courseOpen, setCourseOpen] = useState(false);
//   const [courseSearch, setCourseSearch] = useState('');
//   const [panelPlacement, setPanelPlacement] = useState<'down' | 'up'>('down');
//   const [panelMaxHeight, setPanelMaxHeight] = useState<number>(220);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);
//   const buttonRef = useRef<HTMLButtonElement | null>(null);
//   const panelRef = useRef<HTMLDivElement | null>(null);
//   useEffect(() => {
//     setShow(true);
//   }, []);

//   const closePopup = () => {
//     setShow(false);
//     localStorage.setItem('reg_popup_dismissed', '1');
//   };

//   // Fetch courses once
//   useEffect(() => {
//     api
//       .get('/courses')
//       .then((res) => setCourses(res.data?.data ?? res.data))
//       .catch((err) => console.error(err));
//   }, []);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (!dropdownRef.current) return;
//       if (!dropdownRef.current.contains(e.target as Node)) setCourseOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   const filteredCourses = courses.filter((c) => {
//     const label = `${c.title} ${c.category?.name ? `(${c.category.name})` : ''}`.toLowerCase();
//     return label.includes(courseSearch.toLowerCase());
//   });

//   // Auto-place dropdown above/below depending on space
//   const computeDropdownPlacement = () => {
//     const btn = buttonRef.current;
//     if (!btn) return;

//     const rect = btn.getBoundingClientRect();
//     const gap = 10; // space between button and panel
//     const margin = 12; // safe margin from viewport edges
//     const desiredPanelHeight = 320; // target available height for list+search

//     const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
//     const spaceAbove = rect.top - gap - margin;

//     // Prefer side with more space, but try to keep at least some usable height
//     const placeDown = spaceBelow >= Math.min(desiredPanelHeight, 180) || spaceBelow >= spaceAbove;

//     const available = placeDown ? spaceBelow : spaceAbove;

//     // Set max height for scroll area (minus search + padding)
//     const computedMaxHeight = Math.max(160, Math.min(available - 70, 360)); // 70 ~ header/search/padding

//     setPanelPlacement(placeDown ? 'down' : 'up');
//     setPanelMaxHeight(computedMaxHeight);
//   };

//   // Compute placement when opening, and on resize/scroll while open
//   useLayoutEffect(() => {
//     if (!courseOpen) return;

//     computeDropdownPlacement();

//     const onResize = () => computeDropdownPlacement();
//     const onScroll = () => computeDropdownPlacement();

//     window.addEventListener('resize', onResize);
//     window.addEventListener('scroll', onScroll, true); // true catches scroll in containers too
//     return () => {
//       window.removeEventListener('resize', onResize);
//       window.removeEventListener('scroll', onScroll, true);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [courseOpen]);

//   const handleRegistrationSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const form = e.currentTarget as HTMLFormElement;

//     if (!selectedCourse) {
//       alert('Please select a program.');
//       return;
//     }

//     try {
//       setSubmitting(true);

//       await api.post('/addenrollmentrequest', {
//         course_id: selectedCourse,
//         name: (form.elements.namedItem('name') as HTMLInputElement).value,
//         email: (form.elements.namedItem('email') as HTMLInputElement).value,
//         phone_number: (form.elements.namedItem('phone') as HTMLInputElement).value,
//         college: (form.elements.namedItem('college') as HTMLInputElement).value,
//       });

//       alert('Registration successful! We will contact you soon.');
//       setOpenForm(false);
//       setSelectedCourse('');
//       setCourseSearch('');
//       setCourseOpen(false);
//       setSubmitting(false);
//     } catch (err) {
//       console.error(err);
//       setSubmitting(false);
//       alert('Something went wrong. Please try again later.');
//     }
//   };

//   if (!show) return null;

//   const selectedLabel = selectedCourse
//     ? (() => {
//         const c = courses.find((x) => String(x.id) === String(selectedCourse));
//         return c ? `${c.title}${c.category?.name ? ` (${c.category.name})` : ''}` : 'Selected program';
//       })()
//     : '';

//   return (
//     <>
//       <div className="overlay">
//         <div className="popup">
//           <button className="close" onClick={closePopup}>
//             ✕
//           </button>

//           <span className="badge">Registrations Open</span>

//           <div className="marquee-container">
//             <h3 className="marquee-title">🚀 Upcoming Batches Registration</h3>
//           </div>

//           <p className="subtitle">
//             Registration started for <b>Summer Training</b> & <b>Internship</b>
//           </p>

//           {!openForm ? (
//             <>
//               <div className="cards">
//                 <div className="card">
//                   <h4>Summer Training</h4>
//                   <p>Learn fundamentals & build projects with mentor support.</p>
//                   <ul>
//                     <li>Beginner friendly</li>
//                     <li>Live guidance</li>
//                     <li>Certificate</li>
//                   </ul>
//                 </div>
//                 <div className="card">
//                   <h4>Internship</h4>
//                   <p>Work on real tasks & improve your portfolio.</p>
//                   <ul>
//                     <li>Real projects</li>
//                     <li>Mentorship</li>
//                     <li>Internship letter</li>
//                   </ul>
//                 </div>
//               </div>

//               <div className="actions">
//                 <button className="cta" onClick={() => setOpenForm(true)}>
//                   Register Now
//                 </button>
//                 <button className="secondary" onClick={closePopup}>
//                   Maybe later
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <h4 className="formTitle">Complete Your Registration</h4>

//               <form className="form" onSubmit={handleRegistrationSubmit}>
//                 <input name="name" placeholder="Full Name" required />
//                 <input name="phone" placeholder="Phone Number" required />
//                 <input name="email" type="email" placeholder="Email Address" required />
//                 <input name="college" placeholder="College" required />
//                 <div className="selectWrap" ref={dropdownRef}>
//                   <label className="selectLabel">Select Program</label>
//                   <button
//                     ref={buttonRef}
//                     type="button"
//                     className={`selectButton ${courseOpen ? 'open' : ''}`}
//                     onClick={() => setCourseOpen((v) => !v)}
//                     aria-haspopup="listbox"
//                     aria-expanded={courseOpen}
//                   >
//                     <span className={`selectValue ${selectedCourse ? '' : 'placeholder'}`}>
//                       {selectedCourse ? selectedLabel : 'Select Program'}
//                     </span>
//                     <span className="chev">▾</span>
//                   </button>
//                   {courseOpen && (
//                     <div
//                       ref={panelRef}
//                       className={`selectPanel ${panelPlacement === 'up' ? 'up' : 'down'}`}
//                       style={
//                         {
//                           '--listMax': `${panelMaxHeight}px`,
//                         } as React.CSSProperties
//                       }
//                     >
//                       <input
//                         className="selectSearch"
//                         placeholder="Search program..."
//                         value={courseSearch}
//                         onChange={(e) => setCourseSearch(e.target.value)}
//                         autoFocus
//                       />

//                       <div className="selectList" role="listbox">
//                         {filteredCourses.length === 0 ? (
//                           <div className="selectEmpty">No programs found</div>
//                         ) : (
//                           filteredCourses.map((course) => {
//                             const active = String(course.id) === String(selectedCourse);

//                             return (
//                               <button
//                                 key={course.id}
//                                 type="button"
//                                 className={`selectItem ${active ? 'active' : ''}`}
//                                 onClick={() => {
//                                   setSelectedCourse(String(course.id));
//                                   setCourseOpen(false);
//                                   setCourseSearch('');
//                                 }}
//                                 role="option"
//                                 aria-selected={active}
//                               >
//                                 <span className="selectItemTitle">{course.title}</span>
//                                 {course.category?.name && (
//                                   <span className="selectItemTag">{course.category.name}</span>
//                                 )}
//                               </button>
//                             );
//                           })
//                         )}
//                       </div>
//                       <input type="hidden" name="course_id" value={selectedCourse} required />
//                       {!selectedCourse && <p className="selectHint">Please select a program</p>}
//                     </div>
//                   )}
//                 </div>

//                 <div className="actions">
//                   <button className="cta" type="submit" disabled={submitting}>
//                     {submitting ? 'Submitting...' : 'Submit'}
//                   </button>

//                   <button
//                     type="button"
//                     className="secondary"
//                     onClick={() => {
//                       setOpenForm(false);
//                       setCourseOpen(false);
//                     }}
//                     disabled={submitting}
//                   >
//                     Back
//                   </button>
//                 </div>
//               </form>
//             </>
//           )}
//         </div>
//       </div>

//       <style jsx>{`
//         .overlay {
//           position: fixed;
//           inset: 0;
//           background: rgba(0, 0, 0, 0.75);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 9999;
//           padding: 10px;
//           border: 1px solid rgba(255, 255, 255, 0.1);
//         }

//         .popup {
//           background: #0b0f19;
//           color: #e9eefc;
//           width: 100%;
//           max-width: 720px;
//           border-radius: 18px;
//           padding: 20px;
//           position: relative;
//           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
//         }

//         .close {
//           position: absolute;
//           top: 12px;
//           right: 12px;
//           background: rgba(255, 255, 255, 0.1);
//           border: none;
//           color: #fff;
//           width: 36px;
//           height: 36px;
//           border-radius: 10px;
//           cursor: pointer;
//         }

//         .badge {
//           display: inline-block;
//           background: rgba(99, 102, 241, 0.2);
//           border: 1px solid rgba(99, 102, 241, 0.4);
//           padding: 6px 12px;
//           border-radius: 999px;
//           font-size: 12px;
//           margin-bottom: 10px;
//         }

//         .marquee-container {
//           overflow: hidden;
//           background: rgba(99, 102, 241, 0.1);
//           border-radius: 8px;
//           padding: 8px 0;
//           margin-bottom: 12px;
//         }

//         .marquee-container .marquee-title {
//           animation: scroll 15s linear alternate;
//           margin: 0;
//           padding: 0 16px;
//           white-space: nowrap;
//           display: inline-block;
//         }

//         @keyframes scroll {
//           from {
//             transform: translateX(100%);
//           }
//           to {
//             transform: translateX(-100%);
//           }
//         }

//         .subtitle {
//           margin-bottom: 16px;
//           color: rgba(233, 238, 252, 0.75);
//         }

//         .cards {
//           display: grid;
//           grid-template-columns: 1fr;
//           gap: 12px;
//         }

//         @media (min-width: 640px) {
//           .cards {
//             grid-template-columns: 1fr 1fr;
//           }
//         }

//         .card {
//           background: rgba(255, 255, 255, 0.05);
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           border-radius: 14px;
//           padding: 14px;
//         }

//         .card h4 {
//           color: #e9eefc;
//           margin: 0 0 6px;
//         }

//         .card p {
//           font-size: 14px;
//           color: rgba(233, 238, 252, 0.7);
//         }

//         .card ul {
//           color: #e9eefc;
//           padding-left: 18px;
//           font-size: 14px;
//         }

//         .actions {
//           display: flex;
//           gap: 10px;
//           margin-top: 16px;
//           flex-wrap: wrap;
//         }

//         .cta {
//           background: #e9eefc;
//           color: #0b0f19;
//           border: none;
//           padding: 12px 18px;
//           border-radius: 12px;
//           font-weight: 600;
//           cursor: pointer;
//         }

//         .cta:disabled {
//           opacity: 0.7;
//           cursor: not-allowed;
//         }

//         .secondary {
//           background: transparent;
//           border: 1px solid rgba(255, 255, 255, 0.2);
//           color: #e9eefc;
//           padding: 12px 18px;
//           border-radius: 12px;
//           cursor: pointer;
//         }

//         .secondary:disabled {
//           opacity: 0.7;
//           cursor: not-allowed;
//         }

//         .formTitle {
//           margin-top: 10px;
//           font-size: 18px;
//         }

//         .form {
//           display: grid;
//           gap: 10px;
//           margin-top: 12px;
//         }

//         .form input,
//         .form textarea {
//           background: rgba(0, 0, 0, 0.3);
//           border: 1px solid rgba(255, 255, 255, 0.15);
//           border-radius: 12px;
//           padding: 12px;
//           color: #e9eefc;
//           outline: none;
//         }

//         /* ===== Custom Dropdown Styles ===== */

//         .selectWrap {
//           position: relative;
//           display: grid;
//           gap: 6px;
//         }

//         .selectLabel {
//           font-size: 13px;
//           color: rgba(233, 238, 252, 0.75);
//           padding-left: 4px;
//         }

//         .selectButton {
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 10px;

//           background: rgba(0, 0, 0, 0.3);
//           border: 1px solid rgba(255, 255, 255, 0.15);
//           border-radius: 12px;
//           padding: 12px;
//           color: #e9eefc;
//           outline: none;
//           cursor: pointer;
//           transition: border 0.15s ease, box-shadow 0.15s ease;
//         }

//         .selectButton.open {
//           border-color: rgba(99, 102, 241, 0.65);
//           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
//         }

//         .selectValue {
//           text-align: left;
//           font-size: 14px;
//           line-height: 1.2;
//           overflow: hidden;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//           flex: 1;
//         }

//         .selectValue.placeholder {
//           color: rgba(233, 238, 252, 0.6);
//         }

//         .chev {
//           opacity: 0.9;
//           font-size: 14px;
//         }

//         .selectPanel {
//           position: absolute;
//           left: 0;
//           right: 0;
//           z-index: 99999;

//           background: #0b0f19;
//           border: 1px solid rgba(255, 255, 255, 0.14);
//           border-radius: 14px;
//           padding: 10px;

//           box-shadow: 0 22px 70px rgba(0, 0, 0, 0.65);

//           /* crisp visibility */
//           backdrop-filter: blur(6px);
//         }

//         .selectPanel.down {
//           top: calc(100% + 10px);
//         }

//         .selectPanel.up {
//           bottom: calc(100% + 10px);
//         }

//         .selectSearch {
//           width: 100%;
//           background: rgba(255, 255, 255, 0.06);
//           border: 1px solid rgba(255, 255, 255, 0.12);
//           border-radius: 12px;
//           padding: 10px 12px;
//           color: #e9eefc;
//           outline: none;
//         }

//         .selectSearch:focus {
//           border-color: rgba(99, 102, 241, 0.65);
//           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
//         }

//         .selectList {
//           margin-top: 10px;
//           max-height: var(--listMax, 220px);
//           overflow: auto;
//           display: grid;
//           gap: 8px;
//           padding-right: 4px;
//         }

//         .selectItem {
//           width: 100%;
//           text-align: left;
//           background: rgba(255, 255, 255, 0.05);
//           border: 1px solid rgba(255, 255, 255, 0.1);
//           border-radius: 12px;
//           padding: 10px 12px;
//           color: #e9eefc;
//           cursor: pointer;

//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           gap: 10px;
//           transition: transform 0.1s ease, border 0.15s ease;
//         }

//         .selectItem:hover {
//           transform: translateY(-1px);
//           border-color: rgba(99, 102, 241, 0.45);
//         }

//         .selectItem.active {
//           border-color: rgba(99, 102, 241, 0.75);
//           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
//         }

//         .selectItemTitle {
//           font-size: 14px;
//         }

//         .selectItemTag {
//           font-size: 12px;
//           padding: 4px 8px;
//           border-radius: 999px;
//           background: rgba(99, 102, 241, 0.18);
//           border: 1px solid rgba(99, 102, 241, 0.35);
//           color: rgba(233, 238, 252, 0.95);
//           white-space: nowrap;
//         }

//         .selectEmpty {
//           padding: 12px;
//           border-radius: 12px;
//           background: rgba(255, 255, 255, 0.04);
//           border: 1px solid rgba(255, 255, 255, 0.08);
//           color: rgba(233, 238, 252, 0.7);
//           text-align: center;
//           font-size: 13px;
//         }

//         .selectHint {
//           margin: 10px 4px 0;
//           font-size: 12px;
//           color: rgba(233, 238, 252, 0.65);
//         }
//       `}</style>
//     </>
//   );
// }
'use client';

import api from '@/lib/axios';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type PayMethod = 'qr' | 'office';

export default function Registration() {
  const [show, setShow] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Steps
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields (controlled so we can submit once at end)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');

  // Payment
  const [payMethod, setPayMethod] = useState<PayMethod>('qr');
  const [txnNumber, setTxnNumber] = useState('');
  const [showQr, setShowQr] = useState(false);

  // dropdown
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [panelPlacement, setPanelPlacement] = useState<'down' | 'up'>('down');
  const [panelMaxHeight, setPanelMaxHeight] = useState<number>(220);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Temporary QR image (replace later with your own)
  const TEMP_QR =
    'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=EASYCODERS_REGISTRATION_FEE';
  useEffect(() => {
    setShow(true);
  }, []);

  const closePopup = () => {
    setShow(false);
    localStorage.setItem('reg_popup_dismissed', '1');
  };
  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(res.data?.data ?? res.data))
      .catch((err) => console.error(err));
  }, []);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setCourseOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const filteredCourses = courses.filter((c) => {
    const label = `${c.title} ${c.category?.name ? `(${c.category.name})` : ''}`.toLowerCase();
    return label.includes(courseSearch.toLowerCase());
  });
  const computeDropdownPlacement = () => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const gap = 10;
    const margin = 12;
    const desiredPanelHeight = 320;

    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;

    const placeDown = spaceBelow >= Math.min(desiredPanelHeight, 180) || spaceBelow >= spaceAbove;
    const available = placeDown ? spaceBelow : spaceAbove;

    const computedMaxHeight = Math.max(160, Math.min(available - 70, 360));

    setPanelPlacement(placeDown ? 'down' : 'up');
    setPanelMaxHeight(computedMaxHeight);
  };

  useLayoutEffect(() => {
    if (!courseOpen) return;
    computeDropdownPlacement();
    const onResize = () => computeDropdownPlacement();
    const onScroll = () => computeDropdownPlacement();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [courseOpen]);

  const selectedLabel = selectedCourse
    ? (() => {
        const c = courses.find((x) => String(x.id) === String(selectedCourse));
        return c ? `${c.title}${c.category?.name ? ` (${c.category.name})` : ''}` : 'Selected program';
      })()
    : '';

  const resetFormState = () => {
    setStep(1);

    setName('');
    setPhone('');
    setEmail('');
    setCollege('');

    setSelectedCourse('');
    setCourseSearch('');
    setCourseOpen(false);

    setPayMethod('qr');
    setTxnNumber('');
    setShowQr(false);
  };

  const validateStep = (s: 1 | 2 | 3) => {
    if (s === 1) {
      if (!name.trim()) return 'Please enter full name.';
      if (!phone.trim()) return 'Please enter phone number.';
      if (!email.trim()) return 'Please enter email address.';
      if (!college.trim()) return 'Please enter college.';
    }

    if (s === 2) {
      if (!selectedCourse) return 'Please select a program.';
    }

    if (s === 3) {
      // Payment rules:
      // - If payMethod === 'qr' => transaction number required
      // - If payMethod === 'office' => no txn required
      if (payMethod === 'qr') {
        const txn = txnNumber.trim();
        if (!txn) return 'Please enter Transaction Number (UTR / UPI Ref No.).';
        if (txn.length < 6) return 'Transaction Number looks too short. Please re-check.';
      }
    }

    return '';
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      alert(err);
      return;
    }
    setStep((prev) => (prev === 1 ? 2 : 3));
  };

  const prevStep = () => {
    setStep((prev) => (prev === 3 ? 2 : 1));
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate all steps before final submit
    const err1 = validateStep(1);
    if (err1) return alert(err1);
    const err2 = validateStep(2);
    if (err2) return alert(err2);
    const err3 = validateStep(3);
    if (err3) return alert(err3);

    try {
      setSubmitting(true);

      await api.post('/addenrollmentrequest', {
        course_id: selectedCourse,
        name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        college: college.trim(),

        payment_method: payMethod, // NEW
        transaction_number: payMethod === 'qr' ? txnNumber.trim() : null, // NEW
      });

      alert('Registration successful! We will contact you soon.');
      setOpenForm(false);
      resetFormState();
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Something went wrong. Please try again later.');
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="overlay">
        <div className="popup">
          <button className="close" onClick={closePopup}>
            ✕
          </button>

          <span className="badge">Registrations Open</span>

          <div className="marquee-container">
            <h3 className="marquee-title">🚀 Upcoming Batches Registration</h3>
          </div>

          <p className="subtitle">
            Registration started for <b>Summer Training</b> & <b>Internship</b>
          </p>

          {!openForm ? (
            <>
              <div className="cards">
                <div className="card">
                  <h4>Summer Training</h4>
                  <p>Learn fundamentals & build projects with mentor support.</p>
                  <ul>
                    <li>Beginner friendly</li>
                    <li>Live guidance</li>
                    <li>Certificate</li>
                  </ul>
                </div>
                <div className="card">
                  <h4>Internship</h4>
                  <p>Work on real tasks & improve your portfolio.</p>
                  <ul>
                    <li>Real projects</li>
                    <li>Mentorship</li>
                    <li>Internship letter</li>
                  </ul>
                </div>
              </div>

              <div className="actions">
                <button className="cta" onClick={() => setOpenForm(true)}>
                  Register Now
                </button>
                <button className="secondary" onClick={closePopup}>
                  Maybe later
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="topRow">
                <h4 className="formTitle">Complete Your Registration</h4>

                {/* Stepper */}
                <div className="stepper" aria-label="Registration steps">
                  <div className={`step ${step >= 1 ? 'active' : ''}`}>
                    <div className="dot">1</div>
                    <div className="lbl">Details</div>
                  </div>
                  <div className={`line ${step >= 2 ? 'active' : ''}`} />
                  <div className={`step ${step >= 2 ? 'active' : ''}`}>
                    <div className="dot">2</div>
                    <div className="lbl">Program</div>
                  </div>
                  <div className={`line ${step >= 3 ? 'active' : ''}`} />
                  <div className={`step ${step >= 3 ? 'active' : ''}`}>
                    <div className="dot">3</div>
                    <div className="lbl">Payment</div>
                  </div>
                </div>
              </div>

              {/* Two-column layout (side-by-side) */}
              <div className="grid2">
                {/* LEFT: Form */}
                <form className="form" onSubmit={handleRegistrationSubmit}>
                  {step === 1 ? (
                    <>
                      <div className="sectionTitle">Step 1 — Your Details</div>

                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone Number"
                        required
                      />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email Address"
                        required
                      />
                      <input
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="College"
                        required
                      />
                    </>
                  ) : step === 2 ? (
                    <>
                      <div className="sectionTitle">Step 2 — Select Program</div>

                      <div className="selectWrap" ref={dropdownRef}>
                        <label className="selectLabel">Select Program</label>
                        <button
                          ref={buttonRef}
                          type="button"
                          className={`selectButton ${courseOpen ? 'open' : ''}`}
                          onClick={() => setCourseOpen((v) => !v)}
                          aria-haspopup="listbox"
                          aria-expanded={courseOpen}
                        >
                          <span className={`selectValue ${selectedCourse ? '' : 'placeholder'}`}>
                            {selectedCourse ? selectedLabel : 'Select Program'}
                          </span>
                          <span className="chev">▾</span>
                        </button>

                        {courseOpen && (
                          <div
                            ref={panelRef}
                            className={`selectPanel ${panelPlacement === 'up' ? 'up' : 'down'}`}
                            style={
                              {
                                '--listMax': `${panelMaxHeight}px`,
                              } as React.CSSProperties
                            }
                          >
                            <input
                              className="selectSearch"
                              placeholder="Search program..."
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              autoFocus
                            />

                            <div className="selectList" role="listbox">
                              {filteredCourses.length === 0 ? (
                                <div className="selectEmpty">No programs found</div>
                              ) : (
                                filteredCourses.map((course) => {
                                  const active = String(course.id) === String(selectedCourse);

                                  return (
                                    <button
                                      key={course.id}
                                      type="button"
                                      className={`selectItem ${active ? 'active' : ''}`}
                                      onClick={() => {
                                        setSelectedCourse(String(course.id));
                                        setCourseOpen(false);
                                        setCourseSearch('');
                                      }}
                                      role="option"
                                      aria-selected={active}
                                    >
                                      <span className="selectItemTitle">{course.title}</span>
                                      {course.category?.name && (
                                        <span className="selectItemTag">{course.category.name}</span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>

                            <input type="hidden" name="course_id" value={selectedCourse} required />
                            {!selectedCourse && <p className="selectHint">Please select a program</p>}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sectionTitle">Step 3 — Payment</div>
                      <div className="notice">
                        <span className="noticeIcon">⚠️</span>
                        <div className="noticeText">
                          <b>Note:</b> Registration fee is <b>non-refundable</b>. Please verify details before payment.
                        </div>
                      </div>
                      <div className="payMethods">
                        <label className={`payOption ${payMethod === 'qr' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="pay_method"
                            checked={payMethod === 'qr'}
                            onChange={() => setPayMethod('qr')}
                          />
                          <div className="payOptionBody">
                            <div className="payOptTitle">Pay via QR (UPI)</div>
                            <div className="payOptSub">Scan QR and enter transaction number.</div>
                          </div>
                        </label>

                        <label className={`payOption ${payMethod === 'office' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="pay_method"
                            checked={payMethod === 'office'}
                            onChange={() => {
                              setPayMethod('office');
                              setTxnNumber('');
                              setShowQr(false);
                            }}
                          />
                          <div className="payOptionBody">
                            <div className="payOptTitle">Pay at Office</div>
                            <div className="payOptSub">Pay in-person at our office counter.</div>
                          </div>
                        </label>
                      </div>

                      {payMethod === 'qr' ? (
                        <>
                          {/* QR must not be directly visible: show only when user clicks */}
                          <div className="qrHiddenBox">
                            <button
                              type="button"
                              className="revealBtn"
                              onClick={() => setShowQr((v) => !v)}
                            >
                              {showQr ? 'Hide QR Code' : 'Show QR Code'}
                            </button>

                            {showQr ? (
                              <div className="qrReveal">
                                <div className="qrWrap">
                                  <img className="qrImg" src='images/TechnobrenQR.jpeg' alt="Temporary Registration Fee QR Code" />
                                </div>
                                {/* <div className="qrCaption">Temporary QR (replace later)</div> */}
                              </div>
                            ) : (
                              <div className="qrHint">
                                QR code is hidden for privacy. Click “Show QR Code” to view and scan.
                              </div>
                            )}
                          </div>

                          <div className="txnWrap">
                            <label className="txnLabel">Transaction Number (UTR / UPI Ref No.)</label>
                            <input
                              value={txnNumber}
                              onChange={(e) => setTxnNumber(e.target.value)}
                              placeholder="Eg: 123456789012 / UPI Ref No."
                              className="txnInput"
                              required={payMethod === 'qr'}
                            />
                            <div className="txnHint">We use this to verify your payment quickly.</div>
                          </div>
                        </>
                      ) : (
                        <div className="officeInfo">
                          <div className="officeBadge">Pay at Office Selected</div>
                          <p className="officeText">
                            You can complete the payment at the office. After submitting this registration request, our
                            team will contact you with the office address and timing (or you can add it on the website).
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="actions">
                    {step > 1 ? (
                      <button type="button" className="secondary" onClick={prevStep} disabled={submitting}>
                        Back
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          setOpenForm(false);
                          setCourseOpen(false);
                        }}
                        disabled={submitting}
                      >
                        Close
                      </button>
                    )}

                    {step < 3 ? (
                      <button type="button" className="cta" onClick={nextStep} disabled={submitting}>
                        Next
                      </button>
                    ) : (
                      <button className="cta" type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Registration'}
                      </button>
                    )}
                  </div>
                </form>

                {/* RIGHT: Summary (side by side) */}
                <div className="summary">
                  <div className="summaryTitle">Summary</div>

                  <div className="sumCard">
                    <div className="sumRow">
                      <span className="k">Name</span>
                      <span className="v">{name || '—'}</span>
                    </div>
                    <div className="sumRow">
                      <span className="k">Phone</span>
                      <span className="v">{phone || '—'}</span>
                    </div>
                    <div className="sumRow">
                      <span className="k">Email</span>
                      <span className="v">{email || '—'}</span>
                    </div>
                    <div className="sumRow">
                      <span className="k">College</span>
                      <span className="v">{college || '—'}</span>
                    </div>
                  </div>

                  <div className="sumCard">
                    <div className="sumRow">
                      <span className="k">Program</span>
                      <span className="v">{selectedCourse ? selectedLabel : '—'}</span>
                    </div>
                    <div className="sumRow">
                      <span className="k">Payment</span>
                      <span className="v">{payMethod === 'qr' ? 'QR (UPI)' : 'Pay at Office'}</span>
                    </div>
                    {payMethod === 'qr' ? (
                      <div className="sumRow">
                        <span className="k">Txn No.</span>
                        <span className="v">{txnNumber || '—'}</span>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="linkBtn"
                    onClick={() => {
                      resetFormState();
                    }}
                    disabled={submitting}
                  >
                    Reset form
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .popup {
          background: #0b0f19;
          color: #e9eefc;
          width: 100%;
          max-width: 920px; /* wider for side-by-side */
          border-radius: 18px;
          padding: 20px;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }

        .close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          cursor: pointer;
        }

        .badge {
          display: inline-block;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .marquee-container {
          overflow: hidden;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
          padding: 8px 0;
          margin-bottom: 12px;
        }

        .marquee-container .marquee-title {
          animation: scroll 15s linear alternate;
          margin: 0;
          padding: 0 16px;
          white-space: nowrap;
          display: inline-block;
        }

        @keyframes scroll {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }

        .subtitle {
          margin-bottom: 16px;
          color: rgba(233, 238, 252, 0.75);
        }

        .cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 640px) {
          .cards {
            grid-template-columns: 1fr 1fr;
          }
        }

        .card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 14px;
        }

        .card h4 {
          color: #e9eefc;
          margin: 0 0 6px;
        }

        .card p {
          font-size: 14px;
          color: rgba(233, 238, 252, 0.7);
        }

        .card ul {
          color: #e9eefc;
          padding-left: 18px;
          font-size: 14px;
        }

        /* Top row title + stepper */
        .topRow {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        .formTitle {
          margin: 0;
          font-size: 18px;
        }

        .stepper {
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.7;
        }

        .step.active {
          opacity: 1;
        }

        .dot {
          width: 26px;
          height: 26px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
        }

        .step.active .dot {
          background: rgba(99, 102, 241, 0.22);
          border-color: rgba(99, 102, 241, 0.55);
        }

        .lbl {
          font-size: 12px;
          color: rgba(233, 238, 252, 0.8);
        }

        .line {
          width: 26px;
          height: 2px;
          background: rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          opacity: 0.6;
        }

        .line.active {
          background: rgba(99, 102, 241, 0.75);
          opacity: 1;
        }

        /* Side-by-side layout */
        .grid2 {
          margin-top: 14px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 900px) {
          .grid2 {
            grid-template-columns: 1.2fr 0.8fr; /* left bigger */
            align-items: start;
          }
        }

        .form {
          display: grid;
          gap: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 14px;
        }

        .sectionTitle {
          font-size: 13px;
          font-weight: 700;
          color: rgba(233, 238, 252, 0.9);
          margin-bottom: 2px;
        }

        .form input,
        .form textarea {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          color: #e9eefc;
          outline: none;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .cta {
          background: #e9eefc;
          color: #0b0f19;
          border: none;
          padding: 12px 18px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .cta:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e9eefc;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
        }

        .secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Summary panel */
        .summary {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 14px;
          position: sticky;
          top: 14px;
        }

        @media (max-width: 899px) {
          .summary {
            position: relative;
            top: 0;
          }
        }

        .summaryTitle {
          font-size: 14px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .sumCard {
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 8px;
          margin-bottom: 10px;
        }

        .sumRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 13px;
        }

        .k {
          color: rgba(233, 238, 252, 0.65);
        }

        .v {
          color: rgba(233, 238, 252, 0.92);
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .linkBtn {
          background: transparent;
          border: none;
          color: rgba(233, 238, 252, 0.8);
          text-decoration: underline;
          cursor: pointer;
          padding: 6px 0;
          font-weight: 700;
        }

        /* Notice */
        .notice {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.22);
          padding: 12px 12px;
          border-radius: 14px;
        }

        .noticeIcon {
          font-size: 18px;
          line-height: 1;
          margin-top: 2px;
        }

        .noticeText {
          color: rgba(233, 238, 252, 0.9);
          font-size: 13px;
          line-height: 1.35;
        }

        /* Payment method options */
        .payMethods {
          display: grid;
          gap: 10px;
        }

        .payOption {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.22);
          cursor: pointer;
        }

        .payOption input {
          margin-top: 4px;
        }

        .payOption.active {
          border-color: rgba(99, 102, 241, 0.7);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
        }

        .payOptTitle {
          font-weight: 800;
          font-size: 13px;
        }

        .payOptSub {
          font-size: 12px;
          color: rgba(233, 238, 252, 0.7);
          margin-top: 2px;
        }

        /* Hidden QR reveal box */
        .qrHiddenBox {
          border: 1px dashed rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
        }

        .revealBtn {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #e9eefc;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
        }

        .qrHint {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(233, 238, 252, 0.65);
        }

        .qrReveal {
          margin-top: 12px;
          display: grid;
          place-items: center;
          gap: 8px;
        }

        .qrWrap {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .qrImg {
          width: 240px;
          height: 240px;
          border-radius: 12px;
          object-fit: cover;
        }

        .qrCaption {
          text-align: center;
          font-size: 12px;
          color: rgba(233, 238, 252, 0.65);
        }

        .txnWrap {
          display: grid;
          gap: 6px;
        }

        .txnLabel {
          font-size: 13px;
          color: rgba(233, 238, 252, 0.75);
          padding-left: 4px;
        }

        .txnInput {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          color: #e9eefc;
          outline: none;
        }

        .txnInput:focus {
          border-color: rgba(99, 102, 241, 0.65);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        .txnHint {
          font-size: 12px;
          color: rgba(233, 238, 252, 0.65);
          padding-left: 4px;
        }

        /* Pay at office info */
        .officeInfo {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
        }

        .officeBadge {
          display: inline-block;
          background: rgba(34, 197, 94, 0.14);
          border: 1px solid rgba(34, 197, 94, 0.22);
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .officeText {
          margin: 0;
          color: rgba(233, 238, 252, 0.75);
          font-size: 13px;
          line-height: 1.35;
        }

        /* ===== Custom Dropdown Styles ===== */
        .selectWrap {
          position: relative;
          display: grid;
          gap: 6px;
        }

        .selectLabel {
          font-size: 13px;
          color: rgba(233, 238, 252, 0.75);
          padding-left: 4px;
        }

        .selectButton {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          color: #e9eefc;
          outline: none;
          cursor: pointer;
          transition: border 0.15s ease, box-shadow 0.15s ease;
        }

        .selectButton.open {
          border-color: rgba(99, 102, 241, 0.65);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        .selectValue {
          text-align: left;
          font-size: 14px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .selectValue.placeholder {
          color: rgba(233, 238, 252, 0.6);
        }

        .chev {
          opacity: 0.9;
          font-size: 14px;
        }

        .selectPanel {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 99999;

          background: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 10px;

          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
        }

        .selectPanel.down {
          top: calc(100% + 10px);
        }

        .selectPanel.up {
          bottom: calc(100% + 10px);
        }

        .selectSearch {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e9eefc;
          outline: none;
        }

        .selectSearch:focus {
          border-color: rgba(99, 102, 241, 0.65);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        .selectList {
          margin-top: 10px;
          max-height: var(--listMax, 220px);
          overflow: auto;
          display: grid;
          gap: 8px;
          padding-right: 4px;
        }

        .selectItem {
          width: 100%;
          text-align: left;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e9eefc;
          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: transform 0.1s ease, border 0.15s ease;
        }

        .selectItem:hover {
          transform: translateY(-1px);
          border-color: rgba(99, 102, 241, 0.45);
        }

        .selectItem.active {
          border-color: rgba(99, 102, 241, 0.75);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .selectItemTitle {
          font-size: 14px;
        }

        .selectItemTag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.18);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: rgba(233, 238, 252, 0.95);
          white-space: nowrap;
        }

        .selectEmpty {
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(233, 238, 252, 0.7);
          text-align: center;
          font-size: 13px;
        }

        .selectHint {
          margin: 10px 4px 0;
          font-size: 12px;
          color: rgba(233, 238, 252, 0.65);
        }
      `}</style>
    </>
  );
}