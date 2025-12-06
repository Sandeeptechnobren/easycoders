'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function CollegeDashboard() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await api.get('/college/students');
                setStudents(response.data);
            } catch (error) {
                console.error('Failed to fetch students', error);
                router.push('/college/login');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [router]);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">College Dashboard</h1>
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('role');
                            router.push('/college/login');
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.enrollments?.length || 0} Courses
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.assigned_tasks?.length || 0} Tasks
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.attendances?.length || 0} Days
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
