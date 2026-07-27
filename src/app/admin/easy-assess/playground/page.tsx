'use client';

import RoleGuard from '@/components/RoleGuard';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection, AdminPanel, AdminState } from '@/components/admin/AdminSection';

/* ──────────────────────────────────────────────────────────────────────────
 * /admin/easy-assess/playground — Code Playground limits
 *
 * The student "save my code" feature caps how many snippets each student can
 * keep and how large each one can be. Those limits are admin-configurable and
 * read live by the save endpoint, so changes here take effect immediately.
 *   GET  /api/playground/settings
 *   PUT  /api/playground/settings { max_snippets, max_kb }
 * ────────────────────────────────────────────────────────────────────────── */

const BASE = 'https://api.easycoders.in/api';
type LoadState = 'loading' | 'ready' | 'error';

export default function PlaygroundLimitsAdmin() {
  const [maxSnippets, setMaxSnippets] = useState('50');
  const [maxKb, setMaxKb] = useState('100');
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    fetchWithAuth(`${BASE}/playground/settings`)
      .then(j => {
        const d = j?.data ?? {};
        setMaxSnippets(String(d.max_snippets ?? 50));
        setMaxKb(String(d.max_kb ?? 100));
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const save = async () => {
    const sn = Number(maxSnippets), kb = Number(maxKb);
    if (!Number.isInteger(sn) || sn < 1) { setOk(false); setMsg('Max snippets must be a whole number of at least 1.'); return; }
    if (!Number.isInteger(kb) || kb < 1) { setOk(false); setMsg('Max size must be a whole number of at least 1 KB.'); return; }
    setSaving(true); setMsg('');
    try {
      const j = await fetchWithAuth(`${BASE}/playground/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_snippets: sn, max_kb: kb }),
      });
      const d = j?.data ?? {};
      setMaxSnippets(String(d.max_snippets ?? sn));
      setMaxKb(String(d.max_kb ?? kb));
      setOk(true); setMsg('Saved — new limits apply to students immediately.');
    } catch (e: unknown) {
      setOk(false); setMsg(e instanceof Error ? e.message : 'Could not save.');
    } finally { setSaving(false); }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Assess · Module"
        title="Code Playground Limits"
        description="Control how much code students can keep in the Playground's 'Saved codes'. These limits are read live by the save endpoint, so changes take effect immediately — raise them if students need more room."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Assess', href: '/admin/easy-assess' },
          { label: 'Playground Limits' },
        ]}
      >
        <style jsx>{`
          .fld { display:flex; flex-direction:column; gap:6px; max-width:320px; margin-bottom:18px; }
          .fld label { font-size:12px; font-weight:700; color:#4A5568; }
          .fld .hint { font-size:12px; color:#94A3B8; font-weight:400; }
          .fld input { background:#fff; border:1px solid #E5E9F2; border-radius:10px; padding:10px 12px; font-family:inherit; font-size:14px; color:#0B1B3A; outline:none; transition:border-color .18s, box-shadow .18s; }
          .fld input:focus { border-color:#E8A020; box-shadow:0 0 0 3px rgba(232,160,32,.16); }
          .btn { display:inline-flex; align-items:center; gap:7px; padding:10px 22px; border-radius:10px; border:none; cursor:pointer; background:#0B1B3A; color:#fff; font-weight:700; font-size:13px; }
          .btn:hover:not(:disabled) { background:#E8A020; color:#0B1B3A; }
          .btn:disabled { opacity:.6; cursor:not-allowed; }
          .msg { margin-top:14px; font-size:13px; font-weight:600; }
          .msg.ok { color:#166534; } .msg.err { color:#991B1B; }
        `}</style>

        <AdminPanel title="Saved-code limits" subtitle="Per student">
          {state === 'loading' && <AdminState kind="loading" message="Loading current limits…" />}
          {state === 'error' && <AdminState kind="error" message="Couldn't load the limits. Check your session and refresh." />}
          {state === 'ready' && (
            <div>
              <div className="fld">
                <label htmlFor="max-snip">Max saved snippets per student</label>
                <input id="max-snip" type="number" min={1} value={maxSnippets} onChange={e => setMaxSnippets(e.target.value)} />
                <span className="hint">How many codes each student can keep. Default 50.</span>
              </div>
              <div className="fld">
                <label htmlFor="max-kb">Max size per snippet (KB)</label>
                <input id="max-kb" type="number" min={1} value={maxKb} onChange={e => setMaxKb(e.target.value)} />
                <span className="hint">Largest single code a student can save. Default 100 KB.</span>
              </div>
              <button className="btn" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save limits'}</button>
              {msg && <div className={`msg ${ok ? 'ok' : 'err'}`}>{msg}</div>}
            </div>
          )}
        </AdminPanel>
      </AdminSection>
    </RoleGuard>
  );
}
