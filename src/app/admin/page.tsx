'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import AdminAttendanceSettings from '@/components/AdminAttendanceSettings';

export default function AdminDashboard() {
    const [categories, setCategories] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data));
    }, []);

    const handleLogout = async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: "#050505", color: "white" }}
        >
            <div className="container">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1
                        className="fw-bold"
                        style={{
                            color: "#00c2ff",
                            textShadow: "0 0 12px rgba(0,194,255,0.5)"
                        }}
                    >
                        Admin Dashboard
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="btn fw-bold px-4 py-2"
                        style={{
                            background: "#ff3b3b",
                            color: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 0 12px rgba(255,0,0,0.4)"
                        }}
                    >
                        Logout
                    </button>
                </div>

                {/* MAIN GRID */}
                <div className="row g-4">

                    {/* CATEGORIES CARD */}
                    <div className="col-md-6">
                        <div
                            className="p-4 rounded-4 h-100"
                            style={{
                                background: "rgba(15,15,15,0.85)",
                                border: "1px solid rgba(0,194,255,0.25)",
                                boxShadow: "0 0 20px rgba(0,194,255,0.15)",
                                backdropFilter: "blur(6px)"
                            }}
                        >
                            <h3
                                className="fw-bold mb-3"
                                style={{ color: "#14f4ff" }}
                            >
                                Categories
                            </h3>

                            <ul className="list-unstyled">
                                {categories.map((cat) => (
                                    <li
                                        key={cat.id}
                                        className="py-2 border-bottom border-secondary"
                                    >
                                        <strong className="text-white">{cat.name}</strong>

                                        {cat.children && cat.children.length > 0 && (
                                            <ul className="list-unstyled ms-3 mt-1 text-muted">
                                                {cat.children.map((child: any) => (
                                                    <li key={child.id}>• {child.name}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>

                        </div>
                    </div>

                    {/* QUICK ACTIONS + UPDATE ABOUT SECTION */}
                    <div className="col-md-6">
                        <div
                            className="p-4 rounded-4 h-100"
                            style={{
                                background: "rgba(15,15,15,0.85)",
                                border: "1px solid rgba(0,194,255,0.25)",
                                boxShadow: "0 0 20px rgba(0,194,255,0.15)",
                                backdropFilter: "blur(6px)"
                            }}
                        >
                            {/* QUICK ACTIONS */}
                            <h3
                                className="fw-bold mb-3"
                                style={{ color: "#14f4ff" }}
                            >
                                Quick Actions
                            </h3>

                            <div className="d-grid gap-2 mb-4">
                                <button
                                    className="btn fw-bold py-2"
                                    style={{
                                        background: "#00c2ff",
                                        color: "#000",
                                        borderRadius: "10px",
                                        boxShadow: "0 0 12px rgba(0,194,255,0.4)"
                                    }}
                                >
                                    Add Course
                                </button>
                                <button
                                    className="btn fw-bold py-2"
                                    style={{
                                        background: "#00ff9d",
                                        color: "#000",
                                        borderRadius: "10px",
                                        boxShadow: "0 0 12px rgba(0,255,157,0.4)"
                                    }}
                                >
                                    Add Category
                                </button>
                            </div>

                            {/* UPDATE ABOUT US */}
                            <h3
                                className="fw-bold mb-3 mt-4"
                                style={{ color: "#14f4ff" }}
                            >
                                Update About Us
                            </h3>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    api
                                        .post('/about', {
                                            title: formData.get('title'),
                                            content: formData.get('content'),
                                            image_url: formData.get('image_url'),
                                        })
                                        .then(() => alert('Updated successfully!'));
                                }}
                                className="d-grid gap-3"
                            >
                                <input
                                    name="title"
                                    placeholder="Title"
                                    className="form-control bg-dark text-white border-secondary"
                                    required
                                    style={{ borderRadius: "8px" }}
                                />

                                <textarea
                                    name="content"
                                    placeholder="Content"
                                    className="form-control bg-dark text-white border-secondary"
                                    rows={5}
                                    required
                                    style={{ borderRadius: "8px" }}
                                />

                                <input
                                    name="image_url"
                                    placeholder="Image URL (Optional)"
                                    className="form-control bg-dark text-white border-secondary"
                                    style={{ borderRadius: "8px" }}
                                />

                                <button
                                    type="submit"
                                    className="btn fw-bold py-2"
                                    style={{
                                        background: "#14f4ff",
                                        color: "#000",
                                        borderRadius: "10px",
                                        boxShadow: "0 0 15px rgba(20,244,255,0.4)"
                                    }}
                                >
                                    Update Content
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ATTENDANCE SETTINGS COMPONENT */}
                <div className="mt-5">
                    <AdminAttendanceSettings />
                </div>

            </div>
        </div>
    );
}
