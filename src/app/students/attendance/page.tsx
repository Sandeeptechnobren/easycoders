'use client';

import { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type AttendanceRecord = {
  id: number;
  date: string;
  punch_in: string;
  punch_out?: string;
  location?: { id: number; name: string };
  wifi_verified: boolean;
  gps_verified: boolean;
};

export default function StudentAttendancePage() {
  const [tab, setTab] = useState<'punch' | 'history'>('punch');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  const checkTodayRecord = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetchWithAuth(`${BASE}/attendance/my?from=${today}&to=${today}`);
      const list: AttendanceRecord[] = res.data?.data || res.data || [];
      setTodayRecord(list.find(r => r.date === today || r.punch_in?.startsWith(today)) || null);
    } catch {}
  };

  useEffect(() => { checkTodayRecord(); }, []);

  const getGPS = (): Promise<{ latitude: number; longitude: number } | null> =>
    new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000 }
      );
    });

  const punchIn = async () => {
    setPunchLoading(true); setPunchMsg('');
    try {
      const gps = await getGPS();
      await fetchWithAuth(`${BASE}/attendance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gps || {}),
      });
      setPunchMsg('Punched in successfully!');
      checkTodayRecord();
    } catch (e: any) {
      setPunchMsg(e.message || 'Punch-in failed. Ensure you are on the office WiFi or GPS zone.');
    } finally { setPunchLoading(false); }
  };

  const punchOut = async () => {
    setPunchLoading(true); setPunchMsg('');
    try {
      await fetchWithAuth(`${BASE}/attendance/punch-out`, { method: 'POST' });
      setPunchMsg('Punched out successfully!');
      checkTodayRecord();
    } catch (e: any) { setPunchMsg(e.message || 'Punch-out failed.'); } finally { setPunchLoading(false); }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/attendance/my`);
      setRecords(res.data?.data || res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const duration = (punchIn: string, punchOut?: string) => {
    if (!punchOut) return '—';
    const diff = Math.round((new Date(punchOut).getTime() - new Date(punchIn).getTime()) / 60000);
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const isPunchedIn = todayRecord && !todayRecord.punch_out;
  const isPunchedOut = todayRecord && todayRecord.punch_out;

  return (
    <RoleGuard allowedRoles={[3]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4" style={{ maxWidth: 800 }}>
          <div className="mb-4">
            <h3 className="fw-bold mb-1">My Attendance</h3>
            <p className="text-muted mb-0">Punch in/out and view your attendance history</p>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button className={`nav-link ${tab === 'punch' ? 'active' : ''}`} onClick={() => setTab('punch')}>Punch In/Out</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
            </li>
          </ul>

          {tab === 'punch' && (
            <div className="card">
              <div className="card-body text-center py-5">
                <h5 className="fw-bold mb-1">Today's Attendance</h5>
                <p className="text-muted small mb-4">{new Date().toDateString()}</p>

                {!todayRecord && (
                  <div className="alert alert-warning d-inline-block mb-4">Not punched in yet today</div>
                )}
                {isPunchedIn && (
                  <div className="alert alert-success d-inline-block mb-4">
                    Punched in at {new Date(todayRecord.punch_in).toLocaleTimeString()}
                    {todayRecord.location && ` · ${todayRecord.location.name}`}
                    <div className="small mt-1">
                      {todayRecord.wifi_verified && <span className="badge bg-info me-1">WiFi verified</span>}
                      {todayRecord.gps_verified && <span className="badge bg-success">GPS verified</span>}
                    </div>
                  </div>
                )}
                {isPunchedOut && (
                  <div className="alert alert-secondary d-inline-block mb-4">
                    In: {new Date(todayRecord.punch_in).toLocaleTimeString()} ·
                    Out: {new Date(todayRecord.punch_out!).toLocaleTimeString()} ·
                    Duration: {duration(todayRecord.punch_in, todayRecord.punch_out)}
                  </div>
                )}

                {punchMsg && (
                  <div className={`alert ${punchMsg.includes('successfully') ? 'alert-success' : 'alert-danger'} mb-4`}>
                    {punchMsg}
                  </div>
                )}

                <div className="d-flex gap-3 justify-content-center">
                  {!isPunchedIn && !isPunchedOut && (
                    <button className="btn btn-success btn-lg px-5" onClick={punchIn} disabled={punchLoading}>
                      {punchLoading ? 'Processing...' : '📍 Punch In'}
                    </button>
                  )}
                  {isPunchedIn && (
                    <button className="btn btn-danger btn-lg px-5" onClick={punchOut} disabled={punchLoading}>
                      {punchLoading ? 'Processing...' : '🔴 Punch Out'}
                    </button>
                  )}
                  {isPunchedOut && (
                    <div className="text-muted">Attendance complete for today.</div>
                  )}
                </div>

                <p className="text-muted small mt-4">
                  Attendance is verified by office WiFi/IP. GPS is used as fallback.
                </p>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <>
              <button className="btn btn-outline-secondary btn-sm mb-3" onClick={loadHistory}>Refresh</button>
              {loading ? (
                <div className="text-center py-4 text-muted">Loading...</div>
              ) : (
                <div className="card">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Duration</th><th>Location</th><th>Verified</th></tr>
                      </thead>
                      <tbody>
                        {records.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-muted py-4">No records found.</td></tr>
                        ) : records.map(r => (
                          <tr key={r.id}>
                            <td>{r.date}</td>
                            <td className="small">{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—'}</td>
                            <td className="small">{r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : <span className="text-warning">Active</span>}</td>
                            <td className="small">{duration(r.punch_in, r.punch_out)}</td>
                            <td className="small">{r.location?.name || '—'}</td>
                            <td>
                              {r.wifi_verified && <span className="badge bg-info me-1">WiFi</span>}
                              {r.gps_verified && <span className="badge bg-success">GPS</span>}
                              {!r.wifi_verified && !r.gps_verified && <span className="badge bg-secondary">Manual</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
