'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import PunchInButton from '@/components/PunchInButton';
import Loader from "../loader/page";
export default function StudentDashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, ticketsRes] = await Promise.all([
                    api.get('/tasks'),
                    api.get('/tickets')
                ]);
                setTasks(tasksRes.data);
                setTickets(ticketsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };
if (loading) return <Loader />;

    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: "#050505", color: "white" }}
        >
            <div className="container">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1
                        className="fw-bold"
                        style={{
                            color: "#00c2ff",
                            textShadow: "0 0 12px rgba(0,194,255,0.5)"
                        }}
                    >
                        Student Dashboard
                    </h1>
{/* 
                    <button
                        onClick={handleLogout}
                        className="btn fw-bold px-4 py-2"
                        style={{
                            background: "#ff3b3b",
                            color: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 0 12px rgba(255,0,0,0.4)"
                        }}
                    >
                        Logout
                    </button> */}
                </div>

                {/* PUNCH IN */}
                <div className="mb-4">
                    <PunchInButton />
                </div>

                <div className="row g-4">

                    {/* TASKS PANEL */}
                    <div className="col-md-6">
                        <div
                            className="p-4 rounded-4 h-100"
                            style={{
                                background: "rgba(15,15,15,0.85)",
                                border: "1px solid rgba(0,194,255,0.25)",
                                boxShadow: "0 0 20px rgba(0,194,255,0.15)",
                                backdropFilter: "blur(6px)"
                            }}
                        >
                            <h3
                                className="fw-bold mb-3"
                                style={{ color: "#14f4ff" }}
                            >
                                My Tasks
                            </h3>

                            {tasks.length === 0 ? (
                                <p className="text-muted">No tasks assigned yet.</p>
                            ) : (
                                <ul className="list-unstyled">
                                    {tasks.map((task) => (
                                        <li
                                            key={task.id}
                                            className="py-3 border-bottom border-secondary"
                                        >
                                            <h5 className="fw-bold text-white">{task.title}</h5>
                                            <p className="text-muted">{task.description}</p>

                                            <span
                                                className="badge px-3 py-2"
                                                style={{
                                                    background:
                                                        task.status === "completed"
                                                            ? "rgba(0,255,157,0.2)"
                                                            : "rgba(255,193,7,0.2)",
                                                    color:
                                                        task.status === "completed"
                                                            ? "#00ff9d"
                                                            : "#ffc107",
                                                    border: "1px solid rgba(255,255,255,0.2)"
                                                }}
                                            >
                                                {task.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* COURSES PANEL */}
                    <div className="col-md-6">
                        <div
                            className="p-4 rounded-4 h-100"
                            style={{
                                background: "rgba(15,15,15,0.85)",
                                border: "1px solid rgba(0,255,157,0.25)",
                                boxShadow: "0 0 20px rgba(0,255,157,0.15)",
                                backdropFilter: "blur(6px)"
                            }}
                        >
                            <h3
                                className="fw-bold mb-3"
                                style={{ color: "#00ff9d" }}
                            >
                                My Courses
                            </h3>

                            <p className="text-muted">
                                Enrolled courses will appear here.
                            </p>
                        </div>
                    </div>
                </div>

                {/* TICKETS PANEL */}
                <div
                    className="mt-5 p-4 rounded-4"
                    style={{
                        background: "rgba(15,15,15,0.85)",
                        border: "1px solid rgba(0,194,255,0.25)",
                        boxShadow: "0 0 20px rgba(0,194,255,0.15)",
                        backdropFilter: "blur(6px)"
                    }}
                >
                    <h3
                        className="fw-bold mb-3"
                        style={{ color: "#14f4ff" }}
                    >
                        Support Tickets
                    </h3>

                    {/* Raise Ticket Form */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            api.post('/tickets', {
                                title: formData.get('title'),
                                description: formData.get('description')
                            }).then(() => window.location.reload());
                        }}
                        className="mb-4"
                    >
                        <input
                            name="title"
                            placeholder="Issue Title"
                            required
                            className="form-control bg-dark text-white border-secondary mb-3"
                            style={{ borderRadius: "8px" }}
                        />
                        <textarea
                            name="description"
                            placeholder="Describe your issue..."
                            required
                            className="form-control bg-dark text-white border-secondary mb-3"
                            rows={3}
                            style={{ borderRadius: "8px" }}
                        />
                        <button
                            type="submit"
                            className="btn fw-bold"
                            style={{
                                background: "#00c2ff",
                                color: "#000",
                                borderRadius: "10px",
                                boxShadow: "0 0 12px rgba(0,194,255,0.45)"
                            }}
                        >
                            Raise Ticket
                        </button>
                    </form>

                    {/* Existing Tickets */}
                    <h4 className="fw-bold mb-3">My Tickets</h4>

                    <ul className="list-unstyled">
                        {tickets.map((ticket) => (
                            <li
                                key={ticket.id}
                                className="py-3 border-bottom border-secondary"
                            >
                                <div className="d-flex justify-content-between">
                                    <strong>{ticket.title}</strong>

                                    <span
                                        className="badge px-3 py-2"
                                        style={{
                                            background:
                                                ticket.status === "open"
                                                    ? "rgba(255,193,7,0.2)"
                                                    : "rgba(0,255,157,0.2)",
                                            color:
                                                ticket.status === "open"
                                                    ? "#ffc107"
                                                    : "#00ff9d",
                                            border: "1px solid rgba(255,255,255,0.2)"
                                        }}
                                    >
                                        {ticket.status}
                                    </span>
                                </div>

                                <p className="text-muted mt-2">{ticket.description}</p>

                                {ticket.trainer_reply && (
                                    <div
                                        className="mt-2 p-2 rounded"
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            borderLeft: "3px solid #00ff9d"
                                        }}
                                    >
                                        <strong>Trainer Reply:</strong> {ticket.trainer_reply}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}
