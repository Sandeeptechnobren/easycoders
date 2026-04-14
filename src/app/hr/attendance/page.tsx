'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/projects/backend/public/api';

type AttendanceRecord = {
  id: number;
  user?: { id: number; name: string; email: string; role: string };
  location?: { id: number; name: string };
  punch_in: string;
  punch_out?: string;
  date: string;
  status: string;
  wifi_verified: boolean;
  gps_verified: boolean;
  ip_address?: string;
  notes?: string;
};
type Location = {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  allowed_ips?: string[];
  is_active: boolean;
};

export default function AttendancePage() {
  const [tab, setTab] = useState<'records' | 'manual' | 'locations'>('records');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Manual mark
  const [manualForm, setManualForm] = useState({
    user_id: '', date: '', punch_in: '', punch_out: '', notes: ''
  });
  const [manualMsg, setManualMsg] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  // Location modal
  const [showLocModal, setShowLocModal] = useState(false);
  const [editLoc, setEditLoc] = useState<Location | null>(null);
  const [locForm, setLocForm] = useState({
    name: '', address: '', latitude: '', longitude: '',
    radius_meters: '100', allowed_ips: '', is_active: true,
  });
  const [locMsg, setLocMsg] = useState('');
  const [locSaving, setLocSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterFrom) params.append('from', filterFrom);
      if (filterTo) params.append('to', filterTo);
      if (filterRole) params.append('role', filterRole);
      const res = await fetchWithAuth(`${BASE}/attendance?${params}`);
      setRecords(res.data?.data || res.data || []);
    } catch {} finally { setLoading(false); }
  }, [filterDate, filterFrom, filterTo, filterRole]);

  const loadLocations = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/attendance/locations`);
      setLocations(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'records') loadRecords();
    if (tab === 'locations') loadLocations();
  }, [tab, loadRecords, loadLocations]);

  const markManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSaving(true); setManualMsg('');
    try {
      await fetchWithAuth(`${BASE}/attendance/manual`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...manualForm, user_id: Number(manualForm.user_id) }),
      });
      setManualMsg('Attendance marked successfully.');
      setManualForm({ user_id: '', date: '', punch_in: '', punch_out: '', notes: '' });
    } catch (e: any) { setManualMsg(e.message || 'Failed.'); } finally { setManualSaving(false); }
  };

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
      latitude: String(loc.latitude || ''), longitude: String(loc.longitude || ''),
      radius_meters: String(loc.radius_meters || 100),
      allowed_ips: (loc.allowed_ips || []).join(', '),
      is_active: loc.is_active,
    });
    setLocMsg('');
    setShowLocModal(true);
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
      setLocMsg('Saved.'); setShowLocModal(false); loadLocations();
    } catch (e: any) { setLocMsg(e.message || 'Failed.'); } finally { setLocSaving(false); }
  };

  const deleteLoc = async (id: number) => {
    if (!confirm('Delete this location?')) return;
    try {
      await fetchWithAuth(`${BASE}/attendance/locations/${id}`, { method: 'DELETE' });
      loadLocations();
    } catch (e: any) { alert(e.message || 'Failed.'); }
  };

  const duration = (punchIn: string, punchOut?: string) => {
    if (!punchOut) return '—';
    const diff = Math.round((new Date(punchOut).getTime() - new Date(punchIn).getTime()) / 60000);
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <div className="admin-wrap">
        <div className="container-fluid py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-1">Attendance Management</h3>
              <p className="text-muted mb-0">View records, mark manually, manage locations</p>
            </div>
          </div>

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item"><button className={`nav-link ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>Attendance Records</button></li>
            <li className="nav-item"><button className={`nav-link ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>Mark Manual</button></li>
            <li className="nav-item"><button className={`nav-link ${tab === 'locations' ? 'active' : ''}`} onClick={() => setTab('locations')}>Locations</button></li>
          </ul>

          {/* ── Records Tab ── */}
          {tab === 'records' && (
            <>
              <div className="d-flex gap-3 mb-4 flex-wrap">
                <div>
                  <label className="form-label small text-muted mb-1">Date</label>
                  <input type="date" className="form-control form-control-sm" value={filterDate}
                    onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">From</label>
                  <input type="date" className="form-control form-control-sm" value={filterFrom}
                    onChange={e => setFilterFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">To</label>
                  <input type="date" className="form-control form-control-sm" value={filterTo}
                    onChange={e => setFilterTo(e.target.value)} />
                </div>
                <div>
                  <label className="form-label small text-muted mb-1">Role</label>
                  <select className="form-select form-select-sm" value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
                <div className="d-flex align-items-end">
                  <button className="btn btn-sm btn-primary" onClick={loadRecords}>Apply</button>
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
                          <th>Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.length === 0 ? (
                          <tr><td colSpan={8} className="text-center text-muted py-4">No records found.</td></tr>
                        ) : records.map(r => (
                          <tr key={r.id}>
                            <td>
                              <div className="fw-semibold">{r.user?.name || '—'}</div>
                              <small className="text-muted">{r.user?.email}</small>
                            </td>
                            <td><span className="badge bg-secondary text-capitalize">{r.user?.role || '—'}</span></td>
                            <td className="small">{r.date}</td>
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

          {/* ── Manual Mark Tab ── */}
          {tab === 'manual' && (
            <div className="card" style={{ maxWidth: 600 }}>
              <div className="card-header fw-semibold">Mark Attendance Manually</div>
              <div className="card-body">
                {manualMsg && <div className={`alert ${manualMsg.includes('success') ? 'alert-success' : 'alert-danger'}`}>{manualMsg}</div>}
                <form onSubmit={markManual}>
                  <div className="mb-3">
                    <label className="form-label">User ID *</label>
                    <input type="number" className="form-control" required value={manualForm.user_id}
                      onChange={e => setManualForm(f => ({ ...f, user_id: e.target.value }))}
                      placeholder="Enter user ID" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-control" required value={manualForm.date}
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
                      onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={manualSaving}>
                    {manualSaving ? 'Saving...' : 'Mark Attendance'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Locations Tab ── */}
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
                        <div className="d-flex gap-2 mt-3">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openEditLoc(loc)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLoc(loc.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Location Modal ── */}
      {showLocModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editLoc ? 'Edit Location' : 'Add Location'}</h5>
                <button className="btn-close" onClick={() => setShowLocModal(false)} />
              </div>
              <form onSubmit={saveLoc}>
                <div className="modal-body">
                  {locMsg && <div className={`alert ${locMsg === 'Saved.' ? 'alert-success' : 'alert-danger'}`}>{locMsg}</div>}
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
                  <div className="row g-3 mb-3">
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
                  <div className="mb-3">
                    <label className="form-label">GPS Radius (meters)</label>
                    <input type="number" min={10} max={5000} className="form-control" value={locForm.radius_meters}
                      onChange={e => setLocForm(f => ({ ...f, radius_meters: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Allowed IPs <small className="text-muted">(comma-separated)</small></label>
                    <input className="form-control" placeholder="e.g. 192.168.1.1, 10.0.0.1" value={locForm.allowed_ips}
                      onChange={e => setLocForm(f => ({ ...f, allowed_ips: e.target.value }))} />
                  </div>
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
    </RoleGuard>
  );
}
