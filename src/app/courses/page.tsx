'use client';

import { Suspense, useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Loader from '../loader/page';

function CoursesList() {
    const [courses, setCourses] = useState<any[]>([]);
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('category');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const endpoint = categoryId
            ? `/courses?category_id=${categoryId}`
            : '/courses';

        api.get(endpoint)
            .then(res => {
                // works for both direct array and {data:[]}
                setCourses(res.data?.data ?? res.data);
            })
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, [categoryId]);
    if (loading) return <Loader />;

    return (
        <div className="row g-4">
            {courses.map(course => (
                <div key={course.id} className="col-12 col-md-4">
                    <div
                        className="p-4 rounded-4 h-100 position-relative"
                        style={{
                            background: 'rgba(15, 15, 15, 0.85)',
                            border: '1px solid rgba(0,194,255,0.18)',
                            boxShadow: '0 0 20px rgba(0,194,255,0.1)',
                            backdropFilter: 'blur(6px)',
                            transition: '0.3s ease',
                        }}
                    >
                        {course.offer && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background:
                                        'linear-gradient(135deg, #ff9800, #ff5722)',
                                    color: '#000',
                                    padding: '6px 10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    borderRadius: '20px',
                                    boxShadow:
                                        '0 0 12px rgba(255,152,0,0.6)',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {course.offer}
                            </span>
                        )}

                        <span
                            className="small fw-bold text-uppercase"
                            style={{ color: '#14f4ff' }}
                        >
                            {course.category?.name}
                        </span>

                        <h3 className="fw-bold mt-2 mb-2">
                            {course.title}
                        </h3>

                        <p
                            className="text-gray"
                            style={{ fontSize: '0.95rem' }}
                        >
                            {course.description?.length > 120
                                ? course.description.slice(0, 120) + '...'
                                : course.description}
                        </p>

                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <Link
                                href={`/courses/${course.id}`}
                                className="btn fw-bold px-3 py-2"
                                style={{
                                    background: '#00c2ff',
                                    color: '#000',
                                    borderRadius: '8px',
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

                <Suspense
                    fallback={
                        <div className="text-center">
                            Loading...
                        </div>
                    }
                >
                    <CoursesList />
                </Suspense>
            </div>
        </div>
    );
}
