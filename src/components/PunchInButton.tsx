'use client';

import { useState } from 'react';
import api from '@/lib/axios';

export default function PunchInButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [punchedIn, setPunchedIn] = useState(false);

  const getGPS = (): Promise<{ latitude: number; longitude: number } | null> =>
    new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 }
      );
    });

  const handlePunchIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      const gps = await getGPS();
      await api.post('/attendance', gps || {});
      setMessage('✅ Punched in successfully!');
      setPunchedIn(true);
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
        '❌ Punch-in failed. Ensure you are on the office WiFi or GPS zone.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePunchOut = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.post('/attendance/punch-out');
      setMessage('✅ Punched out successfully!');
      setPunchedIn(false);
    } catch (err: any) {
      setMessage(err.response?.data?.message || '❌ Punch-out failed.');
    } finally {
      setLoading(false);
    }
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
      <h3 className="fw-bold mb-2" style={{ color: '#00ff9d', textShadow: '0 0 10px rgba(0,255,157,0.5)' }}>
        Daily Attendance
      </h3>
      <p className="text-muted small mb-4">
        Verified via office WiFi/IP. GPS is used as a fallback when not on WiFi.
      </p>

      <div className="d-flex gap-3 justify-content-center">
        {!punchedIn ? (
          <button
            onClick={handlePunchIn}
            disabled={loading}
            className="btn fw-bold px-5 py-3"
            style={{
              background: loading ? '#666' : '#00ff9d',
              color: '#000',
              borderRadius: '30px',
              boxShadow: loading ? 'none' : '0 0 18px rgba(0,255,157,0.45)',
            }}
          >
            {loading ? 'Processing...' : '📍 Punch In'}
          </button>
        ) : (
          <button
            onClick={handlePunchOut}
            disabled={loading}
            className="btn fw-bold px-5 py-3"
            style={{
              background: loading ? '#666' : '#ff4a4a',
              color: '#fff',
              borderRadius: '30px',
              boxShadow: loading ? 'none' : '0 0 18px rgba(255,74,74,0.45)',
            }}
          >
            {loading ? 'Processing...' : '🔴 Punch Out'}
          </button>
        )}
      </div>

      {message && (
        <p className="mt-3 fw-bold" style={{ color: message.startsWith('✅') ? '#00ff9d' : '#ff4a4a' }}>
          {message}
        </p>
      )}
    </div>
  );
}
