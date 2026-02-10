// 'use client';
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import api from '@/lib/axios';
// import Dropdown from '@/components/ui/Dropdown/Dropdown';
// import './signup.css';

// export default function AssessmentSignup() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     otp: '',
//     phone: '',
//     password: '',
//     password_confirmation: '',
//     gender: '',
//     date_of_birth: '',
//     level: '',
//     goal: '',
//     college_id: '', 
//   });
//   const [otpSent, setOtpSent] = useState(false);
//   const [colleges, setColleges] = useState<any[]>([]);
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [dateType, setDateType] = useState<'text' | 'date'>('text');
//   const levelOptions = [
//     { label: 'Beginner', value: 'beginner' },
//     { label: 'Intermediate', value: 'intermediate' },
//     { label: 'Advanced', value: 'advanced' },
//   ];
//   const goalOptions = [
//     { label: 'Learn fundamentals', value: 'fundamentals' },
//     { label: 'Prepare for job', value: 'job' },
//     { label: 'Switch career', value: 'career-switch' },
//   ];
//   const genderOptions = [
//     { label: 'Male', value: 'male' },
//     { label: 'Female', value: 'female' },
//     { label: 'Other', value: 'other' },
//   ];
//   useEffect(() => {
//   getColleges();
//     }, []);

//   /* ---------- HANDLERS ---------- */
//   const handleChange = (e: any) => {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const sendOtp = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       await api.post('/assessment/send-otp', { name: form.name, email: form.email });
//       setOtpSent(true);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyOtp = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       await api.post('/assessment/verify-otp', { email: form.email, otp: form.otp });
//       setOtpVerified(true);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Invalid OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!otpVerified) return;
//     if (form.password !== form.password_confirmation) {
//       setError('Passwords do not match');
//       return;
//     }
//     setLoading(true);
//     try {
//       await api.post('assessment/register', form);
//       localStorage.setItem('assessment_user', form.email);
//       router.replace('/self-assessment/app');
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };
// const getColleges = async () => {
//   try {
//     const response = await api.get('/collegeList');
//     const data = response.data.data || response.data;
//     const formatted = data.map((college: any) => ({
//       label: college.name,
//       value: college.id,
//     }));
//     setColleges(formatted);
//   } catch (err: any) {
//     console.error("Fetch error:", err);
//   }
// };

//   return (
//     <div className="sa-auth-wrapper">
//       <div className="sa-auth-card">
//         <h2 className="sa-auth-title">Sign Up</h2>
//         <p className="sa-auth-subtitle">Verify your email and complete your profile</p>

//         {error && <div className="sa-error">{error}</div>}

//         <form onSubmit={register}>
//           <div className="sa-input-group">
//             {/* BASIC INFO */}
//             <input
//               name="name"
//               className="sa-input"
//               placeholder="Full Name"
//               value={form.name}
//               onChange={handleChange}
//               disabled={otpSent}
//               required
//             />

//             <input
//               name="email"
//               type="email"
//               className="sa-input"
//               placeholder="Email Address"
//               value={form.email}
//               onChange={handleChange}
//               disabled={otpSent}
//               required
//             />

//             {!otpSent && (
//               <button type="button" className="sa-primary-btn" onClick={sendOtp} disabled={loading}>
//                 {loading ? 'Sending OTP…' : 'Send OTP'}
//               </button>
//             )}

//             {/* OTP VERIFICATION */}
//             {otpSent && !otpVerified && (
//               <>
//                 <div className="sa-step-divider" />
//                 <div className="sa-otp-row">
//                   <input
//                     name="otp"
//                     className="sa-input"
//                     placeholder="Enter OTP"
//                     value={form.otp}
//                     onChange={handleChange}
//                     required
//                   />
//                   <button type="button" className="sa-secondary-btn" onClick={verifyOtp} disabled={loading}>
//                     Verify
//                   </button>
//                 </div>
//               </>
//             )}

//             {/* FINAL REGISTRATION DETAILS */}
//             {otpVerified && (
//               <>
//                 <div className="sa-step-divider" />

//                 <input 
//                   name="phone" 
//                   className="sa-input" 
//                   placeholder="Phone Number" 
//                   value={form.phone} 
//                   onChange={handleChange} 
//                   required 
//                 />
                
//                 <Dropdown 
//                   options={genderOptions} 
//                   placeholder="Select Gender" 
//                   value={form.gender} 
//                   onChange={v => setForm(p => ({ ...p, gender: v as string }))} 
//                 />
                
