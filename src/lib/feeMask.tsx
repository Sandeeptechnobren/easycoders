'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
 * Fee masking — hides student-fee amounts behind **** by default, with a
 * global "Show amounts" toggle (persisted in localStorage, synced across every
 * mounted component via a custom event). Used wherever a fee/payment/due amount
 * is *displayed* (read-only) in the admin / HR / student portals. Data-entry
 * inputs are left untouched — you need to see what you're typing.
 * ────────────────────────────────────────────────────────────────────────── */

const KEY = 'ec_show_fees';
const EVT = 'ec-fees-visibility';
const MASK = '****';

function readVisible(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

/** Global show/hide flag for fee amounts. Default = hidden (masked). */
export function useFeeVisibility(): [boolean, (v: boolean) => void] {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readVisible());
    const sync = () => setVisible(readVisible());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);

  const set = useCallback((v: boolean) => {
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* ignore */ }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVT));
  }, []);

  return [visible, set];
}

/**
 * Format a fee amount, masking it when amounts are hidden.
 * `visible` comes from useFeeVisibility(). `emptyDash` keeps a — for null/empty.
 */
export function maskAmount(
  value: unknown,
  visible: boolean,
  opts: { prefix?: string; emptyDash?: boolean } = {},
): string {
  const { prefix = '₹', emptyDash = false } = opts;
  if (emptyDash && (value === null || value === undefined || value === '')) return '—';
  if (!visible) return MASK;
  const n = Number(value);
  if (value === null || value === undefined || value === '' || isNaN(n)) return emptyDash ? '—' : `${prefix}0`;
  return `${prefix}${n.toLocaleString('en-IN')}`;
}

/** Drop-in display for a fee amount (reads the global flag itself). */
export function FeeAmount({ value, prefix = '₹', emptyDash = false }: { value: unknown; prefix?: string; emptyDash?: boolean }) {
  const [visible] = useFeeVisibility();
  return <>{maskAmount(value, visible, { prefix, emptyDash })}</>;
}

/** "Show / Hide amounts" pill — flips the global flag. Works on any background. */
export function FeeToggle({ style }: { style?: CSSProperties }) {
  const [visible, setVisible] = useFeeVisibility();
  return (
    <button
      type="button"
      onClick={() => setVisible(!visible)}
      title={visible ? 'Hide fee amounts' : 'Show fee amounts'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 13px', borderRadius: 100, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
        border: '1px solid #D7DEEA', background: '#fff', color: '#4A5568',
        ...style,
      }}
    >
      <span aria-hidden>{visible ? '🙈' : '👁'}</span>
      {visible ? 'Hide amounts' : 'Show amounts'}
    </button>
  );
}
