'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function StudentManagement() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        college: '',
        batch: '',
        phone: '',
        email: '',
        password: '',
        paid_amount: '',
        payment_method: '',
        transaction_id: '',
        receipt_id: '',
    });

    useEffect(() => {
        const pwd =
            'EC26' +
            Math.random().toString(36).substring(2, 8);
        setForm(prev => ({ ...prev, password: pwd }));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await api.post('/register', {
            ...form,
            role: 'student',
        });

        router.push('/students');
    };

    return (
        <div className="container py-5">
            <div className="card shadow-lg border-0">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">🎓 Student Registration</h4>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">

                            {/* Name */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Full Name
                                </label>
                                <input
                                    name="name"
                                    className="form-control"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* College */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    College
                                </label>
                                <input
                                    name="college"
                                    className="form-control"
                                    value={form.college}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Batch */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">
                                    Batch
                                </label>
                                <input
                                    name="batch"
                                    className="form-control"
                                    placeholder="2024-25"
                                    value={form.batch}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">
                                    Phone Number
                                </label>
                                <input
                                    name="phone"
                                    className="form-control"
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Password (Auto Generated) */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Password (Auto Generated)
                                </label>
                                <input
                                    className="form-control bg-light"
                                    value={form.password}
                                    readOnly
                                />
                                <small className="text-muted">
                                    Share this password with the student
                                </small>
                            </div>

                            {/* Paid Amount */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Paid Amount
                                </label>
                                <input
                                    name="paid_amount"
                                    className="form-control"
                                    value={form.paid_amount}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Payment Method */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Payment Method
                                </label>
                                <select
                                    name="payment_method"
                                    className="form-select"
                                    value={form.payment_method}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select</option>
                                    <option value="cash">Cash</option>
                                    <option value="online">Online</option>
                                </select>
                            </div>

                            {/* Transaction ID */}
                            {form.payment_method === 'online' && (
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Transaction ID
                                    </label>
                                    <input
                                        name="transaction_id"
                                        className="form-control"
                                        value={form.transaction_id}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            )}

                            {/* Receipt ID */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Receipt ID
                                </label>
                                <input
                                    name="receipt_id"
                                    className="form-control"
                                    value={form.receipt_id}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="text-end mt-4">
                            <button className="btn btn-primary px-5">
                                Register Student
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
