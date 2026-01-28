'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import './login.css';

export default function AssessmentLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        'https://api.easycoders.in/projects/backend/public/api/assessment/login',
        {
          email,
          password,
        }
      );

      /**
       * Adjust this if backend returns token/user differently
       */
      const token = res.data?.data?.token || res.data?.token;

      if (!token) {
        throw new Error('Invalid login response');
      }

      // Save assessment session
      localStorage.setItem('assessment_token', token);
      localStorage.setItem('assessment_user', email);

      router.replace('/self-assessment/app');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-auth-wrapper">
      <div className="sa-auth-card">
        <h2 className="sa-auth-title">Assessment Login</h2>
        <p className="sa-auth-subtitle">
          Login to continue your self-assessment
        </p>

        {error && <div className="sa-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="sa-input-group">
            <input
              type="email"
              className="sa-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              className="sa-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="sa-primary-btn"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Login →'}
            </button>
          </div>
        </form>

        <div className="sa-auth-footer">
          New here?{' '}
          <a
            onClick={() => router.push('/self-assessment/signup')}
            style={{ cursor: 'pointer' }}
          >
            Register for Assessment
          </a>
        </div>
      </div>
    </div>
  );
}
