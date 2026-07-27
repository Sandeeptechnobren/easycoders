'use client';

import api from '@/lib/axios';
import Image from 'next/image';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type PayMethod = 'qr' | 'office';

interface RegistrationProps {
  onClose?: () => void;
}

interface CourseFeature {
  id: number | string;
  feature: string;
}

interface ApiCourse {
  id: number | string;
  title: string;
  description?: string | null;
  duration?: string | null;
  level?: string | null;
  offer?: string | null;
  discounted_price?: string | null;
  original_price?: string | null;
  category?: { name?: string; features?: CourseFeature[] };
}

/* ──────────────────────────────────────────────────────────────────────────
 * Registration popup.
 *
 * Job-Oriented rework (Jul 2026):
 *   - Initial view now showcases the LIVE "Internship" category courses as
 *     job-oriented training programs (the category ships a "Job Oriented
 *     Training" feature). Programs are pulled from the same /courses call the
 *     form dropdown already uses — no static list to keep in sync.
 *   - Each program card leads with the target JOB ROLE (outcome) + the
 *     duration/level (schedule). No stock photos: the API has no per-course
 *     images, so cards use a branded navy→blue gradient header with the tech
 *     tag + the real offer — consistent and robust to any course list.
 *   - Clicking a card opens the form PRE-SELECTED to that program.
 *   - Form/payment logic, API call, and dismissal localStorage logic are
 *     unchanged — only the initial view + styling were reworked.
 *
 * Earlier (May 2026): navy+gold re-skin replacing the old purple-gradient UI.
 * ────────────────────────────────────────────────────────────────────────── */

/* Which category counts as "job-oriented". Case-insensitive substring match so
 * it keeps working if the category is renamed slightly (e.g. "Internships"). */
const JOB_CATEGORY_MATCH = 'intern';

/* Title → target job role. "PHP Laravel Development" → "PHP Laravel Developer",
 * "UI/UX Design" → "UI/UX Designer"; otherwise fall back to the title itself. */
const roleFromTitle = (title: string): string => {
  const t = (title || '').trim();
  if (/development$/i.test(t)) return t.replace(/\s*development$/i, ' Developer');
  if (/design$/i.test(t))      return t.replace(/\s*design$/i, ' Designer');
  if (/engineering$/i.test(t)) return t.replace(/\s*engineering$/i, ' Engineer');
  return t;
};

/* Short tech label for the card header: drop the trailing "Development" etc. */
const techTag = (title: string): string =>
  (title || '').replace(/\s*(development|design|engineering|foundations?)$/i, '').trim() || (title || '').trim();

/* "beginner" → "Beginner". */
const titleCase = (s?: string | null): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

/* "a" / "an" by the following word's leading sound (good enough for our tracks:
 * "an Android Developer", "a Python Developer", "a MERN Developer"). */
const articleFor = (word: string): string =>
  /^[aeiou]/i.test((word || '').trim()) ? 'an' : 'a';

