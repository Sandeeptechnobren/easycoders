'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { email, password });
      const token = response.data.data.access_token;
      const user = response.data.data.user;
      const role = user.role;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', role);

      login(role, user, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      onClose();
      if (role === 1) router.push('/admin');
      else if (role === 2) router.push('/hr');
      else if (role === 3) router.push('/student-dashboard');
      else if (role === 4) router.push('/trainer');
      else router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .lm-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(5, 10, 25, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: lm-fade-in 0.22s ease;
        }

        @keyframes lm-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes lm-slide-up {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes lm-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes lm-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes lm-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }

        .lm-box {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 2px 4px rgba(0,0,0,0.04),
            0 8px 32px rgba(11,27,58,0.14),
            0 32px 64px rgba(11,27,58,0.1);
          animation: lm-slide-up 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ── DECORATIVE HEADER BAND ── */
        .lm-band {
          position: relative;
          height: 6px;
          background: linear-gradient(90deg, #0B1B3A 0%, #1A3A6B 40%, #E8A020 70%, #F5C356 100%);
          background-size: 200% auto;
          animation: lm-shimmer 3s linear infinite;
        }

        /* ── CLOSE BUTTON ── */
        .lm-close {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          color: #64748B;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
          line-height: 1;
        }

        .lm-close:hover {
          background: #0B1B3A;
          border-color: #0B1B3A;
          color: #fff;
          transform: rotate(90deg);
        }

        /* ── BODY ── */
        .lm-body {
          padding: 36px 40px 40px;
        }

        /* ── ICON ── */
        .lm-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #0B1B3A 0%, #1A3A6B 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 14px rgba(11,27,58,0.25);
        }

        /* ── HEADING ── */
        .lm-title {
          font-family: 'Sora', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #0B1B3A;
          margin: 0 0 6px;
          letter-spacing: -0.4px;
          line-height: 1.2;
        }

        .lm-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #64748B;
          margin: 0 0 28px;
          line-height: 1.5;
        }

        /* ── ERROR ── */
        .lm-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #FFF5F5;
          border: 1px solid #FED7D7;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          animation: lm-shake 0.4s ease;
        }

        .lm-error-icon {
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          background: #FC8181;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
        }

        .lm-error-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #C53030;
          line-height: 1.5;
        }

        /* ── FORM ── */
        .lm-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lm-label {
          font-family: 'Sora', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #0B1B3A;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .lm-input-wrap {
          position: relative;
        }

        .lm-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .lm-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 400;
          color: #0B1B3A;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .lm-input::placeholder { color: #B0BAC9; }

        .lm-input:focus {
          background: #fff;
          border-color: #0B1B3A;
          box-shadow: 0 0 0 4px rgba(11,27,58,0.07);
        }

        .lm-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94A3B8;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.18s;
        }

        .lm-eye-btn:hover { color: #0B1B3A; }

        /* ── SUBMIT BUTTON ── */
        .lm-submit {
          margin-top: 4px;
          width: 100%;
          padding: 14px;
          font-family: 'Sora', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: #fff;
          background: linear-gradient(135deg, #0B1B3A 0%, #1A3A6B 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.22s ease;
          box-shadow: 0 4px 16px rgba(11,27,58,0.28);
          position: relative;
          overflow: hidden;
        }

        .lm-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1A3A6B 0%, #E8A020 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .lm-submit:hover::before { opacity: 1; }
        .lm-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(11,27,58,0.35); }
        .lm-submit:active { transform: translateY(0); }
        .lm-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .lm-submit span { position: relative; z-index: 1; }

        .lm-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lm-spin 0.7s linear infinite;
          position: relative;
          z-index: 1;
        }

        /* ── DIVIDER ── */
        .lm-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }

        .lm-divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }

        .lm-divider-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #94A3B8;
          white-space: nowrap;
        }

        /* ── FOOTER ── */
        .lm-footer {
          text-align: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: #64748B;
          padding-top: 4px;
        }

        .lm-footer a {
          color: #0B1B3A;
          font-weight: 600;
          text-decoration: none;
          border-bottom: 1.5px solid #E8A020;
          padding-bottom: 1px;
          transition: color 0.18s, border-color 0.18s;
        }

        .lm-footer a:hover { color: #E8A020; }

        /* ── TRUST BADGES ── */
        .lm-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          padding: 16px 40px;
          border-top: 1px solid #F1F5F9;
          background: #FAFBFD;
        }

        .lm-trust-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11.5px;
          font-weight: 500;
          color: #94A3B8;
        }

        @media (max-width: 480px) {
          .lm-body { padding: 28px 24px 32px; }
          .lm-trust { padding: 14px 24px; gap: 12px; }
          .lm-trust-item span { display: none; }
        }
      `}</style>

      <div className="lm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="lm-box">

          {/* Shimmer band */}
          <div className="lm-band" />

          {/* Close */}
          <button className="lm-close" onClick={onClose} aria-label="Close">✕</button>

          <div className="lm-body">
            {/* Icon */}
            <div className="lm-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M12 14C6.48 14 2 16.69 2 20V22H22V20C22 16.69 17.52 14 12 14Z" fill="#E8A020"/>
              </svg>
            </div>

            {/* Heading */}
            <h2 className="lm-title">Welcome back</h2>
            <p className="lm-subtitle">Sign in to continue your learning journey</p>

            {/* Error */}
            {error && (
              <div className="lm-error">
                <div className="lm-error-icon">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1L5 5.5M5 7.5L5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="lm-error-text">{error}</p>
              </div>
            )}

            {/* Form */}
            <form className="lm-form" onSubmit={handleSubmit}>
              <div className="lm-field">
                <label className="lm-label">Email Address</label>
                <div className="lm-input-wrap">
                  <span className="lm-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    className="lm-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="lm-field">
                <label className="lm-label">Password</label>
                <div className="lm-input-wrap">
                  <span className="lm-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    className="lm-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    className="lm-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12C1.9 9.63 3.44 7.55 5.41 6M9.9 4.24A9.12 9.12 0 0 1 12 4C17 4 21.27 7.61 23 12C22.27 13.96 21.06 15.7 19.54 17.08M1 1L23 23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12C2.73 7.61 7 4 12 4C17 4 21.27 7.61 23 12C21.27 16.39 17 20 12 20C7 20 2.73 16.39 1 12Z" stroke="currentColor" strokeWidth="1.6"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="lm-submit" disabled={loading}>
                {loading ? (
                  <div className="lm-spinner" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{position:'relative',zIndex:1}}>
                        <path d="M5 12H19M13 6L19 12L13 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </>
                )}
              </button>

              <div className="lm-divider">
                <div className="lm-divider-line" />
                <span className="lm-divider-text">New to Easy Coders?</span>
                <div className="lm-divider-line" />
              </div>

              <p className="lm-footer">
                Don&apos;t have an account?{' '}
                <Link href="/contactus" onClick={onClose}>Contact Us</Link>
              </p>
            </form>
          </div>

          {/* Trust bar */}
          <div className="lm-trust">
            <div className="lm-trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" stroke="#10B981" strokeWidth="1.8" fill="rgba(16,185,129,0.1)"/>
                <path d="M9 12L11 14L15 10" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>Secure Login</span>
            </div>
            <div className="lm-trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#3B82F6" strokeWidth="1.8" fill="rgba(59,130,246,0.1)"/>
                <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>Encrypted</span>
            </div>
            <div className="lm-trust-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="1.8" fill="rgba(245,158,11,0.1)"/>
                <path d="M12 7V12L15 15" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span>24/7 Access</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}