'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/api';

type AttendanceRecord = {
  id: number;
  date: string;
  punch_in: string | null;
  punch_out?: string | null;
  location?: { id: number; name: string } | null;
  wifi_verified: boolean;
  gps_verified: boolean;
};

type Stats = {
  from: string;
  to: string;
  total_days: number;
  working_days: number;
  sundays_skipped: number;
  holidays_skipped: number;
  present: number;
  absent: number;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const todayYmd = () => {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};
const daysAgoYmd = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

export default function StudentAttendancePage() {
  const [tab, setTab] = useState<'punch' | 'history'>('punch');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState('');
  const [punchLoading, setPunchLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  // Date range filters (default last 30 days inclusive)
  const [from, setFrom] = useState(daysAgoYmd(30));
  const [to, setTo]     = useState(todayYmd());

  const checkTodayRecord = useCallback(async () => {
    try {
      const t = todayYmd();
      const res = await fetchWithAuth(`${BASE}/attendance/my?from=${t}&to=${t}`);
      const paginator = res.data;
      const list: AttendanceRecord[] = Array.isArray(paginator)
        ? paginator
        : (paginator?.data ?? []);
      const match = list.find(r => {
        const recDate = (r.date || '').slice(0, 10);
        return recDate === t || (r.punch_in?.startsWith(t) ?? false);
      });
      setTodayRecord(match || null);
    } catch { /* ignore — UI shows "Not punched in yet" */ }
  }, []);

  const loadStats = useCallback(async (rangeFrom: string, rangeTo: string) => {
    setStatsLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/attendance/stats?from=${rangeFrom}&to=${rangeTo}`);
      setStats(res.data as Stats);
    } catch {
      // Stats may be unavailable if the holidays table hasn't been migrated yet.
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (rangeFrom: string, rangeTo: string) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/attendance/my?from=${rangeFrom}&to=${rangeTo}`);
      const paginator = res.data;
      const list: AttendanceRecord[] = Array.isArray(paginator)
        ? paginator
        : (paginator?.data ?? []);
      setRecords(list);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial: today's record + 30-day stats
  useEffect(() => { checkTodayRecord(); }, [checkTodayRecord]);
  useEffect(() => { loadStats(from, to); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // History loads whenever user enters the tab (uses current from/to)
  useEffect(() => { if (tab === 'history') loadHistory(from, to); }, [tab, loadHistory, from, to]);

  const applyRange = () => {
    loadStats(from, to);
    if (tab === 'history') loadHistory(from, to);
  };

  const resetRange = () => {
    const f = daysAgoYmd(30), t = todayYmd();
    setFrom(f); setTo(t);
    loadStats(f, t);
    if (tab === 'history') loadHistory(f, t);
  };

  const getGPS = (): Promise<{ latitude: number; longitude: number } | null> =>
    new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 8000, enableHighAccuracy: true }
      );
    });

  const punchIn = async () => {
    setPunchLoading(true); setPunchMsg('');
    try {
      const gps = await getGPS();
      if (!gps) {
        setPunchMsg('Location access denied. Please enable GPS in your browser — both office WiFi AND GPS are required.');
        setPunchLoading(false);
        return;
      }
      await fetchWithAuth(`${BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gps),
      });
      setPunchMsg('Punched in successfully!');
      checkTodayRecord();
      loadStats(from, to);
    } catch (e: any) {
      setPunchMsg(e.message || 'Punch-in failed. You must be on the office WiFi AND within the configured GPS zone.');
    } finally { setPunchLoading(false); }
  };

  const punchOut = async () => {
    setPunchLoading(true); setPunchMsg('');
    try {
      await fetchWithAuth(`${BASE}/attendance/punch-out`, { method: 'POST' });
      setPunchMsg('Punched out successfully!');
      checkTodayRecord();
    } catch (e: any) {
      setPunchMsg(e.message || 'Punch-out failed.');
    } finally { setPunchLoading(false); }
  };

  const duration = (punchIn?: string | null, punchOut?: string | null) => {
    if (!punchIn || !punchOut) return '—';
    const diff = Math.round((new Date(punchOut).getTime() - new Date(punchIn).getTime()) / 60000);
    if (isNaN(diff) || diff < 0) return '—';
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const isPunchedIn  = todayRecord && !todayRecord.punch_out;
  const isPunchedOut = todayRecord && !!todayRecord.punch_out;

  const attendancePct = stats && stats.working_days > 0
    ? Math.round((stats.present / stats.working_days) * 100)
    : null;

  return (
    <RoleGuard allowedRoles={[3]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4" style={{ maxWidth: 900 }}>
          <div className="mb-4">
            <h3 className="fw-bold mb-1">My Attendance</h3>
            <p className="text-muted mb-0">Punch in/out, view stats, and your attendance history</p>
          </div>

          {/* ── Stats Card ── */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <div className="fw-semibold">Attendance Summary</div>
                  <small className="text-muted">
                    {stats ? `${stats.from} → ${stats.to}` : `${from} → ${to}`}
                  </small>
                </div>
                {attendancePct !== null && (
                  <span className={`badge fs-6 ${attendancePct >= 75 ? 'bg-success' : attendancePct >= 50 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                    {attendancePct}% attendance
                  </span>
                )}
              </div>

              {statsLoading ? (
                <div className="text-muted small">Loading stats…</div>
              ) : !stats ? (
                <div className="text-muted small">
                  Stats unavailable for this range. (If you just deployed, the holidays table may not be migrated yet.)
                </div>
              ) : (
                <div className="row g-3 text-center">
                  <div className="col-6 col-md">
                    <div className="border rounded p-2">
                      <div className="text-muted small">Present</div>
                      <div className="fw-bold fs-4 text-success">{stats.present}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="border rounded p-2">
                      <div className="text-muted small">Absent</div>
                      <div className="fw-bold fs-4 text-danger">{stats.absent}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="border rounded p-2">
                      <div className="text-muted small">Working Days</div>
                      <div className="fw-bold fs-4">{stats.working_days}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="border rounded p-2">
                      <div className="text-muted small">Holidays</div>
                      <div className="fw-bold fs-4 text-primary">{stats.holidays_skipped}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md">
                    <div className="border rounded p-2">
                      <div className="text-muted small">Sundays</div>
                      <div className="fw-bold fs-4 text-secondary">{stats.sundays_skipped}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                    Punched in at {todayRecord!.punch_in ? new Date(todayRecord!.punch_in).toLocaleTimeString() : '—'}
                    {todayRecord!.location && ` · ${todayRecord!.location.name}`}
                    <div className="small mt-1">
                      {todayRecord!.wifi_verified && <span className="badge bg-info me-1">WiFi verified</span>}
                      {todayRecord!.gps_verified && <span className="badge bg-success">GPS verified</span>}
                    </div>
                  </div>
                )}
                {isPunchedOut && (
                  <div className="alert alert-secondary d-inline-block mb-4">
                    In: {todayRecord!.punch_in ? new Date(todayRecord!.punch_in).toLocaleTimeString() : '—'} ·
                    Out: {todayRecord!.punch_out ? new Date(todayRecord!.punch_out).toLocaleTimeString() : '—'} ·
                    Duration: {duration(todayRecord!.punch_in, todayRecord!.punch_out)}
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
                  Both office WiFi <strong>AND</strong> GPS must match the configured location to punch in.
                </p>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <>
              <div className="d-flex gap-3 mb-3 flex-wrap align-items-end">
                <div>
                  <label className="form-label small text-muted mb-1">From</label>
                  <input type="date" className="form-control form-control-sm" value={from}
                    onChange={e => setFrom(e.target.value)} max={to} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">To</label>
                  <input type="date" className="form-control form-control-sm" value={to}
                    onChange={e => setTo(e.target.value)} min={from} max={todayYmd()} />
                </div>
                <button className="btn btn-sm btn-primary" onClick={applyRange}>Apply</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={resetRange}>Last 30 days</button>
              </div>

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
                          <tr><td colSpan={6} className="text-center text-muted py-4">No records found in this range.</td></tr>
                        ) : records.map(r => (
                          <tr key={r.id}>
                            <td>{(r.date || '').slice(0, 10)}</td>
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
