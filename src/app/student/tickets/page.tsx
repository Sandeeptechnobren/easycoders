'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../../loader/page';

export default function Tickets() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addTicketPopup, setAddTicketPopup] = useState(false);

    const [title, setTitle] = useState('');
    const [task_category, setTaskCategory] = useState('');
    const [description, setDescription] = useState('');

    const [taskCategories, setTaskCategories] = useState<any[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const fetchTickets = () => {
        setLoading(true);
        api.get('/student/myTickets')
            .then(res => setTickets(res.data?.data ?? []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        api.get('/getTaskCategories')
            .then(res => setTaskCategories(res.data?.data ?? []))
            .finally(() => setLoadingCategories(false));
    }, []);

    const handleTicketSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        api.post('/student/createMyTicket', {
            title,
            description,
            task_category,
        }).then(() => {
            fetchTickets();
            setAddTicketPopup(false);
            setTitle('');
            setTaskCategory('');
            setDescription('');
        });
    };

    if (loading || loadingCategories) return <Loader />;

    return (
        <div className="min-vh-100 py-5" style={{ background: "#050505", color: "white" }}>
            <div className="container">
                {/* Page Header */}
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h1 className="fw-bold mb-2" style={{ color: "#00c2ff", textShadow: "0 0 12px rgba(0,194,255,0.5)" }}>
                            Support Tickets
                        </h1>
                        <p className="text-white mb-0">Raise and track your support requests</p>
                    </div>
                    <button
                        className="btn fw-bold px-4 py-2"
                        onClick={() => setAddTicketPopup(true)}
                        style={{
                            background: "linear-gradient(45deg, #00c2ff, #00ff9d)",
                            border: "none",
                            color: "#000",
                            borderRadius: "12px",
                            boxShadow: "0 0 15px rgba(0,194,255,0.3)"
                        }}
                    >
                        + Raise Ticket
                    </button>
                </div>

                {/* Tickets Table Card */}
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
                        <table className="table" style={{ color: "white" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.1)" }}>
                                    <th className="py-3 bg-transparent text-white border-0">ID</th>
                                    <th className="py-3 bg-transparent text-white border-0">Title</th>
                                    <th className="py-3 bg-transparent text-white border-0">Description</th>
                                    <th className="py-3 bg-transparent text-white border-0">Status</th>
                                    <th className="py-3 bg-transparent text-white border-0">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 border-0">
                                            <div className="text-muted opacity-50">
                                                <h6>No tickets yet</h6>
                                                <p className="mb-0 small">Raise a ticket to get support</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td className="py-3 bg-transparent border-0 font-monospace text-white">
                                                #{ticket.ticket_id}
                                            </td>
                                            <td className="py-3 bg-transparent text-white border-0 fw-semibold">
                                                {ticket.title}
                                            </td>
                                            <td className="py-3 bg-transparent border-0 text-white" style={{ maxWidth: "250px" }}>
                                                <div className="text-truncate">{ticket.description}</div>
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
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="py-3 bg-transparent border-0 text-white">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Overlay */}
                {addTicketPopup && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                        style={{
                            background: "rgba(0,0,0,0.8)",
                            zIndex: 1050,
                            backdropFilter: "blur(5px)"
                        }}
                    >
                        <div
                            className="p-4 rounded-4 shadow-lg w-100"
                            style={{
                                maxWidth: "600px",
                                background: "#111",
                                border: "1px solid rgba(255,255,255,0.1)"
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold m-0 text-white">Raise New Ticket</h3>
                                <button
                                    onClick={() => setAddTicketPopup(false)}
                                    className="btn btn-link text-white text-decoration-none fs-4 p-0"
                                >
                                    &times;
                                </button>
                            </div>

                            <form onSubmit={handleTicketSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-white small text-uppercase fw-bold">Title</label>
                                    <input
                                        className="form-control bg-dark border-secondary text-white"
                                        style={{ borderColor: "rgba(255,255,255,0.1)" }}
                                        placeholder="Brief summary of the issue"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label text-white small text-uppercase fw-bold">Category</label>
                                    <select
                                        className="form-select bg-dark border-secondary text-white"
                                        style={{ borderColor: "rgba(255,255,255,0.1)" }}
                                        value={task_category}
                                        onChange={e => setTaskCategory(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {taskCategories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-white small text-uppercase fw-bold">Description</label>
                                    <textarea
                                        className="form-control bg-dark border-secondary text-white"
                                        style={{ borderColor: "rgba(255,255,255,0.1)" }}
                                        rows={5}
                                        placeholder="Detailed explanation..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary px-4"
                                        onClick={() => setAddTicketPopup(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn fw-bold px-4"
                                        style={{
                                            background: "#00c2ff",
                                            color: "#000",
                                            border: "none",
                                            boxShadow: "0 0 10px rgba(0,194,255,0.4)"
                                        }}
                                    >
                                        Submit Ticket
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