//                 {/* PROPER DATE OF BIRTH PLACEHOLDER LOGIC */}
//                 <input 
//                   name="date_of_birth"
//                   className="sa-input"
//                   type={dateType}
//                   placeholder="Date of Birth (DD/MM/YYYY)"
//                   onFocus={() => setDateType('date')}
//                   onBlur={(e) => {
//                     if (!e.target.value) setDateType('text');
//                   }}
//                   value={form.date_of_birth}
//                   onChange={handleChange}
//                   required
//                 />
//                 <Dropdown
//                   options={colleges}
//                   placeholder="Select College"
//                   value={form.college_id}
//                   onChange={(v) =>
//                     setForm(p => ({ ...p, college_id: v as string }))
//                   }
//                 />
//                 <input 
//                   name="password" 
//                   type="password" 
//                   className="sa-input" 
//                   placeholder="Password" 
//                   value={form.password} 
//                   onChange={handleChange} 
//                   required 
//                 />
                
//                 <input 
//                   name="password_confirmation" 
//                   type="password" 
//                   className="sa-input" 
//                   placeholder="Confirm Password" 
//                   value={form.password_confirmation} 
//                   onChange={handleChange} 
//                   required 
//                 />

//                 <Dropdown 
//                   options={levelOptions} 
//                   placeholder="Experience Level" 
//                   value={form.level} 
//                   onChange={v => setForm(p => ({ ...p, level: v as string }))} 
//                 />
                
//                 <Dropdown 
//                   options={goalOptions} 
//                   placeholder="Your Goal" 
//                   value={form.goal} 
//                   onChange={v => setForm(p => ({ ...p, goal: v as string }))} 
//                 />

//                 <button type="submit" className="sa-primary-btn" disabled={loading}>
//                   {loading ? 'Registering…' : 'Start Assessment →'}
//                 </button>
//               </>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import api from '@/lib/axios';
// import Dropdown from '@/components/ui/Dropdown/Dropdown';
// import './signup.css';

// // Define the shape of our college options for better TS support
// interface CollegeOption {
//   label: string;
//   value: number;
// }

// export default function AssessmentSignup() {
//   const router = useRouter();

//   /* ---------------- STATE ---------------- */
//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     otp: '',
//     phone: '',
//     password: '',
//     password_confirmation: '',
//     gender: '',
//     date_of_birth: '',
//     level: '',
//     goal: '',
//     college_id: undefined as number | undefined,
//   });

