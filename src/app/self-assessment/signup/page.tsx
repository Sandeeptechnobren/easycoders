'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Dropdown from '@/components/ui/Dropdown/Dropdown';
import './signup.css';

const STEPS = ['Verify Email', 'Confirm OTP', 'Your Profile'];

export default function AssessmentSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', otp: '', phone: '', password: '',
    password_confirmation: '', gender: '', date_of_birth: '',
    level: '', goal: '', college_id: undefined as number | undefined,
    course: '', year: undefined as number | undefined,
  });
  const [showPwd, setShowPwd]   = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [otpSent, setOtpSent]   = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => { getColleges(); }, []);

  const handleChange = (e: any) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const getColleges = async () => {
    try {
      const { data } = await api.get('/collegeList');
      const list = data.data || data || [];
      setColleges(list.map((c: any) => ({ label: c.college_name || c.name, value: Number(c.id) })));
    } catch { console.error('Colleges load failed'); }
  };

  const sendOtp = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Please enter your name and email.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/assessment/send-otp', { name: form.name, email: form.email });
      setOtpSent(true);
    } catch (err: any) { setError(err.response?.data?.message || 'Error sending OTP. Try again.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/assessment/verify-otp', { email: form.email, otp: form.otp });
      setOtpVerified(true);
    } catch { setError('Invalid verification code. Please check and try again.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.college_id) return setError('Please select a college.');
    if (form.password !== form.password_confirmation) return setError('Passwords do not match.');
    setLoading(true); setError('');
    try {
      await api.post('/assessment/register', form);
      localStorage.setItem('assessment_user', form.email);
      router.replace('/self-assessment/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const currentStep = otpVerified ? 2 : otpSent ? 1 : 0;
  const progress    = otpVerified ? 100 : otpSent ? 55 : 10;

  return (
    <div className="sa-wrapper">

      {/* ── LEFT PANEL ── */}
      <div className="sa-left">
        <div className="sa-left-logo">
          <div className="sa-left-logo-icon">
            <img src="/images/eclogo.png" alt="Easy Coders" />
          </div>
          <span className="sa-left-logo-name">Easy Coders</span>
        </div>

        <h1 className="sa-left-headline">
          Start Your <span>Assessment Journey</span> Today
        </h1>
        <p className="sa-left-sub">
          Create your free account and take a smart assessment to discover your exact coding level in minutes.
        </p>

        <div className="sa-left-features">
          {[
            { icon: '🧠', title: 'Smart Assessments',   desc: 'Questions that adapt to test real understanding.' },
            { icon: '⚡', title: 'Instant Feedback',    desc: 'Get your results and score immediately.' },
            { icon: '🗺️', title: 'Personalised Roadmap', desc: 'Know exactly what to learn next.' },
          ].map(f => (
            <div key={f.title} className="sa-left-feature">
              <div className="sa-left-feature-icon">{f.icon}</div>
              <div className="sa-left-feature-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sa-left-stat">
          <div className="sa-left-stat-number">5 min</div>
          <div className="sa-left-stat-label">Average time to complete • 100% free • No credit card</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="sa-right">

        {/* Progress bar */}
        <div className="sa-progress-bar-wrap">
          <div className="sa-progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="sa-form-card">

          {/* Eyebrow */}
          <div className="sa-form-eyebrow">
            <span className="sa-form-eyebrow-dot" />
            Create Account
          </div>

          {/* Step indicator */}
          <div className="sa-steps-indicator">
            {STEPS.map((label, i) => {
              const done   = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
                  <div className="sa-step-node">
                    <div className={`sa-step-circle ${done ? 'done' : active ? 'active' : ''}`}>
                      {done ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`sa-step-label ${done ? 'done' : active ? 'active' : ''}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`sa-step-line ${done ? 'done' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Title */}
          <h2 className="sa-form-title">
            {otpVerified ? 'Complete Your Profile' : otpSent ? 'Verify Your Email' : 'Join Easy Coders'}
          </h2>
          <p className="sa-form-subtitle">
            {otpVerified
              ? 'Almost done! Fill in a few details to create your account.'
              : otpSent
              ? `We sent a 6-digit code to ${form.email}`
              : 'Start with your name and email to get a verification code.'}
          </p>

          {/* Error */}
          {error && (
            <div className="sa-alert">
              <div className="sa-alert-icon">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v4M5 7.5v1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="sa-alert-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>

            {/* ── STEP 1: Name + Email ── */}
            {!otpSent && (
              <div className="sa-step-animate">
                <div className="sa-field">
                  <label>Full Name</label>
                  <div className="sa-input-wrap">
                    <span className="sa-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <input name="name" className="sa-input" placeholder="e.g. Riya Sharma"
                      value={form.name} onChange={handleChange} required />
                  </div>
                </div>

                <div className="sa-field">
                  <label>Email Address</label>
                  <div className="sa-input-wrap">
                    <span className="sa-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </span>
                    <input name="email" type="email" className="sa-input" placeholder="you@example.com"
                      value={form.email} onChange={handleChange} required />
                  </div>
                </div>

                <button type="button" className="sa-btn-primary" onClick={sendOtp}
                  disabled={loading || !form.email || !form.name} style={{ marginTop: 4 }}>
                  {loading
                    ? <><div className="sa-spinner" /><span>Sending…</span></>
                    : <><span>Send Verification Code</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6"/>
                        </svg></>}
                </button>

                <div className="sa-auth-footer">
                  Already registered?{' '}
                  <button type="button" onClick={() => router.push('/self-assessment/login')}>
                    Login here
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: OTP ── */}
            {otpSent && !otpVerified && (
              <div className="sa-step-animate">
                <div className="sa-field">
                  <label>Verification Code</label>
                  <div className="sa-otp-group">
                    <div className="sa-input-wrap" style={{ flex: 1 }}>
                      <span className="sa-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input name="otp" className="sa-input" placeholder="000000"
                        value={form.otp} onChange={handleChange} required maxLength={6} />
                    </div>
                    <button type="button" className="sa-btn-outline" onClick={verifyOtp} disabled={loading || !form.otp}>
                      {loading ? '…' : 'Verify'}
                    </button>
                  </div>
                </div>

                <div className="sa-auth-footer" style={{ marginTop: 12 }}>
                  Wrong email?{' '}
                  <button type="button" onClick={() => { setOtpSent(false); setError(''); }}>
                    Go back
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Profile ── */}
            {otpVerified && (
              <div className="sa-step-animate">
                <div className="sa-grid">
                  <div className="sa-field">
                    <label>Phone</label>
                    <div className="sa-input-wrap">
                      <span className="sa-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      </span>
                      <input name="phone" className="sa-input" placeholder="+91 00000 00000"
                        value={form.phone} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="sa-field">
                    <label>Gender</label>
                    <Dropdown
                      options={[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]}
                      placeholder="Select"
                      value={form.gender}
                      onChange={v => setForm(p => ({ ...p, gender: v as string }))}
                    />
                  </div>
                </div>

                <div className="sa-field">
                  <label>Your College</label>
                  <Dropdown
                    options={colleges}
                    placeholder="Search college…"
                    value={form.college_id}
                    onChange={v => setForm(p => ({ ...p, college_id: Number(v) }))}
                  />
                </div>

                <div className="sa-grid">
                  <div className="sa-field">
                    <label>Password</label>
                    <div className="sa-input-wrap">
                      <span className="sa-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input name="password" type={showPwd ? 'text' : 'password'} className="sa-input"
                        placeholder="••••••••" value={form.password} onChange={handleChange} required style={{ paddingRight: 40 }} />
                      <button type="button" className="sa-eye-btn" onClick={() => setShowPwd(v => !v)}>
                        {showPwd
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12c.9-2.37 2.44-4.45 4.41-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8-.73 1.96-1.94 3.7-3.46 5.08M1 1l22 22"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M1 12C2.73 7.61 7 4 12 4c5 0 9.27 3.61 11 8-1.73 4.39-6 8-11 8C7 20 2.73 16.39 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  </div>

                  <div className="sa-field">
                    <label>Confirm</label>
                    <div className="sa-input-wrap">
                      <span className="sa-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input name="password_confirmation" type={showCPwd ? 'text' : 'password'} className="sa-input"
                        placeholder="••••••••" value={form.password_confirmation} onChange={handleChange} required style={{ paddingRight: 40 }} />
                      <button type="button" className="sa-eye-btn" onClick={() => setShowCPwd(v => !v)}>
                        {showCPwd
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12c.9-2.37 2.44-4.45 4.41-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8-.73 1.96-1.94 3.7-3.46 5.08M1 1l22 22"/></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M1 12C2.73 7.61 7 4 12 4c5 0 9.27 3.61 11 8-1.73 4.39-6 8-11 8C7 20 2.73 16.39 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sa-grid">
                  <div className="sa-field">
                    <label>Course</label>
                    <Dropdown
                      options={[
                        { label: 'B.Tech (CSE)', value: 'b_tech' },
                        { label: 'BCA',          value: 'bca'    },
                        { label: 'MCA',          value: 'mca'    },
                        { label: 'Polytechnic',  value: 'polytechnic' },
                      ]}
                      placeholder="Select course"
                      value={form.course}
                      onChange={v => setForm(p => ({ ...p, course: v as string }))}
                    />
                  </div>
                  <div className="sa-field">
                    <label>Year</label>
                    <Dropdown
                      options={[
                        { label: '1st Year', value: 1 },
                        { label: '2nd Year', value: 2 },
                        { label: '3rd Year', value: 3 },
                        { label: '4th Year', value: 4 },
                      ]}
                      placeholder="Select year"
                      value={form.year}
                      onChange={v => setForm(p => ({ ...p, year: v as number }))}
                    />
                  </div>
                </div>

                <div className="sa-grid">
                  <div className="sa-field">
                    <label>Experience Level</label>
                    <Dropdown
                      options={[
                        { label: 'Beginner',     value: 'beginner'     },
                        { label: 'Intermediate', value: 'intermediate' },
                        { label: 'Advanced',     value: 'advanced'     },
                      ]}
                      placeholder="Your level"
                      value={form.level}
                      onChange={v => setForm(p => ({ ...p, level: v as string }))}
                    />
                  </div>
                  <div className="sa-field">
                    <label>Your Goal</label>
                    <Dropdown
                      options={[
                        { label: 'Job Preparation', value: 'job'           },
                        { label: 'Learn Basics',    value: 'fundamentals'  },
                        { label: 'Career Switch',   value: 'career-switch' },
                      ]}
                      placeholder="Your goal"
                      value={form.goal}
                      onChange={v => setForm(p => ({ ...p, goal: v as string }))}
                    />
                  </div>
                </div>

                <button type="submit" className="sa-btn-primary" disabled={loading} style={{ marginTop: 8 }}>
                  {loading
                    ? <><div className="sa-spinner" /><span>Creating account…</span></>
                    : <><span>Finish & Start Assessment</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6"/>
                        </svg></>}
                </button>
              </div>
            )}
          </form>

          {/* Trust bar */}
          <div className="sa-trust">
            {[
              { icon: '🔒', label: 'Secure & Private' },
              { icon: '✅', label: '100% Free'        },
              { icon: '⚡', label: 'Takes 5 minutes'  },
            ].map(t => (
              <div key={t.label} className="sa-trust-item">
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
