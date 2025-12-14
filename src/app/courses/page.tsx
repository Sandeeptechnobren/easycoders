'use client';

import { Suspense, useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Loader from '../loader/page';

function CoursesList() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category');

    useEffect(() => {
        setLoading(true);

        const endpoint = categoryId
            ? `/courses?category_id=${categoryId}`
            : '/courses';

        api.get(endpoint)
            .then(res => {
                setCourses(res.data?.data ?? res.data);
            })
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, [categoryId]);

    if (loading) return <Loader />;

    /* ============================
       GROUP COURSES BY CATEGORY
    ============================ */
    const groupedCourses = courses.reduce((acc: any, course: any) => {
        const categoryName = course.category?.name || 'Other';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(course);
        return acc;
    }, {});

    return (
        <div className="d-flex flex-column gap-5">
            {Object.entries(groupedCourses).map(
                ([categoryName, categoryCourses]: any) => (
                    <div key={categoryName}>
                        {/* CATEGORY HEADER */}
                        <div
                            className="mb-4 px-4 py-3 rounded-3"
                            style={{
                                background: 'rgba(0,194,255,0.12)',
                                borderLeft: '5px solid #00c2ff',
                                boxShadow: '0 0 12px rgba(0,194,255,0.15)',
                            }}
                        >
                            <h2
                                className="mb-0 fw-bold"
                                style={{
                                    color: '#00c2ff',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {categoryName}
                                <span
                                    className="ms-3"
                                    style={{
                                        fontSize: '0.9rem',
                                        color: '#9ca3af',
                                    }}
                                >
                                    ({categoryCourses.length} Courses)
                                </span>
                            </h2>
                        </div>

                        {/* COURSES GRID */}
                        <div className="row g-4">
                            {categoryCourses.map((course: any) => (
                                <div
                                    key={course.id}
                                    className="col-12 col-md-4"
                                >
                                    <div
                                        className="rounded-4 h-100 position-relative"
                                        style={{
                                            background:
                                                'rgba(15, 15, 15, 0.85)',
                                            border:
                                                '1px solid rgba(0,194,255,0.18)',
                                            boxShadow:
                                                '0 0 20px rgba(0,194,255,0.1)',
                                            backdropFilter: 'blur(6px)',
                                            transition: '0.3s ease',
                                            padding: '1.5rem',
                                            paddingTop: course.offer
                                                ? '3.2rem'
                                                : '1.5rem', // ✅ SPACE FOR BADGE
                                        }}
                                    >
                                        {/* OFFER BADGE */}
                                        {course.offer && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    zIndex: 2,
                                                    background:
                                                        'linear-gradient(135deg, #ff9800, #ff5722)',
                                                    color: '#000',
                                                    padding:
                                                        '6px 12px',
                                                    fontSize:
                                                        '0.7rem',
                                                    fontWeight: 700,
                                                    borderRadius:
                                                        '20px',
                                                    boxShadow:
                                                        '0 0 12px rgba(255,152,0,0.6)',
                                                    textTransform:
                                                        'uppercase',
                                                    whiteSpace:
                                                        'nowrap',
                                                }}
                                            >
                                                {course.offer}
                                            </span>
                                        )}

                                        {/* COURSE TITLE */}
                                        <h4 className="fw-bold mb-2">
                                            {course.title}
                                        </h4>

                                        {/* DESCRIPTION */}
                                        <p
                                            style={{
                                                fontSize: '0.95rem',
                                                color: '#c9d1d9',
                                            }}
                                        >
                                            {course.description?.length >
                                                120
                                                ? course.description.slice(
                                                    0,
                                                    120
                                                ) + '...'
                                                : course.description}
                                        </p>

                                        {/* ACTION */}
                                        <div className="mt-4">
                                            <Link
                                                href={`/courses/${course.id}`}
                                                className="btn fw-bold px-3 py-2"
                                                style={{
                                                    background:
                                                        '#00c2ff',
                                                    color: '#000',
                                                    borderRadius:
                                                        '8px',
                                                    boxShadow:
                                                        '0 0 15px rgba(0,194,255,0.4)',
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
                )
            )}
        </div>
    );
}

export default function CoursesPage() {
    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: '#050505', color: 'white' }}
        >
            <div className="container">
                <h1
                    className="fw-bold mb-5 text-center"
                    style={{
                        color: '#00c2ff',
                        textShadow:
                            '0 0 12px rgba(0,194,255,0.4)',
                    }}
                >
                    Available Courses
                </h1>

                <Suspense fallback={<div>Loading...</div>}>
                    <CoursesList />
                </Suspense>
            </div>
        </div>
    );
}
