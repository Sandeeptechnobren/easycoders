"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import Loader from "@/app/loader/page";

// Define the type for an Enrollment
interface Enrollment {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    college: string;
    course_name?: string; // Optional if backend returns it
    date: string;
    resolved: boolean;
}

export default function EnrollmentRequests() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        async function fetchEnrollments() {
            try {
                const res = await api.get("/enrollmentRequests");
                const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

                const mappedData = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    phone_number: item.phone_number,
                    college: item.college,
                    course_name: item.course?.title || item.course_name || "N/A",
                    date: item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date || 'N/A',
                    resolved: false
                }));
                setEnrollments(mappedData);
            } catch (error) {
                console.error("Failed to fetch enrollments", error);
            } finally {
                setLoading(false);
            }
        }
        fetchEnrollments();
    }, []);

    // Toggle Resolved Logic
    const handleToggleResolved = (id: number) => {
        setEnrollments(enrollments.map((enr) =>
            enr.id === id ? { ...enr, resolved: !enr.resolved } : enr
        ));
    };

    // Stats
    const totalEnrollments = enrollments.length;
    const todayCount = enrollments.filter(i => i.date === new Date().toLocaleDateString()).length;

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ background: "#050505", color: "#e0e6ed", fontFamily: "'Inter', sans-serif" }}>

            <div className="container-fluid p-4 p-md-5 mb-auto">
                {/* Header Section */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
                    <div>
                        <h1 className="fw-bold display-5 mb-1"
                            style={{
                                background: "linear-gradient(90deg, #00c2ff, #00ff9d)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                letterSpacing: "-1px"
                            }}>
                            Enrollment Requests
                        </h1>
                        <p className="text-secondary mb-0">Manage new course enrollment applications.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="d-flex gap-3">
                        <div className="px-4 py-3 rounded-4"
                            style={{ background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)" }}>
                            <span className="d-block text-info small text-uppercase fw-bold">Total Requests</span>
                            <span className="h3 fw-bold mb-0 text-white">{totalEnrollments}</span>
                        </div>
                        <div className="px-4 py-3 rounded-4"
                            style={{ background: "rgba(0,255,157,0.1)", border: "1px solid rgba(0,255,157,0.2)" }}>
                            <span className="d-block text-success small text-uppercase fw-bold">New Today</span>
                            <span className="h3 fw-bold mb-0 text-white">{todayCount}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Loader />
                ) : enrollments.length > 0 ? (
                    <div className="table-responsive rounded-4 p-3"
                        style={{
                            background: "rgba(20, 20, 20, 0.6)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
                        }}>
                        <table className="table table-dark table-hover align-middle mb-0" style={{ background: "transparent" }}>
                            <thead style={{ borderBottom: "1px solid rgba(0,194,255,0.3)" }}>
                                <tr>
                                    <th className="py-3 ps-3 text-info">Date</th>
                                    <th className="py-3 text-info">Student Name</th>
                                    <th className="py-3 text-info">Course</th>
                                    <th className="py-3 text-info">Contact</th>
                                    <th className="py-3 text-info">College</th>
                                    <th className="py-3 text-end pe-3 text-info">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((enr) => (
                                    <tr key={enr.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td className="ps-3 text-secondary">{enr.date}</td>
                                        <td className="fw-bold text-white">{enr.name}</td>
                                        <td className="text-info">{enr.course_name}</td>
                                        <td>
                                            <div className="d-flex flex-column">
                                                <a href={`mailto:${enr.email}`} className="text-decoration-none text-white small mb-1">
                                                    {enr.email}
                                                </a>
                                                <span className="text-secondary small">{enr.phone_number}</span>
                                            </div>
                                        </td>
                                        <td className="text-secondary small">{enr.college}</td>
                                        <td className="text-end pe-3">
                                            <div className="d-flex align-items-center justify-content-end gap-3">
                                                <div className="form-check form-switch m-0">
                                                    <input
                                                        className="form-check-input shadow-none"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={enr.resolved}
                                                        onChange={() => handleToggleResolved(enr.id)}
                                                        title={enr.resolved ? "Status: Resolved" : "Status: Pending"}
                                                        style={{
                                                            cursor: "pointer",
                                                            width: "40px",
                                                            height: "20px",
                                                            backgroundColor: enr.resolved ? "#00ff9d" : "#343a40",
                                                            borderColor: enr.resolved ? "#00ff9d" : "#495057",
                                                            transition: "0.3s ease"
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-5 text-muted">
                        <div className="mb-3 fs-1">📝</div>
                        <h4>No enrollment requests</h4>
                        <p>New student applications will appear here.</p>
                    </div>
                )}
            </div>

        </div>
    );
}