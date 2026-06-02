'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import '../signup/signup.css';

export default function AssessmentLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Forgot-password flow ──
  const BASE = 'https://api.easycoders.in/projects/backend/public/api';
  const [mode, setMode] = useState<'login' | 'fp-email' | 'fp-otp' | 'fp-reset' | 'fp-done'>('login');
  const [info, setInfo] = useState('');
  const [fpEmail, setFpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const HEAD: Record<string, { title: string; sub: string }> = {
    'login':    { title: 'Welcome back 👋',    sub: 'Login to continue your self-assessment' },
    'fp-email': { title: 'Forgot password?',   sub: "Enter your account email and we'll send a verification code." },
    'fp-otp':   { title: 'Check your email',   sub: 'Enter the 6-digit code we just sent you.' },
    'fp-reset': { title: 'Set a new password', sub: 'Choose a password you haven’t used before.' },
    'fp-done':  { title: 'Password reset ✅',  sub: 'Your password has been updated.' },
  };

  const msgOf = (err: any) => err?.response?.data?.message;
  const goForgot = () => { setError(''); setInfo(''); setOtp(''); setNewPassword(''); setConfirmPassword(''); setFpEmail(email); setMode('fp-email'); };
  const backToLogin = () => { setError(''); setInfo(''); setMode('login'); };

  const submitForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setLoading(true);
    try {
      const res = await api.post(`${BASE}/assessment/forgot-password`, { email: fpEmail });
      setInfo(res.data?.message || 'A verification code has been sent to your email.');
      setOtp(''); setMode('fp-otp'); setResendIn(30);
    } catch (err: any) { setError(msgOf(err) || 'Could not send the code. Please try again.'); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (resendIn > 0) return;
    setError(''); setInfo('');
    try { const res = await api.post(`${BASE}/assessment/forgot-password`, { email: fpEmail }); setInfo(res.data?.message || 'A new code has been sent.'); setResendIn(30); }
    catch (err: any) { setError(msgOf(err) || 'Could not resend the code.'); }
  };

  const submitVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setLoading(true);
    try { await api.post(`${BASE}/assessment/verify-reset-otp`, { email: fpEmail, otp }); setMode('fp-reset'); }
    catch (err: any) { setError(msgOf(err) || 'Invalid or expired code.'); }
    finally { setLoading(false); }
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('The two passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setInfo(''); setLoading(true);
    try {
      await api.post(`${BASE}/assessment/reset-password`, { email: fpEmail, otp, new_password: newPassword, new_password_confirmation: confirmPassword });
      setMode('fp-done');
    } catch (err: any) { setError(msgOf(err) || 'Could not reset the password.'); }
    finally { setLoading(false); }
  };

  /* If the visitor already has a valid EasyAssess session, skip the
   * login form entirely and drop them into the dashboard. Avoids the
   * confusing "I'm already logged in, why am I being asked to sign in
   * again?" experience now that the floating bubble routes here. */
  useEffect(() => {
    try {
      const token = localStorage.getItem('assessment_token');
      const user  = localStorage.getItem('assessment_user');
      if (token && user) router.replace('/self-assessment/app');
    } catch { /* localStorage unavailable — fall through to the form */ }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required'); return; }
    localStorage.clear();
    setLoading(true);
    try {
      const res = await api.post(
        'https://api.easycoders.in/projects/backend/public/api/assessment/login',
        { email, password }
      );
      const assessment_token = res.data?.token || res.data?.data?.token;
      const userData = res.data?.user;
      if (!assessment_token) throw new Error('Invalid login response');
      localStorage.setItem('assessment_token', assessment_token);
      localStorage.setItem('assessment_user', email);
      localStorage.setItem('logged_in_user', userData?.name || email.split('@')[0]);
      router.replace('/self-assessment/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          Track Your <span>Coding Growth</span> With Smart Assessments
        </h1>
        <p className="sa-left-sub">
          Sign in to resume your personalised assessment journey and see how far you've come.
        </p>

        <div className="sa-left-features">
          {[
            { icon: '📋', title: 'Resume Assessments', desc: 'Pick up exactly where you left off.' },
            { icon: '📈', title: 'Track Progress',     desc: 'Watch your skills improve over time.' },
            { icon: '🏆', title: 'Earn Certificates',  desc: 'Download proof of your achievements.' },
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
          <div className="sa-left-stat-number">500+</div>
          <div className="sa-left-stat-label">Students have assessed their skills with us</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="sa-right">
        <div className="sa-form-card">

          <div className="sa-form-eyebrow">
            <span className="sa-form-eyebrow-dot" />
            Assessment Portal
          </div>

          <h2 className="sa-form-title">{HEAD[mode].title}</h2>
          <p className="sa-form-subtitle">{mode === 'fp-otp' && fpEmail ? `Enter the 6-digit code we sent to ${fpEmail}.` : HEAD[mode].sub}</p>

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

          {info && !error && (
            <div className="sa-alert" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <div className="sa-alert-icon" style={{ background: '#16A34A' }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.3L5 8.8L9.5 3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="sa-alert-text" style={{ color: '#166534' }}>{info}</span>
            </div>
          )}

          {/* ── Login ── */}
          {mode === 'login' && (
          <>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="sa-field">
              <label>Email Address</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  type="email"
                  className="sa-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="sa-field">
              <label>Password</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="sa-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button type="button" className="sa-eye-btn" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12c.9-2.37 2.44-4.45 4.41-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8-.73 1.96-1.94 3.7-3.46 5.08M1 1l22 22"/>
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <path d="M1 12C2.73 7.61 7 4 12 4c5 0 9.27 3.61 11 8-1.73 4.39-6 8-11 8C7 20 2.73 16.39 1 12z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', margin: '-4px 0 6px' }}>
              <button type="button" onClick={goForgot} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Forgot password?</button>
            </div>

            {/* Submit */}
            <button type="submit" className="sa-btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? (
                <><div className="sa-spinner" /><span>Signing in…</span></>
              ) : (
                <>
                  <span>Login & Continue</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider + signup link */}
          <div className="sa-divider" style={{ marginTop: 20 }}>
            <div className="sa-divider-line" />
            <span className="sa-divider-text">Don't have an account?</span>
            <div className="sa-divider-line" />
          </div>

          <div className="sa-auth-footer">
            <button onClick={() => router.push('/self-assessment/signup')}>
              Register for Assessment →
            </button>
          </div>
          </>
          )}

          {/* ── Step 1: enter email ── */}
          {mode === 'fp-email' && (
          <form onSubmit={submitForgotEmail}>
            <div className="sa-field">
              <label>Email Address</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input type="email" className="sa-input" placeholder="you@example.com" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required autoFocus autoComplete="email" />
              </div>
            </div>
            <button type="submit" className="sa-btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? (<><div className="sa-spinner" /><span>Sending…</span></>) : <span>Send verification code</span>}
            </button>
            <button type="button" onClick={backToLogin} style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer' }}>← Back to login</button>
          </form>
          )}

          {/* ── Step 2: enter OTP ── */}
          {mode === 'fp-otp' && (
          <form onSubmit={submitVerifyOtp}>
            <div className="sa-field">
              <label>Verification Code</label>
              <div className="sa-input-wrap">
                <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="sa-input" placeholder="••••••" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus style={{ textAlign: 'center', letterSpacing: 10, fontSize: 20, fontWeight: 600, paddingLeft: 14 }} />
              </div>
            </div>
            <button type="submit" className="sa-btn-primary" disabled={loading || otp.length !== 6} style={{ marginTop: 8 }}>
              {loading ? (<><div className="sa-spinner" /><span>Verifying…</span></>) : <span>Verify code</span>}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#64748B', marginTop: 12 }}>
              Didn&apos;t get it?{' '}
              <button type="button" onClick={resendOtp} disabled={resendIn > 0} style={{ background: 'none', border: 'none', color: resendIn > 0 ? '#B0BAC9' : '#7C3AED', fontWeight: 600, cursor: resendIn > 0 ? 'not-allowed' : 'pointer', padding: 0, fontSize: 12.5 }}>
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </p>
            <button type="button" onClick={backToLogin} style={{ display: 'block', margin: '6px auto 0', background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer' }}>← Back to login</button>
          </form>
          )}

          {/* ── Step 3: new password ── */}
          {mode === 'fp-reset' && (
          <form onSubmit={submitReset}>
            <div className="sa-field">
              <label>New Password</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type={showNew ? 'text' : 'password'} className="sa-input" placeholder="At least 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoFocus autoComplete="new-password" style={{ paddingRight: 44 }} />
                <button type="button" className="sa-eye-btn" onClick={() => setShowNew(v => !v)}>
                  {showNew ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12c.9-2.37 2.44-4.45 4.41-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8-.73 1.96-1.94 3.7-3.46 5.08M1 1l22 22"/></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M1 12C2.73 7.61 7 4 12 4c5 0 9.27 3.61 11 8-1.73 4.39-6 8-11 8C7 20 2.73 16.39 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="sa-field">
              <label>Confirm New Password</label>
              <div className="sa-input-wrap">
                <span className="sa-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type={showNew ? 'text' : 'password'} className="sa-input" placeholder="Re-enter the new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" className="sa-btn-primary" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? (<><div className="sa-spinner" /><span>Resetting…</span></>) : <span>Reset password</span>}
            </button>
            <button type="button" onClick={backToLogin} style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer' }}>← Back to login</button>
          </form>
          )}

          {/* ── Done ── */}
          {mode === 'fp-done' && (
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 18px' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(22,163,74,0.12)"/><path d="M7 12.5L10.5 16L17 9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <button type="button" className="sa-btn-primary" onClick={backToLogin}><span>Back to login</span></button>
          </div>
          )}

          {/* Trust bar */}
          <div className="sa-trust">
            {[
              { icon: '🔒', label: 'Secure Login' },
              { icon: '🛡️', label: 'Encrypted' },
              { icon: '✅', label: '100% Free' },
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
