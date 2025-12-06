'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await api.post('/login', { email, password });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            const role = response.data.user.role;

            if (role === 'admin') router.push('/admin');
            else if (role === 'trainer') router.push('/trainer');
            else router.push('/student');

        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
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
                    width: "380px",
                    background: "rgba(15,15,15,0.85)",
                    border: "1px solid rgba(0,194,255,0.25)",
                    boxShadow: "0 0 25px rgba(0,194,255,0.15)",
                    backdropFilter: "blur(6px)",
                }}
            >
                <h2
                    className="text-center fw-bold mb-4"
                    style={{
                        color: "#00c2ff",
                        textShadow: "0 0 12px rgba(0,194,255,0.5)",
                    }}
                >
                    Login
                </h2>

                {/* ERROR ALERT */}
                {error && (
                    <div className="alert alert-danger text-center py-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

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
                    <div className="mb-4">
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

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        className="btn w-100 fw-bold py-2"
                        style={{
                            background: "#00c2ff",
                            color: "#000",
                            borderRadius: "10px",
                            boxShadow: "0 0 15px rgba(0,194,255,0.5)",
                        }}
                    >
                        Login
                    </button>

                </form>

                {/* REGISTER LINK */}
                <p className="mt-3 text-center">
                    Don't have an account?{" "}
                    <Link
                        href="/register"
                        style={{ color: "#14f4ff", textDecoration: "none" }}
                    >
                        Register
                    </Link>
                </p>
            </div>

        </div>
    );
}
