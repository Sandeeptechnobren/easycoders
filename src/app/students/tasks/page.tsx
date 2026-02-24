'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../../loader/page';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskCategories, setTaskCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);


    useEffect(() => {
        api.get('/student/tasks', {
            params: {
                category_id: selectedCategory,
            },
        })
            .then(res => {
                setTasks(res.data?.data ?? res.data);
            })
            .finally(() => setLoadingTasks(false));
    }, [selectedCategory]);
    useEffect(() => {
        api.get('/getTaskCategories')
            .then(res => {
                setTaskCategories(res.data?.data ?? res.data);
            })
            .finally(() => setLoadingCategories(false));
    }, []);

    if (loadingTasks || loadingCategories) return <Loader />;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-4 mt-2">My Tasks</h4>
                <select
                    className="form-select w-25"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">All</option>
                    {taskCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="card shadow-sm">

                <div className="card-body table-responsive">
                    {tasks.length === 0 ? (
                        <p className="text-center text-muted">No tasks assigned yet.</p>
                    ) : (
                        <table className="table table-bordered table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Output Image</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task, index) => (
                                    <tr key={task.id}>
                                        <td>{index + 1}</td>

                                        <td className="fw-semibold">
                                            {task.title}
                                        </td>

                                        <td style={{ maxWidth: 300 }}>
                                            {task.description}
                                        </td>

                                        <td>
                                            <span className="badge bg-info text-dark">
                                                {task.category?.name ?? 'N/A'}
                                            </span>
                                        </td>

                                        <td className="text-center">
                                            {task.image ? (
                                                <img
                                                    src={task.image}
                                                    alt="Task Output"
                                                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                                                    className="rounded border"
                                                />
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>

                                        <td>
                                            <span
                                                className={`badge ${task.status === 'completed'
                                                    ? 'bg-success'
                                                    : task.status === 'pending'
                                                        ? 'bg-warning text-dark'
                                                        : 'bg-secondary'
                                                    }`}
                                            >
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
