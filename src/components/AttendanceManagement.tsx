'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type AttendanceRecord = {
  id: number;
  user?: { id: number; name: string; email: string; phone?: string; role: string } | null;
  location?: { id: number; name: string } | null;
  marked_by?: number | null;
  markedBy?: { id: number; name: string } | null;
  punch_in: string | null;
  punch_out?: string | null;
  date: string;
  status: string;
  wifi_verified: boolean;
  gps_verified: boolean;
  ip_address?: string | null;
  notes?: string | null;
};

type Location = {
  id: number;
  name: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_meters?: number;
  allowed_ips?: string[];
  is_active: boolean;
};

type Holiday = {
  id: number;
  date: string;
  name: string;
  description?: string | null;
  creator?: { id: number; name: string } | null;
};

type User = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
};

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Role display — production DB stores role as a numeric string ('1'..'4')
// for some users and a literal string ('admin'/'hr'/'student'/'trainer')
// for others. This maps both shapes to a human label.
const ROLE_NAMES: Record<string, string> = {
  '1': 'Admin',   'admin':   'Admin',
  '2': 'HR',      'hr':      'HR',
  '3': 'Student', 'student': 'Student',
  '4': 'Trainer', 'trainer': 'Trainer',
};
const roleLabel = (role?: string | number | null): string => {
  if (role === null || role === undefined || role === '') return '—';
  const key = String(role).trim().toLowerCase();
  if (ROLE_NAMES[key]) return ROLE_NAMES[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
};

// Indian national holidays for 2026. Lunar / Islamic dates are best-effort
// approximations — the admin can adjust each date in the picker before adding.
const INDIAN_HOLIDAYS_2026: Array<{ date: string; name: string; description: string; approximate?: boolean }> = [
  { date: '2026-01-01', name: "New Year's Day",           description: 'Calendar new year' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', description: 'Harvest festival' },
  { date: '2026-01-26', name: 'Republic Day',             description: 'National holiday' },
  { date: '2026-02-17', name: 'Maha Shivratri',           description: 'Hindu festival',          approximate: true },
  { date: '2026-03-04', name: 'Holi',                     description: 'Festival of colors',     approximate: true },
  { date: '2026-03-21', name: 'Eid al-Fitr',              description: 'Islamic festival',       approximate: true },
  { date: '2026-04-03', name: 'Good Friday',              description: 'Christian holiday',      approximate: true },
  { date: '2026-04-14', name: 'Ambedkar Jayanti',         description: 'National holiday' },
  { date: '2026-05-01', name: 'Labour Day',               description: 'International Workers Day' },
  { date: '2026-05-27', name: 'Eid al-Adha (Bakrid)',     description: 'Islamic festival',       approximate: true },
  { date: '2026-08-15', name: 'Independence Day',         description: 'National holiday' },
  { date: '2026-08-26', name: 'Janmashtami',              description: 'Hindu festival',         approximate: true },
  { date: '2026-10-02', name: 'Gandhi Jayanti',           description: 'National holiday' },
  { date: '2026-10-20', name: 'Dussehra (Vijaya Dashami)',description: 'Hindu festival',         approximate: true },
  { date: '2026-11-08', name: 'Diwali',                   description: 'Festival of lights',     approximate: true },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti',       description: 'Sikh holiday',           approximate: true },
  { date: '2026-12-25', name: 'Christmas',                description: 'Christian holiday' },
];

export default function AttendanceManagement() {
  const [tab, setTab] = useState<'records' | 'manual' | 'locations' | 'holidays'>('records');

  // Records tab
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(todayYmd()); // default today
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterQ, setFilterQ] = useState('');

  // Manual mark — uses student search
  const [manualSearch, setManualSearch] = useState('');
  const [manualResults, setManualResults] = useState<User[]>([]);
  const [manualSearching, setManualSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [manualForm, setManualForm] = useState({
    date: todayYmd(),
    punch_in: '09:00',
    punch_out: '',
    notes: '',
  });
  const [manualMsg, setManualMsg] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  // Locations tab
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocModal, setShowLocModal] = useState(false);
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [locForm, setLocForm] = useState({
    name: '', address: '', latitude: '', longitude: '',
    radius_meters: '100', allowed_ips: '', is_active: true,
  });
  const [locMsg, setLocMsg] = useState('');
  const [locSaving, setLocSaving] = useState(false);
  const [autoIpLoading, setAutoIpLoading] = useState(false);
  const [autoGpsLoading, setAutoGpsLoading] = useState(false);

  // Holidays tab
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [showHolModal, setShowHolModal] = useState(false);
  const [editHol, setEditHol] = useState<Holiday | null>(null);
  const [holForm, setHolForm] = useState({ date: '', name: '', description: '' });
  const [holMsg, setHolMsg] = useState('');
  const [holSaving, setHolSaving] = useState(false);

  // National holidays bulk-add modal
  const [showNationalModal, setShowNationalModal] = useState(false);
  const [nationalChoices, setNationalChoices] = useState<
    Array<{ date: string; name: string; description: string; checked: boolean; alreadyExists: boolean }>
  >([]);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  // ── Records ──────────────────────────────────────────────────────────────
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterFrom) params.append('from', filterFrom);
      if (filterTo)   params.append('to',   filterTo);
      if (filterRole) params.append('role', filterRole);
      if (filterQ)    params.append('q',    filterQ);
      const res = await fetchWithAuth(`${BASE}/attendance?${params}`);
      const paginator = res.data;
      const list: AttendanceRecord[] = Array.isArray(paginator)
        ? paginator
        : (paginator?.data ?? []);
      setRecords(list);
    } catch { setRecords([]); } finally { setLoading(false); }
  }, [filterDate, filterFrom, filterTo, filterRole, filterQ]);

  const resetRecordFilters = () => {
    setFilterDate(todayYmd());
    setFilterFrom('');
    setFilterTo('');
    setFilterRole('');
    setFilterQ('');
  };

  // ── Locations ────────────────────────────────────────────────────────────
  const loadLocations = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/attendance/locations`);
      setLocations(res.data || []);
    } catch {}
  }, []);

  // ── Holidays ─────────────────────────────────────────────────────────────
  const loadHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/holidays?year=${new Date().getFullYear()}`);
      setHolidays(res.data || []);
    } catch { setHolidays([]); } finally { setHolidaysLoading(false); }
  }, []);

  // ── Tab-change loads only (filter changes wait for explicit Apply click,
  //     otherwise typing in the search box would re-fetch on every keystroke).
  useEffect(() => {
    if (tab === 'records')   loadRecords();
    if (tab === 'locations') loadLocations();
    if (tab === 'holidays')  loadHolidays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Manual mark: student search (debounced) ─────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (!manualSearch || manualSearch.length < 2) {
        setManualResults([]);
        return;
      }
      (async () => {
        setManualSearching(true);
        try {
          const res = await fetchWithAuth(`${BASE}/commanAPIs/users?search=${encodeURIComponent(manualSearch)}&limit=10`);
          setManualResults(res.data || []);
        } catch { setManualResults([]); } finally { setManualSearching(false); }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [manualSearch]);

  const markManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setManualMsg('Please search for and select a student first.');
      return;
    }
    setManualSaving(true); setManualMsg('');
    try {
      await fetchWithAuth(`${BASE}/attendance/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          date: manualForm.date,
          punch_in: manualForm.punch_in,
          punch_out: manualForm.punch_out || null,
          notes: manualForm.notes || null,
        }),
      });
      setManualMsg(`Attendance marked successfully for ${selectedUser.name}.`);
      // Reset form but keep date for batch-marking convenience
      setSelectedUser(null);
      setManualSearch('');
      setManualResults([]);
      setManualForm(f => ({ ...f, punch_out: '', notes: '' }));
    } catch (e: any) {
      setManualMsg(e.message || 'Failed to mark attendance.');
    } finally { setManualSaving(false); }
  };

  // ── Locations modal ──────────────────────────────────────────────────────
  const openCreateLoc = () => {
    setEditLoc(null);
    setLocForm({ name: '', address: '', latitude: '', longitude: '', radius_meters: '100', allowed_ips: '', is_active: true });
    setLocMsg('');
    setShowLocModal(true);
  };

  const openEditLoc = (loc: Location) => {
    setEditLoc(loc);
    setLocForm({
      name: loc.name, address: loc.address || '',
      latitude: String(loc.latitude ?? ''), longitude: String(loc.longitude ?? ''),
      radius_meters: String(loc.radius_meters || 100),
      allowed_ips: (loc.allowed_ips || []).join(', '),
      is_active: loc.is_active,
    });
    setLocMsg('');
    setShowLocModal(true);
  };

  // ── Auto-fetch IP (tries backend first, falls back to public ipify service) ──
  const autoFetchIp = async () => {
    setAutoIpLoading(true); setLocMsg('');
    let ip = '';
    let source: 'backend' | 'public' | null = null;

    // 1) Primary: backend /attendance/my-ip — returns the IP as Laravel sees it.
    //    This is what student punches will be compared against, so it's the
    //    canonical source. If the endpoint isn't deployed yet, fall through.
    try {
      const res = await fetchWithAuth(`${BASE}/attendance/my-ip`);
      ip = res?.data?.ip || res?.ip || '';
      if (ip) source = 'backend';
    } catch {
      // backend endpoint not available — try the public fallback
    }

    // 2) Fallback: public IP service (https://api.ipify.org).
    //    NOTE: returns the user's public IP. If the server is behind a
    //    reverse proxy, this may differ from what Laravel actually sees.
    if (!ip) {
      try {
        const r = await fetch('https://api.ipify.org?format=json');
        if (r.ok) {
          const j = await r.json();
          ip = (j?.ip || '').trim();
          if (ip) source = 'public';
        }
      } catch {}
    }

    if (!ip) {
      setLocMsg('Could not detect your IP automatically. Please enter it manually below.');
      setAutoIpLoading(false);
      return;
    }

    const current = locForm.allowed_ips.split(',').map(s => s.trim()).filter(Boolean);
    if (current.includes(ip)) {
      setLocMsg(`IP ${ip} is already in the list.`);
    } else {
      setLocForm(f => ({ ...f, allowed_ips: [...current, ip].join(', ') }));
      setLocMsg(source === 'backend'
        ? `Added ${ip} (detected by the server — this is what student punches will be checked against).`
        : `Added ${ip} (detected via public service — verify it matches what the server sees if your backend is behind a proxy).`);
    }

    setAutoIpLoading(false);
  };

  // ── Auto-fetch GPS (with clear, actionable error messages) ────────────────
  const autoFetchGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocMsg('Geolocation is not supported in this browser.');
      return;
    }

    // Browsers only expose geolocation on secure contexts.
    const insecure =
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';
    if (insecure) {
      setLocMsg('GPS requires HTTPS. Open the production site (HTTPS) and try again.');
      return;
    }

    setAutoGpsLoading(true);
    setLocMsg('Requesting location… please allow the browser prompt.');

    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocForm(f => ({
          ...f,
          latitude:  pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        setLocMsg(`Got coordinates: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (accuracy ±${Math.round(pos.coords.accuracy)} m).`);
        setAutoGpsLoading(false);
      },
      err => {
        let msg = 'Failed to get GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permission denied. Allow location access for this site in your browser settings, then try again.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location unavailable. Ensure GPS / location services are enabled on this device.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Request timed out. Move to an area with better signal and try again.';
        }
        setLocMsg(msg);
        setAutoGpsLoading(false);
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const saveLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocSaving(true); setLocMsg('');
    try {
      const payload = {
        name: locForm.name, address: locForm.address,
        latitude: locForm.latitude ? Number(locForm.latitude) : undefined,
        longitude: locForm.longitude ? Number(locForm.longitude) : undefined,
        radius_meters: locForm.radius_meters ? Number(locForm.radius_meters) : undefined,
        allowed_ips: locForm.allowed_ips.split(',').map(s => s.trim()).filter(Boolean),
        is_active: locForm.is_active,
      };
      if (editLoc) {
        await fetchWithAuth(`${BASE}/attendance/locations/${editLoc.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth(`${BASE}/attendance/locations`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      setShowLocModal(false); loadLocations();
    } catch (e: any) { setLocMsg(e.message || 'Failed.'); } finally { setLocSaving(false); }
  };

  const deleteLoc = async (id: number) => {
    if (!confirm('Delete this location?')) return;
    try {
      await fetchWithAuth(`${BASE}/attendance/locations/${id}`, { method: 'DELETE' });
      loadLocations();
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  // Toggle a location between active and inactive (PATCH-like via existing PUT endpoint).
  const toggleLocActive = async (loc: Location) => {
    const verb = loc.is_active ? 'Deactivate' : 'Activate';
    if (!confirm(`${verb} the location "${loc.name}"?`)) return;
    try {
      await fetchWithAuth(`${BASE}/attendance/locations/${loc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !loc.is_active }),
      });
      loadLocations();
    } catch (e: any) {
      alert(e.message || `${verb} failed.`);
    }
  };

  // ── Holidays modal ───────────────────────────────────────────────────────
  const openCreateHol = () => {
    setEditHol(null);
    setHolForm({ date: '', name: '', description: '' });
    setHolMsg('');
    setShowHolModal(true);
  };

  const openEditHol = (h: Holiday) => {
    setEditHol(h);
    setHolForm({
      date: (h.date || '').slice(0, 10),
      name: h.name,
      description: h.description || '',
    });
    setHolMsg('');
    setShowHolModal(true);
  };

  const saveHol = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolSaving(true); setHolMsg('');
    try {
      const payload = { date: holForm.date, name: holForm.name, description: holForm.description || undefined };
      if (editHol) {
        await fetchWithAuth(`${BASE}/holidays/${editHol.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      } else {
        await fetchWithAuth(`${BASE}/holidays`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
      }
      setShowHolModal(false); loadHolidays();
    } catch (e: any) { setHolMsg(e.message || 'Failed.'); } finally { setHolSaving(false); }
  };

  const deleteHol = async (id: number) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      await fetchWithAuth(`${BASE}/holidays/${id}`, { method: 'DELETE' });
      loadHolidays();
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  // Open the national-holidays modal, pre-filling defaults from the curated
  // INDIAN_HOLIDAYS_2026 list and marking ones already in the DB as "exists".
  const openNationalModal = () => {
    const existing = new Set(holidays.map(h => (h.date || '').slice(0, 10)));
    setNationalChoices(
      INDIAN_HOLIDAYS_2026.map(h => ({
        date: h.date,
        name: h.name,
        description: h.description + (h.approximate ? ' (date is approximate — verify before saving)' : ''),
        checked: !existing.has(h.date),
        alreadyExists: existing.has(h.date),
      }))
    );
    setBulkMsg('');
    setShowNationalModal(true);
  };

  // Bulk-add all selected holidays. Each POST is independent; failures are
  // tallied separately so a duplicate doesn't abort the rest.
  const bulkAddSelected = async () => {
    const selected = nationalChoices.filter(c => c.checked && !c.alreadyExists);
    if (selected.length === 0) {
      setShowNationalModal(false);
      return;
    }
    setBulkAdding(true);
    setBulkMsg('');
    let added = 0;
    const failures: string[] = [];
    for (const h of selected) {
      try {
        await fetchWithAuth(`${BASE}/holidays`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: h.date, name: h.name, description: h.description }),
        });
        added++;
      } catch (e: any) {
        failures.push(`${h.name} (${h.date}) — ${e?.message || 'failed'}`);
      }
    }
    setBulkAdding(false);
    if (failures.length === 0) {
      setShowNationalModal(false);
      loadHolidays();
      return;
    }
    setBulkMsg(`Added ${added}. Failed ${failures.length}:\n` + failures.join('\n'));
    loadHolidays();
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const duration = (punchIn?: string | null, punchOut?: string | null) => {
    if (!punchIn || !punchOut) return '—';
    const diff = Math.round((new Date(punchOut).getTime() - new Date(punchIn).getTime()) / 60000);
    if (isNaN(diff) || diff < 0) return '—';
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Attendance Management</h3>
              <p className="text-muted mb-0">View records, mark manually, manage locations &amp; holidays</p>
            </div>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item"><button className={`nav-link ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>Attendance Records</button></li>
            <li className="nav-item"><button className={`nav-link ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>Mark Manual</button></li>
            <li className="nav-item"><button className={`nav-link ${tab === 'locations' ? 'active' : ''}`} onClick={() => setTab('locations')}>Locations</button></li>
            <li className="nav-item"><button className={`nav-link ${tab === 'holidays' ? 'active' : ''}`} onClick={() => setTab('holidays')}>Holidays</button></li>
          </ul>

          {/* ─── Records Tab ─── */}
          {tab === 'records' && (
            <>
              <div className="d-flex gap-3 mb-4 flex-wrap align-items-end">
                <div>
                  <label className="form-label small text-muted mb-1">Date</label>
                  <input type="date" className="form-control form-control-sm" value={filterDate}
                    onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">From</label>
                  <input type="date" className="form-control form-control-sm" value={filterFrom}
                    onChange={e => { setFilterFrom(e.target.value); if (e.target.value) setFilterDate(''); }} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">To</label>
                  <input type="date" className="form-control form-control-sm" value={filterTo}
                    onChange={e => { setFilterTo(e.target.value); if (e.target.value) setFilterDate(''); }} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">Role</label>
                  <select className="form-select form-select-sm" value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ minWidth: 220 }}>
                  <label className="form-label small text-muted mb-1">Search (name, email, phone, ID)</label>
                  <input type="text" className="form-control form-control-sm" value={filterQ}
                    onChange={e => setFilterQ(e.target.value)}
                    placeholder="e.g. John, john@…, 98xxxx, 42" />
                </div>
                <div>
                  <button className="btn btn-sm btn-primary me-2" onClick={loadRecords}>Apply</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { resetRecordFilters(); }}>Reset (Today)</button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5 text-muted">Loading...</div>
              ) : (
                <div className="card">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th>Date</th>
                          <th>Punch In</th>
                          <th>Punch Out</th>
                          <th>Duration</th>
                          <th>Location</th>
                          <th>Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.length === 0 ? (
                          <tr><td colSpan={8} className="text-center text-muted py-4">No records found for these filters.</td></tr>
                        ) : records.map(r => (
                          <tr key={r.id}>
                            <td>
                              <div className="fw-semibold">{r.user?.name || '—'} <small className="text-muted">#{r.user?.id}</small></div>
                              <small className="text-muted">{r.user?.email}</small>
                            </td>
                            <td><span className="badge bg-secondary">{roleLabel(r.user?.role)}</span></td>
                            <td className="small">{(r.date || '').slice(0, 10)}</td>
                            <td className="small">{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—'}</td>
                            <td className="small">{r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : <span className="text-warning">Active</span>}</td>
                            <td className="small">{duration(r.punch_in, r.punch_out)}</td>
                            <td className="small">{r.location?.name || '—'}</td>
                            <td className="small">
                              {r.wifi_verified && <span className="badge bg-info me-1">WiFi</span>}
                              {r.gps_verified && <span className="badge bg-success me-1">GPS</span>}
                              {r.marked_by && (
                                <span className="badge bg-warning text-dark" title={`Admin user #${r.marked_by}`}>
                                  Manual by {r.markedBy?.name || `Admin #${r.marked_by}`}
                                </span>
                              )}
                              {!r.wifi_verified && !r.gps_verified && !r.marked_by && (
                                <span className="badge bg-secondary">Unverified</span>
                              )}
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

          {/* ─── Manual Mark Tab ─── */}
          {tab === 'manual' && (
            <div className="card" style={{ maxWidth: 640 }}>
              <div className="card-header fw-semibold">Mark Attendance Manually</div>
              <div className="card-body">
                {manualMsg && <div className={`alert ${manualMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>{manualMsg}</div>}

                <form onSubmit={markManual}>
                  {/* Student picker */}
                  <div className="mb-3 position-relative">
                    <label className="form-label">Student *</label>
                    {selectedUser ? (
                      <div className="d-flex justify-content-between align-items-center border rounded p-2 bg-light">
                        <div>
                          <div className="fw-semibold">{selectedUser.name} <small className="text-muted">#{selectedUser.id}</small></div>
                          <small className="text-muted">{selectedUser.email}{selectedUser.phone ? ` · ${selectedUser.phone}` : ''}{selectedUser.role ? ` · ${roleLabel(selectedUser.role)}` : ''}</small>
                        </div>
                        <button type="button" className="btn btn-sm btn-outline-secondary"
                          onClick={() => { setSelectedUser(null); setManualSearch(''); setManualResults([]); }}>
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="text" className="form-control"
                          placeholder="Search by name, email, or phone (min 2 chars)"
                          value={manualSearch}
                          onChange={e => setManualSearch(e.target.value)} />
                        {manualSearch.length >= 2 && (
                          <div className="border rounded mt-1" style={{ maxHeight: 220, overflowY: 'auto' }}>
                            {manualSearching ? (
                              <div className="p-2 text-muted small">Searching…</div>
                            ) : manualResults.length === 0 ? (
                              <div className="p-2 text-muted small">No users found.</div>
                            ) : manualResults.map(u => (
                              <button key={u.id} type="button"
                                className="d-block w-100 text-start btn btn-sm border-bottom rounded-0"
                                onClick={() => { setSelectedUser(u); setManualSearch(''); setManualResults([]); }}>
                                <div className="fw-semibold">{u.name} <small className="text-muted">#{u.id}</small></div>
                                <small className="text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ''}{u.role ? ` · ${roleLabel(u.role)}` : ''}</small>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-control" required value={manualForm.date}
                      max={todayYmd()}
                      onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Punch In *</label>
                      <input type="time" className="form-control" required value={manualForm.punch_in}
                        onChange={e => setManualForm(f => ({ ...f, punch_in: e.target.value }))} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Punch Out</label>
                      <input type="time" className="form-control" value={manualForm.punch_out}
                        onChange={e => setManualForm(f => ({ ...f, punch_out: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={2} value={manualForm.notes}
                      onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Reason / context (optional)" />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={manualSaving || !selectedUser}>
                    {manualSaving ? 'Saving...' : 'Mark Present'}
                  </button>
                  <small className="text-muted ms-3">Will be recorded as marked by you.</small>
                </form>
              </div>
            </div>
          )}

          {/* ─── Locations Tab ─── */}
          {tab === 'locations' && (
            <>
              <div className="d-flex justify-content-end mb-3">
                <button className="btn btn-primary" onClick={openCreateLoc}>+ Add Location</button>
              </div>
              <div className="row g-3">
                {locations.length === 0 ? (
                  <div className="text-muted text-center py-4">No locations configured.</div>
                ) : locations.map(loc => (
                  <div key={loc.id} className="col-md-6 col-xl-4">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0">{loc.name}</h6>
                          <span className={`badge ${loc.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {loc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {loc.address && <p className="text-muted small mb-2">{loc.address}</p>}
                        {(loc.latitude && loc.longitude) && (
                          <div className="small text-muted mb-1">
                            GPS: {loc.latitude}, {loc.longitude} (r={loc.radius_meters}m)
                          </div>
                        )}
                        {(loc.allowed_ips || []).length > 0 && (
                          <div className="small text-muted mb-2">
                            IPs: {loc.allowed_ips!.join(', ')}
                          </div>
                        )}
                        <div className="d-flex gap-2 mt-3 flex-wrap">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEditLoc(loc)}>Edit</button>
                          <button className={`btn btn-sm ${loc.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => toggleLocActive(loc)}>
                            {loc.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLoc(loc.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ─── Holidays Tab ─── */}
          {tab === 'holidays' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>{new Date().getFullYear()}</strong>
                  <small className="text-muted ms-2">{holidays.length} holiday{holidays.length === 1 ? '' : 's'} configured</small>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-outline-primary" onClick={openNationalModal}>📅 From National Holidays</button>
                  <button className="btn btn-primary" onClick={openCreateHol}>+ Add Holiday</button>
                </div>
              </div>

              {holidaysLoading ? (
                <div className="text-center py-4 text-muted">Loading...</div>
              ) : (
                <div className="card">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr><th>Date</th><th>Day</th><th>Name</th><th>Description</th><th>Added by</th><th></th></tr>
                      </thead>
                      <tbody>
                        {holidays.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-muted py-4">No holidays configured yet.</td></tr>
                        ) : holidays.map(h => (
                          <tr key={h.id}>
                            <td className="fw-semibold">{(h.date || '').slice(0, 10)}</td>
                            <td className="small text-muted">{new Date(h.date).toLocaleDateString(undefined, { weekday: 'long' })}</td>
                            <td>{h.name}</td>
                            <td className="small text-muted">{h.description || '—'}</td>
                            <td className="small text-muted">{h.creator?.name || '—'}</td>
                            <td className="text-end">
                              <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditHol(h)}>Edit</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteHol(h.id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="text-muted small mt-3">
                Holidays and Sundays are excluded from absentee counts on the student attendance dashboard.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Location Modal ── */}
      {showLocModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editLoc ? 'Edit Location' : 'Add Location'}</h5>
                <button className="btn-close" onClick={() => setShowLocModal(false)} />
              </div>
              <form onSubmit={saveLoc}>
                <div className="modal-body">
                  {locMsg && (
                    <div className={`alert ${
                      locMsg.toLowerCase().includes('fail') ||
                      locMsg.toLowerCase().includes('could not') ||
                      locMsg.toLowerCase().includes('denied') ||
                      locMsg.toLowerCase().includes('unavailable') ||
                      locMsg.toLowerCase().includes('timed out') ||
                      locMsg.toLowerCase().includes('not supported') ||
                      locMsg.toLowerCase().includes('requires https')
                        ? 'alert-danger' : 'alert-info'} py-2 small`}>
                      {locMsg}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input className="form-control" required value={locForm.name}
                      onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input className="form-control" value={locForm.address}
                      onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="row g-3 mb-1">
                    <div className="col-6">
                      <label className="form-label">Latitude</label>
                      <input type="number" step="any" className="form-control" value={locForm.latitude}
                        onChange={e => setLocForm(f => ({ ...f, latitude: e.target.value }))} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Longitude</label>
                      <input type="number" step="any" className="form-control" value={locForm.longitude}
                        onChange={e => setLocForm(f => ({ ...f, longitude: e.target.value }))} />
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-success mb-3"
                    onClick={autoFetchGps} disabled={autoGpsLoading}>
                    {autoGpsLoading ? 'Fetching…' : '📍 Use Current Location'}
                  </button>

                  <div className="mb-3">
                    <label className="form-label">GPS Radius (meters)</label>
                    <input type="number" min={10} max={5000} className="form-control" value={locForm.radius_meters}
                      onChange={e => setLocForm(f => ({ ...f, radius_meters: e.target.value }))} />
                  </div>

                  <div className="mb-1">
                    <label className="form-label">Allowed IPs <small className="text-muted">(comma-separated)</small></label>
                    <input className="form-control" placeholder="e.g. 192.168.1.1, 10.0.0.1" value={locForm.allowed_ips}
                      onChange={e => setLocForm(f => ({ ...f, allowed_ips: e.target.value }))} />
                  </div>
                  <button type="button" className="btn btn-sm btn-outline-info mb-3"
                    onClick={autoFetchIp} disabled={autoIpLoading}>
                    {autoIpLoading ? 'Fetching…' : '📡 Use Current IP'}
                  </button>

                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="loc-active"
                      checked={locForm.is_active}
                      onChange={e => setLocForm(f => ({ ...f, is_active: e.target.checked }))} />
                    <label className="form-check-label" htmlFor="loc-active">Active</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLocModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={locSaving}>
                    {locSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── National Holidays Modal ── */}
      {showNationalModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">National Holidays — 2026</h5>
                <button className="btn-close" onClick={() => setShowNationalModal(false)} />
              </div>
              <div className="modal-body" style={{ maxHeight: 480, overflowY: 'auto' }}>
                <p className="small text-muted mb-2">
                  Select the holidays to add to {new Date().getFullYear()}. Lunar / Islamic dates are best-effort approximations — edit the date column before adding if your calendar differs. Holidays already configured are pre-disabled.
                </p>

                {bulkMsg && (
                  <div className="alert alert-warning py-2 small" style={{ whiteSpace: 'pre-wrap' }}>{bulkMsg}</div>
                )}

                <table className="table table-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th style={{ width: 140 }}>Date</th>
                      <th>Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nationalChoices.map((c, i) => (
                      <tr key={i} className={c.alreadyExists ? 'text-muted' : ''}>
                        <td>
                          <input type="checkbox"
                            checked={c.checked}
                            disabled={c.alreadyExists}
                            onChange={e => {
                              const next = [...nationalChoices];
                              next[i] = { ...next[i], checked: e.target.checked };
                              setNationalChoices(next);
                            }} />
                        </td>
                        <td>
                          <input type="date" className="form-control form-control-sm"
                            value={c.date}
                            disabled={c.alreadyExists}
                            onChange={e => {
                              const next = [...nationalChoices];
                              next[i] = { ...next[i], date: e.target.value };
                              setNationalChoices(next);
                            }} />
                        </td>
                        <td>
                          {c.name}
                          {c.alreadyExists && <span className="badge bg-success ms-2">added</span>}
                        </td>
                        <td className="small text-muted">{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-secondary"
                    onClick={() => setNationalChoices(nc => nc.map(c => c.alreadyExists ? c : ({ ...c, checked: true })))}>
                    Select All
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-secondary"
                    onClick={() => setNationalChoices(nc => nc.map(c => ({ ...c, checked: false })))}>
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNationalModal(false)}>Close</button>
                <button type="button" className="btn btn-primary"
                  onClick={bulkAddSelected}
                  disabled={bulkAdding || nationalChoices.filter(c => c.checked && !c.alreadyExists).length === 0}>
                  {bulkAdding
                    ? 'Adding…'
                    : `Add ${nationalChoices.filter(c => c.checked && !c.alreadyExists).length} Holiday${nationalChoices.filter(c => c.checked && !c.alreadyExists).length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Holiday Modal ── */}
      {showHolModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editHol ? 'Edit Holiday' : 'Add Holiday'}</h5>
                <button className="btn-close" onClick={() => setShowHolModal(false)} />
              </div>
              <form onSubmit={saveHol}>
                <div className="modal-body">
                  {holMsg && <div className="alert alert-danger py-2 small">{holMsg}</div>}
                  <div className="mb-3">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-control" required value={holForm.date}
                      onChange={e => setHolForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input className="form-control" required value={holForm.name}
                      onChange={e => setHolForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Republic Day" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={2} value={holForm.description}
                      onChange={e => setHolForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowHolModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={holSaving}>
                    {holSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
