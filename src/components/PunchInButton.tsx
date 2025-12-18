'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export default function PunchInButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState<any>(null);
    const [locationName, setLocationName] = useState<string>('Fetching location...');

    // Fetch attendance settings
    useEffect(() => {
        api.get('/attendance/settings').then(res => setSettings(res.data));
    }, []);

    // Reverse geocode settings location
    useEffect(() => {
        if (!settings?.latitude || !settings?.longitude) {
            setLocationName('No location restriction set');
            return;
        }

        const fetchLocationName = async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${settings.latitude}&lon=${settings.longitude}`,
                    {
                        headers: {
                            'User-Agent': 'AttendanceApp/1.0',
                        },
                    }
                );

                const data = await res.json();
                setLocationName(data.display_name || 'Unknown location');
            } catch (error) {
                console.error('Reverse geocoding failed:', error);
                setLocationName('Unable to fetch location');
            }
        };

        fetchLocationName();
    }, [settings?.latitude, settings?.longitude]);

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a =
            Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) *
            Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;

        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const handlePunchIn = () => {
        setLoading(true);
        setMessage('');

        if (!navigator.geolocation) {
            setMessage('❌ Geolocation is not supported.');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async position => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                if (settings?.latitude && settings?.longitude) {
                    const distance = calculateDistance(
                        userLat,
                        userLon,
                        Number(settings.latitude),
                        Number(settings.longitude)
                    );

                    if (distance > settings.radius) {
                        setMessage(
                            `❌ You are ${Math.round(distance)}m away. Allowed radius: ${settings.radius}m`
                        );
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
                    setMessage(
                        error.response?.data?.message ||
                        '❌ Failed to punch in.'
                    );
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setMessage('❌ Unable to retrieve your location.');
                setLoading(false);
            }
        );
    };

    return (
        <div
            className="p-4 p-md-5 rounded-4 text-center mb-4"
            style={{
                background: 'rgba(15,15,15,0.85)',
                border: '1px solid rgba(0,255,157,0.25)',
                boxShadow: '0 0 25px rgba(0,255,157,0.18)',
                backdropFilter: 'blur(6px)',
                color: 'white',
            }}
        >
            <h3
                className="fw-bold mb-3"
                style={{
                    color: '#00ff9d',
                    textShadow: '0 0 10px rgba(0,255,157,0.5)',
                }}
            >
                Daily Attendance
            </h3>

            {settings?.latitude ? (
                <p className="text-muted mb-3">
                    <strong>Required Location:</strong>
                    <br />
                    <span className="text-info">{locationName}</span>
                    <br />
                    <small>
                        ({settings.latitude}, {settings.longitude})
                    </small>
                    <br />
                    Radius:{' '}
                    <span className="text-warning">
                        {settings.radius}m
                    </span>
                </p>
            ) : (
                <p className="text-muted mb-3">
                    No location restriction set.
                </p>
            )}

            <button
                onClick={handlePunchIn}
                disabled={loading}
                className="btn fw-bold px-5 py-3"
                style={{
                    background: loading ? '#666' : '#00ff9d',
                    color: '#000',
                    borderRadius: '30px',
                    boxShadow: loading
                        ? 'none'
                        : '0 0 18px rgba(0,255,157,0.45)',
                }}
            >
                {loading ? 'Locating...' : '📍 Punch In'}
            </button>

            {message && (
                <p
                    className="mt-3 fw-bold"
                    style={{
                        color: message.startsWith('✅')
                            ? '#00ff9d'
                            : '#ff4a4a',
                    }}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
