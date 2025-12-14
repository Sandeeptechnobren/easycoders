'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Loader from '../loader/page';

export default function AboutPage() {
    const [about, setAbout] = useState<any>(null);

    useEffect(() => {
        api.get('/about').then(res => {
            setAbout(res.data?.data ?? res.data);
        });
    }, []);

    if (!about) return <Loader />;

    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: '#050505', color: 'white' }}
        >
            <div className="container">
                <div
                    className="rounded-4 mx-auto overflow-hidden"
                    style={{
                        maxWidth: '1000px',
                        background: 'rgba(15,15,15,0.9)',
                        border: '1px solid rgba(0,194,255,0.25)',
                        boxShadow: '0 0 40px rgba(0,194,255,0.2)',
                        backdropFilter: 'blur(6px)',
                    }}
                >
                    {/* HERO IMAGE */}
                    {about.image_url && (
                        <div
                            className="position-relative"
                            style={{ height: '340px', overflow: 'hidden' }}
                        >
                            <img
                                src={about.image_url}
                                alt="About Easy Coders"
                                className="w-100 h-100"
                                style={{
                                    objectFit: 'cover',
                                    opacity: 0.85,
                                }}
                            />
                            <div
                                className="position-absolute top-0 start-0 w-100 h-100"
                                style={{
                                    background:
                                        'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.9))',
                                }}
                            />
                            <div className="position-absolute bottom-0 start-0 p-4 p-md-5">
                                <h1
                                    className="fw-bold"
                                    style={{
                                        color: '#14f4ff',
                                        textShadow:
                                            '0 0 20px rgba(20,244,255,0.6)',
                                        fontSize: '2.6rem',
                                    }}
                                >
                                    {about.title || 'About Easy Coders'}
                                </h1>
                            </div>
                        </div>
                    )}

                    {/* CONTENT */}
                    <div className="p-4 p-md-5">
                        {/* INTRO */}
                        <p
                            style={{
                                fontSize: '1.15rem',
                                lineHeight: '1.9',
                                color: '#c9d1d9',
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {about.content ||
                                `Easy Coders is a future-focused training institute dedicated to transforming students into industry-ready professionals. 
We believe that learning to code should be practical, structured, and aligned with real-world development workflows.`}
                        </p>

                        {/* DIVIDER */}
                        <div
                            className="my-5"
                            style={{
                                height: '1px',
                                background:
                                    'linear-gradient(to right, transparent, #00c2ff, transparent)',
                            }}
                        />

                        {/* SECTIONS */}
                        <div className="row g-4">
                            {/* WHO WE ARE */}
                            <div className="col-md-6">
                                <h3 style={{ color: '#00c2ff' }}>
                                    Who We Are
                                </h3>
                                <p
                                    style={{
                                        color: '#c9d1d9',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    We are a team of passionate developers,
                                    mentors, and industry professionals who
                                    have worked on real production systems.
                                    Our goal is to bridge the gap between
                                    academic learning and professional
                                    software development.
                                </p>
                            </div>

                            {/* MISSION */}
                            <div className="col-md-6">
                                <h3 style={{ color: '#00c2ff' }}>
                                    Our Mission
                                </h3>
                                <p
                                    style={{
                                        color: '#c9d1d9',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    To empower students with practical coding
                                    skills, strong fundamentals, and confidence
                                    to build scalable applications, crack
                                    interviews, and succeed in the tech
                                    industry.
                                </p>
                            </div>

                            {/* VISION */}
                            <div className="col-md-6">
                                <h3 style={{ color: '#00c2ff' }}>
                                    Our Vision
                                </h3>
                                <p
                                    style={{
                                        color: '#c9d1d9',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    We envision creating a learning ecosystem
                                    where students don’t just learn languages,
                                    but understand systems, architecture, and
                                    real-world problem solving.
                                </p>
                            </div>

                            {/* WHY US */}
                            <div className="col-md-6">
                                <h3 style={{ color: '#00c2ff' }}>
                                    Why Choose Us
                                </h3>
                                <ul
                                    style={{
                                        color: '#c9d1d9',
                                        lineHeight: '1.9',
                                        paddingLeft: '1.2rem',
                                    }}
                                >
                                    <li>Industry-oriented curriculum</li>
                                    <li>Live project-based learning</li>
                                    <li>Internship & job-ready training</li>
                                    <li>Personal mentorship & guidance</li>
                                    <li>Modern tools & best practices</li>
                                </ul>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="text-center mt-5">
                            <h4 style={{ color: '#14f4ff' }}>
                                Learn. Build. Grow.
                            </h4>
                            <p style={{ color: '#c9d1d9' }}>
                                Join Easy Coders and take the first step toward
                                a successful tech career.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
