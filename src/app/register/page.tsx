'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [collegeId, setCollegeId] = useState('');
    const [colleges, setColleges] = useState<any[]>([]);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        api.get('/colleges')
            .then(res => setColleges(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/register', { name, email, password, role, college_id: collegeId });
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center justify-content-center"
            style={{
                background: "#050505",
                color: "white",
            }}
        >
            <div
                className="p-4 p-md-5 rounded-4 shadow-lg"
                style={{
                    width: "420px",
                    background: "rgba(15, 15, 15, 0.85)",
                    border: "1px solid rgba(0, 194, 255, 0.25)",
                    boxShadow: "0 0 25px rgba(0, 194, 255, 0.15)",
                    backdropFilter: "blur(8px)",
                }}
            >
                <h2
                    className="text-center fw-bold mb-4"
                    style={{
                        color: "#00c2ff",
                        textShadow: "0 0 12px rgba(0,194,255,0.5)",
                    }}
                >
                    Create Account
                </h2>

                {/* ERROR ALERT */}
                {error && (
                    <div className="alert alert-danger text-center py-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* NAME */}
                    <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-control bg-dark text-white border-secondary"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ borderRadius: "8px" }}
                        />
                    </div>

                    {/* EMAIL */}
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control bg-dark text-white border-secondary"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ borderRadius: "8px" }}
                        />
                    </div>

                    {/* PASSWORD */}
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control bg-dark text-white border-secondary"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ borderRadius: "8px" }}
                        />
                    </div>

                    {/* ROLE SELECT */}
                    {/* <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select
                            className="form-select bg-dark text-white border-secondary"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            style={{ borderRadius: "8px" }}
                        >
                            <option value="student">Student</option>
                            <option value="trainer">Trainer</option>
                        </select>
                    </div> */}
                    {role === 'student' && (
                        <div className="mb-3">
                            <label className="form-label">College</label>
                            <input
                                type="text"
                                className="form-control bg-dark text-white border-secondary"
                                value={collegeId}
                                onChange={(e) => setCollegeId(e.target.value)}
                                required
                                style={{ borderRadius: "8px" }}
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn w-100 fw-bold py-2 mt-2"
                        style={{
                            background: "#00c2ff",
                            color: "#000",
                            borderRadius: "10px",
                            boxShadow: "0 0 15px rgba(0,194,255,0.5)",
                        }}
                    >
                        Register
                    </button>

                </form>

                {/* LOGIN REDIRECT */}
                <p className="mt-3 text-center">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        style={{ color: "#14f4ff", textDecoration: "none" }}
                    >
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
}
