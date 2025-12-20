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
        <div className="min-vh-100 py-5" style={{ background: "#050505", color: "white" }}>
            <div className="container">
                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h1 className="fw-bold mb-2" style={{ color: "#00c2ff", textShadow: "0 0 12px rgba(0,194,255,0.5)" }}>
                            My Tasks
                        </h1>
                        <p className="text-white mb-0">Track and manage your assigned tasks</p>
                    </div>

                    <div className="position-relative" style={{ width: "250px" }}>
                        <select
                            className="form-select bg-dark text-white border-0 shadow-none"
                            style={{
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "10px",
                                padding: "10px 15px",
                                outline: "none",
                                cursor: "pointer"
                            }}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {taskCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tasks Table Card */}
                <div
                    className="p-4 rounded-4"
                    style={{
                        background: "rgba(20,20,20,0.6)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                    }}
                >
                    <div className="table-responsive">
                        {tasks.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="text-muted opacity-50">
                                    <i className="bi bi-clipboard-check fs-1 mb-3 d-block"></i>
                                    <h6>No tasks available</h6>
                                    <p className="mb-0 small">Tasks assigned to you will appear here</p>
                                </div>
                            </div>
                        ) : (
                            <table className="table" style={{ color: "white" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                                        <th className="py-3 bg-transparent text-white border-0">#</th>
                                        <th className="py-3 bg-transparent text-white border-0">Title</th>
                                        <th className="py-3 bg-transparent text-white border-0">Description</th>
                                        <th className="py-3 bg-transparent text-white border-0">Category</th>
                                        <th className="py-3 bg-transparent text-white border-0 text-center">Output</th>
                                        <th className="py-3 bg-transparent text-white border-0">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task, index) => (
                                        <tr key={task.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                            <td className="py-3 bg-transparent text-white border-0 font-monospace text-white">
                                                {index + 1}
                                            </td>
                                            <td className="py-3 bg-transparent text-white border-0 fw-semibold">
                                                {task.title}
                                            </td>
                                            <td className="py-3 bg-transparent text-white border-0" style={{ maxWidth: "300px" }}>
                                                <div className="text-truncate">{task.description}</div>
                                            </td>
                                            <td className="py-3 bg-transparent border-0">
                                                <span
                                                    className="badge px-3 py-2 rounded-pill"
                                                    style={{
                                                        background: "rgba(0,194,255,0.15)",
                                                        color: "#00c2ff",
                                                        border: "1px solid rgba(0,194,255,0.3)"
                                                    }}
                                                >
                                                    {task.category?.name ?? 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3 bg-transparent border-0 text-center">
                                                {task.image ? (
                                                    <img
                                                        src={task.image}
                                                        alt="Task Output"
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            border: "2px solid rgba(255,255,255,0.2)",
                                                            boxShadow: "0 0 10px rgba(0,0,0,0.5)"
                                                        }}
                                                        className="rounded-3"
                                                    />
                                                ) : (
                                                    <span className="text-white opacity-50 small">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 bg-transparent border-0">
                                                <span
                                                    className="badge px-3 py-2 rounded-pill"
                                                    style={{
                                                        background: task.status === 'completed' ? 'rgba(0,255,157,0.15)' :
                                                            task.status === 'pending' ? 'rgba(255,193,7,0.15)' : 'rgba(255,255,255,0.1)',
                                                        color: task.status === 'completed' ? '#00ff9d' :
                                                            task.status === 'pending' ? '#ffc107' : '#fff',
                                                        border: `1px solid ${task.status === 'completed' ? 'rgba(0,255,157,0.3)' :
                                                            task.status === 'pending' ? 'rgba(255,193,7,0.3)' : 'rgba(255,255,255,0.2)'}`
                                                    }}
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
        </div>
    );
}
