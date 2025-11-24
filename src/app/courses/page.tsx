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
        const endpoint = categoryId ? `/courses?category_id=${categoryId}` : '/courses';
        api.get(endpoint).then(res => setCourses(res.data));
    }, [categoryId]);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Available Courses</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="p-6">
                                <div className="text-xs font-bold text-blue-600 uppercase mb-2">
                                    {course.category?.name}
                                </div>
                                <h2 className="text-xl font-bold mb-2">{course.title}</h2>
                                <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-green-600">${course.price}</span>
                                    <Link href={`/courses/${course.id}`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                        View Details
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
