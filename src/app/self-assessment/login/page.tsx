// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import api from '@/lib/axios';
// import './login.css';

// export default function AssessmentLogin() {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
    
//     if (!email || !password) {
//       setError('Email and password are required');
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await api.post(
//         'https://api.easycoders.in/projects/backend/public/api/assessment/login',
//         { email, password }
//       );

//       const token = res.data?.token || res.data?.data?.token;
//       const userData = res.data?.user;
//       console.log(userData);
//       if (!token) {
//         throw new Error('Invalid login response');
//       }
//       localStorage.setItem('assessment_token', token);
//       localStorage.setItem('assessment_user', email);
//       const displayName = userData?.name || email.split('@')[0];
//       localStorage.setItem('logged_in_user', displayName);
      
//       router.replace('/self-assessment/app');
//     } catch (err: any) {
//       setError(
//         err.response?.data?.message || 'Invalid credentials. Please try again.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="sa-auth-wrapper">
//       <div className="sa-auth-card">
//         <h2 className="sa-auth-title">Assessment Login</h2>
//         <p className="sa-auth-subtitle">Login to continue your self-assessment</p>

//         {error && <div className="sa-error">{error}</div>}

//         <form onSubmit={handleSubmit}>
//           <div className="sa-input-group">
//             <input
//               type="email"
//               className="sa-input"
//               placeholder="Email address"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//             />
//             <input
//               type="password"
//               className="sa-input"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//             <button type="submit" className="sa-primary-btn" disabled={loading}>
//               {loading ? 'Logging in...' : 'Login →'}
//             </button>
//           </div>
//         </form>

//         <div className="sa-auth-footer">
//           New here?{' '}
//           <span
//             onClick={() => router.push('/self-assessment/signup')}
//             style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 'bold' }}
//           >
//             Register for Assessment
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import '../signup/signup.css'; // ✅ reuse same stylesheet as signup

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

      const displayName = userData?.name || email.split('@')[0];
      localStorage.setItem('logged_in_user', displayName);

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
    <div className="sa-wrapper">
      <div className="sa-container">
        
        {/* LEFT BRANDING SECTION (Same as Signup) */}
        <div className="sa-branding">
          <div className="sa-glass">
            <div className="sa-logo-circle">EC</div>
            <h1>Easy Coders</h1>
            <p>
              Continue your structured self-assessment journey
              and track your coding growth.
            </p>
            <div className="sa-features">
              <span>✓ Resume Smart Assessment</span>
              <span>✓ Track Your Progress</span>
              <span>✓ Unlock Your Roadmap</span>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN SECTION */}
        <div className="sa-content">
          <div className="sa-header">
            <h2>Welcome Back 👋</h2>
            <p>Login to continue your self-assessment</p>
          </div>

          {error && <div className="sa-alert">{error}</div>}

          <div className="sa-form-scroll">
            <form onSubmit={handleSubmit}>
              <div className="sa-step sa-animate-in">
                <div className="sa-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="sa-input"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="sa-field">
                  <label>Password</label>
                  <input
                    type="password"
                    className="sa-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="sa-btn-primary sa-mt-2"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login & Continue →'}
                </button>

                <div className="sa-auth-footer" style={{ marginTop: '20px' }}>
                  New here?{' '}
                  <span
                    onClick={() =>
                      router.push('/self-assessment/signup')
                    }
                    style={{
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      fontWeight: 'bold',
                    }}
                  >
                    Register for Assessment
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}