'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const pwd = 'EC' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setForm(prev => ({ ...prev, password: pwd }));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/register', {
                ...form,
                role: 'student',
            });
            router.push('/students');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
    };

    const inputFocusScale = { scale: 1.01, boxShadow: "0 0 0 2px rgba(0, 194, 255, 0.4)" };
    const buttonHoverScale = { scale: 1.02, boxShadow: "0 0 25px rgba(0, 194, 255, 0.5)" };
    const buttonTapScale = { scale: 0.98 };

    return (
        <motion.div
            className="min-vh-100 py-5"
            style={{ background: "#09090b", color: "#e4e4e7" }}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-10 col-xl-9">

                        {/* Header */}
                        <div className="d-flex justify-content-between align-items-end mb-5">
                            <div>
                                <motion.h6
                                    className="text-uppercase fw-bold ls-2 mb-2"
                                    style={{ color: "#00c2ff", letterSpacing: "2px", fontSize: "0.75rem" }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Administration
                                </motion.h6>
                                <motion.h2
                                    className="fw-bold mb-0 text-white display-6"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    New Student Registration
                                </motion.h2>
                            </div>
                            <motion.button
                                onClick={() => router.back()}
                                className="btn btn-outline-light border-0 opacity-75 d-none d-md-block"
                                whileHover={{ scale: 1.05, opacity: 1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <i className="bi bi-arrow-left me-2"></i> Back to List
                            </motion.button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Personal Details Section */}
                            <motion.div className="mb-5" variants={itemVariants}>
                                <h5 className="mb-4 pb-2 border-bottom border-secondary border-opacity-25 text-white">
                                    <i className="bi bi-person-badge me-2 text-primary"></i>
                                    Personal Details
                                </h5>
                                <div className="row g-4">
                                    {/* Name Input */}
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label text-secondary small text-uppercase fw-bold">Full Name</label>
                                            <motion.div className="input-group" whileHover={{ scale: 1.01 }}>
                                                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                                                    <i className="bi bi-person"></i>
                                                </span>
                                                <motion.input
                                                    name="name"
                                                    className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                    placeholder="Enter full name"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    required
                                                    whileFocus={inputFocusScale}
                                                    transition={{ type: "spring", stiffness: 300 }}
                                                />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* College Input */}
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label className="form-label text-secondary small text-uppercase fw-bold">College / Institution</label>
                                            <motion.div className="input-group" whileHover={{ scale: 1.01 }}>
                                                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                                                    <i className="bi bi-building"></i>
                                                </span>
                                                <motion.input
                                                    name="college"
                                                    className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                    placeholder="Enter college name"
                                                    value={form.college}
                                                    onChange={handleChange}
                                                    required
                                                    whileFocus={inputFocusScale}
                                                />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Batch Input */}
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="form-label text-secondary small text-uppercase fw-bold">Batch Year</label>
                                            <motion.input
                                                name="batch"
                                                className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                placeholder="e.g. 2024-2025"
                                                value={form.batch}
                                                onChange={handleChange}
                                                required
                                                whileFocus={inputFocusScale}
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Input */}
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="form-label text-secondary small text-uppercase fw-bold">Phone Number</label>
                                            <motion.div className="input-group" whileHover={{ scale: 1.01 }}>
                                                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                                                    <i className="bi bi-telephone"></i>
                                                </span>
                                                <motion.input
                                                    name="phone"
                                                    className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                    placeholder="+91..."
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    required
                                                    whileFocus={inputFocusScale}
                                                />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Email Input */}
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="form-label text-secondary small text-uppercase fw-bold">Email Address</label>
                                            <motion.div className="input-group" whileHover={{ scale: 1.01 }}>
                                                <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary">
                                                    <i className="bi bi-envelope"></i>
                                                </span>
                                                <motion.input
                                                    type="email"
                                                    name="email"
                                                    className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                    placeholder="name@example.com"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    required
                                                    whileFocus={inputFocusScale}
                                                />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Payment & Security Section */}
                            <motion.div
                                className="p-4 rounded-4 mb-4"
                                style={{ background: "rgba(30, 30, 35, 0.4)", border: "1px solid rgba(255,255,255,0.05)" }}
                                variants={itemVariants}
                            >
                                <h5 className="mb-4 text-white">
                                    <i className="bi bi-credit-card me-2 text-info"></i>
                                    Payment & Account Setup
                                </h5>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label text-secondary small text-uppercase fw-bold">Payment Method</label>
                                        <motion.select
                                            name="payment_method"
                                            className="form-select bg-dark border-secondary border-opacity-25 text-white py-2"
                                            value={form.payment_method}
                                            onChange={handleChange}
                                            required
                                            whileFocus={inputFocusScale}
                                        >
                                            <option value="">Select Method</option>
                                            <option value="cash">Cash Payment</option>
                                            <option value="online">Online Transfer / UPI</option>
                                        </motion.select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-secondary small text-uppercase fw-bold">Amount Paid</label>
                                        <motion.div className="input-group" whileHover={{ scale: 1.01 }}>
                                            <span className="input-group-text bg-dark border-secondary border-opacity-25 text-secondary fw-bold">₹</span>
                                            <motion.input
                                                name="paid_amount"
                                                className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                placeholder="0.00"
                                                value={form.paid_amount}
                                                onChange={handleChange}
                                                required
                                                whileFocus={inputFocusScale}
                                            />
                                        </motion.div>
                                    </div>

                                    {form.payment_method === 'online' && (
                                        <motion.div
                                            className="col-md-6"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="form-label text-secondary small text-uppercase fw-bold">Transaction Reference ID</label>
                                            <motion.input
                                                name="transaction_id"
                                                className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                                placeholder="Enter Transaction ID"
                                                value={form.transaction_id}
                                                onChange={handleChange}
                                                required
                                                whileFocus={inputFocusScale}
                                            />
                                        </motion.div>
                                    )}

                                    <div className="col-md-6">
                                        <label className="form-label text-secondary small text-uppercase fw-bold">Receipt Number</label>
                                        <motion.input
                                            name="receipt_id"
                                            className="form-control bg-dark border-secondary border-opacity-25 text-white py-2"
                                            placeholder="REC-..."
                                            value={form.receipt_id}
                                            onChange={handleChange}
                                            required
                                            whileFocus={inputFocusScale}
                                        />
                                    </div>

                                    <div className="col-12 mt-4">
                                        <motion.div
                                            className="p-3 rounded bg-dark border border-secondary border-opacity-25 d-flex align-items-center justify-content-between"
                                            whileHover={{ borderColor: "rgba(0, 194, 255, 0.5)" }}
                                        >
                                            <div>
                                                <label className="form-label text-secondary small text-uppercase fw-bold mb-0">Auto-Generated Password</label>
                                                <div className="text-secondary small">This password will be assigned to the student account.</div>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <code className="fs-5 text-primary me-3 user-select-all">{form.password}</code>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Actions */}
                            <motion.div
                                className="d-flex justify-content-end gap-3 mt-5"
                                variants={itemVariants}
                            >
                                <motion.button
                                    type="button"
                                    className="btn btn-outline-secondary px-4 py-2"
                                    onClick={() => router.back()}
                                    whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.5)", color: "white" }}
                                    whileTap={buttonTapScale}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    className="btn btn-primary px-5 py-2 fw-semibold border-0"
                                    disabled={loading}
                                    style={{ background: "#00c2ff", color: "#000" }}
                                    whileHover={buttonHoverScale}
                                    whileTap={buttonTapScale}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Registering...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check2-circle me-2"></i>
                                            Complete Registration
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>

                        </form>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}