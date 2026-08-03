'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';

/* /admin/notifications — compose and send custom notifications.
 *
 * Covers the whole notification API: history (GET /admin/notifications),
 * picker data (…/audiences), live recipient preview (…/preview), send-or-
 * schedule (POST), detail (GET {id}), cancel, resend and delete.
 *
 * Each send lands as an in-app row for every recipient AND an FCM push.
 * Mirrors /admin/reviews: hardcoded BASE, fetchWithAuth, AdminSection chrome,
 * portaled modals with :global() overlay rules.
 *
 * ⚠️ Class names are all `ntf-*` prefixed — Bootstrap is loaded globally via
 * CDN in layout.tsx, so bare .modal/.card/.btn/.badge/.alert would collide. */

const BASE = 'https://api.easycoders.in/api';

type AudienceType = 'all' | 'role' | 'batch' | 'course' | 'users';
type Status = 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

type Campaign = {
  id: number;
  title: string;
  message: string;
  audience_type: AudienceType;
  audience_ids: number[] | null;
  audience_label: string | null;
  data: { type?: string; id?: string | number } | null;
  status: Status;
  scheduled_at: string | null;
  sent_at: string | null;
  error: string | null;
  recipients_count: number;
  push_sent_count: number;
  push_failed_count: number;
  created_at: string | null;
  creator?: { id: number; name: string } | null;
};

type Option = { id: number; name: string };
type UserOption = { id: number; name: string; email: string; role: number };

type Audiences = {
  roles: Option[];
  batches: { id: number; name: string; course_id: number | null; status: string }[];
  courses: { id: number; title: string; status: string }[];
  users: UserOption[];
};

