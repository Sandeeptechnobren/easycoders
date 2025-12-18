'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../../loader/page';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/tasks').then(res => {
            setTasks(res.data?.data ?? res.data);
            setLoading(false);
        });
    }, []);
    if (loading) return <Loader />;
    return (
        <div>
            <h1>My Tasks</h1>
            <ul>
                {tasks.map((task: any) => (
                    <li key={task.id}>{task.title}</li>
                ))}
            </ul>
        </div>
    );
}
