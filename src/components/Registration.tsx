'use client';

import api from '@/lib/axios';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type PayMethod = 'qr' | 'office';

// Accept optional onClose prop so HomePage can control visibility
interface RegistrationProps {
  onClose?: () => void;
}

export default function Registration({ onClose }: RegistrationProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');

  const [payMethod, setPayMethod] = useState<PayMethod>('qr');
  const [txnNumber, setTxnNumber] = useState('');
  const [showQr, setShowQr] = useState(false);

  const [courseOpen, setCourseOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [panelPlacement, setPanelPlacement] = useState<'down' | 'up'>('down');
  const [panelMaxHeight, setPanelMaxHeight] = useState<number>(220);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const closePopup = () => {
    localStorage.setItem('reg_popup_dismissed', '1');
    localStorage.setItem('reg_popup_dismissed_at', String(Date.now()));
    onClose?.();
  };

  useEffect(() => {
    api.get('/courses')
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
    const gap = 10, margin = 12, desiredPanelHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const placeDown = spaceBelow >= Math.min(desiredPanelHeight, 180) || spaceBelow >= spaceAbove;
    const available = placeDown ? spaceBelow : spaceAbove;
    setPanelPlacement(placeDown ? 'down' : 'up');
    setPanelMaxHeight(Math.max(160, Math.min(available - 70, 360)));
  };

  useLayoutEffect(() => {
    if (!courseOpen) return;
    computeDropdownPlacement();
    window.addEventListener('resize', computeDropdownPlacement);
    window.addEventListener('scroll', computeDropdownPlacement, true);
    return () => {
      window.removeEventListener('resize', computeDropdownPlacement);
      window.removeEventListener('scroll', computeDropdownPlacement, true);
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
    setName(''); setPhone(''); setEmail(''); setCollege('');
    setSelectedCourse(''); setCourseSearch(''); setCourseOpen(false);
    setPayMethod('qr'); setTxnNumber(''); setShowQr(false);
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
    if (s === 3 && payMethod === 'qr') {
      const txn = txnNumber.trim();
      if (!txn) return 'Please enter Transaction Number (UTR / UPI Ref No.).';
      if (txn.length < 6) return 'Transaction Number looks too short. Please re-check.';
    }
    return '';
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) { alert(err); return; }
    setStep((prev) => (prev === 1 ? 2 : 3));
  };

  const prevStep = () => setStep((prev) => (prev === 3 ? 2 : 1));

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err1 = validateStep(1); if (err1) return alert(err1);
    const err2 = validateStep(2); if (err2) return alert(err2);
    const err3 = validateStep(3); if (err3) return alert(err3);
    try {
      setSubmitting(true);
      await api.post('/addenrollmentrequest', {
        course_id: selectedCourse,
        name: name.trim(), email: email.trim(),
        phone_number: phone.trim(), college: college.trim(),
        payment_method: payMethod,
        transaction_number: payMethod === 'qr' ? txnNumber.trim() : null,
      });
      alert('Registration successful! We will contact you soon.');
      setOpenForm(false);
      resetFormState();
      closePopup();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) closePopup(); }}>
        <div className="popup">
          <button className="close" onClick={closePopup} aria-label="Close">✕</button>

          <span className="badge">🎓 Registrations Open</span>

          <div className="marquee-container">
            <h3 className="marquee-title">🚀 Upcoming Batches Registration — Summer Training & Internship 2025</h3>
          </div>

          <p className="subtitle">
            Registration started for <b>Summer Training</b> & <b>Internship</b>
          </p>

          {!openForm ? (
            <>
              <div className="cards">
                <div className="card">
                  <h4>☀️ Summer Training</h4>
                  <p>Learn fundamentals & build projects with mentor support.</p>
                  <ul>
                    <li>Beginner friendly</li>
                    <li>Live guidance</li>
                    <li>Certificate</li>
                  </ul>
                </div>
                <div className="card">
                  <h4>💼 Internship</h4>
                  <p>Work on real tasks & improve your portfolio.</p>
                  <ul>
                    <li>Real projects</li>
                    <li>Mentorship</li>
                    <li>Internship letter</li>
                  </ul>
                </div>
              </div>
              <div className="actions">
                <button className="cta" onClick={() => setOpenForm(true)}>Register Now →</button>
                <button className="secondary" onClick={closePopup}>Maybe later</button>
              </div>
            </>
          ) : (
            <>
              <div className="topRow">
                <h4 className="formTitle">Complete Your Registration</h4>
                <div className="stepper">
                  {[1, 2, 3].map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <div className={`line ${step >= s ? 'active' : ''}`} />}
                      <div className={`step ${step >= s ? 'active' : ''}`}>
                        <div className="dot">{s}</div>
                        <div className="lbl">{['Details', 'Program', 'Payment'][i]}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="grid2">
                <form className="form" onSubmit={handleRegistrationSubmit}>
                  {step === 1 && (
                    <>
                      <div className="sectionTitle">Step 1 — Your Details</div>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" required />
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email Address" required />
                      <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College" required />
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="sectionTitle">Step 2 — Select Program</div>
                      <div className="selectWrap" ref={dropdownRef}>
                        <label className="selectLabel">Select Program</label>
                        <button
                          ref={buttonRef} type="button"
                          className={`selectButton ${courseOpen ? 'open' : ''}`}
                          onClick={() => setCourseOpen((v) => !v)}
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
                            style={{ '--listMax': `${panelMaxHeight}px` } as React.CSSProperties}
                          >
                            <input
                              className="selectSearch" placeholder="Search program..."
                              value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} autoFocus
                            />
                            <div className="selectList" role="listbox">
                              {filteredCourses.length === 0
                                ? <div className="selectEmpty">No programs found</div>
                                : filteredCourses.map((course) => {
                                    const active = String(course.id) === String(selectedCourse);
                                    return (
                                      <button
                                        key={course.id} type="button"
                                        className={`selectItem ${active ? 'active' : ''}`}
                                        onClick={() => { setSelectedCourse(String(course.id)); setCourseOpen(false); setCourseSearch(''); }}
                                      >
                                        <span className="selectItemTitle">{course.title}</span>
                                        {course.category?.name && <span className="selectItemTag">{course.category.name}</span>}
                                      </button>
                                    );
                                  })
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="sectionTitle">Step 3 — Payment</div>
                      <div className="notice">
                        <span className="noticeIcon">⚠️</span>
                        <div className="noticeText"><b>Note:</b> Registration fee is <b>non-refundable</b>.</div>
                      </div>
                      <div className="payMethods">
                        <label className={`payOption ${payMethod === 'qr' ? 'active' : ''}`}>
                          <input type="radio" name="pay_method" checked={payMethod === 'qr'} onChange={() => setPayMethod('qr')} />
                          <div className="payOptionBody">
                            <div className="payOptTitle">Pay via QR (UPI)</div>
                            <div className="payOptSub">Scan QR and enter transaction number.</div>
                          </div>
                        </label>
                        <label className={`payOption ${payMethod === 'office' ? 'active' : ''}`}>
                          <input type="radio" name="pay_method" checked={payMethod === 'office'} onChange={() => { setPayMethod('office'); setTxnNumber(''); setShowQr(false); }} />
                          <div className="payOptionBody">
                            <div className="payOptTitle">Pay at Office</div>
                            <div className="payOptSub">Pay in-person at our office counter.</div>
                          </div>
                        </label>
                      </div>

                      {payMethod === 'qr' ? (
                        <>
                          <div className="qrHiddenBox">
                            <button type="button" className="revealBtn" onClick={() => setShowQr((v) => !v)}>
                              {showQr ? 'Hide QR Code' : 'Show QR Code'}
                            </button>
                            {showQr ? (
                              <div className="qrReveal">
                                <div className="qrWrap">
                                  <img className="qrImg" src="/images/TechnobrenQR.jpeg" alt="Registration Fee QR Code" />
                                </div>
                              </div>
                            ) : (
                              <div className="qrHint">QR code is hidden for privacy. Click "Show QR Code" to view and scan.</div>
                            )}
                          </div>
                          <div className="txnWrap">
                            <label className="txnLabel">Transaction Number (UTR / UPI Ref No.)</label>
                            <input value={txnNumber} onChange={(e) => setTxnNumber(e.target.value)} placeholder="Eg: 123456789012" className="txnInput" required />
                            <div className="txnHint">We use this to verify your payment quickly.</div>
                          </div>
                        </>
                      ) : (
                        <div className="officeInfo">
                          <div className="officeBadge">✅ Pay at Office Selected</div>
                          <p className="officeText">Our team will contact you with the office address and timing after you submit.</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="actions">
                    {step > 1
                      ? <button type="button" className="secondary" onClick={prevStep} disabled={submitting}>← Back</button>
                      : <button type="button" className="secondary" onClick={() => { setOpenForm(false); resetFormState(); }} disabled={submitting}>Close</button>
                    }
                    {step < 3
                      ? <button type="button" className="cta" onClick={nextStep} disabled={submitting}>Next →</button>
                      : <button className="cta" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Registration'}</button>
                    }
                  </div>
                </form>

                <div className="summary">
                  <div className="summaryTitle">📋 Summary</div>
                  <div className="sumCard">
                    {[['Name', name], ['Phone', phone], ['Email', email], ['College', college]].map(([k, v]) => (
                      <div key={k} className="sumRow"><span className="k">{k}</span><span className="v">{v || '—'}</span></div>
                    ))}
                  </div>
                  <div className="sumCard">
                    <div className="sumRow"><span className="k">Program</span><span className="v">{selectedCourse ? selectedLabel : '—'}</span></div>
                    <div className="sumRow"><span className="k">Payment</span><span className="v">{payMethod === 'qr' ? 'QR (UPI)' : 'Pay at Office'}</span></div>
                    {payMethod === 'qr' && <div className="sumRow"><span className="k">Txn No.</span><span className="v">{txnNumber || '—'}</span></div>}
                  </div>
                  <button type="button" className="linkBtn" onClick={resetFormState} disabled={submitting}>Reset form</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.78);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 10px;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .popup {
          background: #0b0f19; color: #e9eefc;
          width: 100%; max-width: 920px;
          border-radius: 20px; padding: 24px;
          position: relative;
          box-shadow: 0 24px 70px rgba(0,0,0,0.55);
          border: 1px solid rgba(255,255,255,0.07);
          animation: slideUp 0.3s ease;
          max-height: 92vh; overflow-y: auto;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .close {
          position: absolute; top: 14px; right: 14px;
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
          color: #fff; width: 34px; height: 34px;
          border-radius: 10px; cursor: pointer; font-size: 14px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .close:hover { background: rgba(255,255,255,0.14); }

        .badge {
          display: inline-block;
          background: rgba(99,102,241,0.18); border: 1px solid rgba(99,102,241,0.4);
          padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 600;
          margin-bottom: 12px; color: #c7d2fe;
        }

        .marquee-container {
          overflow: hidden; background: rgba(99,102,241,0.1);
          border-radius: 8px; padding: 8px 0; margin-bottom: 12px;
        }
        .marquee-title {
          animation: scroll 18s linear infinite; margin: 0; padding: 0 16px;
          white-space: nowrap; display: inline-block; font-size: 14px; font-weight: 600;
        }
        @keyframes scroll { from { transform: translateX(100%); } to { transform: translateX(-100%); } }

        .subtitle { margin-bottom: 16px; color: rgba(233,238,252,0.7); font-size: 14px; }

        .cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 640px) { .cards { grid-template-columns: 1fr 1fr; } }

        .card {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 16px;
          transition: border-color 0.2s;
        }
        .card:hover { border-color: rgba(99,102,241,0.35); }
        .card h4 { color: #e9eefc; margin: 0 0 8px; font-size: 15px; }
        .card p { font-size: 13px; color: rgba(233,238,252,0.65); margin-bottom: 10px; }
        .card ul { color: rgba(233,238,252,0.8); padding-left: 16px; font-size: 13px; display: grid; gap: 4px; }

        .actions { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; justify-content: flex-end; }
        .cta {
          background: #e9eefc; color: #0b0f19; border: none;
          padding: 11px 22px; border-radius: 12px; font-weight: 700;
          cursor: pointer; font-size: 14px; transition: background 0.15s, transform 0.12s;
        }
        .cta:hover { background: #fff; transform: translateY(-1px); }
        .cta:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .secondary {
          background: transparent; border: 1px solid rgba(255,255,255,0.2);
          color: rgba(233,238,252,0.8); padding: 11px 20px; border-radius: 12px;
          cursor: pointer; font-size: 14px; transition: border-color 0.15s;
        }
        .secondary:hover { border-color: rgba(255,255,255,0.4); }
        .secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .topRow { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 8px; }
        .formTitle { margin: 0; font-size: 17px; font-weight: 800; }
        .stepper { display: flex; align-items: center; gap: 8px; }
        .step { display: flex; align-items: center; gap: 6px; opacity: 0.5; transition: opacity 0.2s; }
        .step.active { opacity: 1; }
        .dot { width: 26px; height: 26px; border-radius: 8px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; }
        .step.active .dot { background: rgba(99,102,241,0.22); border-color: rgba(99,102,241,0.55); color: #c7d2fe; }
        .lbl { font-size: 12px; color: rgba(233,238,252,0.75); }
        .line { width: 22px; height: 2px; background: rgba(255,255,255,0.12); border-radius: 999px; }
        .line.active { background: rgba(99,102,241,0.7); }

        .grid2 { margin-top: 14px; display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 860px) { .grid2 { grid-template-columns: 1.2fr 0.8fr; align-items: start; } }

        .form { display: grid; gap: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 16px; }
        .sectionTitle { font-size: 12px; font-weight: 700; color: rgba(233,238,252,0.8); text-transform: uppercase; letter-spacing: 0.06em; }
        .form input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14); border-radius: 11px; padding: 11px 13px; color: #e9eefc; outline: none; font-family: inherit; font-size: 14px; transition: border-color 0.15s; }
        .form input:focus { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
        .form input::placeholder { color: rgba(233,238,252,0.35); }

        .summary { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 16px; position: sticky; top: 14px; }
        .summaryTitle { font-size: 13px; font-weight: 800; margin-bottom: 12px; }
        .sumCard { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.09); border-radius: 12px; padding: 12px; display: grid; gap: 8px; margin-bottom: 10px; }
        .sumRow { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; }
        .k { color: rgba(233,238,252,0.55); }
        .v { color: rgba(233,238,252,0.9); text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .linkBtn { background: transparent; border: none; color: rgba(233,238,252,0.6); text-decoration: underline; cursor: pointer; padding: 4px 0; font-size: 12px; }

        .notice { display: flex; gap: 10px; align-items: flex-start; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); padding: 11px 12px; border-radius: 12px; }
        .noticeIcon { font-size: 16px; margin-top: 1px; }
        .noticeText { color: rgba(233,238,252,0.85); font-size: 13px; line-height: 1.4; }

        .payMethods { display: grid; gap: 8px; }
        .payOption { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); cursor: pointer; transition: border-color 0.15s; }
        .payOption input { margin-top: 3px; flex-shrink: 0; }
        .payOption.active { border-color: rgba(99,102,241,0.65); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .payOptTitle { font-weight: 700; font-size: 13px; }
        .payOptSub { font-size: 12px; color: rgba(233,238,252,0.6); margin-top: 2px; }

        .qrHiddenBox { border: 1px dashed rgba(255,255,255,0.16); border-radius: 13px; padding: 12px; background: rgba(255,255,255,0.02); }
        .revealBtn { width: 100%; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); color: #e9eefc; padding: 10px 12px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; }
        .qrHint { margin-top: 10px; font-size: 12px; color: rgba(233,238,252,0.5); }
        .qrReveal { margin-top: 12px; display: grid; place-items: center; }
        .qrWrap { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 12px; }
        .qrImg { width: 200px; height: 200px; border-radius: 10px; object-fit: cover; }

        .txnWrap { display: grid; gap: 6px; }
        .txnLabel { font-size: 12px; color: rgba(233,238,252,0.7); padding-left: 2px; }
        .txnInput { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14); border-radius: 11px; padding: 11px 13px; color: #e9eefc; outline: none; font-size: 14px; }
        .txnInput:focus { border-color: rgba(99,102,241,0.6); }
        .txnHint { font-size: 11px; color: rgba(233,238,252,0.5); padding-left: 2px; }

        .officeInfo { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); padding: 12px; }
        .officeBadge { display: inline-block; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.22); padding: 5px 10px; border-radius: 100px; font-size: 12px; font-weight: 700; margin-bottom: 8px; color: #86efac; }
        .officeText { color: rgba(233,238,252,0.7); font-size: 13px; line-height: 1.4; }

        .selectWrap { position: relative; display: grid; gap: 6px; }
        .selectLabel { font-size: 12px; color: rgba(233,238,252,0.7); }
        .selectButton { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.14); border-radius: 11px; padding: 11px 13px; color: #e9eefc; outline: none; cursor: pointer; transition: border 0.15s; font-size: 14px; }
        .selectButton.open { border-color: rgba(99,102,241,0.6); box-shadow: 0 0 0 3px rgba(99,102,241,0.14); }
        .selectValue { text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .selectValue.placeholder { color: rgba(233,238,252,0.4); }
        .chev { font-size: 13px; opacity: 0.8; }
        .selectPanel { position: absolute; left: 0; right: 0; z-index: 99999; background: #0d1220; border: 1px solid rgba(255,255,255,0.13); border-radius: 14px; padding: 10px; box-shadow: 0 22px 70px rgba(0,0,0,0.7); }
        .selectPanel.down { top: calc(100% + 8px); }
        .selectPanel.up { bottom: calc(100% + 8px); }
        .selectSearch { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 9px 12px; color: #e9eefc; outline: none; font-size: 13px; }
        .selectList { margin-top: 8px; max-height: var(--listMax, 220px); overflow: auto; display: grid; gap: 6px; }
        .selectItem { width: 100%; text-align: left; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 9px 12px; color: #e9eefc; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: border-color 0.15s; font-size: 13px; }
        .selectItem:hover { border-color: rgba(99,102,241,0.4); }
        .selectItem.active { border-color: rgba(99,102,241,0.7); }
        .selectItemTag { font-size: 11px; padding: 3px 7px; border-radius: 100px; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #c7d2fe; white-space: nowrap; }
        .selectEmpty { padding: 12px; text-align: center; font-size: 13px; color: rgba(233,238,252,0.5); }
      `}</style>
    </>
  );
}