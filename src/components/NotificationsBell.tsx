'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/api';

const BASE = 'https://api.easycoders.in/api';
const POLL_MS = 60_000;

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: { ticket_id?: number; ticket_code?: string; task_id?: number; category_id?: number } | null;
  read_at: string | null;
  created_at: string;
};

// Map role → which tickets page to land on when a ticket notification is clicked.
const ticketRouteForRole = (role: string | null): string => {
  const n = parseInt(role || '0', 10);
  if (n === 3) return '/students/tickets';
  if (n === 4) return '/trainer/tickets';
  // admin (1) and HR (2)
  return '/admin/tickets';
};

// Map role → which tasks page to land on when a task notification is clicked.
const taskRouteForRole = (role: string | null): string => {
  const n = parseInt(role || '0', 10);
  if (n === 3) return '/students/tasks';
  if (n === 4) return '/trainer/tasks';
  return '/admin/tasks';
};

const formatRel = (s?: string): string => {
  if (!s) return '';
  try {
    const t = new Date(s).getTime();
    const diff = Math.max(0, Date.now() - t);
    const min = Math.floor(diff / 60_000);
    if (min < 1)  return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24)  return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7)  return `${day}d ago`;
    return new Date(s).toLocaleDateString();
  } catch { return s; }
};

export default function NotificationsBell() {
  const { token, role, isLoading } = useAuth();
  const router = useRouter();

  const [open, setOpen]       = useState(false);
  const [count, setCount]     = useState(0);
  const [items, setItems]     = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Polling ──────────────────────────────────────────────────────────────
  const refreshCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchWithAuth(`${BASE}/notifications/unread-count`);
      setCount(Math.max(0, Number(res?.data?.count ?? 0)));
    } catch { /* swallow — non-critical */ }
  }, [token]);

  useEffect(() => {
    if (isLoading || !token) return;
    refreshCount();
    const t = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(t);
  }, [token, isLoading, refreshCount]);

  // ── Drop-down loader ─────────────────────────────────────────────────────
  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE}/notifications?per_page=10`);
      const paginator = res?.data;
      const list: NotificationItem[] = Array.isArray(paginator)
        ? paginator
        : (paginator?.data ?? []);
      setItems(list);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [token]);

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      if (next) loadList();
      return next;
    });
  };

  // ── Item click → mark read + navigate ────────────────────────────────────
  const handleClick = async (n: NotificationItem) => {
    setOpen(false);

    if (!n.read_at) {
      try {
        await fetchWithAuth(`${BASE}/notifications/${n.id}/read`, { method: 'POST' });
      } catch {}
      // Optimistic refresh.
      refreshCount();
    }

    // Task notifications go to the tasks page (optionally pre-filtered by
    // category); everything else is a ticket notification.
    const isTask = n.type === 'task_assigned' || n.type === 'tasks_assigned'
      || n.data?.task_id != null || n.data?.category_id != null;
    if (isTask) {
      const taskBase = taskRouteForRole(role);
      const cat = n.data?.category_id;
      router.push(cat ? `${taskBase}?category=${cat}` : taskBase);
      return;
    }

    // Build the destination URL based on the recipient's role.
    const base = ticketRouteForRole(role);
    const ticketId = n.data?.ticket_id;
    router.push(ticketId ? `${base}?ticket=${ticketId}` : base);
  };

  const markAllRead = async () => {
    try {
      await fetchWithAuth(`${BASE}/notifications/read-all`, { method: 'POST' });
      refreshCount();
      loadList();
    } catch {}
  };

  // Hide for unauthenticated users.
  if (isLoading || !token) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={toggle}
        title="Notifications"
        aria-label="Notifications"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '6px 8px',
          cursor: 'pointer',
          position: 'relative',
          fontSize: 20,
          lineHeight: 1,
          color: 'inherit',
        }}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: '#ef4444',
            color: '#fff',
            borderRadius: 11,
            padding: '2px 6px',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            minWidth: 18,
            textAlign: 'center',
            boxShadow: '0 0 0 2px #fff',
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1040 }}
          />

          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1050,
            width: 360,
            maxWidth: 'calc(100vw - 24px)',
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 12px 32px rgba(15,23,42,0.18)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#0f172a',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fafafa',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                Notifications {count > 0 && (
                  <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: 6 }}>
                    · {count} unread
                  </span>
                )}
              </div>
              {count > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
                  <div style={{ fontSize: 13 }}>You have no notifications yet.</div>
                </div>
              ) : (
                items.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    style={{
                      width: '100%',
                      background: n.read_at ? '#fff' : '#eff6ff',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      padding: '12px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {!n.read_at && <span style={{
                          display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                          background: '#2563eb', marginRight: 6, verticalAlign: 'middle',
                        }} />}
                        {n.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {formatRel(n.created_at)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
