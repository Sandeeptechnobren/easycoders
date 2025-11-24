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
        // Placeholder for payment integration
        alert('Redirecting to payment gateway...');
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!course) return <div className="p-8">Course not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-8">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {course.category?.name}
                    </span>
                    <h1 className="text-4xl font-bold mt-4 mb-6">{course.title}</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Course Details</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li><strong>Duration:</strong> {course.duration}</li>
                                <li><strong>Level:</strong> {course.level}</li>
                                <li><strong>Price:</strong> ${course.price}</li>
                            </ul>
                        </div>
                        <div>
                            <button
                                onClick={handleEnroll}
                                className="w-full bg-green-600 text-white text-xl font-bold py-4 rounded-lg hover:bg-green-700 transition shadow-lg"
                            >
                                Enroll Now
                            </button>
                        </div>
                    </div>

                    <div className="prose max-w-none">
                        <h3 className="text-2xl font-bold mb-4">Description</h3>
                        <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
