'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Dropdown from '@/components/ui/Dropdown/Dropdown';
import './signup.css';

export default function AssessmentSignup() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    otp: '',
    phone: '',
    password: '',
    password_confirmation: '',
    gender: '',
    date_of_birth: '',
    level: '',
    goal: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateType, setDateType] = useState<'text' | 'date'>('text');
  const levelOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
  ];
  const goalOptions = [
    { label: 'Learn fundamentals', value: 'fundamentals' },
    { label: 'Prepare for job', value: 'job' },
    { label: 'Switch career', value: 'career-switch' },
  ];
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  /* ---------- HANDLERS ---------- */
  const handleChange = (e: any) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/assessment/send-otp', { name: form.name, email: form.email });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/assessment/verify-otp', { email: form.email, otp: form.otp });
      setOtpVerified(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) return;
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('assessment/register', form);
      localStorage.setItem('assessment_user', form.email);
      router.replace('/self-assessment/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sa-auth-wrapper">
      <div className="sa-auth-card">
        <h2 className="sa-auth-title">Sign Up</h2>
        <p className="sa-auth-subtitle">Verify your email and complete your profile</p>

        {error && <div className="sa-error">{error}</div>}

        <form onSubmit={register}>
          <div className="sa-input-group">
            {/* BASIC INFO */}
            <input
              name="name"
              className="sa-input"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              disabled={otpSent}
              required
            />

            <input
              name="email"
              type="email"
              className="sa-input"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              disabled={otpSent}
              required
            />

            {!otpSent && (
              <button type="button" className="sa-primary-btn" onClick={sendOtp} disabled={loading}>
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            )}

            {/* OTP VERIFICATION */}
            {otpSent && !otpVerified && (
              <>
                <div className="sa-step-divider" />
                <div className="sa-otp-row">
                  <input
                    name="otp"
                    className="sa-input"
                    placeholder="Enter OTP"
                    value={form.otp}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" className="sa-secondary-btn" onClick={verifyOtp} disabled={loading}>
                    Verify
                  </button>
                </div>
              </>
            )}

            {/* FINAL REGISTRATION DETAILS */}
            {otpVerified && (
              <>
                <div className="sa-step-divider" />

                <input 
                  name="phone" 
                  className="sa-input" 
                  placeholder="Phone Number" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                />
                
                <Dropdown 
                  options={genderOptions} 
                  placeholder="Select Gender" 
                  value={form.gender} 
                  onChange={v => setForm(p => ({ ...p, gender: v as string }))} 
                />
                
                {/* PROPER DATE OF BIRTH PLACEHOLDER LOGIC */}
                <input 
                  name="date_of_birth"
                  className="sa-input"
                  type={dateType}
                  placeholder="Date of Birth (DD/MM/YYYY)"
                  onFocus={() => setDateType('date')}
                  onBlur={(e) => {
                    if (!e.target.value) setDateType('text');
                  }}
                  value={form.date_of_birth}
                  onChange={handleChange}
                  required
                />

                <input 
                  name="password" 
                  type="password" 
                  className="sa-input" 
                  placeholder="Password" 
                  value={form.password} 
                  onChange={handleChange} 
                  required 
                />
                
                <input 
                  name="password_confirmation" 
                  type="password" 
                  className="sa-input" 
                  placeholder="Confirm Password" 
                  value={form.password_confirmation} 
                  onChange={handleChange} 
                  required 
                />

                <Dropdown 
                  options={levelOptions} 
                  placeholder="Experience Level" 
                  value={form.level} 
                  onChange={v => setForm(p => ({ ...p, level: v as string }))} 
                />
                
                <Dropdown 
                  options={goalOptions} 
                  placeholder="Your Goal" 
                  value={form.goal} 
                  onChange={v => setForm(p => ({ ...p, goal: v as string }))} 
                />

                <button type="submit" className="sa-primary-btn" disabled={loading}>
                  {loading ? 'Registering…' : 'Start Assessment →'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}