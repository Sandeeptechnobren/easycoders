'use client';

import { useCallback, useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import Loader from '@/components/Loader';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';
import { useSiteTheme } from '@/context/ThemeContext';

/* /admin/site-theme — turn the seasonal site theme on or off for ALL visitors.
 *
 * The server owns the decision: it returns `active`, already resolved against
 * both the on/off intent and the optional date window (evaluated in IST, since
 * the app runs UTC but the business does not). This page therefore never does
 * date maths — it shows what the server reports.
 *
 * Classes are `st-*` prefixed: Bootstrap is CDN-loaded globally in layout.tsx,
 * so bare .card/.btn/.badge/.form-switch would collide. */

const BASE = 'https://api.easycoders.in/api';

type ThemeConfig = {
  enabled: boolean;
  theme: string;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  timezone: string;
  available: string[];
};

/** 'YYYY-MM-DD HH:mm:ss' (what the API stores) → the value a datetime-local wants. */
const toInput = (s: string | null) => (s ? s.replace(' ', 'T').slice(0, 16) : '');
/** …and back. */
const fromInput = (s: string) => (s ? `${s.replace('T', ' ')}:00` : null);

export default function SiteThemePage() {
  const [cfg, setCfg] = useState<ThemeConfig | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(true);

  const [enabled, setEnabled] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const { applyTheme } = useSiteTheme();

  const load = useCallback(() => {
    setState('loading');
    fetchWithAuth(`${BASE}/admin/site-settings`)
      .then((r) => {
        const d: ThemeConfig | undefined = r?.data;
        if (!d) throw new Error('Malformed response');
        setCfg(d);
        setEnabled(!!d.enabled);
        setStartsAt(toInput(d.starts_at));
        setEndsAt(toInput(d.ends_at));
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const r = await fetchWithAuth(`${BASE}/admin/site-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          theme: 'tiranga',
          starts_at: fromInput(startsAt),
          ends_at: fromInput(endsAt),
        }),
      });
      const d: ThemeConfig | undefined = r?.data;
      if (d) {
        setCfg(d);
        setEnabled(!!d.enabled);
        setStartsAt(toInput(d.starts_at));
        setEndsAt(toInput(d.ends_at));
        // Repaint this browser immediately so the admin sees the result of
        // their own change without a reload. Everyone else picks it up on their
        // next page load.
        applyTheme(d.active ? 'tiranga' : 'default');
      }
      setOk(true);
      setMsg(r?.message ?? 'Saved.');
    } catch (e: unknown) {
      setOk(false);
      setMsg(e instanceof Error ? e.message : 'Could not save the theme.');
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!cfg &&
    (enabled !== cfg.enabled ||
      startsAt !== toInput(cfg.starts_at) ||
      endsAt !== toInput(cfg.ends_at));

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Appearance"
        title="Site Theme"
        description="Switch the seasonal Tiranga theme on for the whole website. Optionally schedule it, and it will turn itself on and off."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'Site Theme' },
        ]}
      >
        {state === 'loading' && <Loader label="Loading theme settings…" />}
        {state === 'error' && (
          <AdminState
            kind="error"
            message="Could not load the theme settings."
            action={<button className="st-btn" onClick={load}>Retry</button>}
          />
        )}

        {state === 'ready' && cfg && (
          <>
            <AdminPanel
              title="Tiranga theme"
              subtitle="Tricolour accents across the site — nothing else changes"
            >
              <div className="st-row">
                <div className="st-copy">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label="Enable the Tiranga theme"
                    className={`st-switch ${enabled ? 'on' : ''}`}
                    onClick={() => setEnabled((v) => !v)}
                    disabled={saving}
                  >
                    <span className="st-thumb" />
                  </button>
                  <div>
                    <p className="st-label">{enabled ? 'Enabled' : 'Disabled'}</p>
                    <p className="st-hint">
                      {enabled
                        ? 'Visitors see the tricolour accents (subject to any schedule below).'
                        : 'The site uses its normal navy and gold styling.'}
                    </p>
                  </div>
                </div>

                {/* What is ACTUALLY live right now, straight from the server —
                    this can differ from the switch when a schedule is set. */}
                <span className={`st-pill ${cfg.active ? 'live' : 'off'}`}>
                  {cfg.active ? 'Live now' : 'Not live'}
                </span>
              </div>
            </AdminPanel>

            <AdminPanel
              title="Schedule (optional)"
              subtitle={`Leave both blank to control it manually · times are ${cfg.timezone}`}
            >
              <div className="st-grid">
                <label className="st-field">
                  <span>Turn on from</span>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    disabled={saving}
                  />
                </label>
                <label className="st-field">
                  <span>Turn off after</span>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    disabled={saving}
                  />
                </label>
              </div>
              <p className="st-hint st-hint-block">
                Times are interpreted in {cfg.timezone} — so 15 August 00:00 means midnight in
                India, not on the server. The switch above must also be on for a schedule to apply.
              </p>
            </AdminPanel>

            <div className="st-actions">
              {msg && <span className={`st-msg ${ok ? 'ok' : 'err'}`}>{msg}</span>}
              <button className="st-btn primary" onClick={save} disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </>
        )}

        <style jsx>{`
          .st-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
          .st-copy { display: flex; align-items: center; gap: 16px; }
          .st-label { margin: 0; font-size: 15px; font-weight: 700; color: var(--navy); font-family: 'Playfair Display', Georgia, serif; }
          .st-hint { margin: 2px 0 0; font-size: 12.5px; color: var(--slate-soft); line-height: 1.5; max-width: 48ch; }
          .st-hint-block { margin-top: 14px; max-width: none; }

          /* No shared switch component exists in this repo — every other toggle
             is a bare checkbox. Built here with a real role="switch". */
          .st-switch {
            position: relative; flex: none;
            width: 46px; height: 26px; border-radius: 999px;
            border: 1px solid var(--border); background: #EEF1F7;
            cursor: pointer; padding: 0; transition: background .2s ease, border-color .2s ease;
          }
          .st-switch.on { background: var(--gold); border-color: var(--gold); }
          .st-switch:disabled { opacity: .55; cursor: not-allowed; }
          .st-thumb {
            position: absolute; top: 2px; left: 2px;
            width: 20px; height: 20px; border-radius: 50%;
            background: #fff; box-shadow: 0 1px 3px rgba(11,27,58,.28);
            transition: left .2s ease;
          }
          .st-switch.on .st-thumb { left: 22px; }

          .st-pill { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 5px 13px; border-radius: 100px; }
          .st-pill.live { background: #EAF7E8; color: #0E6606; }
          .st-pill.off  { background: var(--navy-soft); color: var(--slate); }

          .st-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 16px; }
          .st-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
          .st-field span { font-size: 12.5px; font-weight: 600; color: var(--slate); }
          .st-field input {
            border: 1px solid #D7DEEA; border-radius: 10px; padding: 9px 12px;
            font-size: 13.5px; font-family: inherit; color: var(--navy);
            outline: none; box-sizing: border-box; width: 100%; background: #fff;
          }
          .st-field input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(232,160,32,.16); }

          .st-actions { display: flex; align-items: center; justify-content: flex-end; gap: 14px; margin-top: 20px; flex-wrap: wrap; }
          .st-msg { font-size: 13px; font-weight: 600; }
          .st-msg.ok { color: #166534; }
          .st-msg.err { color: #991B1B; }

          .st-btn {
            border: 1.5px solid var(--border); background: #fff; color: var(--slate);
            border-radius: 10px; padding: 10px 22px; font-size: 13px; font-weight: 700;
            cursor: pointer; font-family: inherit; transition: all .18s ease;
          }
          .st-btn.primary { background: var(--navy); border-color: var(--navy); color: #fff; }
          .st-btn.primary:hover:not(:disabled) { background: var(--gold); border-color: var(--gold); color: var(--navy); }
          .st-btn:disabled { opacity: .5; cursor: not-allowed; }

          @media (prefers-reduced-motion: reduce) {
            .st-switch, .st-thumb, .st-btn { transition: none; }
          }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}
