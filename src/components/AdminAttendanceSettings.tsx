'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function AdminAttendanceSettings() {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('100');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/attendance/settings');
            if (response.data.latitude) {
                setLatitude(response.data.latitude);
                setLongitude(response.data.longitude);
                setRadius(response.data.radius);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await api.post('/attendance/settings', {
                latitude,
                longitude,
                radius,
            });
            setMessage('✅ Settings saved successfully!');
        } catch (error: any) {
            setMessage('❌ Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setMessage('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toString());
                setLongitude(position.coords.longitude.toString());
            },
            () => {
                setMessage('❌ Unable to retrieve your location.');
            }
        );
    };

    return (
        <div
            className="p-4 p-md-5 mt-4 rounded-4"
            style={{
                background: "rgba(15,15,15,0.85)",
                border: "1px solid rgba(0,194,255,0.25)",
                boxShadow: "0 0 25px rgba(0,194,255,0.15)",
                backdropFilter: "blur(6px)",
                color: "white",
            }}
        >
            <h2
                className="fw-bold mb-4"
                style={{
                    color: "#14f4ff",
                    textShadow: "0 0 10px rgba(20,244,255,0.4)",
                }}
            >
                Attendance Location Settings
            </h2>

            <form onSubmit={handleSave}>

                {/* INPUT GRID */}
                <div className="row g-4">

                    {/* LATITUDE */}
                    <div className="col-md-6">
                        <label className="form-label">Latitude</label>
                        <input
                            type="text"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            className="form-control bg-dark text-white border-secondary"
                            style={{ borderRadius: "8px" }}
                            required
                        />
                    </div>

                    {/* LONGITUDE */}
                    <div className="col-md-6">
                        <label className="form-label">Longitude</label>
                        <input
                            type="text"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            className="form-control bg-dark text-white border-secondary"
                            style={{ borderRadius: "8px" }}
                            required
                        />
                    </div>

                    {/* RADIUS */}
                    <div className="col-md-6">
                        <label className="form-label">Radius (meters)</label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="form-control bg-dark text-white border-secondary"
                            style={{ borderRadius: "8px" }}
                            required
                            min={10}
                        />
                    </div>
                </div>

                {/* BUTTONS */}
                <div className="d-flex gap-3 mt-4 flex-wrap">

                    {/* USE CURRENT LOCATION */}
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="btn fw-bold"
                        style={{
                            background: "#444",
                            color: "#fff",
                            borderRadius: "10px",
                            padding: "10px 20px",
                            boxShadow: "0 0 10px rgba(255,255,255,0.1)",
                        }}
                    >
                        📍 Use Current Location
                    </button>

                    {/* SAVE SETTINGS */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn fw-bold"
                        style={{
                            background: loading ? "#777" : "#00c2ff",
                            color: "#000",
                            borderRadius: "10px",
                            padding: "10px 20px",
                            boxShadow: "0 0 15px rgba(0,194,255,0.45)",
                        }}
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </button>
                </div>

                {/* FEEDBACK MESSAGE */}
                {message && (
                    <p
                        className="mt-3 fw-bold"
                        style={{
                            color: message.startsWith("✅") ? "#00ff9d" : "#ff4a4a",
                        }}
                    >
                        {message}
                    </p>
                )}

            </form>
        </div>
    );
}