//   const [otpSent, setOtpSent] = useState(false);
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [colleges, setColleges] = useState<CollegeOption[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [dateType, setDateType] = useState<'text' | 'date'>('text');

//   /* ---------------- OPTIONS ---------------- */
//   const levelOptions = [
//     { label: 'Beginner', value: 'beginner' },
//     { label: 'Intermediate', value: 'intermediate' },
//     { label: 'Advanced', value: 'advanced' },
//   ];

//   const goalOptions = [
//     { label: 'Learn fundamentals', value: 'fundamentals' },
//     { label: 'Prepare for job', value: 'job' },
//     { label: 'Switch career', value: 'career-switch' },
//   ];

//   const genderOptions = [
//     { label: 'Male', value: 'male' },
//     { label: 'Female', value: 'female' },
//     { label: 'Other', value: 'other' },
//   ];

//   /* ---------------- EFFECTS ---------------- */
//   useEffect(() => {
//     getColleges();
//   }, []);

//   /* ---------------- HANDLERS ---------------- */
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const getColleges = async () => {
//     try {
//       const response = await api.get('/collegeList');
      
//       // Ensure we are accessing the correct part of your Laravel/API response
//       const rawData = response.data.data || response.data || [];

//       // Map the data to match the Dropdown's expected {label, value} format
//       const formatted: CollegeOption[] = rawData.map((college: any) => ({
//         // This handles both 'college_name' (from your SQL) and 'name'
//         label: college.college_name || college.name || 'Unknown College',
//         value: Number(college.id),
//       }));

//       setColleges(formatted);
//     } catch (err) {
//       console.error('Failed to fetch colleges:', err);
//       setError('Unable to load colleges. Please check your connection.');
//     }
//   };

//   const sendOtp = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       await api.post('/assessment/send-otp', {
//         name: form.name,
//         email: form.email,
//       });
//       setOtpSent(true);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verifyOtp = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       await api.post('/assessment/verify-otp', {
//         email: form.email,
//         otp: form.otp,
//       });
//       setOtpVerified(true);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Invalid OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!otpVerified) return;
//     if (!form.college_id) {
//       setError('Please select your college');
//       return;
//     }
//     if (form.password !== form.password_confirmation) {
//       setError('Passwords do not match');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       await api.post('/assessment/register', form);
//       localStorage.setItem('assessment_user', form.email);
//       router.replace('/self-assessment/app');
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <div className="sa-auth-wrapper">
//       <div className="sa-auth-card">
//         <h2 className="sa-auth-title">Sign Up</h2>
//         <p className="sa-auth-subtitle">
//           Verify your email and complete your profile
//         </p>

//         {error && <div className="sa-error">{error}</div>}

//         <form onSubmit={register}>
//           <div className="sa-input-group">
//             {/* STEP 1: BASIC INFO */}
//             <input
//               name="name"
//               className="sa-input"
//               placeholder="Full Name"
//               value={form.name}
//               onChange={handleChange}
//               disabled={otpSent}
//               required
//             />

//             <input
//               name="email"
//               type="email"
//               className="sa-input"
//               placeholder="Email Address"
//               value={form.email}
//               onChange={handleChange}
//               disabled={otpSent}
//               required
//             />

//             {!otpSent && (
//               <button
//                 type="button"
//                 className="sa-primary-btn"
//                 onClick={sendOtp}
//                 disabled={loading}
//               >
//                 {loading ? 'Sending OTP…' : 'Send OTP'}
//               </button>
//             )}

//             {/* STEP 2: OTP VERIFICATION */}
//             {otpSent && !otpVerified && (
//               <>
//                 <div className="sa-step-divider" />
//                 <div className="sa-otp-row">
//                   <input
//                     name="otp"
//                     className="sa-input"
//                     placeholder="Enter OTP"
//                     value={form.otp}
//                     onChange={handleChange}
//                     required
//                   />
//                   <button
//                     type="button"
//                     className="sa-secondary-btn"
//                     onClick={verifyOtp}
//                     disabled={loading}
//                   >
//                     {loading ? 'Verifying...' : 'Verify'}
//                   </button>
//                 </div>
//               </>
//             )}

//             {/* STEP 3: FINAL DETAILS (Only shown after OTP) */}
//             {otpVerified && (
//               <>
//                 <div className="sa-step-divider" />

//                 <input
//                   name="phone"
//                   className="sa-input"
//                   placeholder="Phone Number"
//                   value={form.phone}
//                   onChange={handleChange}
//                   required
//                 />

//                 <Dropdown
//                   options={genderOptions}
//                   placeholder="Select Gender"
//                   value={form.gender}
//                   onChange={v => setForm(p => ({ ...p, gender: v as string }))}
//                 />

//                 <input
//                   name="date_of_birth"
//                   className="sa-input"
//                   type={dateType}
//                   placeholder="Date of Birth"
//                   onFocus={() => setDateType('date')}
//                   onBlur={e => {
//                     if (!e.target.value) setDateType('text');
//                   }}
//                   value={form.date_of_birth}
//                   onChange={handleChange}
//                   required
//                 />

//                 <Dropdown
//                   options={colleges}
//                   placeholder="Select College"
//                   value={form.college_id}
//                   onChange={v => setForm(p => ({ ...p, college_id: Number(v) }))}
//                 />

//                 <input
//                   name="password"
//                   type="password"
//                   className="sa-input"
//                   placeholder="Password"
//                   value={form.password}
//                   onChange={handleChange}
//                   required
//                 />

//                 <input
//                   name="password_confirmation"
//                   type="password"
//                   className="sa-input"
//                   placeholder="Confirm Password"
//                   value={form.password_confirmation}
//                   onChange={handleChange}
//                   required
//                 />

//                 <Dropdown
//                   options={levelOptions}
//                   placeholder="Experience Level"
//                   value={form.level}
//                   onChange={v => setForm(p => ({ ...p, level: v as string }))}
//                 />

//                 <Dropdown
//                   options={goalOptions}
//                   placeholder="Your Goal"
//                   value={form.goal}
//                   onChange={v => setForm(p => ({ ...p, goal: v as string }))}
//                 />

//                 <button
//                   type="submit"
//                   className="sa-primary-btn"
//                   disabled={loading || !form.college_id}
//                 >
//                   {loading ? 'Registering…' : 'Start Assessment →'}
//                 </button>
//               </>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
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
        {/* Left Side: Branding */}
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

        {/* Right Side: Form */}
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
                </div>
              )}

              {/* STEP 2: OTP */}
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