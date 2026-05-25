'use client';

import { useEffect, useState, useCallback } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';

/* ──────────────────────────────────────────────────────────────────────────
 * AttendanceManagement — shared between /hr/attendance and /admin/attendance
 *
 * Previous version used bare Bootstrap (`nav nav-tabs`, `form-control`,
 * `btn btn-primary`) which (a) bled through as raw blue underlined link
 * text on the tab strip — the recurring Bootstrap-link-cascade bug, and
 * (b) looked completely off-brand against the rest of the navy/gold UI.
 *
 * This revision keeps every piece of state, every handler, every modal
 * intact; only the visual layer was rewritten with scoped styled-jsx and
 * a :global(.attn-page a) reset to defeat the link-color cascade (same
 * trick used on /admin and /self-assessment).
 * ────────────────────────────────────────────────────────────────────────── */

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

/* Narrow `unknown` errors thrown from fetchWithAuth into a string. Avoids
 * the `catch (e: any)` lint errors that previously littered this file. */
const errMsg = (e: unknown, fallback = 'Something went wrong.'): string =>
  e instanceof Error ? e.message : fallback;

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
/* Maps a role to a tinted pill class — keeps the table scan-able. */
const roleBadgeClass = (role?: string | number | null): string => {
  const k = String(role || '').trim().toLowerCase();
  if (k === '1' || k === 'admin')   return 'role-admin';
  if (k === '2' || k === 'hr')      return 'role-hr';
  if (k === '3' || k === 'student') return 'role-student';
  if (k === '4' || k === 'trainer') return 'role-trainer';
  return 'role-other';
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
          // Pinned to role=student — manual attendance marking is a
          // student-scoped flow (the backend default-to-students fallback
          // was removed in the UserSearchService fix).
          const res = await fetchWithAuth(`${BASE}/commanAPIs/users?role=student&search=${encodeURIComponent(manualSearch)}&limit=10`);
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
    } catch (e: unknown) {
      setManualMsg(errMsg(e, 'Failed to mark attendance.'));
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
    } catch (e: unknown) { setLocMsg(errMsg(e, 'Failed.')); } finally { setLocSaving(false); }
  };

  const deleteLoc = async (id: number) => {
    if (!confirm('Delete this location?')) return;
    try {
      await fetchWithAuth(`${BASE}/attendance/locations/${id}`, { method: 'DELETE' });
      loadLocations();
    } catch (e: unknown) { alert(errMsg(e, 'Failed.')); }
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
    } catch (e: unknown) {
      alert(errMsg(e, `${verb} failed.`));
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
    } catch (e: unknown) { setHolMsg(errMsg(e, 'Failed.')); } finally { setHolSaving(false); }
  };

  const deleteHol = async (id: number) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      await fetchWithAuth(`${BASE}/holidays/${id}`, { method: 'DELETE' });
      loadHolidays();
    } catch (e: unknown) { alert(errMsg(e, 'Failed.')); }
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
      } catch (e: unknown) {
        failures.push(`${h.name} (${h.date}) — ${errMsg(e, 'failed')}`);
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

  const TABS: Array<{ key: typeof tab; label: string; icon: React.ReactNode }> = [
    { key: 'records',   label: 'Records',  icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>) },
    { key: 'manual',    label: 'Mark Manual', icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" /></svg>) },
    { key: 'locations', label: 'Locations', icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>) },
    { key: 'holidays',  label: 'Holidays', icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l-2 9 9-2 8-8a3 3 0 0 0-4-4l-8 8z" /></svg>) },
  ];

  /* Number of holidays already added (for the badge on the Holidays tab). */
  const holidayCount = holidays.length;

  return (
    <RoleGuard allowedRoles={[1, 2]}>
      <div className="attn-page">
        <style jsx>{`
          /* ─── Bulletproof anchor reset ─────────────────────────────────────
             Bootstrap (loaded via layout.tsx) styles bare anchors with
             text-decoration: underline + a blue color. That cascades into
             every <Link>-wrapped child and made the tab strip look like a
             list of blue underlined links in the screenshot. Reset it at
             the page wrapper; same fix used on /admin & /self-assessment. */
          :global(.attn-page a) {
            color: inherit;
            text-decoration: none;
          }
          :global(.attn-page) {
            --navy:       #0B1B3A;
            --navy-mid:   #152D5A;
            --navy-deep:  #07122A;
            --navy-soft:  #F4F6FB;
            --gold:       #E8A020;
            --gold-light: #F5C356;
            --gold-soft:  #FEF6E7;
            --gold-deep:  #B97A0F;
            --slate:      #4A5568;
            --slate-soft: #94A3B8;
            --border:     #E5E9F2;
            --border-soft:#F1F4F9;
            --white:      #ffffff;
          }

          .attn-page {
            min-height: 100vh;
            background: #F4F6FB;
            font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
            color: #0B1B3A;
            padding-top: 110px; /* clear the fixed Navbar */
            padding-bottom: 60px;
          }

          /* ─── Hero ─── */
          .attn-hero {
            background: linear-gradient(180deg, #0B1B3A 0%, #152D5A 100%);
            color: #ffffff;
            padding: 38px 24px 50px;
            position: relative;
            overflow: hidden;
          }
          .attn-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse 700px 400px at 80% 30%, rgba(232,160,32,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 500px 300px at 10% 80%, rgba(26,86,219,0.18) 0%, transparent 70%);
            pointer-events: none;
          }
          .attn-hero-inner {
            position: relative;
            z-index: 1;
            max-width: 1180px;
            margin: 0 auto;
          }
          .attn-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: rgba(232,160,32,0.14);
            border: 1px solid rgba(232,160,32,0.34);
            color: #F5C356;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 5px 14px;
            border-radius: 100px;
            margin-bottom: 12px;
          }
          .attn-eyebrow::before {
            content: '';
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #E8A020;
          }
          .attn-title {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(28px, 3.4vw, 36px);
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.015em;
            line-height: 1.2;
          }
          .attn-sub {
            font-size: 14.5px;
            line-height: 1.6;
            color: rgba(255,255,255,0.7);
            margin: 8px 0 0;
            max-width: 640px;
            font-weight: 300;
          }

          .attn-inner {
            max-width: 1180px;
            margin: -24px auto 0;
            padding: 0 24px;
            position: relative;
            z-index: 2;
          }

          /* ─── Tab strip ─── */
          .attn-tabs {
            display: inline-flex;
            gap: 4px;
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 14px;
            padding: 5px;
            box-shadow: 0 4px 14px rgba(11, 27, 58, 0.06);
            margin-bottom: 18px;
            flex-wrap: wrap;
          }
          .attn-tab {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            border: none;
            background: transparent;
            padding: 9px 16px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 600;
            color: #4A5568;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.18s ease, color 0.18s ease;
          }
          .attn-tab:hover {
            background: #F8FAFD;
            color: #0B1B3A;
          }
          .attn-tab.active {
            background: linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%);
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(11, 27, 58, 0.18);
          }
          .attn-tab .pill-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            border-radius: 100px;
            background: #FEF6E7;
            color: #B97A0F;
            font-size: 10px;
            font-weight: 700;
          }
          .attn-tab.active .pill-count {
            background: rgba(232,160,32,0.22);
            color: #F5C356;
          }

          /* ─── Panel ─── */
          .attn-panel {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 18px;
            padding: 22px;
            box-shadow: 0 2px 12px rgba(11, 27, 58, 0.05);
          }

          /* ─── Filters ─── */
          .attn-filters {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
            align-items: flex-end;
            padding-bottom: 18px;
            margin-bottom: 18px;
            border-bottom: 1px solid #F1F4F9;
          }
          .fl-group { display: flex; flex-direction: column; gap: 6px; }
          .fl-lbl {
            font-size: 11px;
            color: #94A3B8;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .fl-group input,
          .fl-group select {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 10px;
            padding: 9px 12px;
            font-family: inherit;
            font-size: 13px;
            color: #0B1B3A;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease;
            min-width: 150px;
          }
          .fl-group input[type='search'] { min-width: 220px; }
          .fl-group input:focus,
          .fl-group select:focus {
            border-color: #E8A020;
            box-shadow: 0 0 0 3px rgba(232,160,32,0.16);
          }
          .fl-actions { display: flex; gap: 8px; align-items: flex-end; }

          /* ─── Buttons ─── */
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            padding: 9px 18px;
            border-radius: 10px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.02em;
            border: 1px solid transparent;
            cursor: pointer;
            transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, transform 0.15s ease;
            white-space: nowrap;
          }
          .btn:active { transform: translateY(1px); }
          .btn-primary { background: #0B1B3A; color: #ffffff; }
          .btn-primary:hover:not(:disabled) { background: #E8A020; color: #0B1B3A; }
          .btn-primary:disabled { background: #94A3B8; color: #ffffff; cursor: not-allowed; }
          .btn-gold { background: #E8A020; color: #0B1B3A; }
          .btn-gold:hover:not(:disabled) { background: #B97A0F; color: #ffffff; }
          .btn-ghost { background: #ffffff; color: #4A5568; border-color: #E5E9F2; }
          .btn-ghost:hover { border-color: #E8A020; color: #0B1B3A; }
          .btn-outline-primary { background: #ffffff; color: #0B1B3A; border-color: #E5E9F2; }
          .btn-outline-primary:hover { background: #0B1B3A; color: #ffffff; border-color: #0B1B3A; }
          .btn-outline-danger { background: #ffffff; color: #991B1B; border-color: #FCA5A5; }
          .btn-outline-danger:hover { background: #FEF2F2; border-color: #EF4444; }
          .btn-outline-warn { background: #ffffff; color: #92660D; border-color: #FCD34D; }
          .btn-outline-warn:hover { background: #FEF6E7; border-color: #E8A020; }
          .btn-outline-success { background: #ffffff; color: #166534; border-color: #86EFAC; }
          .btn-outline-success:hover { background: #ECFDF5; border-color: #22C55E; }
          .btn-sm { padding: 6px 12px; font-size: 12px; }

          /* ─── Table ─── */
          .table-wrap { overflow-x: auto; margin: 0 -22px -22px; padding: 0 22px; }
          .attn-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .attn-table thead th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #94A3B8;
            padding: 12px 14px;
            border-bottom: 1px solid #E5E9F2;
            background: #FAFBFD;
          }
          .attn-table thead th:first-child { border-top-left-radius: 10px; }
          .attn-table thead th:last-child  { border-top-right-radius: 10px; }
          .attn-table tbody td {
            padding: 14px;
            border-bottom: 1px solid #F1F4F9;
            color: #0B1B3A;
            vertical-align: middle;
          }
          .attn-table tbody tr:hover td { background: #F8FAFD; }
          .attn-table tbody tr:last-child td { border-bottom: none; }
          .uname { font-weight: 600; }
          .uname-sub { font-size: 12px; color: #94A3B8; }
          .uemail { font-size: 12px; color: #4A5568; }

          .punch-active { color: #B97A0F; font-weight: 600; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }

          /* ─── Badges (role + verification) ─── */
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }
          .role-admin    { background: #0B1B3A; color: #ffffff; }
          .role-hr       { background: #EEF2FF; color: #3730A3; }
          .role-student  { background: #ECFDF5; color: #166534; }
          .role-trainer  { background: #FEF6E7; color: #92660D; }
          .role-other    { background: #F4F6FB; color: #4A5568; }
          .badge-info    { background: #DBEAFE; color: #1E40AF; }
          .badge-success { background: #ECFDF5; color: #166534; }
          .badge-warn    { background: #FEF6E7; color: #92660D; }
          .badge-muted   { background: #F4F6FB; color: #94A3B8; }
          .verif-row { display: inline-flex; gap: 4px; flex-wrap: wrap; }

          /* ─── States ─── */
          .attn-state {
            text-align: center;
            padding: 48px 20px;
            color: #94A3B8;
            font-size: 13px;
          }
          .attn-state .spinner {
            display: inline-block;
            width: 22px;
            height: 22px;
            border: 2.5px solid #E5E9F2;
            border-top-color: #E8A020;
            border-radius: 50%;
            margin-bottom: 10px;
            animation: attn-spin 0.85s linear infinite;
          }
          @keyframes attn-spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) {
            .attn-state .spinner { animation: none; }
          }

          /* ─── Sub-header (between filter row and content) ─── */
          .attn-sub-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }
          .attn-sub-head h2 {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 18px;
            font-weight: 700;
            color: #0B1B3A;
            margin: 0;
            letter-spacing: -0.01em;
          }
          .attn-sub-head .sub-meta {
            font-size: 12px;
            color: #94A3B8;
            margin-top: 2px;
          }
          .attn-actions { display: flex; gap: 8px; flex-wrap: wrap; }

          /* ─── Manual mark form ─── */
          .form-wrap { max-width: 640px; margin: 0 auto; }
          .fld { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
          .fld-lbl { font-size: 12px; color: #4A5568; font-weight: 600; }
          .fld input,
          .fld select,
          .fld textarea {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 10px;
            padding: 10px 12px;
            font-family: inherit;
            font-size: 13px;
            color: #0B1B3A;
            outline: none;
            transition: border-color 0.18s ease, box-shadow 0.18s ease;
            width: 100%;
          }
          .fld input:focus,
          .fld select:focus,
          .fld textarea:focus {
            border-color: #E8A020;
            box-shadow: 0 0 0 3px rgba(232,160,32,0.16);
          }
          .fld-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
          .fld-row .fld { margin-bottom: 0; }

          /* ─── Search dropdown ─── */
          .search-results {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 10px;
            margin-top: 6px;
            max-height: 220px;
            overflow-y: auto;
            box-shadow: 0 8px 22px rgba(11, 27, 58, 0.08);
          }
          .search-item {
            display: block;
            width: 100%;
            text-align: left;
            padding: 10px 12px;
            background: transparent;
            border: none;
            border-bottom: 1px solid #F1F4F9;
            font-family: inherit;
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .search-item:hover { background: #FEF6E7; }
          .search-item:last-child { border-bottom: none; }
          .search-name { font-weight: 600; color: #0B1B3A; font-size: 13px; }
          .search-meta { font-size: 11px; color: #94A3B8; margin-top: 2px; }
          .search-empty { padding: 12px; color: #94A3B8; font-size: 12px; text-align: center; }

          /* ─── Selected user pill ─── */
          .selected-user {
            background: #FEF6E7;
            border: 1px solid rgba(232,160,32,0.34);
            border-radius: 12px;
            padding: 12px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .selected-user-meta { font-size: 11px; color: #92660D; margin-top: 2px; }

          /* ─── Alerts ─── */
          .alert {
            padding: 10px 14px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 14px;
            border: 1px solid;
            line-height: 1.5;
          }
          .alert-info    { background: #EFF6FF; color: #1E3A8A; border-color: #BFDBFE; }
          .alert-success { background: #ECFDF5; color: #166534; border-color: #86EFAC; }
          .alert-danger  { background: #FEF2F2; color: #991B1B; border-color: #FCA5A5; }
          .alert-warn    { background: #FEF6E7; color: #92660D; border-color: #FCD34D; white-space: pre-wrap; }

          /* ─── Location cards ─── */
          .loc-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
          }
          .loc-card {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 16px;
            padding: 18px;
            transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
            position: relative;
            overflow: hidden;
          }
          .loc-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #E8A020, #F5C356);
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          .loc-card:hover {
            border-color: rgba(232,160,32,0.5);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(11, 27, 58, 0.06);
          }
          .loc-card:hover::before { opacity: 1; }
          @media (prefers-reduced-motion: reduce) {
            .loc-card:hover { transform: none; }
          }
          .loc-head {
            display: flex; justify-content: space-between; align-items: flex-start;
            gap: 10px; margin-bottom: 8px;
          }
          .loc-name {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 16px;
            font-weight: 700;
            color: #0B1B3A;
            margin: 0;
            letter-spacing: -0.01em;
          }
          .loc-addr { font-size: 12px; color: #4A5568; margin: 0 0 10px; line-height: 1.5; }
          .loc-meta { font-size: 11.5px; color: #94A3B8; margin-bottom: 4px; }
          .loc-meta strong { color: #4A5568; font-weight: 600; }
          .loc-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid #F1F4F9; }

          /* ─── Modal ─── */
          :global(.attn-modal-backdrop) {
            position: fixed;
            inset: 0;
            background: rgba(7, 18, 42, 0.55);
            backdrop-filter: blur(2px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1050;
            padding: 20px;
            animation: attn-modal-in 0.18s ease;
          }
          @keyframes attn-modal-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          :global(.attn-modal-card) {
            background: #ffffff;
            border-radius: 20px;
            width: 100%;
            max-width: 640px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(7, 18, 42, 0.45);
            animation: attn-modal-rise 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.2);
          }
          :global(.attn-modal-card.is-lg) { max-width: 820px; }
          @keyframes attn-modal-rise {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            :global(.attn-modal-backdrop),
            :global(.attn-modal-card) { animation: none; }
          }
          :global(.attn-modal-head) {
            padding: 20px 24px 16px;
            border-bottom: 1px solid #F1F4F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          :global(.attn-modal-title) {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 20px;
            font-weight: 700;
            color: #0B1B3A;
            margin: 0;
            letter-spacing: -0.01em;
          }
          :global(.attn-modal-close) {
            background: transparent;
            border: none;
            cursor: pointer;
            color: #94A3B8;
            padding: 6px;
            border-radius: 6px;
            line-height: 0;
            transition: background 0.15s, color 0.15s;
          }
          :global(.attn-modal-close):hover { background: #F4F6FB; color: #0B1B3A; }
          :global(.attn-modal-body) {
            padding: 22px 24px;
            overflow-y: auto;
            flex: 1;
          }
          :global(.attn-modal-foot) {
            padding: 16px 24px;
            border-top: 1px solid #F1F4F9;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            background: #FAFBFD;
            flex-wrap: wrap;
          }

          /* ─── Checkbox ─── */
          .ck-row {
            display: flex; align-items: center; gap: 8px;
            font-size: 13px; color: #4A5568;
          }
          .ck-row input[type='checkbox'] {
            width: 16px; height: 16px;
            accent-color: #E8A020;
            cursor: pointer;
          }

          /* ─── National-holidays table inside modal ─── */
          .nat-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
          .nat-table thead th {
            text-align: left;
            padding: 8px 8px;
            font-size: 10.5px;
            font-weight: 700;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #E5E9F2;
          }
          .nat-table tbody td {
            padding: 8px;
            border-bottom: 1px solid #F1F4F9;
            color: #0B1B3A;
          }
          .nat-table tbody tr.nat-existed td { color: #94A3B8; }
          .nat-table tbody tr:last-child td { border-bottom: none; }
          .nat-table input[type='date'] {
            background: #ffffff;
            border: 1px solid #E5E9F2;
            border-radius: 8px;
            padding: 5px 8px;
            font-size: 12px;
            font-family: inherit;
            color: #0B1B3A;
            outline: none;
          }
          .nat-table input[type='date']:focus {
            border-color: #E8A020;
            box-shadow: 0 0 0 2px rgba(232,160,32,0.16);
          }

          .small-note { font-size: 12px; color: #94A3B8; margin: 14px 0 0; }

          /* ─── Mobile tweaks ─── */
          @media (max-width: 720px) {
            .attn-tab { padding: 8px 12px; font-size: 12px; }
            .fl-group input[type='search'] { min-width: 0; }
            .fld-row { grid-template-columns: 1fr; }
            .attn-inner { padding: 0 16px; }
            .attn-hero { padding: 30px 20px 44px; }
          }
        `}</style>

        {/* ───────── Hero ───────── */}
        <header className="attn-hero">
          <div className="attn-hero-inner">
            <span className="attn-eyebrow">Operations · Attendance</span>
            <h1 className="attn-title">Attendance Management</h1>
            <p className="attn-sub">
              View daily attendance records, mark attendance manually for a student, configure
              office locations with GPS &amp; IP fencing, and manage the company-wide holiday calendar.
            </p>
          </div>
        </header>

        <main className="attn-inner">
          {/* ───────── Tabs ───────── */}
          <div className="attn-tabs" role="tablist" aria-label="Attendance sections">
            {TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`attn-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon}
                {t.label}
                {t.key === 'holidays' && holidayCount > 0 && (
                  <span className="pill-count">{holidayCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ─── Records Tab ─── */}
          {tab === 'records' && (
            <div className="attn-panel">
              <div className="attn-filters">
                <div className="fl-group">
                  <label className="fl-lbl">Date</label>
                  <input type="date" value={filterDate}
                    onChange={e => setFilterDate(e.target.value)} />
                </div>
                <div className="fl-group">
                  <label className="fl-lbl">From</label>
                  <input type="date" value={filterFrom}
                    onChange={e => { setFilterFrom(e.target.value); if (e.target.value) setFilterDate(''); }} />
                </div>
                <div className="fl-group">
                  <label className="fl-lbl">To</label>
                  <input type="date" value={filterTo}
                    onChange={e => { setFilterTo(e.target.value); if (e.target.value) setFilterDate(''); }} />
                </div>
                <div className="fl-group">
                  <label className="fl-lbl">Role</label>
                  <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="">All roles</option>
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="fl-group" style={{ flex: '1 1 220px' }}>
                  <label className="fl-lbl">Search</label>
                  <input type="search" value={filterQ}
                    onChange={e => setFilterQ(e.target.value)}
                    placeholder="Name, email, phone, ID…" />
                </div>
                <div className="fl-actions">
                  <button className="btn btn-primary" onClick={loadRecords}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Apply
                  </button>
                  <button className="btn btn-ghost" onClick={resetRecordFilters}>Reset (today)</button>
                </div>
              </div>

              <div className="attn-sub-head">
                <div>
                  <h2>Attendance records</h2>
                  <div className="sub-meta">
                    {loading
                      ? 'Loading…'
                      : `${records.length} record${records.length === 1 ? '' : 's'} ${filterDate ? `on ${filterDate}` : 'in range'}`}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="attn-state">
                  <div className="spinner" aria-hidden="true" />
                  <div>Loading attendance records…</div>
                </div>
              ) : records.length === 0 ? (
                <div className="attn-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, marginBottom: 8 }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <div>No records match these filters.</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="attn-table">
                    <thead>
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
                      {records.map(r => (
                        <tr key={r.id}>
                          <td>
                            <div className="uname">
                              {r.user?.name || '—'} <span className="uname-sub">#{r.user?.id}</span>
                            </div>
                            <div className="uemail">{r.user?.email}</div>
                          </td>
                          <td>
                            <span className={`badge ${roleBadgeClass(r.user?.role)}`}>{roleLabel(r.user?.role)}</span>
                          </td>
                          <td>{(r.date || '').slice(0, 10)}</td>
                          <td>{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : '—'}</td>
                          <td>
                            {r.punch_out
                              ? new Date(r.punch_out).toLocaleTimeString()
                              : <span className="punch-active">Active</span>}
                          </td>
                          <td>{duration(r.punch_in, r.punch_out)}</td>
                          <td>{r.location?.name || '—'}</td>
                          <td>
                            <span className="verif-row">
                              {r.wifi_verified && <span className="badge badge-info">WiFi</span>}
                              {r.gps_verified  && <span className="badge badge-success">GPS</span>}
                              {r.marked_by && (
                                <span className="badge badge-warn" title={`Admin user #${r.marked_by}`}>
                                  Manual · {r.markedBy?.name || `#${r.marked_by}`}
                                </span>
                              )}
                              {!r.wifi_verified && !r.gps_verified && !r.marked_by && (
                                <span className="badge badge-muted">Unverified</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── Manual Mark Tab ─── */}
          {tab === 'manual' && (
            <div className="attn-panel">
              <div className="attn-sub-head">
                <div>
                  <h2>Mark attendance manually</h2>
                  <div className="sub-meta">For days a student forgot to punch / was on a sanctioned outside trip.</div>
                </div>
              </div>

              <div className="form-wrap">
                {manualMsg && (
                  <div className={`alert ${manualMsg.toLowerCase().includes('success') ? 'alert-success' : 'alert-danger'}`}>
                    {manualMsg}
                  </div>
                )}

                <form onSubmit={markManual}>
                  {/* Student picker */}
                  <div className="fld" style={{ position: 'relative' }}>
                    <label className="fld-lbl">Student *</label>
                    {selectedUser ? (
                      <div className="selected-user">
                        <div>
                          <div className="uname">
                            {selectedUser.name} <span className="uname-sub">#{selectedUser.id}</span>
                          </div>
                          <div className="selected-user-meta">
                            {selectedUser.email}
                            {selectedUser.phone ? ` · ${selectedUser.phone}` : ''}
                            {selectedUser.role ? ` · ${roleLabel(selectedUser.role)}` : ''}
                          </div>
                        </div>
                        <button type="button" className="btn btn-sm btn-ghost"
                          onClick={() => { setSelectedUser(null); setManualSearch(''); setManualResults([]); }}>
                          Change
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="text"
                          placeholder="Search by name, email or phone (min 2 chars)"
                          value={manualSearch}
                          onChange={e => setManualSearch(e.target.value)} />
                        {manualSearch.length >= 2 && (
                          <div className="search-results">
                            {manualSearching ? (
                              <div className="search-empty">Searching…</div>
                            ) : manualResults.length === 0 ? (
                              <div className="search-empty">No students found.</div>
                            ) : manualResults.map(u => (
                              <button key={u.id} type="button" className="search-item"
                                onClick={() => { setSelectedUser(u); setManualSearch(''); setManualResults([]); }}>
                                <div className="search-name">{u.name} <span className="uname-sub">#{u.id}</span></div>
                                <div className="search-meta">
                                  {u.email}
                                  {u.phone ? ` · ${u.phone}` : ''}
                                  {u.role ? ` · ${roleLabel(u.role)}` : ''}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="fld">
                    <label className="fld-lbl">Date *</label>
                    <input type="date" required value={manualForm.date}
                      max={todayYmd()}
                      onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} />
                  </div>

                  <div className="fld-row">
                    <div className="fld">
                      <label className="fld-lbl">Punch In *</label>
                      <input type="time" required value={manualForm.punch_in}
                        onChange={e => setManualForm(f => ({ ...f, punch_in: e.target.value }))} />
                    </div>
                    <div className="fld">
                      <label className="fld-lbl">Punch Out</label>
                      <input type="time" value={manualForm.punch_out}
                        onChange={e => setManualForm(f => ({ ...f, punch_out: e.target.value }))} />
                    </div>
                  </div>

                  <div className="fld">
                    <label className="fld-lbl">Notes</label>
                    <textarea rows={2} value={manualForm.notes}
                      onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Reason / context (optional)" />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn btn-primary" disabled={manualSaving || !selectedUser}>
                      {manualSaving ? 'Saving…' : 'Mark present'}
                    </button>
                    <small style={{ fontSize: 12, color: '#94A3B8' }}>
                      Will be recorded as marked by you.
                    </small>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ─── Locations Tab ─── */}
          {tab === 'locations' && (
            <div className="attn-panel">
              <div className="attn-sub-head">
                <div>
                  <h2>Office locations</h2>
                  <div className="sub-meta">
                    {locations.length === 0
                      ? 'No locations configured yet — students cannot punch from a fenced site.'
                      : `${locations.length} configured · GPS + IP fencing rules`}
                  </div>
                </div>
                <div className="attn-actions">
                  <button className="btn btn-primary" onClick={openCreateLoc}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add location
                  </button>
                </div>
              </div>

              {locations.length === 0 ? (
                <div className="attn-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, marginBottom: 8 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>No locations configured.</div>
                </div>
              ) : (
                <div className="loc-grid">
                  {locations.map(loc => (
                    <div key={loc.id} className="loc-card">
                      <div className="loc-head">
                        <h3 className="loc-name">{loc.name}</h3>
                        <span className={`badge ${loc.is_active ? 'badge-success' : 'badge-muted'}`}>
                          {loc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {loc.address && <p className="loc-addr">{loc.address}</p>}
                      {(loc.latitude && loc.longitude) && (
                        <div className="loc-meta">
                          <strong>GPS:</strong> {loc.latitude}, {loc.longitude} · radius {loc.radius_meters}m
                        </div>
                      )}
                      {(loc.allowed_ips || []).length > 0 && (
                        <div className="loc-meta">
                          <strong>IPs:</strong> {loc.allowed_ips!.join(', ')}
                        </div>
                      )}
                      <div className="loc-actions">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEditLoc(loc)}>Edit</button>
                        <button className={`btn btn-sm ${loc.is_active ? 'btn-outline-warn' : 'btn-outline-success'}`}
                          onClick={() => toggleLocActive(loc)}>
                          {loc.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => deleteLoc(loc.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Holidays Tab ─── */}
          {tab === 'holidays' && (
            <div className="attn-panel">
              <div className="attn-sub-head">
                <div>
                  <h2>Holiday calendar · {new Date().getFullYear()}</h2>
                  <div className="sub-meta">
                    {holidays.length} holiday{holidays.length === 1 ? '' : 's'} configured · excluded from absentee counts
                  </div>
                </div>
                <div className="attn-actions">
                  <button className="btn btn-ghost" onClick={openNationalModal}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    From national list
                  </button>
                  <button className="btn btn-primary" onClick={openCreateHol}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add holiday
                  </button>
                </div>
              </div>

              {holidaysLoading ? (
                <div className="attn-state">
                  <div className="spinner" aria-hidden="true" />
                  <div>Loading holiday calendar…</div>
                </div>
              ) : holidays.length === 0 ? (
                <div className="attn-state">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55, marginBottom: 8 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <div>No holidays configured yet.</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="attn-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Added by</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.map(h => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 600 }}>{(h.date || '').slice(0, 10)}</td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>
                            {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long' })}
                          </td>
                          <td>{h.name}</td>
                          <td style={{ fontSize: 12, color: '#4A5568' }}>{h.description || '—'}</td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>{h.creator?.name || '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-sm btn-outline-primary" style={{ marginRight: 6 }} onClick={() => openEditHol(h)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteHol(h.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="small-note">
                Holidays and Sundays are excluded from absentee counts on the student attendance dashboard.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* ─────────────────── Location Modal ─────────────────── */}
      {showLocModal && (
        <div className="attn-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowLocModal(false); }}>
          <div className="attn-modal-card is-lg">
            <div className="attn-modal-head">
              <h2 className="attn-modal-title">{editLoc ? 'Edit location' : 'Add location'}</h2>
              <button className="attn-modal-close" onClick={() => setShowLocModal(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={saveLoc} style={{ display: 'contents' }}>
              <div className="attn-modal-body">
                {locMsg && (
                  <div className={`alert ${
                    locMsg.toLowerCase().includes('fail') ||
                    locMsg.toLowerCase().includes('could not') ||
                    locMsg.toLowerCase().includes('denied') ||
                    locMsg.toLowerCase().includes('unavailable') ||
                    locMsg.toLowerCase().includes('timed out') ||
                    locMsg.toLowerCase().includes('not supported') ||
                    locMsg.toLowerCase().includes('requires https')
                      ? 'alert-danger' : 'alert-info'}`}>
                    {locMsg}
                  </div>
                )}

                <div className="fld">
                  <label className="fld-lbl">Name *</label>
                  <input required value={locForm.name}
                    onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="fld">
                  <label className="fld-lbl">Address</label>
                  <input value={locForm.address}
                    onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} />
                </div>

                <div className="fld-row">
                  <div className="fld">
                    <label className="fld-lbl">Latitude</label>
                    <input type="number" step="any" value={locForm.latitude}
                      onChange={e => setLocForm(f => ({ ...f, latitude: e.target.value }))} />
                  </div>
                  <div className="fld">
                    <label className="fld-lbl">Longitude</label>
                    <input type="number" step="any" value={locForm.longitude}
                      onChange={e => setLocForm(f => ({ ...f, longitude: e.target.value }))} />
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-outline-success" style={{ marginBottom: 14 }}
                  onClick={autoFetchGps} disabled={autoGpsLoading}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {autoGpsLoading ? 'Fetching…' : 'Use current location'}
                </button>

                <div className="fld">
                  <label className="fld-lbl">GPS radius (meters)</label>
                  <input type="number" min={10} max={5000} value={locForm.radius_meters}
                    onChange={e => setLocForm(f => ({ ...f, radius_meters: e.target.value }))} />
                </div>

                <div className="fld">
                  <label className="fld-lbl">Allowed IPs <span style={{ color: '#94A3B8', fontWeight: 400 }}>(comma-separated)</span></label>
                  <input placeholder="e.g. 192.168.1.1, 10.0.0.1" value={locForm.allowed_ips}
                    onChange={e => setLocForm(f => ({ ...f, allowed_ips: e.target.value }))} />
                </div>
                <button type="button" className="btn btn-sm btn-outline-primary" style={{ marginBottom: 14 }}
                  onClick={autoFetchIp} disabled={autoIpLoading}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
                  </svg>
                  {autoIpLoading ? 'Fetching…' : 'Use current IP'}
                </button>

                <label className="ck-row">
                  <input type="checkbox"
                    checked={locForm.is_active}
                    onChange={e => setLocForm(f => ({ ...f, is_active: e.target.checked }))} />
                  Active (students can punch from here)
                </label>
              </div>
              <div className="attn-modal-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setShowLocModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={locSaving}>
                  {locSaving ? 'Saving…' : 'Save location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────── National Holidays Modal ─────────────────── */}
      {showNationalModal && (
        <div className="attn-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowNationalModal(false); }}>
          <div className="attn-modal-card is-lg">
            <div className="attn-modal-head">
              <h2 className="attn-modal-title">National holidays · 2026</h2>
              <button className="attn-modal-close" onClick={() => setShowNationalModal(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="attn-modal-body" style={{ maxHeight: 480 }}>
              <p className="small-note" style={{ marginTop: 0, marginBottom: 12 }}>
                Select holidays to add to {new Date().getFullYear()}. Lunar / Islamic dates are best-effort approximations — edit each date inline if your calendar differs. Already-added entries are pre-disabled.
              </p>

              {bulkMsg && <div className="alert alert-warn">{bulkMsg}</div>}

              <table className="nat-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <th style={{ width: 150 }}>Date</th>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {nationalChoices.map((c, i) => (
                    <tr key={i} className={c.alreadyExists ? 'nat-existed' : ''}>
                      <td>
                        <input type="checkbox"
                          checked={c.checked}
                          disabled={c.alreadyExists}
                          style={{ accentColor: '#E8A020', width: 15, height: 15, cursor: c.alreadyExists ? 'not-allowed' : 'pointer' }}
                          onChange={e => {
                            const next = [...nationalChoices];
                            next[i] = { ...next[i], checked: e.target.checked };
                            setNationalChoices(next);
                          }} />
                      </td>
                      <td>
                        <input type="date"
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
                        {c.alreadyExists && <span className="badge badge-success" style={{ marginLeft: 8 }}>Added</span>}
                      </td>
                      <td style={{ color: '#4A5568' }}>{c.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button type="button" className="btn btn-sm btn-ghost"
                  onClick={() => setNationalChoices(nc => nc.map(c => c.alreadyExists ? c : ({ ...c, checked: true })))}>
                  Select all
                </button>
                <button type="button" className="btn btn-sm btn-ghost"
                  onClick={() => setNationalChoices(nc => nc.map(c => ({ ...c, checked: false })))}>
                  Deselect all
                </button>
              </div>
            </div>
            <div className="attn-modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setShowNationalModal(false)}>Close</button>
              <button type="button" className="btn btn-primary"
                onClick={bulkAddSelected}
                disabled={bulkAdding || nationalChoices.filter(c => c.checked && !c.alreadyExists).length === 0}>
                {bulkAdding
                  ? 'Adding…'
                  : `Add ${nationalChoices.filter(c => c.checked && !c.alreadyExists).length} holiday${nationalChoices.filter(c => c.checked && !c.alreadyExists).length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── Holiday Modal ─────────────────── */}
      {showHolModal && (
        <div className="attn-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowHolModal(false); }}>
          <div className="attn-modal-card">
            <div className="attn-modal-head">
              <h2 className="attn-modal-title">{editHol ? 'Edit holiday' : 'Add holiday'}</h2>
              <button className="attn-modal-close" onClick={() => setShowHolModal(false)} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={saveHol} style={{ display: 'contents' }}>
              <div className="attn-modal-body">
                {holMsg && <div className="alert alert-danger">{holMsg}</div>}
                <div className="fld">
                  <label className="fld-lbl">Date *</label>
                  <input type="date" required value={holForm.date}
                    onChange={e => setHolForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="fld">
                  <label className="fld-lbl">Name *</label>
                  <input required value={holForm.name}
                    onChange={e => setHolForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Republic Day" />
                </div>
                <div className="fld">
                  <label className="fld-lbl">Description</label>
                  <textarea rows={2} value={holForm.description}
                    onChange={e => setHolForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="attn-modal-foot">
                <button type="button" className="btn btn-ghost" onClick={() => setShowHolModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={holSaving}>
                  {holSaving ? 'Saving…' : 'Save holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
