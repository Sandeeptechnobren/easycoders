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
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Categories</h2>
                    <ul>
                        {categories.map((cat) => (
                            <li key={cat.id} className="border-b py-2">
                                {cat.name}
                                {cat.children && cat.children.length > 0 && (
                                    <ul className="ml-4 text-sm text-gray-600">
                                        {cat.children.map((child: any) => (
                                            <li key={child.id}>- {child.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        <button className="w-full bg-blue-600 text-white p-2 rounded">Add Course</button>
                        <button className="w-full bg-green-600 text-white p-2 rounded">Add Category</button>
                    </div>

                    <h2 className="text-xl font-semibold mt-8 mb-4">Update About Us</h2>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        api.post('/about', {
                            title: formData.get('title'),
                            content: formData.get('content'),
                            image_url: formData.get('image_url')
                        }).then(() => alert('Updated successfully!'));
                    }} className="space-y-4">
                        <input name="title" placeholder="Title" className="w-full p-2 border rounded" required />
                        <textarea name="content" placeholder="Content" className="w-full p-2 border rounded h-32" required></textarea>
                        <input name="image_url" placeholder="Image URL (Optional)" className="w-full p-2 border rounded" />
                        <button type="submit" className="w-full bg-secondary text-white p-2 rounded hover:bg-gray-800">Update Content</button>
                    </form>
                </div>
            </div>

            <AdminAttendanceSettings />
        </div>
    );
}