export default function Registration({ onClose }: RegistrationProps) {
  const [courses, setCourses]               = useState<ApiCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openForm, setOpenForm]             = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [email, setEmail]       = useState('');
  const [college, setCollege]   = useState('');

  const [payMethod, setPayMethod]   = useState<PayMethod>('qr');
  const [txnNumber, setTxnNumber]   = useState('');
  const [showQr, setShowQr]         = useState(false);

  const [courseOpen, setCourseOpen]         = useState(false);
  const [courseSearch, setCourseSearch]     = useState('');
  const [panelPlacement, setPanelPlacement] = useState<'down' | 'up'>('down');
  const [panelMaxHeight, setPanelMaxHeight] = useState<number>(220);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef   = useRef<HTMLButtonElement | null>(null);
  const panelRef    = useRef<HTMLDivElement | null>(null);

  const closePopup = () => {
    localStorage.setItem('reg_popup_dismissed', '1');
    localStorage.setItem('reg_popup_dismissed_at', String(Date.now()));
    onClose?.();
  };

  /* ─── Load programs for the dropdown ─── */
  useEffect(() => {
    api.get('/courses')
      .then(res => setCourses(res.data?.data ?? res.data ?? []))
      .catch(err => console.error('Programs load failed', err));
  }, []);

  /* ─── Close program dropdown on outside-click ─── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setCourseOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCourses = courses.filter(c => {
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
    const placeDown  = spaceBelow >= Math.min(desiredPanelHeight, 180) || spaceBelow >= spaceAbove;
    const available  = placeDown ? spaceBelow : spaceAbove;
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
        const c = courses.find(x => String(x.id) === String(selectedCourse));
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
      if (!name.trim())    return 'Please enter your full name.';
      if (!phone.trim())   return 'Please enter your phone number.';
      if (!email.trim())   return 'Please enter your email address.';
      if (!college.trim()) return 'Please enter your college.';
    }
    if (s === 2) {
      if (!selectedCourse) return 'Please select a program.';
    }
    if (s === 3 && payMethod === 'qr') {
      const txn = txnNumber.trim();
      if (!txn)            return 'Please enter the transaction number (UTR / UPI ref no.).';
      if (txn.length < 6)  return 'Transaction number looks too short. Please re-check.';
    }
    return '';
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) { alert(err); return; }
    setStep(prev => (prev === 1 ? 2 : 3));
  };

  const prevStep = () => setStep(prev => (prev === 3 ? 2 : 1));

  /* Open the form, optionally pre-selecting the program the user clicked. */
  const startWithProgram = (id?: string | number) => {
    if (id !== undefined && id !== null) setSelectedCourse(String(id));
    setOpenForm(true);
  };

  /* Job-oriented programs = the Internship-category courses. Fall back to all
   * courses if the category can't be matched, so the popup is never empty. */
  const jobPrograms = courses.filter(c =>
    String(c.category?.name ?? '').toLowerCase().includes(JOB_CATEGORY_MATCH),
  );
  const displayPrograms = jobPrograms.length ? jobPrograms : courses;
  const coursesLoading = courses.length === 0;
  /* Real category features to reassure (shared across the internship courses). */
  const programFeatures =
    (displayPrograms.find(c => c.category?.features?.length)?.category?.features ?? [])
      .map(f => f.feature)
      .slice(0, 4);

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err1 = validateStep(1); if (err1) return alert(err1);
    const err2 = validateStep(2); if (err2) return alert(err2);
    const err3 = validateStep(3); if (err3) return alert(err3);
    try {
      setSubmitting(true);
      await api.post('/addenrollmentrequest', {
        course_id:          selectedCourse,
        name:               name.trim(),
        email:              email.trim(),
        phone_number:       phone.trim(),
        college:            college.trim(),
        payment_method:     payMethod,
        transaction_number: payMethod === 'qr' ? txnNumber.trim() : null,
      });
      setSubmitted(true);
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
        <div className="popup" role="dialog" aria-modal="true" aria-labelledby="reg-title">

          {/* Close X */}
          <button className="close" onClick={closePopup} aria-label="Close registration popup">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '36px 16px 28px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(232,160,32,0.16)', border: '1px solid rgba(232,160,32,0.4)', color: '#B97A0F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#0B1B3A', margin: '0 0 8px' }}>Application received!</h2>
              <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 22px' }}>
                Thanks{name ? `, ${name.trim().split(' ')[0]}` : ''} — your application is in. Our team will confirm your spot and reach out within 24 hours.
              </p>
              <button type="button" className="cta" onClick={() => { setSubmitted(false); setOpenForm(false); resetFormState(); closePopup(); }}>Done</button>
            </div>
          ) : !openForm ? (
            <>
              {/* ── INITIAL VIEW: job-oriented training programs ── */}
              <div className="batchesHead">
                <div>
                  <span className="batchesEyebrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
                      <path d="M8 7V5h8v2" />
                    </svg>
                    Job-Oriented Training · Now enrolling
                  </span>
                  <h2 id="reg-title" className="batchesTitle">
                    Train for the <em>job you want</em>
                  </h2>
                </div>
                <p className="batchesNote">Hands-on internship programs built to make you job-ready — we&apos;ll confirm your spot after the registration form.</p>
              </div>

              {/* Real category features — reassurance strip */}
              {programFeatures.length > 0 && (
                <div className="featRow">
                  {programFeatures.map(f => (
                    <span key={f} className="featChip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div className="progGrid">
                {coursesLoading
                  ? [0, 1, 2, 3].map(i => <div key={i} className="progSkel" aria-hidden="true" />)
                  : displayPrograms.map(p => {
                      const role  = roleFromTitle(p.title);
                      const level = titleCase(p.level);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className="prog"
                          onClick={() => startWithProgram(p.id)}
                          aria-label={`Register for ${p.title}`}
                        >
                          <div className="progHead">
                            {p.offer && <span className="progOffer">{p.offer}</span>}
                            <span className="progTag">{techTag(p.title)}</span>
                            <span className="progKicker">Job-Oriented</span>
                          </div>
                          <div className="progBody">
                            <h3 className="progTitle">{p.title}</h3>
                            {role && (
                              <span className="progRole">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                                Become {articleFor(role)} {role}
                              </span>
                            )}
                            <span className="progMeta">
                              {[p.duration, level ? `${level}-friendly` : null].filter(Boolean).join(' · ')}
                            </span>
                            <span className="progGo">Register <span aria-hidden="true">→</span></span>
                          </div>
                        </button>
                      );
                    })}
              </div>

              {/* Two strong CTAs */}
              <div className="actions">
                <button type="button" className="cta" onClick={() => startWithProgram()}>
                  Register now
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button type="button" className="secondary" onClick={closePopup}>Maybe later</button>
              </div>

              <p className="trustNote">
                Trusted by students across India · From the team behind Easy Coders
              </p>
            </>
          ) : (
            <>
              {/* ── FORM VIEW: 3-step wizard ── */}
              <div className="topRow">
                <div>
                  <span className="eyebrow">
                    <span className="eyebrow-dot" /> Step {step} of 3
                  </span>
                  <h2 className="formTitle">
                    {step === 1 && 'Your details'}
                    {step === 2 && 'Pick your program'}
                    {step === 3 && 'Confirm payment'}
                  </h2>
                </div>
                <div className="stepper" aria-label="Registration progress">
                  {[1, 2, 3].map((s, i) => (
                    <React.Fragment key={s}>
                      {i > 0 && <div className={`line ${step >= s ? 'active' : ''}`} />}
                      <div className={`step ${step >= s ? 'active' : ''}`}>
                        <div className="dot">{step > s ? '✓' : s}</div>
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
                      <div className="field">
                        <label>Full name</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required autoComplete="name" />
                      </div>
                      <div className="field">
                        <label>Phone number</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 00000 00000" required type="tel" autoComplete="tel" />
                      </div>
                      <div className="field">
                        <label>Email address</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com" required autoComplete="email" />
                      </div>
                      <div className="field">
                        <label>College</label>
                        <input value={college} onChange={e => setCollege(e.target.value)} placeholder="Your college / institute" required />
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="selectWrap" ref={dropdownRef}>
                      <label className="selectLabel">Choose your program</label>
                      <button
                        ref={buttonRef}
                        type="button"
                        className={`selectButton ${courseOpen ? 'open' : ''}`}
                        onClick={() => setCourseOpen(v => !v)}
                      >
                        <span className={`selectValue ${selectedCourse ? '' : 'placeholder'}`}>
                          {selectedCourse ? selectedLabel : 'Select a program'}
                        </span>
                        <svg className="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {courseOpen && (
                        <div
                          ref={panelRef}
                          className={`selectPanel ${panelPlacement === 'up' ? 'up' : 'down'}`}
                          style={{ '--listMax': `${panelMaxHeight}px` } as React.CSSProperties}
                        >
                          <input
                            className="selectSearch"
                            placeholder="Search program..."
                            value={courseSearch}
                            onChange={e => setCourseSearch(e.target.value)}
                            autoFocus
                          />
                          <div className="selectList" role="listbox">
                            {filteredCourses.length === 0
                              ? <div className="selectEmpty">No programs found</div>
                              : filteredCourses.map(course => {
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
                  )}

                  {step === 3 && (
                    <>
                      <div className="notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <div className="noticeText"><strong>Note:</strong> registration fee is <strong>non-refundable</strong>.</div>
                      </div>

                      <div className="payMethods" role="radiogroup" aria-label="Payment method">
                        <label className={`payOption ${payMethod === 'qr' ? 'active' : ''}`}>
                          <input type="radio" name="pay_method" checked={payMethod === 'qr'} onChange={() => setPayMethod('qr')} />
                          <div>
                            <div className="payOptTitle">Pay via QR (UPI)</div>
                            <div className="payOptSub">Scan QR and enter the transaction number.</div>
                          </div>
                        </label>
                        <label className={`payOption ${payMethod === 'office' ? 'active' : ''}`}>
                          <input type="radio" name="pay_method" checked={payMethod === 'office'} onChange={() => { setPayMethod('office'); setTxnNumber(''); setShowQr(false); }} />
                          <div>
                            <div className="payOptTitle">Pay at the office</div>
                            <div className="payOptSub">Pay in-person at our office counter.</div>
                          </div>
                        </label>
                      </div>

                      {payMethod === 'qr' ? (
                        <>
                          <div className="qrBox">
                            <button type="button" className="revealBtn" onClick={() => setShowQr(v => !v)}>
                              {showQr ? '▲ Hide QR code' : '▼ Show QR code'}
                            </button>
                            {showQr ? (
                              <div className="qrFrame">
                                <Image src="/images/TechnobrenQR.jpeg" alt="EasyCoders UPI QR Code" width={200} height={200} />
                              </div>
                            ) : (
                              <p className="qrHint">QR is hidden for privacy. Click above to reveal and scan.</p>
                            )}
                          </div>
                          <div className="field">
                            <label>Transaction number (UTR / UPI ref no.)</label>
                            <input value={txnNumber} onChange={e => setTxnNumber(e.target.value)} placeholder="e.g. 123456789012" required />
                            <span className="hint">We use this to verify your payment quickly.</span>
                          </div>
                        </>
                      ) : (
                        <div className="officeInfo">
                          <span className="officeBadge">Pay at office selected</span>
                          <p className="officeText">Our team will contact you with the office address and timings after you submit.</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="formActions">
                    {step > 1
                      ? <button type="button" className="secondary" onClick={prevStep} disabled={submitting}>← Back</button>
                      : <button type="button" className="secondary" onClick={() => { setOpenForm(false); resetFormState(); }} disabled={submitting}>Close</button>
                    }
                    {step < 3
                      ? <button type="button" className="cta" onClick={nextStep} disabled={submitting}>
                          Next
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                      : <button className="cta" type="submit" disabled={submitting}>
                          {submitting ? 'Submitting…' : 'Submit registration'}
                        </button>
                    }
                  </div>
                </form>

                {/* Live summary panel */}
                <aside className="summary" aria-label="Registration summary">
                  <div className="summaryTitle">Summary</div>
                  <div className="sumCard">
                    {[['Name', name], ['Phone', phone], ['Email', email], ['College', college]].map(([k, v]) => (
                      <div key={k} className="sumRow">
                        <span className="k">{k}</span>
                        <span className="v">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="sumCard">
                    <div className="sumRow"><span className="k">Program</span><span className="v">{selectedCourse ? selectedLabel : '—'}</span></div>
                    <div className="sumRow"><span className="k">Payment</span><span className="v">{payMethod === 'qr' ? 'QR (UPI)' : 'Pay at Office'}</span></div>
                    {payMethod === 'qr' && <div className="sumRow"><span className="k">Txn no.</span><span className="v">{txnNumber || '—'}</span></div>}
                  </div>
                  <button type="button" className="linkBtn" onClick={resetFormState} disabled={submitting}>Reset form</button>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        /* ─── Brand tokens (mirrors home page / footer) ─── */
        .overlay {
          position: fixed; inset: 0;
          background: rgba(11, 27, 58, 0.78);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 12px;
          animation: regFade 0.22s ease;
        }
        @keyframes regFade { from { opacity: 0; } to { opacity: 1; } }

        .popup {
          background: #ffffff;
          color: #0B1B3A;
          width: 100%;
          max-width: 960px;
          border-radius: 22px;
          padding: 32px 32px 28px;
          position: relative;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(11, 27, 58, 0.06);
          animation: regRise 0.28s ease;
          max-height: 92vh;
          overflow-y: auto;
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }
        @keyframes regRise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .overlay, .popup { animation: none; }
        }

        /* Close X */
        .close {
          position: absolute; top: 14px; right: 14px;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: #F4F6FB;
          border: 1px solid #E5E9F2;
          color: #4A5568;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }
        .close:hover { background: #0B1B3A; color: #ffffff; border-color: #0B1B3A; }

        /* The form view still uses .eyebrow + .eyebrow-dot so keep them. */
        .eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: #FEF6E7;
          color: #92660D;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          margin-bottom: 4px;
        }
        .eyebrow-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #E8A020;
        }

        /* Batches section header (now top of initial view) */
        .batchesHead {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin: 0 40px 18px 0;
          flex-wrap: wrap;
        }
        .batchesEyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%);
          color: #F5C356;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 10px;
        }
        .batchesTitle {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
          color: #0B1B3A;
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .batchesTitle em { color: #E8A020; font-style: italic; }
        .batchesNote {
          font-size: 13px;
          color: #4A5568;
          margin: 0;
          font-weight: 300;
          max-width: 280px;
          text-align: right;
        }
        @media (max-width: 720px) {
          .batchesNote { text-align: left; max-width: none; }
        }
        /* Real-feature reassurance chips (pulled from the category features) */
        .featRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 2px 0 18px;
        }
        .featChip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 500;
          color: #334155;
          background: #F4F6FB;
          border: 1px solid #E5E9F2;
          padding: 5px 11px;
          border-radius: 100px;
        }
        .featChip svg { color: #B97A0F; flex-shrink: 0; }

        /* Program cards — auto-fit so 3 / 4 / 5 programs all lay out cleanly */
        .progGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        @media (max-width: 720px) {
          .progGrid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 460px) {
          .progGrid { grid-template-columns: 1fr; }
        }

        .prog {
          text-align: left;
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .prog:hover {
          transform: translateY(-3px);
          border-color: #E8A020;
          box-shadow: 0 14px 32px rgba(11, 27, 58, 0.12);
        }
        .prog:focus-visible { outline: 2px solid #0B1B3A; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .prog { transition: none; }
          .prog:hover { transform: none; }
        }

        /* Branded gradient header (the API ships no per-course images) */
        .progHead {
          position: relative;
          min-height: 96px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 4px;
          background:
            radial-gradient(120% 120% at 12% 8%, rgba(232, 160, 32, 0.22), transparent 55%),
            linear-gradient(135deg, #0B1B3A 0%, #16305F 58%, #0B1B3A 100%);
          overflow: hidden;
        }
        .progHead::after {
          content: '</>';
          position: absolute;
          right: 8px; bottom: 0;
          font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -3px;
          color: rgba(245, 195, 86, 0.10);
          pointer-events: none;
        }
        .progTag {
          position: relative;
          z-index: 1;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 19px;
          font-weight: 700;
          line-height: 1.15;
          color: #ffffff;
          letter-spacing: -0.01em;
        }
        .progKicker {
          position: relative;
          z-index: 1;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #F5C356;
        }
        .progOffer {
          position: absolute;
          top: 9px; right: 9px;
          z-index: 2;
          max-width: calc(100% - 18px);
          background: #E8A020;
          color: #0B1B3A;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 4px 9px;
          border-radius: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .progBody {
          padding: 12px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .progTitle {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 15px;
          font-weight: 600;
          color: #0B1B3A;
          margin: 0;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        .progRole {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #B97A0F;
          line-height: 1.3;
        }
        .progRole svg { flex-shrink: 0; }
        .progMeta {
          font-size: 12px;
          color: #4A5568;
          font-weight: 400;
        }
        .progGo {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 700;
          color: #0B1B3A;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .prog:hover .progGo,
        .prog:focus-visible .progGo { opacity: 1; transform: translateX(0); }
        @media (hover: none) {
          .progGo { opacity: 1; transform: none; }
        }

        /* Loading skeletons */
        .progSkel {
          height: 208px;
          border-radius: 16px;
          border: 1px solid #E5E9F2;
          background: linear-gradient(100deg, #F4F6FB 30%, #EDF1F8 50%, #F4F6FB 70%);
          background-size: 200% 100%;
          animation: progShimmer 1.2s ease-in-out infinite;
        }
        @keyframes progShimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .progSkel { animation: none; }
        }

        /* Initial-view CTAs */
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 14px;
        }
        .formActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #E8A020;
          color: #0B1B3A;
          border: 1.5px solid #E8A020;
          padding: 12px 22px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.18s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          letter-spacing: 0.01em;
        }
        .cta:hover:not(:disabled) {
          background: #F5C356;
          border-color: #F5C356;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(11, 27, 58, 0.18);
        }
        .cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .cta:focus-visible { outline: 2px solid #0B1B3A; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .cta:hover { transform: none; } }

        .secondary {
          background: transparent;
          color: #4A5568;
          border: 1.5px solid #E5E9F2;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          transition: border-color 0.18s ease, color 0.18s ease;
        }
        .secondary:hover:not(:disabled) {
          border-color: #0B1B3A;
          color: #0B1B3A;
        }
        .secondary:disabled { opacity: 0.55; cursor: not-allowed; }

        .trustNote {
          font-size: 12px;
          color: #94A3B8;
          margin: 4px 0 0;
          text-align: center;
        }

        /* ─── Form view ─── */
        .topRow {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          margin: 4px 0 16px;
          padding-right: 40px;
        }
        .formTitle {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #0B1B3A;
          margin: 4px 0 0;
          letter-spacing: -0.01em;
        }
        .stepper { display: flex; align-items: center; gap: 8px; }
        .step { display: flex; align-items: center; gap: 6px; opacity: 0.5; transition: opacity 0.2s ease; }
        .step.active { opacity: 1; }
        .dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #F4F6FB;
          border: 1.5px solid #E5E9F2;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700;
          color: #4A5568;
        }
        .step.active .dot {
          background: #FEF6E7;
          border-color: #E8A020;
          color: #B97A0F;
        }
        .lbl {
          font-size: 12px;
          color: #4A5568;
          font-weight: 500;
        }
        .step.active .lbl { color: #0B1B3A; font-weight: 700; }
        .line {
          width: 24px; height: 2px;
          background: #E5E9F2;
          border-radius: 100px;
        }
        .line.active { background: #E8A020; }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 860px) {
          .grid2 { grid-template-columns: 1.2fr 0.8fr; align-items: start; }
        }

        .form {
          background: #F8FAFD;
          border: 1px solid #E5E9F2;
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
        .form input,
        .selectButton,
        .selectSearch {
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 11px;
          padding: 11px 14px;
          color: #0B1B3A;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .form input::placeholder,
        .selectSearch::placeholder {
          color: #94A3B8;
        }
        .form input:focus,
        .selectButton.open,
        .selectSearch:focus {
          border-color: #E8A020;
          box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.18);
        }
        .hint {
          font-size: 12px;
          color: #4A5568;
          font-weight: 300;
        }

        /* Summary aside */
        .summary {
          background: #F8FAFD;
          border: 1px solid #E5E9F2;
          border-radius: 18px;
          padding: 18px;
          position: sticky;
          top: 14px;
        }
        @media (max-width: 859px) { .summary { position: static; } }
        .summaryTitle {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 14px;
          font-weight: 700;
          color: #0B1B3A;
          margin-bottom: 12px;
        }
        .sumCard {
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 10px;
        }
        .sumRow {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-size: 12px;
        }
        .k { color: #94A3B8; font-weight: 500; }
        .v {
          color: #0B1B3A;
          text-align: right;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 600;
        }
        .linkBtn {
          background: transparent;
          border: none;
          color: #4A5568;
          text-decoration: underline;
          cursor: pointer;
          padding: 4px 0;
          font-size: 12px;
          font-family: inherit;
        }

        /* Step 3 — notice + payment */
        .notice {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          padding: 11px 14px;
          border-radius: 12px;
          color: #991B1B;
        }
        .notice svg { flex-shrink: 0; margin-top: 1px; }
        .noticeText { font-size: 13px; line-height: 1.5; }

        .payMethods { display: flex; flex-direction: column; gap: 8px; }
        .payOption {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #E5E9F2;
          background: #ffffff;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }
        .payOption input { margin-top: 3px; flex-shrink: 0; accent-color: #0B1B3A; }
        .payOption.active {
          border-color: #E8A020;
          background: #FEF6E7;
          box-shadow: 0 0 0 3px rgba(232, 160, 32, 0.14);
        }
        .payOptTitle { font-weight: 700; font-size: 13px; color: #0B1B3A; }
        .payOptSub { font-size: 12px; color: #4A5568; margin-top: 3px; font-weight: 300; }

        .qrBox {
          border: 1px dashed #E5E9F2;
          border-radius: 14px;
          padding: 12px;
          background: #ffffff;
        }
        .revealBtn {
          width: 100%;
          border: 1px solid #E5E9F2;
          background: #F8FAFD;
          color: #0B1B3A;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          font-family: inherit;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .revealBtn:hover { background: #FEF6E7; border-color: #E8A020; }
        .qrHint { margin: 10px 0 0; font-size: 12px; color: #4A5568; }
        .qrFrame {
          margin-top: 12px;
          background: #F8FAFD;
          border: 1px solid #E5E9F2;
          border-radius: 14px;
          padding: 12px;
          display: flex;
          justify-content: center;
        }
        .qrFrame :global(img) { border-radius: 10px; }

        .officeInfo {
          border-radius: 12px;
          border: 1px solid #E5E9F2;
          background: #ECFDF5;
          padding: 12px 14px;
        }
        .officeBadge {
          display: inline-block;
          background: #DCFCE7;
          border: 1px solid rgba(22, 163, 74, 0.25);
          color: #166534;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .officeText { font-size: 13px; color: #166534; line-height: 1.5; margin: 0; font-weight: 300; }

        /* ─── Custom program dropdown ─── */
        .selectWrap { position: relative; display: flex; flex-direction: column; gap: 6px; }
        .selectLabel { font-size: 13px; font-weight: 600; color: #334155; }
        .selectButton {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
        }
        .selectValue { text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .selectValue.placeholder { color: #94A3B8; }
        .chev { color: #4A5568; flex-shrink: 0; }
        .selectPanel {
          position: absolute; left: 0; right: 0;
          z-index: 9999;
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 14px;
          padding: 10px;
          box-shadow: 0 22px 60px rgba(11, 27, 58, 0.18);
        }
        .selectPanel.down { top: calc(100% + 8px); }
        .selectPanel.up   { bottom: calc(100% + 8px); }
        .selectList {
          margin-top: 8px;
          max-height: var(--listMax, 220px);
          overflow: auto;
          display: flex; flex-direction: column; gap: 6px;
        }
        .selectItem {
          width: 100%;
          text-align: left;
          background: #F8FAFD;
          border: 1px solid #E5E9F2;
          border-radius: 10px;
          padding: 9px 12px;
          color: #0B1B3A;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          font-size: 13px;
          font-family: inherit;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .selectItem:hover { border-color: #E8A020; background: #FEF6E7; }
        .selectItem.active { border-color: #E8A020; background: #FEF6E7; }
        .selectItemTag {
          font-size: 11px;
          padding: 3px 9px;
          border-radius: 100px;
          background: rgba(232, 160, 32, 0.16);
          border: 1px solid rgba(232, 160, 32, 0.34);
          color: #92660D;
          white-space: nowrap;
        }
        .selectEmpty {
          padding: 12px;
          text-align: center;
          font-size: 13px;
          color: #94A3B8;
        }

        /* Mobile tweaks */
        @media (max-width: 540px) {
          .popup { padding: 24px 22px 22px; border-radius: 18px; }
          .batchesHead { margin-right: 0; }
          .batchesTitle { font-size: 20px; }
          .actions, .formActions { flex-direction: column; align-items: stretch; }
          .cta, .secondary { width: 100%; justify-content: center; }
          .close { top: 10px; right: 10px; }
          .topRow { padding-right: 0; }
          .stepper { width: 100%; justify-content: space-between; }
          .lbl { display: none; }
        }
      `}</style>
    </>
  );
}
