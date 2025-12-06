'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

export default function CourseDetailsPage() {
    const { id } = useParams();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/courses/${id}`).then(res => {
            setCourse(res.data);
            setLoading(false);
        });
    }, [id]);

    const handleEnroll = async () => {
        alert('Redirecting to payment gateway...');
    };

    if (loading)
        return (
            <div
                className="min-vh-100 d-flex justify-content-center align-items-center"
                style={{ color: "white", background: "#050505" }}
            >
                Loading...
            </div>
        );

    if (!course)
        return (
            <div
                className="min-vh-100 d-flex justify-content-center align-items-center"
                style={{ color: "white", background: "#050505" }}
            >
                Course not found
            </div>
        );

    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: "#050505", color: "white" }}
        >
            <div className="container">

                {/* MAIN CARD */}
                <div
                    className="rounded-4 mx-auto p-4 p-md-5"
                    style={{
                        maxWidth: "900px",
                        background: "rgba(15, 15, 15, 0.85)",
                        border: "1px solid rgba(0, 194, 255, 0.25)",
                        boxShadow: "0 0 35px rgba(0, 194, 255, 0.18)",
                        backdropFilter: "blur(6px)",
                    }}
                >
                    {/* CATEGORY */}
                    <span
                        className="badge text-uppercase mb-3"
                        style={{
                            background: "rgba(0,194,255,0.25)",
                            color: "#00c2ff",
                            padding: "8px 12px",
                            fontSize: "0.75rem",
                        }}
                    >
                        {course.category?.name}
                    </span>

                    {/* TITLE */}
                    <h1
                        className="fw-bold mb-4"
                        style={{
                            color: "#14f4ff",
                            textShadow: "0 0 12px rgba(20,244,255,0.5)",
                        }}
                    >
                        {course.title}
                    </h1>

                    {/* COURSE DETAILS & ENROLL BUTTON */}
                    <div className="row g-4 mb-4">

                        {/* LEFT DETAILS */}
                        <div className="col-md-6">
                            <h4 className="fw-bold mb-3">Course Details</h4>
                            <ul className="list-unstyled text-muted" style={{ fontSize: "1.05rem" }}>
                                <li><strong className="text-white">Duration:</strong> {course.duration}</li>
                                <li><strong className="text-white">Level:</strong> {course.level}</li>
                                <li>
                                    <strong className="text-white">Price:</strong>{" "}
                                    <span style={{ color: "#00ff9d" }}>₹{course.price}</span>
                                </li>
                            </ul>
                        </div>

                        {/* ENROLL BUTTON */}
                        <div className="col-md-6 d-flex align-items-center">
                            <button
                                onClick={handleEnroll}
                                className="btn w-100 fw-bold py-3"
                                style={{
                                    background: "#00c2ff",
                                    color: "#000",
                                    borderRadius: "12px",
                                    boxShadow: "0 0 20px rgba(0,194,255,0.45)",
                                    fontSize: "1.2rem",
                                }}
                            >
                                Enroll Now →
                            </button>
                        </div>

                    </div>

                    {/* DESCRIPTION */}
                    <div className="mt-4">
                        <h3
                            className="fw-bold mb-3"
                            style={{ color: "#00c2ff", textShadow: "0 0 8px rgba(0,194,255,0.4)" }}
                        >
                            Description
                        </h3>

                        <p
                            className="text-muted"
                            style={{
                                fontSize: "1.05rem",
                                whiteSpace: "pre-line",
                                lineHeight: "1.7",
                            }}
                        >
                            {course.description}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
