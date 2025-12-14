'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Loader from '@/app/loader/page';

export default function CourseDetailsPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

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
        if (!id) {
            setLoading(false);
            return;
        };
        const fetchCourse = async () => {
            try {
                const res = await api.get(`/courses/${id}`);
                setCourse(res.data?.data ?? res.data);
            } catch (error) {
                console.error(error);
                setCourse(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
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
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post('/addenrollmentrequest', {
                course_id: id,
                ...formData,
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
    if (loading) return <Loader />;
    if (!course) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center"
                style={{ background: '#050505', color: 'white' }}>
                Course not found
            </div>
        );
    }
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
                    <span
                        className="badge text-uppercase mb-3"
                        style={{
                            background: 'rgba(0,194,255,0.25)',
                            color: '#00c2ff',
                            padding: '8px 12px',
                            fontSize: '0.75rem',
                        }}
                    >
                        {course.category?.name}
                    </span>
                    {course.offer && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background:
                                    'linear-gradient(135deg, #ff9800, #ff5722)',
                                color: '#000',
                                padding: '6px 10px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                borderRadius: '20px',
                                boxShadow:
                                    '0 0 12px rgba(255,152,0,0.6)',
                                textTransform: 'uppercase',
                            }}
                        >
                            {course.offer}
                        </span>
                    )}
                    <h1
                        className="fw-bold mb-4"
                        style={{
                            color: '#14f4ff',
                            textShadow: '0 0 12px rgba(20,244,255,0.5)',
                        }}
                    >
                        {course.title}
                    </h1>
                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <h4 className="fw-bold mb-3" style={{ color: '#00c2ff' }}>
                                Course Details
                            </h4>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <strong>Duration:</strong> {course.duration}
                                </li>
                                <li className="mb-2">
                                    <strong>Level:</strong> {course.level}
                                </li>
                                <li>
                                    <strong>Fees:</strong>{' '}
                                    <span style={{ color: '#b00101ff', fontWeight: 600 }}>
                                        <del>₹{course.original_price}</del>&nbsp;</span>
                                    <span style={{ color: '#00ff9d', fontWeight: 600 }}>
                                        ₹{course.discounted_price}
                                    </span> (Special discount on One Time Payment, Easy Installments)
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
                    <h3 className="fw-bold mb-3" style={{ color: '#00c2ff' }}>
                        Description
                    </h3>
                    <p style={{ lineHeight: '1.7' }}>{course.description}</p>
                    <h3 className="fw-bold mb-3" style={{ color: '#00c2ff' }}>
                        Key Perks
                    </h3>
                    <ul>
                        {course.category?.features?.map((f: any) => (
                            <li key={f.id} style={{ marginBottom: '6px' }}>
                                {f.feature}
                            </li>
                        ))}
                    </ul>
                    {showEnrollForm && (
                        <div
                            id="enroll-form"
                            className="mt-5 p-4 p-md-5 rounded-4"
                            style={{
                                background: 'rgba(10, 10, 10, 0.9)',
                                border: '1px solid rgba(0, 194, 255, 0.25)',
                            }}
                        >
                            <h3 className="fw-bold mb-4 text-center" style={{ color: '#00c2ff' }}>
                                Enroll for this Course
                            </h3>
                            <form onSubmit={handleSubmit} className="row g-4">
                                {['name', 'email', 'phone_number', 'college'].map((field, i) => (
                                    <div className="col-md-6" key={i}>
                                        <label className="form-label text-light">
                                            {field.replace('_', ' ').toUpperCase()}
                                        </label>
                                        <input
                                            type="text"
                                            name={field}
                                            value={(formData as any)[field]}
                                            onChange={handleChange}
                                            className="form-control bg-dark text-white"
                                            required={field !== 'college'}
                                        />
                                    </div>
                                ))}
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
