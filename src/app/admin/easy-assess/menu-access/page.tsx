'use client';

import RoleGuard from '@/components/RoleGuard';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/menu-access — Student menu access
 *
 * Admin chooses which Easy Assess sidebar menus each student type can see:
 * "direct" (signed up in Easy Assess) vs "EasyCoders" (enrolled + bridged).
 * Read live by GET /assessment/me (the student's `menus`), so changes apply on
 * the student's next login / refresh. "Assessments" is always on.
 *   GET /api/assessment/admin/menu-access
 *   PUT /api/assessment/admin/menu-access { direct, easycoders }
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/projects/backend/public/api';
type LoadState = 'loading' | 'ready' | 'error';
type MenuItem = { key: string; label: string; always_on: boolean };

export default function EasyAssessMenuAccessAdmin() {
  const [cat, setCat] = useState<MenuItem[]>([]);
  const [direct, setDirect] = useState<Record<string, boolean>>({});
  const [ec, setEc] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${BASE}/assessment/admin/menu-access`)
      .then(j => {
        const d = j?.data ?? {};
        setCat(Array.isArray(d.catalogue) ? d.catalogue : []);
        setDirect(d.direct ?? {});
        setEc(d.easycoders ?? {});
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const j = await fetchWithAuth(`${BASE}/assessment/admin/menu-access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direct, easycoders: ec }),
      });
      const d = j?.data ?? {};
      if (d.direct) setDirect(d.direct);
      if (d.easycoders) setEc(d.easycoders);
      setOk(true); setMsg('Saved — students see the change on their next login or refresh.');
    } catch (e: unknown) {
      setOk(false); setMsg(e instanceof Error ? e.message : 'Could not save.');
    } finally { setSaving(false); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Student Access"
        description="Choose which Easy Assess menus each student type can see. Direct students signed up in Easy Assess; EasyCoders students are enrolled and bridged from the main platform. Changes apply on the student's next login or refresh."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Student Access' },
        ]}
      >
        <style jsx>{`
          .mtbl { width:100%; max-width:560px; border-collapse:collapse; font-size:14px; color:#0B1B3A; }
          .mtbl th { text-align:left; font-size:12px; font-weight:700; color:#4A5568; padding:8px 10px; border-bottom:1px solid #E5E9F2; }
          .mtbl th.c, .mtbl td.c { text-align:center; }
          .mtbl td { padding:11px 10px; border-bottom:1px solid #F1F4F9; }
          .mtbl input[type=checkbox] { width:18px; height:18px; cursor:pointer; accent-color:#0B1B3A; }
          .mtbl input:disabled { cursor:not-allowed; }
          .badge { display:inline-block; margin-left:8px; font-size:10.5px; font-weight:700; color:#94A3B8; background:#F1F4F9; padding:2px 8px; border-radius:100px; }
          .note { font-size:12.5px; color:#94A3B8; margin:12px 0 0; max-width:560px; line-height:1.55; }
          .btn { display:inline-flex; align-items:center; gap:7px; margin-top:18px; padding:10px 22px; border-radius:10px; border:none; cursor:pointer; background:#0B1B3A; color:#fff; font-weight:700; font-size:13px; }
          .btn:hover:not(:disabled) { background:#E8A020; color:#0B1B3A; }
          .btn:disabled { opacity:.6; cursor:not-allowed; }
          .msg { margin-top:14px; font-size:13px; font-weight:600; }
          .msg.ok { color:#166534; } .msg.err { color:#991B1B; }
        `}</style>

        <AdminPanel title="Menu access" subtitle="Per student type">
          {state === 'loading' && <AdminState kind="loading" message="Loading menu access…" />}
          {state === 'error' && <AdminState kind="error" message="Couldn't load menu access. Check your session and refresh." />}
          {state === 'ready' && (
            <div>
              <table className="mtbl">
                <thead>
                  <tr><th>Menu</th><th className="c">Direct students</th><th className="c">EasyCoders students</th></tr>
                </thead>
                <tbody>
                  {cat.map(m => (
                    <tr key={m.key}>
                      <td>{m.label}{m.always_on && <span className="badge">always on</span>}</td>
                      <td className="c">
                        <input type="checkbox" disabled={m.always_on}
                          checked={m.always_on ? true : !!direct[m.key]}
                          onChange={e => setDirect(c => ({ ...c, [m.key]: e.target.checked }))} />
                      </td>
                      <td className="c">
                        <input type="checkbox" disabled={m.always_on}
                          checked={m.always_on ? true : !!ec[m.key]}
                          onChange={e => setEc(c => ({ ...c, [m.key]: e.target.checked }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="note">Tick a box to give that student type the menu; untick to remove it. Assessments stays available to everyone.</p>
              <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
              {msg && <div className={`msg ${ok ? 'ok' : 'err'}`}>{msg}</div>}
            </div>
          )}
        </AdminPanel>
      </AdminSection>
    </RoleGuard>
  );
}
