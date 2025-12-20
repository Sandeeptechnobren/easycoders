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
        <div className="container py-4">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">🎫 My Support Tickets</h3>
                    <p className="text-muted mb-0">
                        Raise and track your support requests
                    </p>
                </div>
                <button
                    className="btn btn-primary px-4"
                    onClick={() => setAddTicketPopup(true)}
                >
                    + Raise Ticket
                </button>
            </div>

            {/* Tickets Table */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Ticket ID</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5">
                                        <div className="text-muted">
                                            <h6>No tickets yet</h6>
                                            <p className="mb-0">
                                                Raise a ticket to get support
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                tickets.map((ticket, index) => (
                                    <tr key={ticket.id}>
                                        <td>{index + 1}</td>
                                        <td className="fw-semibold">
                                            {ticket.ticket_id}
                                        </td>
                                        <td>{ticket.title}</td>
                                        <td
                                            style={{
                                                maxWidth: 250,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {ticket.description}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${ticket.status === 'open'
                                                        ? 'bg-warning text-dark'
                                                        : 'bg-success'
                                                    }`}
                                            >
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="text-muted">
                                            {new Date(
                                                ticket.created_at
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <div
                className={`modal fade ${addTicketPopup ? 'show d-block' : ''}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            >
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-3">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-semibold">
                                🎫 Raise Support Ticket
                            </h5>
                            <button
                                className="btn-close btn-close-white"
                                onClick={() => setAddTicketPopup(false)}
                            />
                        </div>

                        <form onSubmit={handleTicketSubmit}>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            Ticket Title
                                        </label>
                                        <input
                                            className="form-control"
                                            placeholder="Short issue title"
                                            value={title}
                                            onChange={e =>
                                                setTitle(e.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">
                                            Category
                                        </label>
                                        <select
                                            className="form-select"
                                            value={task_category}
                                            onChange={e =>
                                                setTaskCategory(e.target.value)
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select category
                                            </option>
                                            {taskCategories.map(category => (
                                                <option
                                                    key={category.id}
                                                    value={category.id}
                                                >
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            Description
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            placeholder="Describe your issue clearly..."
                                            value={description}
                                            onChange={e =>
                                                setDescription(e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer bg-light">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setAddTicketPopup(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4"
                                >
                                    Create Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
