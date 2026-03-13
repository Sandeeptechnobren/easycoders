'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Dropdown from '@/components/ui/Dropdown/Dropdown';
import './signup.css';

export default function AssessmentSignup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', otp: '', phone: '', password: '',
    password_confirmation: '', gender: '', date_of_birth: '',
    level: '', goal: '', college_id: undefined as number | undefined,
    course:'',year:undefined as number|undefined,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getColleges(); }, []);

  const handleChange = (e: any) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const getColleges = async () => {
    try {
      const { data } = await api.get('/collegeList');
      const list = data.data || data || [];
      setColleges(list.map((c: any) => ({ label: c.college_name || c.name, value: Number(c.id) })));
    } catch (err) { console.error('Colleges load failed'); }
  };

  const sendOtp = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/assessment/send-otp', { name: form.name, email: form.email });
      setOtpSent(true);
    } catch (err: any) { setError(err.response?.data?.message || 'Error sending OTP'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/assessment/verify-otp', { email: form.email, otp: form.otp });
      setOtpVerified(true);
    } catch (err: any) { setError('Invalid Verification Code'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.college_id) return setError('Please select a college');
    if (form.password !== form.password_confirmation) return setError('Passwords do not match');

    setLoading(true);
    setError('');
    try {
      await api.post('/assessment/register', form);
      localStorage.setItem('assessment_user', form.email);
      router.replace('/self-assessment/app');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const progress = otpVerified ? 100 : otpSent ? 50 : 10;

  return (
    <div className="sa-wrapper">
      <div className="sa-container">
        <div className="sa-branding">
          <div className="sa-glass">
            <div className="sa-logo-circle">EC</div>
            <h1>Easy Coders</h1>
            <p>Master technical skills with our structured self-assessment platform.</p>
            <div className="sa-features">
              <span>✓ Interactive Assessments</span>
              <span>✓ Skill Benchmarking</span>
              <span>✓ Career Roadmap</span>
            </div>
          </div>
        </div>
        <div className="sa-content">
          <div className="sa-progress-container">
            <div className="sa-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="sa-header">
            <h2>{otpVerified ? 'Complete Profile' : 'Join Easy Coders'}</h2>
            <p>{otpVerified ? 'Almost there! Just a few more details.' : 'Verify your email to unlock your account.'}</p>
          </div>

          {error && <div className="sa-alert">{error}</div>}

          <div className="sa-form-scroll">
            {/* Using a form element here to handle 'Enter' key submission */}
            <form onSubmit={handleRegister}>
              
              {/* STEP 1: Identification */}
              {!otpVerified && (
                <div className={`sa-step ${otpSent ? 'sa-step-fade' : ''}`}>
                  <div className="sa-field">
                    <label>Full Name</label>
                    <input name="name" className="sa-input" placeholder="e.g. John Doe" value={form.name} onChange={handleChange} required disabled={otpSent} />
                  </div>
                  <div className="sa-field">
                    <label>Email Address</label>
                    <input name="email" type="email" className="sa-input" placeholder="john@example.com" value={form.email} onChange={handleChange} required disabled={otpSent} />
                  </div>
                  {!otpSent && (
                    <button type="button" className="sa-btn-primary" onClick={sendOtp} disabled={loading || !form.email}>
                      {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                    
                  )}
                   <div className="sa-auth-footer">
                      Already Registered?{' '}
                      <span
                        onClick={() => router.push('/self-assessment/login')}
                        style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 'bold' }}>
                        Login
                      </span>
                    </div>       
                </div>
              )}
              {otpSent && !otpVerified && (
                <div className="sa-step sa-animate-in">
                  <div className="sa-field">
                    <label>Verification Code</label>
                    <div className="sa-otp-group">
                      <input name="otp" className="sa-input" placeholder="000000" value={form.otp} onChange={handleChange} required />
                      <button type="button" className="sa-btn-black" onClick={verifyOtp} disabled={loading}>
                        {loading ? '...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Detailed Profile */}
              {otpVerified && (
                <div className="sa-step sa-animate-in">
                  <div className="sa-grid">
                    <div className="sa-field">
                      <label>Phone</label>
                      <input name="phone" className="sa-input" placeholder="+91..." value={form.phone} onChange={handleChange} required />
                    </div>
                    <div className="sa-field">
                      <label>Gender</label>
                      <Dropdown 
                        options={[{label:'Male',value:'male'},{label:'Female',value:'female'}]} 
                        placeholder="Select" 
                        value={form.gender} 
                        onChange={v => setForm(p=>({...p, gender: v as string}))} 
                      />
                    </div>
                  </div>

                  <div className="sa-field">
                    <label>Your College</label>
                    <Dropdown 
                      options={colleges} 
                      placeholder="Search college..." 
                      value={form.college_id} 
                      onChange={v => setForm(p=>({...p, college_id: Number(v)}))} 
                    />
                  </div>

                  <div className="sa-grid">
                    <div className="sa-field">
                      <label>Password</label>
                      <input name="password" type="password" className="sa-input" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                    </div>
                    <div className="sa-field">
                      <label>Confirm</label>
                      <input name="password_confirmation" type="password" className="sa-input" placeholder="••••••••" value={form.password_confirmation} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="sa-grid">
                    <div className="sa-field">
                      <label>Course</label>
                      <Dropdown options={[{label:'B Tech (CSE)',value:'b_tech'},{label:'BCA',value:'bca'},{label:'MCA',value:'mca'},{label:'Polytechnic',value:'polytechnic'}]} placeholder="Course" value={form.course} onChange={v => setForm(p=>({...p, course: v as string}))} />
                    </div>
                   
                    <div className="sa-field">
                      <label>Year</label>
                      <Dropdown
                        options={[
                          { label: '1st Year', value: 1 },
                          { label: '2nd Year', value: 2 },
                          { label: '3rd Year', value: 3 },
                          { label: '4th Year', value: 4 }
                        ]}
                        placeholder="Select Year"
                        value={form.year}
                        onChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            year: v as number
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="sa-grid">
                    <div className="sa-field">
                      <label>Experience</label>
                      <Dropdown options={[{label:'Beginner',value:'beginner'},{label:'Intermediate',value:'intermediate'},{label:'Advanced',value:'advanced'}]} placeholder="Level" value={form.level} onChange={v => setForm(p=>({...p, level: v as string}))} />
                    </div>
                    <div className="sa-field">
                      <label>Goal</label>
                      <Dropdown options={[{label:'Job Prep',value:'job'},{label:'Learn Basics',value:'fundamentals'},{label:'Career Switch',value:'career-switch'}]} placeholder="Goal" value={form.goal} onChange={v => setForm(p=>({...p, goal: v as string}))} />
                    </div>
                  </div>

                  <button type="submit" className="sa-btn-primary sa-mt-2" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Finish & Start Assessment →'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}