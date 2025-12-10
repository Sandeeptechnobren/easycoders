'use client';
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function AddCategory() {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const [children, setChildren] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        api.get('/categories').then(res => setChildren(res.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/addCategory', { name, parentId });
            router.push('/admin');
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <div className="container">
            <h1>Add Category</h1>
            <form onSubmit={handleSubmit} className="mt-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-control" placeholder="Name" />
                <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="form-select">
                    <option value="">Select Parent Category</option>
                    {children.map((child: any) => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                </select>
                <button type="submit" className="btn btn-primary">Add Category</button>
            </form>
        </div>
    )
}