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
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Attendance Location Settings</h2>
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                        <input
                            type="text"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                        <input
                            type="text"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Radius (meters)</label>
                    <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        required
                        min="10"
                    />
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                    >
                        📍 Use Current Location
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded text-white transition ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {loading ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
                {message && <p className="mt-2 font-medium">{message}</p>}
            </form>
        </div>
    );
}
