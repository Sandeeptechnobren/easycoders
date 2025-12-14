"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function ContactUs() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const router = useRouter();

    useEffect(() => {
        document.title = "Contact Us";
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await api.post("/contact", { name, email, message });
            alert("Thank you! We will contact you shortly.");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="min-vh-100 py-5"
            style={{ background: "#050505", color: "white" }}
        >
            <div className="container">
                <div className="row g-4 align-items-stretch">

                    {/* LEFT COLUMN – MAP & ADDRESS */}
                    <div className="col-lg-6">
                        <div
                            className="h-100 p-4 rounded-4"
                            style={{
                                background: "rgba(15,15,15,0.9)",
                                border: "1px solid rgba(0,194,255,0.25)",
                                boxShadow: "0 0 30px rgba(0,194,255,0.15)",
                            }}
                        >
                            <h3
                                className="fw-bold mb-3"
                                style={{ color: "#00c2ff" }}
                            >
                                Our Location
                            </h3>

                            <p className="mb-3" style={{ color: "#c9d1d9" }}>
                                Easy Coders- Technobren Infotech Pvt. Ltd<br />
                                City Tower, Varanasi - Lucknow Rd, Wazidpur,<br /> Jaunpur, Uttar Pradesh<br /> 222002<br />
                                ✉️ easycoders1@gmail.com
                            </p>

                            <div className="ratio ratio-16x9 rounded overflow-hidden">
                                <iframe
                                    src="https://www.google.com/maps?q=jaunpur&output=embed"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN – CONTACT FORM */}
                    <div className="col-lg-6">
                        <div
                            className="h-100 p-4 p-md-5 rounded-4"
                            style={{
                                background: "rgba(15,15,15,0.9)",
                                border: "1px solid rgba(0,194,255,0.25)",
                                boxShadow: "0 0 30px rgba(0,194,255,0.15)",
                            }}
                        >
                            <h3
                                className="fw-bold mb-4 text-center"
                                style={{ color: "#00c2ff" }}
                            >
                                Contact Us
                            </h3>

                            <form onSubmit={handleSubmit} className="row g-3">
                                <div className="col-12">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control bg-dark text-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control bg-dark text-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-control bg-dark text-white"
                                        rows={5}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="col-12 text-center mt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn fw-bold px-5 py-3"
                                        style={{
                                            background: submitting
                                                ? "#555"
                                                : "linear-gradient(135deg, #00c2ff, #00ff9d)",
                                            color: "#000",
                                            borderRadius: "12px",
                                            fontSize: "1.05rem",
                                        }}
                                    >
                                        {submitting ? "Submitting..." : "Send Message →"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
