"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import Loader from "@/app/loader/page";


// Define the type for an Inquiry
interface Inquiry {
    id: number;
    name: string;
    email: string;
    message: string;
    date: string;
    resolved: boolean;
}

export default function ContactInquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);


    // Fetch Data
    useEffect(() => {
        async function fetchInquiries() {
            try {
                const res = await api.get("/contactUsList");
                const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
                const mappedData = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    message: item.message,
                    date: item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date || 'N/A',
                    resolved: false
                }));
                setInquiries(mappedData);
            } catch (error) {
                console.error("Failed to fetch inquiries", error);
            } finally {
                setLoading(false);
            }
        }
        fetchInquiries();
    }, []);

    // Delete Logic
    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this inquiry?")) return;
        setInquiries(inquiries.filter((inquiry) => inquiry.id !== id));
    };

    // Toggle Resolved Logic
    const handleToggleResolved = (id: number) => {
        setInquiries(inquiries.map((inq) =>
            inq.id === id ? { ...inq, resolved: !inq.resolved } : inq
        ));
    };



    // Stats
    const totalInquiries = inquiries.length;
    const todayCount = inquiries.filter(i => i.date === new Date().toLocaleDateString()).length;

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
                            Inquiries
                        </h1>
                        <p className="text-secondary mb-0">Manage incoming messages from students & visitors.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="d-flex gap-3">
                        <div className="px-4 py-3 rounded-4"
                            style={{ background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.2)" }}>
                            <span className="d-block text-info small text-uppercase fw-bold">Total</span>
                            <span className="h3 fw-bold mb-0 text-white">{totalInquiries}</span>
                        </div>
                        <div className="px-4 py-3 rounded-4"
                            style={{ background: "rgba(0,255,157,0.1)", border: "1px solid rgba(0,255,157,0.2)" }}>
                            <span className="d-block text-success small text-uppercase fw-bold">Today</span>
                            <span className="h3 fw-bold mb-0 text-white">{todayCount}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <Loader />
                ) : inquiries.length > 0 ? (
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
                                    <th className="py-3 text-info">Name</th>
                                    <th className="py-3 text-info">Email</th>
                                    <th className="py-3 text-info">Message</th>
                                    <th className="py-3 text-end pe-3 text-info">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inquiries.map((inquiry) => (
                                    <tr key={inquiry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <td className="ps-3 text-secondary">{inquiry.date}</td>
                                        <td className="fw-bold text-white">{inquiry.name}</td>
                                        <td>
                                            <a href={`mailto:${inquiry.email}`} className="text-decoration-none text-info small">
                                                {inquiry.email}
                                            </a>
                                        </td>
                                        <td className="text-secondary text-truncate" style={{ maxWidth: "300px" }} title={inquiry.message}>
                                            {inquiry.message}
                                        </td>
                                        <td className="text-end pe-3">
                                            <div className="d-flex align-items-center justify-content-end gap-3">
                                                <div className="form-check form-switch m-0">
                                                    <input
                                                        className="form-check-input shadow-none"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={inquiry.resolved}
                                                        onChange={() => handleToggleResolved(inquiry.id)}
                                                        title={inquiry.resolved ? "Status: Resolved" : "Status: Pending"}
                                                        style={{
                                                            cursor: "pointer",
                                                            width: "40px",
                                                            height: "20px",
                                                            backgroundColor: inquiry.resolved ? "#00ff9d" : "#343a40",
                                                            borderColor: inquiry.resolved ? "#00ff9d" : "#495057",
                                                            transition: "0.3s ease"
                                                        }}
                                                    />
                                                </div>
                                                {/* <button
                                                    onClick={() => handleDelete(inquiry.id)}
                                                    className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: "32px", height: "32px", padding: 0 }}
                                                    title="Delete"
                                                >
                                                    ✕
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-5 text-muted">
                        <div className="mb-3 fs-1">📭</div>
                        <h4>No inquiries found</h4>
                        <p>Try adjusting your search or wait for new messages.</p>
                    </div>
                )}
            </div>


        </div>
    );
}