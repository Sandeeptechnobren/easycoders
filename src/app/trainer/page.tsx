'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import PunchInButton from '@/components/PunchInButton';

export default function TrainerDashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tasksRes, ticketsRes] = await Promise.all([
                    api.get('/tasks'),
                    api.get('/tickets'),
                ]);

                setTasks(tasksRes.data);
                setTickets(ticketsRes.data);
            } catch (error) {
                console.error('Failed to fetch trainer data:', error);
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

    if (loading)
        return (
            <div
                className="d-flex justify-content-center align-items-center min-vh-100"
                style={{ background: "#050505", color: "white" }}
            >
                Loading...
            </div>
        );

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
                            textShadow: "0 0 12px rgba(0,194,255,0.5)",
                        }}
                    >
                        Trainer Dashboard
                    </h1>

                    <button
                        onClick={handleLogout}
                        className="btn fw-bold px-4 py-2"
                        style={{
                            background: "#ff3b3b",
                            color: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 0 12px rgba(255,0,0,0.4)",
                        }}
                    >
                        Logout
                    </button>
                </div>

                {/* PUNCH-IN BUTTON */}
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
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3
                                    className="fw-bold"
                                    style={{ color: "#14f4ff" }}
                                >
                                    Assigned Tasks
                                </h3>

                                <button
                                    className="btn fw-bold"
                                    style={{
                                        background: "#00c2ff",
                                        color: "#000",
                                        borderRadius: "10px",
                                        boxShadow: "0 0 12px rgba(0,194,255,0.45)",
                                    }}
                                >
                                    Assign New Task
                                </button>
                            </div>

                            <ul className="list-unstyled">
                                {tasks.map((task) => (
                                    <li
                                        key={task.id}
                                        className="py-3 border-bottom border-secondary"
                                    >
                                        <h5 className="fw-bold text-white">{task.title}</h5>
                                        <small className="text-muted">
                                            Student: {task.student?.name}
                                        </small>
                                        <br />
                                        <span
                                            className="badge mt-2"
                                            style={{
                                                background: "#333",
                                                color: "#14f4ff",
                                                border: "1px solid rgba(0,194,255,0.3)",
                                            }}
                                        >
                                            {task.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* TICKETS PANEL */}
                    <div className="col-md-6">
                        <div
                            className="p-4 rounded-4 h-100"
                            style={{
                                background: "rgba(15,15,15,0.85)",
                                border: "1px solid rgba(0,255,157,0.25)",
                                boxShadow: "0 0 20px rgba(0,255,157,0.15)",
                                backdropFilter: "blur(6px)",
                            }}
                        >
                            <h3
                                className="fw-bold mb-3"
                                style={{ color: "#00ff9d" }}
                            >
                                Help Desk Tickets
                            </h3>

                            <ul className="list-unstyled">
                                {tickets.map((ticket) => (
                                    <li
                                        key={ticket.id}
                                        className="py-3 border-bottom border-secondary"
                                    >
                                        <div className="d-flex justify-content-between">
                                            <div>
                                                <h5 className="fw-bold text-white">{ticket.title}</h5>
                                                <small className="text-muted">
                                                    Student: {ticket.student?.name}
                                                </small>

                                                <p className="text-light mt-2">{ticket.description}</p>
                                            </div>

                                            {/* STATUS BADGE */}
                                            <span
                                                className="badge"
                                                style={{
                                                    background: ticket.status === 'open'
                                                        ? "rgba(255,193,7,0.2)"
                                                        : "rgba(0,255,157,0.2)",
                                                    color: ticket.status === 'open'
                                                        ? "#ffc107"
                                                        : "#00ff9d",
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    padding: "6px 10px",
                                                    height: "fit-content",
                                                }}
                                            >
                                                {ticket.status}
                                            </span>
                                        </div>

                                        {/* REPLY FORM */}
                                        {ticket.status === 'open' && (
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    api.put(`/tickets/${ticket.id}`, {
                                                        trainer_reply: formData.get('reply'),
                                                        status: 'closed',
                                                    }).then(() => window.location.reload());
                                                }}
                                                className="d-flex gap-2 mt-3"
                                            >
                                                <input
                                                    name="reply"
                                                    placeholder="Write a reply..."
                                                    className="form-control bg-dark text-white border-secondary"
                                                    required
                                                    style={{ borderRadius: "8px" }}
                                                />
                                                <button
                                                    type="submit"
                                                    className="btn fw-bold"
                                                    style={{
                                                        background: "#00ff9d",
                                                        color: "#000",
                                                        borderRadius: "10px",
                                                        boxShadow: "0 0 12px rgba(0,255,157,0.45)",
                                                    }}
                                                >
                                                    Reply & Close
                                                </button>
                                            </form>
                                        )}

                                        {/* TRAINER REPLY */}
                                        {ticket.trainer_reply && (
                                            <div
                                                className="mt-3 p-2 rounded"
                                                style={{
                                                    background: "rgba(255,255,255,0.05)",
                                                    borderLeft: "3px solid #00ff9d",
                                                }}
                                            >
                                                <strong>Reply:</strong> {ticket.trainer_reply}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
