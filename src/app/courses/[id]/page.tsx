'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

export default function CourseDetailsPage() {
    const { id } = useParams();

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        college: '',
    });
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${id}`);
                setCourse(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCourse();
    }, [id]);
    const handleEnroll = () => {
        setShowEnrollForm(true);
        setTimeout(() => {
            document.getElementById('enroll-form')?.scrollIntoView({
                behavior: 'smooth',
            });
        }, 100);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post('/addenrollmentrequest', {
                course_id: id,
                name: formData.name,
                email: formData.email,
                phone_number: formData.phone_number,
                college: formData.college,
            });
            alert('Enrollment successful! We will contact you soon.');
            setFormData({
                name: '',
                email: '',
                phone_number: '',
                college: '',
            });
            setShowEnrollForm(false);
        } catch (error: any) {
            console.error(error);
            alert(
                error?.response?.data?.message ||
                'Something went wrong. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };
    if (loading)
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center"
                style={{ color: 'white', background: '#050505' }}>
                Loading...
            </div>
        );
    if (!course)
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center"
                style={{ color: 'white', background: '#050505' }}>
                Course not found
            </div>
        );
    return (
        <div className="min-vh-100 py-5" style={{ background: '#050505', color: 'white' }}>
            <div className="container">
                <div
                    className="rounded-4 mx-auto p-4 p-md-5"
                    style={{
                        maxWidth: '900px',
                        background: 'rgba(15, 15, 15, 0.85)',
                        border: '1px solid rgba(0, 194, 255, 0.25)',
                        boxShadow: '0 0 35px rgba(0, 194, 255, 0.18)',
                        backdropFilter: 'blur(6px)',
                    }}
                >
                    <span className="badge text-uppercase mb-3"
                        style={{
                            background: 'rgba(0,194,255,0.25)',
                            color: '#00c2ff',
                            padding: '8px 12px',
                            fontSize: '0.75rem',
                        }}>
                        {course.category?.name}
                    </span>

                    <h1 className="fw-bold mb-4"
                        style={{
                            color: '#14f4ff',
                            textShadow: '0 0 12px rgba(20,244,255,0.5)',
                        }}>
                        {course.title}
                    </h1>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <h4 className="fw-bold mb-3" style={{ color: '#00c2ff' }}>
                                Course Details
                            </h4>

                            <ul className="list-unstyled">
                                <li style={{ color: '#c9d1d9', marginBottom: '8px' }}>
                                    <strong style={{ color: '#ffffff' }}>Duration:</strong> {course.duration}
                                </li>

                                <li style={{ color: '#c9d1d9', marginBottom: '8px' }}>
                                    <strong style={{ color: '#ffffff' }}>Level:</strong> {course.level}
                                </li>

                                <li>
                                    <strong style={{ color: '#ffffff' }}>Price:</strong>{' '}
                                    <span style={{ color: '#00ff9d', fontWeight: 600 }}>
                                        ₹{course.price}
                                    </span>
                                </li>
                            </ul>
                        </div>


                        <div className="col-md-6 d-flex align-items-center">
                            {!showEnrollForm && (
                                <button
                                    onClick={handleEnroll}
                                    className="btn w-100 fw-bold py-3"
                                    style={{
                                        background: '#00c2ff',
                                        color: '#000',
                                        borderRadius: '12px',
                                        boxShadow: '0 0 20px rgba(0,194,255,0.45)',
                                        fontSize: '1.2rem',
                                    }}
                                >
                                    Enroll Now →
                                </button>
                            )}
                        </div>
                    </div>

                    <h3 className="fw-bold mb-3"
                        style={{ color: '#00c2ff' }}>
                        Description
                    </h3>

                    <p className="text-white"
                        style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}>
                        {course.description}
                    </p>
                    {showEnrollForm && (
                        <div
                            id="enroll-form"
                            className="mt-5 p-4 p-md-5 rounded-4"
                            style={{
                                background: 'rgba(10, 10, 10, 0.9)',
                                border: '1px solid rgba(0, 194, 255, 0.25)',
                                boxShadow: '0 0 25px rgba(0, 194, 255, 0.15)',
                            }}
                        >
                            <h3 className="fw-bold mb-4 text-center"
                                style={{ color: '#00c2ff' }}>
                                Enroll for this Course
                            </h3>
                            <form onSubmit={handleSubmit} className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label text-light">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="form-control bg-dark text-white"
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label text-light">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="form-control bg-dark text-white"
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label text-light">Phone</label>
                                    <input
                                        type="text"
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                        className="form-control bg-dark text-white"
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label text-light">College</label>
                                    <input
                                        type="text"
                                        name="college"
                                        value={formData.college}
                                        onChange={handleChange}
                                        className="form-control bg-dark text-white"
                                    />
                                </div>

                                <div className="col-12 text-center mt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn fw-bold px-5 py-3"
                                        style={{
                                            background: submitting
                                                ? '#555'
                                                : 'linear-gradient(135deg, #00c2ff, #00ff9d)',
                                            color: '#000',
                                            borderRadius: '12px',
                                            fontSize: '1.1rem',
                                        }}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Enrollment →'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
