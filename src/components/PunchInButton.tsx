'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function PunchInButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        api.get('/attendance/settings').then(res => setSettings(res.data));
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    const handlePunchIn = () => {
        setLoading(true);
        setMessage('');

        if (!navigator.geolocation) {
            setMessage('Geolocation is not supported by your browser.');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                if (settings && settings.latitude && settings.longitude) {
                    const distance = calculateDistance(userLat, userLon, settings.latitude, settings.longitude);
                    if (distance > settings.radius) {
                        setMessage(`❌ You are ${Math.round(distance)}m away from the location. Allowed radius: ${settings.radius}m.`);
                        setLoading(false);
                        return;
                    }
                }

                try {
                    await api.post('/attendance', {
                        latitude: userLat,
                        longitude: userLon,
                    });
                    setMessage('✅ Punched in successfully!');
                } catch (error: any) {
                    setMessage(error.response?.data?.message || '❌ Failed to punch in.');
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setMessage('❌ Unable to retrieve your location.');
                setLoading(false);
            }
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Daily Attendance</h2>
            {settings && settings.latitude ? (
                <p className="text-sm text-gray-500 mb-4">
                    Required Location: {settings.latitude}, {settings.longitude} (Radius: {settings.radius}m)
                </p>
            ) : (
                <p className="text-sm text-gray-500 mb-4">No location restriction set.</p>
            )}
            <button
                onClick={handlePunchIn}
                disabled={loading}
                className={`px-6 py-3 rounded-full font-bold text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
                {loading ? 'Locating...' : '📍 Punch In'}
            </button>
            {message && <p className="mt-4 font-medium">{message}</p>}
        </div>
    );
}