const TABS: { key: '' | Status; label: string }[] = [
  { key: '',          label: 'All' },
  { key: 'sent',      label: 'Sent' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'failed',    label: 'Failed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<Status, { label: string; bg: string; color: string }> = {
  scheduled: { label: 'Scheduled', bg: '#fffbeb', color: '#b45309' },
  sending:   { label: 'Sending',   bg: '#eff6ff', color: '#1d4ed8' },
  sent:      { label: 'Sent',      bg: '#f0fdf4', color: '#15803d' },
  failed:    { label: 'Failed',    bg: '#fef2f2', color: '#b91c1c' },
  cancelled: { label: 'Cancelled', bg: '#f1f5f9', color: '#475569' },
};

const AUDIENCE_TYPES: { key: AudienceType; label: string; hint: string }[] = [
  { key: 'all',    label: 'Everyone',       hint: 'Every active user on the platform' },
  { key: 'role',   label: 'By role',        hint: 'Admins, HR, trainers or students' },
  { key: 'batch',  label: 'By batch',       hint: 'Active members of the chosen batch(es)' },
  { key: 'course', label: 'By course',      hint: 'Everyone admitted to / in a batch of the course' },
  { key: 'users',  label: 'Specific people', hint: 'Hand-pick individual users' },
];

const ROLE_NAME: Record<number, string> = { 1: 'Admin', 2: 'HR', 3: 'Student', 4: 'Trainer' };

/* Date helpers live at module scope — calling new Date() inside a component
 * body (or a helper defined in it) trips react-hooks/purity at build time. */
const fmtDateTime = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** `YYYY-MM-DDTHH:mm` in LOCAL time, for a datetime-local input. */
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminNotificationsPage() {
  const [items, setItems]     = useState<Campaign[]>([]);
  const [page, setPage]       = useState(1);
  const [lastPage, setLast]   = useState(1);
  const [total, setTotal]     = useState(0);
  const [tab, setTab]         = useState<'' | Status>('');
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');
  const [loading, setLoad]    = useState(true);
  const [busy, setBusy]       = useState<number | null>(null);
  const [err, setErr]         = useState('');

  const [audiences, setAudiences] = useState<Audiences | null>(null);
  const [compose, setCompose]     = useState(false);
  const [detail, setDetail]       = useState<Campaign | null>(null);

  // ── Load history ───────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoad(true);
    setErr('');
    const qs = new URLSearchParams({ page: String(page), per_page: '15' });
    if (tab) qs.set('status', tab);
    if (query) qs.set('search', query);

    fetchWithAuth(`${BASE}/admin/notifications?${qs.toString()}`)
      .then(r => {
        const p = r?.data;
        setItems(Array.isArray(p?.data) ? p.data : []);
        setLast(p?.last_page ?? 1);
        setTotal(p?.total ?? 0);
      })
      .catch((e: unknown) => {
        setItems([]);
        setErr(e instanceof Error ? e.message : 'Could not load notifications.');
      })
      .finally(() => setLoad(false));
  }, [page, tab, query]);

  useEffect(() => { load(); }, [load]);

  // Picker data — loaded once, reused by the compose modal.
  useEffect(() => {
    fetchWithAuth(`${BASE}/admin/notifications/audiences`)
      .then(r => setAudiences(r?.data ?? null))
      .catch(() => setAudiences(null));
  }, []);

  // Debounce the search box into the query the request actually uses.
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Row actions ────────────────────────────────────────────────────────────
  const cancel = async (c: Campaign) => {
    if (!confirm(`Cancel the scheduled notification “${c.title}”?`)) return;
    setBusy(c.id);
    try {
      await fetchWithAuth(`${BASE}/admin/notifications/${c.id}/cancel`, { method: 'POST' });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Cancel failed.'); }
    finally { setBusy(null); }
  };

  const resend = async (c: Campaign) => {
    if (!confirm(`Re-send “${c.title}” to ${c.audience_label ?? 'the same audience'}?`)) return;
    setBusy(c.id);
    try {
      const r = await fetchWithAuth(`${BASE}/admin/notifications/${c.id}/resend`, { method: 'POST' });
      alert(r?.message ?? 'Re-sent.');
      setPage(1); load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Re-send failed.'); }
    finally { setBusy(null); }
  };

  const remove = async (c: Campaign) => {
    if (!confirm(`Delete “${c.title}” from history? Already-delivered notifications stay in recipients' inboxes.`)) return;
    setBusy(c.id);
    try {
      await fetchWithAuth(`${BASE}/admin/notifications/${c.id}`, { method: 'DELETE' });
      load();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed.'); }
    finally { setBusy(null); }
  };

  const openDetail = async (c: Campaign) => {
    setDetail(c); // show what we have immediately
    try {
      const r = await fetchWithAuth(`${BASE}/admin/notifications/${c.id}`);
      if (r?.data) setDetail(r.data);
    } catch { /* keep the list copy */ }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Communication"
        title="Notifications"
        description="Compose a custom notification and send it to everyone, a role, a batch, a course or hand-picked people — instantly or scheduled for later."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Notifications' },
        ]}
      >
        <div className="ntf">
          {/* Toolbar */}
          <div className="ntf-bar">
            <div className="ntf-tabs">
              {TABS.map(t => (
                <button
                  key={t.key || 'all'}
                  className={`ntf-tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => { setTab(t.key); setPage(1); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ntf-bar-right">
              <input
                className="ntf-search"
                placeholder="Search title or message…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="ntf-new" onClick={() => setCompose(true)}>
                <span aria-hidden="true">+</span> New notification
              </button>
            </div>
          </div>

          {err && (
            <div className="ntf-error">
              <span>{err}</span>
              <button className="ntf-retry" onClick={load}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="ntf-empty">Loading notifications…</div>
          ) : err ? (
            /* The load failed — say nothing about the inbox being empty, or a
             * failed request reads as "you have never sent anything". */
            null
          ) : items.length === 0 ? (
            <div className="ntf-empty">
              {query || tab ? 'No notifications match this filter.' : 'No notifications sent yet. Compose your first one.'}
            </div>
          ) : (
            <div className="ntf-list">
              {items.map(c => (
                <article key={c.id} className="ntf-card">
                  <div className="ntf-main">
                    <div className="ntf-head">
                      <h3 className="ntf-title">{c.title}</h3>
                      <span
                        className="ntf-badge"
                        style={{ background: STATUS_BADGE[c.status]?.bg, color: STATUS_BADGE[c.status]?.color }}
                      >
                        {STATUS_BADGE[c.status]?.label ?? c.status}
                      </span>
                    </div>

                    <p className="ntf-msg">{c.message}</p>

                    <div className="ntf-meta">
                      <span className="ntf-aud">{c.audience_label ?? c.audience_type}</span>
                      <span className="ntf-dot">·</span>
                      {c.status === 'scheduled'
                        ? <>scheduled for <strong>{fmtDateTime(c.scheduled_at)}</strong></>
                        : c.sent_at
                          ? <>sent {fmtDateTime(c.sent_at)}</>
                          : <>created {fmtDateTime(c.created_at)}</>}
                      {c.creator?.name && <><span className="ntf-dot">·</span>by {c.creator.name}</>}
                    </div>

                    {c.status === 'failed' && c.error && (
                      <div className="ntf-failmsg">{c.error}</div>
                    )}
                  </div>

                  <div className="ntf-side">
                    {c.status === 'sent' && (
                      <div className="ntf-stats">
                        <div className="ntf-stat">
                          <strong>{c.recipients_count}</strong>
                          <span>recipients</span>
                        </div>
                        <div className="ntf-stat">
                          <strong>{c.push_sent_count}</strong>
                          <span>pushed</span>
                        </div>
                        {c.push_failed_count > 0 && (
                          <div className="ntf-stat ntf-stat-warn">
                            <strong>{c.push_failed_count}</strong>
                            <span>failed</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="ntf-btn-row">
                      <button className="ntf-btn ghost" disabled={busy === c.id} onClick={() => openDetail(c)}>Details</button>
                      {c.status === 'scheduled' && (
                        <button className="ntf-btn warn" disabled={busy === c.id} onClick={() => cancel(c)}>Cancel</button>
                      )}
                      {(c.status === 'sent' || c.status === 'failed') && (
                        <button className="ntf-btn ghost" disabled={busy === c.id} onClick={() => resend(c)}>Re-send</button>
                      )}
                      <button className="ntf-btn del" disabled={busy === c.id} onClick={() => remove(c)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {lastPage > 1 && (
            <div className="ntf-pager">
              <button className="ntf-btn ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="ntf-pageinfo">Page {page} of {lastPage} · {total} total</span>
              <button className="ntf-btn ghost" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>

        {compose && (
          <ComposeModal
            audiences={audiences}
            onClose={() => setCompose(false)}
            onSent={() => { setCompose(false); setTab(''); setPage(1); load(); }}
          />
        )}

        {detail && <DetailModal campaign={detail} onClose={() => setDetail(null)} />}

        <style jsx>{`
          .ntf { font-family: 'DM Sans', system-ui, sans-serif; }

          .ntf-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
          .ntf-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
          .ntf-tab {
            background: #fff; border: 1px solid #e5e9f2; color: #4a5568;
            border-radius: 100px; padding: 8px 16px; font-size: 13px; font-weight: 600;
            cursor: pointer; font-family: inherit; transition: all .18s ease;
          }
          .ntf-tab:hover { border-color: #E8A020; color: #0B1B3A; }
          .ntf-tab.active { background: #0B1B3A; border-color: #0B1B3A; color: #fff; }

          .ntf-bar-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
          .ntf-search {
            border: 1px solid #e5e9f2; border-radius: 10px; padding: 9px 14px;
            font-size: 13px; font-family: inherit; color: #0B1B3A; outline: none;
            min-width: 220px; box-sizing: border-box;
          }
          .ntf-search:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .ntf-new {
            background: #E8A020; border: 1.5px solid #E8A020; color: #0B1B3A;
            border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 700;
            cursor: pointer; font-family: inherit; transition: filter .15s ease;
          }
          .ntf-new:hover { filter: brightness(1.06); }

          .ntf-error {
            display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;
            background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px;
            padding: 12px 16px; font-size: 13px; margin-bottom: 16px;
          }
          .ntf-retry { background: #fff; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
          .ntf-retry:hover { background: #b91c1c; color: #fff; border-color: #b91c1c; }
          .ntf-empty { padding: 48px; text-align: center; color: #8492a6; font-size: 14px; }

          .ntf-list { display: flex; flex-direction: column; gap: 14px; }
          .ntf-card {
            display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px;
            background: #fff; border: 1px solid #e5e9f2; border-radius: 16px; padding: 18px;
          }
          @media (max-width: 780px) { .ntf-card { grid-template-columns: minmax(0, 1fr); } }

          .ntf-main { min-width: 0; }
          .ntf-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
          .ntf-title { font-family: 'Playfair Display', Georgia, serif; font-size: 17px; font-weight: 700; color: #0B1B3A; margin: 0; }
          .ntf-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
          .ntf-msg { font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 8px; white-space: pre-wrap; }
          .ntf-meta { font-size: 12.5px; color: #64748b; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
          .ntf-aud { color: #0B1B3A; font-weight: 600; }
          .ntf-dot { color: #cbd5e1; }
          .ntf-failmsg { margin-top: 8px; background: #fef2f2; color: #b91c1c; border-radius: 8px; padding: 8px 12px; font-size: 12.5px; }

          .ntf-side { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
          @media (max-width: 780px) { .ntf-side { align-items: flex-start; } }
          .ntf-stats { display: flex; gap: 18px; }
          .ntf-stat { display: flex; flex-direction: column; align-items: center; }
          .ntf-stat strong { font-size: 18px; color: #0B1B3A; font-weight: 700; line-height: 1.1; }
          .ntf-stat span { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
          .ntf-stat-warn strong { color: #b45309; }

          .ntf-btn-row { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          .ntf-btn { border: 1px solid #e5e9f2; background: #fff; color: #4a5568; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s ease; }
          .ntf-btn:disabled { opacity: .5; cursor: not-allowed; }
          .ntf-btn.ghost:hover:not(:disabled) { border-color: #0B1B3A; color: #0B1B3A; }
          .ntf-btn.warn:hover:not(:disabled) { border-color: #f59e0b; color: #b45309; }
          .ntf-btn.del:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }

          .ntf-pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 22px; }
          .ntf-pageinfo { font-size: 12.5px; color: #64748b; }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}

/* ─── Compose modal — audience picker + live preview + send/schedule ─── */
function ComposeModal({ audiences, onClose, onSent }: {
  audiences: Audiences | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const [title, setTitle]         = useState('');
  const [message, setMessage]     = useState('');
  const [type, setType]           = useState<AudienceType>('all');
  const [ids, setIds]             = useState<number[]>([]);
  const [includeInactive, setInc] = useState(false);
  const [scheduleOn, setSched]    = useState(false);
  const [when, setWhen]           = useState('');
  const [minWhen, setMinWhen]     = useState('');
  const [userSearch, setUserSrch] = useState('');

  const [count, setCount]     = useState<number | null>(null);
  const [label, setLabel]     = useState('');
  const [sample, setSample]   = useState<UserOption[]>([]);
  const [previewing, setPrev] = useState(false);
  const [previewErr, setPErr] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');

  // Earliest schedulable time — computed in an effect so no Date is
  // constructed during render (react-hooks/purity).
  useEffect(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    setMinWhen(toLocalInput(d));
  }, []);

  // Reset the selection whenever the audience type changes.
  useEffect(() => { setIds([]); setUserSrch(''); }, [type]);

  // Live recipient preview — same resolver the real send uses.
  useEffect(() => {
    if (type !== 'all' && ids.length === 0) {
      setCount(null); setLabel(''); setSample([]); setPErr('');
      return;
    }
    let cancelled = false;
    setPrev(true);
    setPErr('');
    const t = setTimeout(() => {
      fetchWithAuth(`${BASE}/admin/notifications/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience_type: type, audience_ids: ids, include_inactive: includeInactive }),
      })
        .then(r => {
          if (cancelled) return;
          setCount(r?.data?.recipients_count ?? 0);
          setLabel(r?.data?.audience_label ?? '');
          setSample(Array.isArray(r?.data?.sample) ? r.data.sample : []);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setCount(null); setSample([]);
          setPErr(e instanceof Error ? e.message : 'Could not work out who this reaches.');
        })
        .finally(() => { if (!cancelled) setPrev(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [type, ids, includeInactive]);

  const toggleId = (id: number) =>
    setIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const filteredUsers = useMemo(() => {
    const list = audiences?.users ?? [];
    const q = userSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(u =>
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [audiences, userSearch]);

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    (type === 'all' || ids.length > 0) &&
    (!scheduleOn || when !== '') &&
    !sending;

  const submit = async () => {
    setSending(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        audience_type: type,
        include_inactive: includeInactive,
      };
      if (type !== 'all') payload.audience_ids = ids;
      if (scheduleOn && when) payload.scheduled_at = when.replace('T', ' ') + ':00';

      const r = await fetchWithAuth(`${BASE}/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert(r?.message ?? 'Notification sent.');
      onSent();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send the notification.');
    } finally {
      setSending(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="ntfm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ntfm">
        <h3 className="ntfm-title">New notification</h3>

        {error && <div className="ntfm-error">{error}</div>}

        <label className="ntfm-label">Title</label>
        <input
          className="ntfm-input"
          value={title}
          maxLength={255}
          placeholder="e.g. Holiday notice"
          onChange={e => setTitle(e.target.value)}
        />

        <label className="ntfm-label">Message</label>
        <textarea
          className="ntfm-input ntfm-textarea"
          value={message}
          maxLength={2000}
          placeholder="What do you want to tell them?"
          onChange={e => setMessage(e.target.value)}
        />
        <div className="ntfm-counter">{message.length}/2000</div>

        <label className="ntfm-label">Send to</label>
        <div className="ntfm-types">
          {AUDIENCE_TYPES.map(t => (
            <button
              key={t.key}
              type="button"
              className={`ntfm-type ${type === t.key ? 'active' : ''}`}
              onClick={() => setType(t.key)}
              title={t.hint}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Audience selectors */}
        {type === 'role' && (
          <div className="ntfm-picker">
            {(audiences?.roles ?? []).map(r => (
              <label key={r.id} className={`ntfm-chip ${ids.includes(r.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={ids.includes(r.id)} onChange={() => toggleId(r.id)} />
                {r.name}
              </label>
            ))}
          </div>
        )}

        {type === 'batch' && (
          <div className="ntfm-picker">
            {(audiences?.batches ?? []).map(b => (
              <label key={b.id} className={`ntfm-chip ${ids.includes(b.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={ids.includes(b.id)} onChange={() => toggleId(b.id)} />
                {b.name}
              </label>
            ))}
            {(audiences?.batches ?? []).length === 0 && <div className="ntfm-none">No batches found.</div>}
          </div>
        )}

        {type === 'course' && (
          <div className="ntfm-picker">
            {(audiences?.courses ?? []).map(c => (
              <label key={c.id} className={`ntfm-chip ${ids.includes(c.id) ? 'on' : ''}`}>
                <input type="checkbox" checked={ids.includes(c.id)} onChange={() => toggleId(c.id)} />
                {c.title}
              </label>
            ))}
            {(audiences?.courses ?? []).length === 0 && <div className="ntfm-none">No courses found.</div>}
          </div>
        )}

        {type === 'users' && (
          <>
            <input
              className="ntfm-input ntfm-usearch"
              placeholder="Search people by name or email…"
              value={userSearch}
              onChange={e => setUserSrch(e.target.value)}
            />
            <div className="ntfm-userlist">
              {filteredUsers.map(u => (
                <label key={u.id} className={`ntfm-user ${ids.includes(u.id) ? 'on' : ''}`}>
                  <input type="checkbox" checked={ids.includes(u.id)} onChange={() => toggleId(u.id)} />
                  <span className="ntfm-uname">{u.name}</span>
                  <span className="ntfm-urole">{ROLE_NAME[u.role] ?? `Role ${u.role}`}</span>
                  <span className="ntfm-umail">{u.email}</span>
                </label>
              ))}
              {filteredUsers.length === 0 && <div className="ntfm-none">No matching people.</div>}
            </div>
            {ids.length > 0 && <div className="ntfm-selcount">{ids.length} selected</div>}
          </>
        )}

        <label className="ntfm-check">
          <input type="checkbox" checked={includeInactive} onChange={e => setInc(e.target.checked)} />
          Also include deactivated accounts
        </label>

        {/* Live preview */}
        <div className={`ntfm-preview ${previewErr ? 'bad' : ''}`}>
          {previewing
            ? 'Checking who this reaches…'
            : previewErr
              ? <>Couldn&apos;t check the audience — {previewErr}</>
              : count === null
                ? 'Pick an audience to see how many people this reaches.'
                : <>This will reach <strong>{count}</strong> {count === 1 ? 'person' : 'people'}{label ? <> — <em>{label}</em></> : null}.</>}
          {sample.length > 0 && (
            <div className="ntfm-sample">
              e.g. {sample.slice(0, 5).map(s => s.name).join(', ')}{count && count > 5 ? ` +${count - 5} more` : ''}
            </div>
          )}
        </div>

        {/* Scheduling */}
        <label className="ntfm-check">
          <input type="checkbox" checked={scheduleOn} onChange={e => setSched(e.target.checked)} />
          Schedule for later instead of sending now
        </label>
        {scheduleOn && (
          <>
            <input
              className="ntfm-input"
              type="datetime-local"
              value={when}
              min={minWhen}
              onChange={e => setWhen(e.target.value)}
            />
            <div className="ntfm-hint">
              The audience is resolved when it sends, not now — so anyone who joins before then is included.
            </div>
          </>
        )}

        <div className="ntfm-actions">
          <button className="ntfm-btn ghost" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="ntfm-btn send" onClick={submit} disabled={!canSend}>
            {sending ? 'Sending…' : scheduleOn ? 'Schedule' : `Send${count !== null ? ` to ${count}` : ''}`}
          </button>
        </div>

        <style jsx>{`
          /* :global() — styled-jsx does not scope the outermost node of a createPortal argument. */
          :global(.ntfm-overlay) {
            position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
            padding: 16px; overflow-y: auto;
          }
          .ntfm {
            background: #fff; border-radius: 18px; padding: 26px; width: 100%; max-width: 560px;
            max-height: 90vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif;
            box-shadow: 0 28px 70px rgba(0,0,0,0.4);
          }
          .ntfm-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0 0 16px; }
          .ntfm-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; }
          .ntfm-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
          .ntfm-input {
            width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 10px 13px;
            font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; box-sizing: border-box;
          }
          .ntfm-input:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .ntfm-textarea { min-height: 96px; resize: vertical; line-height: 1.55; }
          .ntfm-counter { text-align: right; font-size: 11px; color: #94a3b8; margin-top: 4px; }

          .ntfm-types { display: flex; gap: 7px; flex-wrap: wrap; }
          .ntfm-type {
            background: #fff; border: 1px solid #e5e9f2; color: #4a5568; border-radius: 100px;
            padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit;
            transition: all .15s ease;
          }
          .ntfm-type:hover { border-color: #E8A020; }
          .ntfm-type.active { background: #0B1B3A; border-color: #0B1B3A; color: #fff; }

          .ntfm-picker { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
          .ntfm-chip {
            display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
            border: 1px solid #e5e9f2; border-radius: 100px; padding: 7px 14px;
            font-size: 12.5px; color: #4a5568; transition: all .15s ease;
          }
          .ntfm-chip.on { border-color: #E8A020; background: #fffaf0; color: #0B1B3A; font-weight: 600; }
          .ntfm-chip input { accent-color: #E8A020; }

          .ntfm-usearch { margin-top: 12px; }
          .ntfm-userlist {
            margin-top: 10px; border: 1px solid #e5e9f2; border-radius: 12px;
            max-height: 210px; overflow-y: auto;
          }
          .ntfm-user {
            display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center;
            padding: 9px 13px; border-bottom: 1px solid #f1f5f9; cursor: pointer; font-size: 13px; color: #334155;
          }
          .ntfm-user:last-child { border-bottom: none; }
          .ntfm-user.on { background: #fffaf0; }
          .ntfm-user input { accent-color: #E8A020; }
          .ntfm-uname { font-weight: 600; color: #0B1B3A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .ntfm-urole { font-size: 11px; color: #64748b; background: #f1f5f9; border-radius: 100px; padding: 2px 9px; }
          .ntfm-umail { grid-column: 2 / -1; font-size: 11.5px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .ntfm-selcount { font-size: 12px; color: #0B1B3A; font-weight: 600; margin-top: 8px; }
          .ntfm-none { padding: 14px; font-size: 12.5px; color: #94a3b8; }

          .ntfm-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4a5568; margin-top: 16px; cursor: pointer; }
          .ntfm-check input { accent-color: #E8A020; }

          .ntfm-preview {
            margin-top: 16px; background: #f8fafc; border: 1px solid #e5e9f2; border-left: 3px solid #E8A020;
            border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #334155; line-height: 1.5;
          }
          .ntfm-preview.bad { background: #fef2f2; border-color: #fecaca; border-left-color: #b91c1c; color: #b91c1c; }
          .ntfm-preview strong { color: #0B1B3A; font-size: 15px; }
          .ntfm-sample { font-size: 11.5px; color: #64748b; margin-top: 5px; }
          .ntfm-hint { font-size: 11.5px; color: #64748b; margin-top: 6px; line-height: 1.45; }

          .ntfm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
          .ntfm-btn { border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .ntfm-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .ntfm-btn.send { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .ntfm-btn:disabled { opacity: .55; cursor: not-allowed; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Detail modal ─── */
function DetailModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  if (typeof document === 'undefined') return null;

  const badge = STATUS_BADGE[campaign.status];

  return createPortal(
    <div className="ntfd-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ntfd">
        <div className="ntfd-head">
          <h3 className="ntfd-title">{campaign.title}</h3>
          <span className="ntfd-badge" style={{ background: badge?.bg, color: badge?.color }}>
            {badge?.label ?? campaign.status}
          </span>
        </div>

        <p className="ntfd-msg">{campaign.message}</p>

        <dl className="ntfd-rows">
          <div><dt>Audience</dt><dd>{campaign.audience_label ?? campaign.audience_type}</dd></div>
          <div><dt>Sent by</dt><dd>{campaign.creator?.name ?? '—'}</dd></div>
          <div><dt>Created</dt><dd>{fmtDateTime(campaign.created_at)}</dd></div>
          {campaign.scheduled_at && <div><dt>Scheduled for</dt><dd>{fmtDateTime(campaign.scheduled_at)}</dd></div>}
          {campaign.sent_at && <div><dt>Sent at</dt><dd>{fmtDateTime(campaign.sent_at)}</dd></div>}
          <div><dt>Recipients</dt><dd>{campaign.recipients_count}</dd></div>
          <div><dt>Push delivered</dt><dd>{campaign.push_sent_count}</dd></div>
          <div><dt>Push failed</dt><dd>{campaign.push_failed_count}</dd></div>
          {campaign.data?.type && <div><dt>Deep link</dt><dd>{campaign.data.type}{campaign.data.id ? ` · ${campaign.data.id}` : ''}</dd></div>}
        </dl>

        {campaign.status === 'sent' && campaign.push_sent_count === 0 && campaign.recipients_count > 0 && (
          <div className="ntfd-note">
            Delivered to {campaign.recipients_count} in-app {campaign.recipients_count === 1 ? 'inbox' : 'inboxes'}, but no push was
            sent — nobody in this audience has a registered device yet.
          </div>
        )}

        {campaign.error && <div className="ntfd-err">{campaign.error}</div>}

        <div className="ntfd-actions">
          <button className="ntfd-btn" onClick={onClose}>Close</button>
        </div>

        <style jsx>{`
          :global(.ntfd-overlay) {
            position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
            padding: 16px; overflow-y: auto;
          }
          .ntfd {
            background: #fff; border-radius: 18px; padding: 26px; width: 100%; max-width: 480px;
            max-height: 90vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif;
            box-shadow: 0 28px 70px rgba(0,0,0,0.4);
          }
          .ntfd-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
          .ntfd-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0; }
          .ntfd-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
          .ntfd-msg { font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 18px; white-space: pre-wrap; }

          .ntfd-rows { margin: 0; }
          .ntfd-rows > div { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; border-bottom: 1px solid #f1f5f9; }
          .ntfd-rows dt { font-size: 12.5px; color: #64748b; margin: 0; }
          .ntfd-rows dd { font-size: 13px; color: #0B1B3A; font-weight: 600; margin: 0; text-align: right; }

          .ntfd-note { margin-top: 16px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 10px; padding: 11px 14px; font-size: 12.5px; line-height: 1.5; }
          .ntfd-err { margin-top: 16px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 10px; padding: 11px 14px; font-size: 12.5px; }

          .ntfd-actions { display: flex; justify-content: flex-end; margin-top: 22px; }
          .ntfd-btn { border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid #e5e9f2; background: transparent; color: #4a5568; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
