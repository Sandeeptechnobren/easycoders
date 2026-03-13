'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const [submitting, setSubmitting]= useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await api.post('/login', { email, password });
      const token = response.data.data.access_token;
      const user = response.data.data.user;
      const role = user.role;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', role);
      login(role);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (role === 1) router.push('/admin');
      else if (role === 2) router.push('/hr');
      else if (role === 3) router.push('/student');
      else if (role === 4) router.push('/trainer');
      else router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
    finally{
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="introSection global-header-bg">
        <div className="transparentDiv">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="internalIntro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <h1 style={{ fontSize: '42px', fontWeight: 900 }}>
                Welcome Back 👋
              </h1>
              <p style={{ marginTop: 10, maxWidth: 450 }}>
                Login to continue your learning journey with EasyCoders.
              </p>
            </div>

            <div className="internalIntro introImage" />
          </div>
        </div>
      </section>
      
      <section className="description" style={{ display: 'flex', justifyContent: 'center' }}>
  <div className="courseCard" style={{ width: 420 }}>
    
    <h2 className="sectionTitle" style={{ textAlign: 'center' }}>
      Welcome Back
    </h2>

    <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
      Login to continue your learning journey
    </p>

    {error && (
      <div style={{ 
        color: '#b91c1c', 
        background: '#fee2e2', 
        padding: '8px 12px', 
        borderRadius: 8,
        marginBottom: 12,
        textAlign: 'center',
        fontSize: 13
      }}>
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      <div className="formGroup">
        <label className="formLabel">Email Address</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="formInput"
        />
      </div>

      <div className="formGroup">
        <label className="formLabel">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="formInput"
        />
      </div>

      <button type="submit" className="formButton" disabled={submitting}
      style={{
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer'
        }}>
              {submitting?'Logging In...':'Login'}
      </button>
    </form>

    <p style={{ marginTop: 20, textAlign: 'center', fontSize: 14 }}>
      Don’t have an account?{' '}
      <Link href="/contactus" style={{ color: '#8B5CF6', fontWeight: 600 }}>
        Contact Us
      </Link>
    </p>
  </div>
</section>

    </div>
  );
}
