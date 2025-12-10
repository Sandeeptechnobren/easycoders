'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function AddCourse() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [children, setChildren] = useState<any[]>([]);
    const router = useRouter();
    useEffect(() => {
        api.get('/courses').then(res => setChildren(res.data));
    }, [])
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/addCourse', { name, description, categoryID: categoryId });
            router.push('/admin');
        } catch (error) {
            console.error(error);
        }
    }
    return (
        <div>
            <h1>Add Course</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select Category</option>
                    {children.map((child: any) => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                </select>
                <button type="submit">Add Course</button>
            </form>
        </div>
    )
}