'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category');

    useEffect(() => {
        const endpoint = categoryId
            ? `/courses?category_id=${categoryId}`
            : '/courses';

        api.get(endpoint).then(res => setCourses(res.data));
    }, [categoryId]);

    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: "#050505", color: "white" }}
        >
            <div className="container">

                {/* PAGE TITLE */}
                <h1
                    className="fw-bold mb-5 text-center"
                    style={{
                        color: "#00c2ff",
                        textShadow: "0 0 12px rgba(0,194,255,0.4)",
                    }}
                >
                    Available Courses
                </h1>

                {/* GRID OF COURSES */}
                <div className="row g-4">
                    {courses.map((course) => (
                        <div key={course.id} className="col-12 col-md-4">

                            <div
                                className="p-4 rounded-4 h-100"
                                style={{
                                    background: "rgba(15, 15, 15, 0.85)",
                                    border: "1px solid rgba(0,194,255,0.18)",
                                    boxShadow: "0 0 20px rgba(0,194,255,0.1)",
                                    backdropFilter: "blur(6px)",
                                    transition: "0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 25px rgba(0,194,255,0.35)");
                                    e.currentTarget.style.border =
                                        "1px solid rgba(0,194,255,0.45)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 20px rgba(0,194,255,0.1)");
                                    e.currentTarget.style.border =
                                        "1px solid rgba(0,194,255,0.18)";
                                }}
                            >
                                {/* CATEGORY */}
                                <span
                                    className="small fw-bold text-uppercase"
                                    style={{ color: "#14f4ff" }}
                                >
                                    {course.category?.name}
                                </span>

                                {/* TITLE */}
                                <h3 className="fw-bold mt-2 mb-2">{course.title}</h3>

                                {/* DESCRIPTION */}
                                <p className="text-muted" style={{ fontSize: "0.95rem" }}>
                                    {course.description?.length > 120
                                        ? course.description.slice(0, 120) + '...'
                                        : course.description}
                                </p>

                                {/* PRICE + BUTTON */}
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <span
                                        className="fw-bold"
                                        style={{ color: "#00ff9d", fontSize: "1.25rem" }}
                                    >
                                        ₹{course.price}
                                    </span>

                                    <Link
                                        href={`/courses/${course.id}`}
                                        className="btn fw-bold px-3 py-2"
                                        style={{
                                            background: "#00c2ff",
                                            color: "#000",
                                            borderRadius: "8px",
                                            boxShadow: "0 0 15px rgba(0,194,255,0.4)",
                                        }}
                                    >
                                        View Details →
                                    </Link>
                                </div>

                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
