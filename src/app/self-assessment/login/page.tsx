'use client';

import { useState } from 'react';
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

          <h2 className="sa-form-title">Welcome back 👋</h2>
          <p className="sa-form-subtitle">Login to continue your self-assessment</p>

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
