'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function AboutPage() {
    const [about, setAbout] = useState<any>(null);

    useEffect(() => {
        api.get('/about').then(res => setAbout(res.data));
    }, []);

    if (!about)
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

                {/* MAIN CARD */}
                <div
                    className="rounded-4 mx-auto overflow-hidden"
                    style={{
                        maxWidth: "900px",
                        background: "rgba(15,15,15,0.85)",
                        border: "1px solid rgba(0,194,255,0.25)",
                        boxShadow: "0 0 35px rgba(0,194,255,0.18)",
                        backdropFilter: "blur(6px)",
                    }}
                >

                    {/* IMAGE BANNER */}
                    {about.image_url && (
                        <div
                            className="position-relative"
                            style={{ height: "300px", overflow: "hidden" }}
                        >
                            <img
                                src={about.image_url}
                                alt="About Banner"
                                className="w-100 h-100"
                                style={{ objectFit: "cover", opacity: 0.85 }}
                            />

                            {/* Neon overlay blur */}
                            <div
                                className="position-absolute top-0 start-0 w-100 h-100"
                                style={{
                                    background:
                                        "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.85))",
                                }}
                            ></div>
                        </div>
                    )}

                    {/* CONTENT SECTION */}
                    <div className="p-4 p-md-5">

                        <h1
                            className="fw-bold mb-4"
                            style={{
                                color: "#00c2ff",
                                textShadow: "0 0 15px rgba(0,194,255,0.6)",
                                fontSize: "2.5rem",
                            }}
                        >
                            {about.title}
                        </h1>

                        <div
                            className="text-muted"
                            style={{
                                fontSize: "1.1rem",
                                lineHeight: "1.8",
                                whiteSpace: "pre-line",
                            }}
                        >
                            {about.content}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
