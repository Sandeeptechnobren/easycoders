'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import RoleGuard from '@/components/RoleGuard';
import { fetchWithAuth } from '@/lib/api';
import { AdminSection } from '@/components/admin/AdminSection';

/* /admin/app-releases — ship Android builds for in-app update.
 *
 * The app is sideloaded, not on Play Store, so there is no store to deliver
 * updates. Upload a build here, publish it, and every installed app discovers
 * it on next launch and can update itself.
 *
 * Upload does NOT publish: a build lands as a draft so it can be checked first.
 * Unpublish is the emergency stop — devices immediately stop being offered it.
 *
 * ⚠️ Class names are all `apr-*` / `aprm-*` prefixed — Bootstrap is loaded
 * globally via CDN in layout.tsx, so bare .modal/.card/.btn/.badge collide. */

const BASE = 'https://api.easycoders.in/api';

type Status = 'draft' | 'published' | 'archived';

type Release = {
  id: number;
  platform: string;
  version_name: string;
  version_code: number;
  apk_path: string;
  file_size: number;
  sha256: string;
  release_notes: string | null;
  min_supported_version_code: number | null;
  is_mandatory: boolean;
  status: Status;
  download_count: number;
  download_url: string | null;
  published_at: string | null;
  created_at: string | null;
  creator?: { id: number; name: string } | null;
};

const STATUS_BADGE: Record<Status, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Draft',     bg: '#f1f5f9', color: '#475569' },
  published: { label: '● Live',    bg: '#f0fdf4', color: '#15803d' },
  archived:  { label: 'Withdrawn', bg: '#fef2f2', color: '#b91c1c' },
};

const fmtSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  return isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminAppReleasesPage() {
  const [items, setItems]  = useState<Release[]>([]);
  const [loading, setLoad] = useState(true);
  const [busy, setBusy]    = useState<number | null>(null);
  const [err, setErr]      = useState('');
  const [upload, setUpload] = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    setErr('');
    fetchWithAuth(`${BASE}/admin/app-releases?per_page=50`)
      .then(r => setItems(Array.isArray(r?.data?.data) ? r.data.data : []))
      .catch((e: unknown) => {
        setItems([]);
        setErr(e instanceof Error ? e.message : 'Could not load releases.');
      })
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const live = items.find(r => r.status === 'published') ?? null;

  const act = async (r: Release, path: string, method: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setBusy(r.id);
    try {
      const res = await fetchWithAuth(`${BASE}/admin/app-releases/${r.id}${path}`, { method });
      if (res?.message) alert(res.message);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <RoleGuard allowedRoles={[1]}>
      <AdminSection
        eyebrow="Easy Coders · Mobile"
        title="App Releases"
        description="Upload a new Android build and publish it. Installed apps detect the release on next launch and update themselves."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Easy Coders', href: '/admin/easy-coders' },
          { label: 'App Releases' },
        ]}
      >
        <div className="apr">
          <div className="apr-bar">
            <div className="apr-live">
              {live
                ? <>Currently live: <strong>v{live.version_name}</strong> <span className="apr-code">build {live.version_code}</span></>
                : <>No release is live — installed apps are not being offered any update.</>}
            </div>
            <button className="apr-new" onClick={() => setUpload(true)}>
              <span aria-hidden="true">↑</span> Upload build
            </button>
          </div>

          {err && (
            <div className="apr-error">
              <span>{err}</span>
              <button className="apr-retry" onClick={load}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="apr-empty">Loading releases…</div>
          ) : err ? null : items.length === 0 ? (
            <div className="apr-empty">No builds uploaded yet. Upload one to get started.</div>
          ) : (
            <div className="apr-list">
              {items.map(r => (
                <article key={r.id} className={`apr-card ${r.status === 'published' ? 'islive' : ''}`}>
                  <div className="apr-main">
                    <div className="apr-head">
                      <h3 className="apr-ver">v{r.version_name}</h3>
                      <span className="apr-code">build {r.version_code}</span>
                      <span className="apr-badge" style={{ background: STATUS_BADGE[r.status]?.bg, color: STATUS_BADGE[r.status]?.color }}>
                        {STATUS_BADGE[r.status]?.label ?? r.status}
                      </span>
                      {r.is_mandatory && <span className="apr-badge apr-mand">Forced</span>}
                    </div>

                    {r.release_notes && <p className="apr-notes">{r.release_notes}</p>}

                    <div className="apr-meta">
                      {fmtSize(r.file_size)}
                      <span className="apr-dot">·</span>
                      uploaded {fmtDate(r.created_at)}
                      {r.creator?.name && <><span className="apr-dot">·</span>by {r.creator.name}</>}
                      {r.min_supported_version_code != null && (
                        <><span className="apr-dot">·</span>forces builds below {r.min_supported_version_code}</>
                      )}
                    </div>

                    <div className="apr-sha" title="The app verifies this before installing">
                      sha256 {r.sha256.slice(0, 24)}…
                    </div>
                  </div>

                  <div className="apr-side">
                    <div className="apr-btn-row">
                      {r.download_url && (
                        <a className="apr-btn ghost" href={r.download_url} target="_blank" rel="noreferrer">Download</a>
                      )}
                      {r.status !== 'published' && (
                        <button
                          className="apr-btn pub"
                          disabled={busy === r.id}
                          onClick={() => act(r, '/publish', 'POST',
                            `Publish v${r.version_name} (build ${r.version_code})?\n\nEvery installed app on a lower build will be offered this update.`)}
                        >Publish</button>
                      )}
                      {r.status === 'published' && (
                        <button
                          className="apr-btn warn"
                          disabled={busy === r.id}
                          onClick={() => act(r, '/unpublish', 'POST',
                            `Withdraw v${r.version_name}?\n\nDevices will immediately stop being offered it.`)}
                        >Unpublish</button>
                      )}
                      <button
                        className="apr-btn del"
                        disabled={busy === r.id}
                        onClick={() => act(r, '', 'DELETE',
                          `Delete v${r.version_name}? The APK file is removed from the server too.`)}
                      >Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {upload && <UploadModal onClose={() => setUpload(false)} onDone={() => { setUpload(false); load(); }} />}

        <style jsx>{`
          .apr { font-family: 'DM Sans', system-ui, sans-serif; }

          .apr-bar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
          .apr-live { font-size: 13.5px; color: #4a5568; }
          .apr-live strong { color: #0B1B3A; font-weight: 700; }
          .apr-new {
            background: #E8A020; border: 1.5px solid #E8A020; color: #0B1B3A;
            border-radius: 10px; padding: 9px 18px; font-size: 13px; font-weight: 700;
            cursor: pointer; font-family: inherit; transition: filter .15s ease;
          }
          .apr-new:hover { filter: brightness(1.06); }

          .apr-error { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 16px; }
          .apr-retry { background: #fff; border: 1px solid #fecaca; color: #b91c1c; border-radius: 8px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
          .apr-empty { padding: 48px; text-align: center; color: #8492a6; font-size: 14px; }

          .apr-list { display: flex; flex-direction: column; gap: 14px; }
          .apr-card {
            display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px;
            background: #fff; border: 1px solid #e5e9f2; border-radius: 16px; padding: 18px;
          }
          .apr-card.islive { border-color: #86efac; box-shadow: 0 0 0 3px rgba(34,197,94,0.08); }
          @media (max-width: 780px) { .apr-card { grid-template-columns: minmax(0, 1fr); } }

          .apr-main { min-width: 0; }
          .apr-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
          .apr-ver { font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #0B1B3A; margin: 0; }
          .apr-code { font-size: 12px; color: #64748b; background: #f1f5f9; border-radius: 100px; padding: 2px 10px; }
          .apr-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
          .apr-mand { background: #fffbeb; color: #b45309; }
          .apr-notes { font-size: 13.5px; color: #334155; line-height: 1.6; margin: 0 0 8px; white-space: pre-wrap; }
          .apr-meta { font-size: 12.5px; color: #64748b; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
          .apr-dot { color: #cbd5e1; }
          .apr-sha { font-size: 11px; color: #94a3b8; margin-top: 5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }

          .apr-side { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
          @media (max-width: 780px) { .apr-side { align-items: flex-start; } }
          .apr-btn-row { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          .apr-btn { border: 1px solid #e5e9f2; background: #fff; color: #4a5568; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .15s ease; text-decoration: none; display: inline-block; }
          .apr-btn:disabled { opacity: .5; cursor: not-allowed; }
          .apr-btn.pub { background: #16a34a; border-color: #16a34a; color: #fff; }
          .apr-btn.pub:hover:not(:disabled) { background: #15803d; }
          .apr-btn.warn:hover:not(:disabled) { border-color: #f59e0b; color: #b45309; }
          .apr-btn.del:hover:not(:disabled) { border-color: #ef4444; color: #b91c1c; }
          .apr-btn.ghost:hover { border-color: #0B1B3A; color: #0B1B3A; }
        `}</style>
      </AdminSection>
    </RoleGuard>
  );
}

/* ─── Upload modal ───
 * Uses XMLHttpRequest, not fetch: a build is ~32 MB and fetch gives no upload
 * progress events, so the admin would stare at a frozen dialog for a minute. */
function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [versionName, setVersionName] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [notes, setNotes]             = useState('');
  const [mandatory, setMandatory]     = useState(false);
  const [minSupported, setMinSup]     = useState('');
  const [file, setFile]               = useState<File | null>(null);
  const [pct, setPct]                 = useState<number | null>(null);
  const [error, setError]             = useState('');

  const canSend =
    versionName.trim() !== '' && versionCode.trim() !== '' && file !== null && pct === null;

  const submit = () => {
    if (!file) return;
    setError('');
    setPct(0);

    const fd = new FormData();
    fd.append('version_name', versionName.trim());
    fd.append('version_code', versionCode.trim());
    fd.append('apk', file);
    if (notes.trim()) fd.append('release_notes', notes.trim());
    if (minSupported.trim()) fd.append('min_supported_version_code', minSupported.trim());
    fd.append('is_mandatory', mandatory ? '1' : '0');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/admin/app-releases`);
    xhr.setRequestHeader('Accept', 'application/json');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let body: { message?: string } = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        alert(body.message ?? 'Uploaded.');
        onDone();
      } else {
        setPct(null);
        setError(body.message ?? `Upload failed (HTTP ${xhr.status}).`);
      }
    };
    xhr.onerror = () => { setPct(null); setError('Upload failed — network error.'); };
    xhr.send(fd);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="aprm-overlay" onClick={e => { if (e.target === e.currentTarget && pct === null) onClose(); }}>
      <div className="aprm">
        <h3 className="aprm-title">Upload a build</h3>
        <p className="aprm-sub">
          It uploads as a <strong>draft</strong> — nothing is offered to any device until you publish it.
        </p>

        {error && <div className="aprm-error">{error}</div>}

        <label className="aprm-label">APK file</label>
        <input
          className="aprm-file"
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          disabled={pct !== null}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {file && <div className="aprm-hint">{file.name} · {fmtSize(file.size)}</div>}

        <div className="aprm-row">
          <div>
            <label className="aprm-label">Version name</label>
            <input className="aprm-input" placeholder="1.0.3" value={versionName} disabled={pct !== null}
                   onChange={e => setVersionName(e.target.value)} />
          </div>
          <div>
            <label className="aprm-label">Version code</label>
            <input className="aprm-input" type="number" placeholder="7" value={versionCode} disabled={pct !== null}
                   onChange={e => setVersionCode(e.target.value)} />
          </div>
        </div>
        <div className="aprm-hint">
          Version code must be higher than the live build — Android refuses to install a lower one.
        </div>

        <label className="aprm-label">Release notes</label>
        <textarea className="aprm-input aprm-textarea" placeholder="What changed in this build?"
                  value={notes} maxLength={4000} disabled={pct !== null}
                  onChange={e => setNotes(e.target.value)} />

        <label className="aprm-check">
          <input type="checkbox" checked={mandatory} disabled={pct !== null}
                 onChange={e => setMandatory(e.target.checked)} />
          Force this update (users cannot dismiss it)
        </label>

        <label className="aprm-label">Force any build below (optional)</label>
        <input className="aprm-input" type="number" placeholder="e.g. 6" value={minSupported} disabled={pct !== null}
               onChange={e => setMinSup(e.target.value)} />
        <div className="aprm-hint">
          Use this to retire a build that is actively broken, without forcing everyone.
        </div>

        {pct !== null && (
          <div className="aprm-prog">
            <div className="aprm-bar"><span style={{ width: `${pct}%` }} /></div>
            <div className="aprm-hint">
              {pct < 100 ? `Uploading… ${pct}%` : 'Processing on the server (hashing the file)…'}
            </div>
          </div>
        )}

        <div className="aprm-actions">
          <button className="aprm-btn ghost" onClick={onClose} disabled={pct !== null}>Cancel</button>
          <button className="aprm-btn save" onClick={submit} disabled={!canSend}>
            {pct !== null ? 'Uploading…' : 'Upload as draft'}
          </button>
        </div>

        <style jsx>{`
          /* :global() — styled-jsx does not scope the outermost node of a createPortal argument. */
          :global(.aprm-overlay) {
            position: fixed; inset: 0; background: rgba(11,27,58,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 9999;
            padding: 16px; overflow-y: auto;
          }
          .aprm {
            background: #fff; border-radius: 18px; padding: 26px; width: 100%; max-width: 520px;
            max-height: 90vh; overflow-y: auto; font-family: 'DM Sans', system-ui, sans-serif;
            box-shadow: 0 28px 70px rgba(0,0,0,0.4);
          }
          .aprm-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 700; color: #0B1B3A; margin: 0 0 6px; }
          .aprm-sub { font-size: 13px; color: #64748b; margin: 0 0 14px; line-height: 1.5; }
          .aprm-sub strong { color: #0B1B3A; }
          .aprm-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 14px; }
          .aprm-label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin: 14px 0 6px; }
          .aprm-input, .aprm-file {
            width: 100%; border: 1px solid #e5e9f2; border-radius: 10px; padding: 10px 13px;
            font-size: 14px; font-family: inherit; color: #0B1B3A; outline: none; box-sizing: border-box;
          }
          .aprm-input:focus { border-color: #E8A020; box-shadow: 0 0 0 3px rgba(232,160,32,0.18); }
          .aprm-textarea { min-height: 80px; resize: vertical; line-height: 1.55; }
          .aprm-row { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 12px; }
          .aprm-hint { font-size: 11.5px; color: #64748b; margin-top: 5px; line-height: 1.45; }
          .aprm-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #4a5568; margin-top: 16px; cursor: pointer; }
          .aprm-check input { accent-color: #E8A020; }

          .aprm-prog { margin-top: 18px; }
          .aprm-bar { height: 8px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
          .aprm-bar span { display: block; height: 100%; background: #E8A020; transition: width .2s ease; }

          .aprm-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
          .aprm-btn { border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1.5px solid transparent; }
          .aprm-btn.ghost { background: transparent; border-color: #e5e9f2; color: #4a5568; }
          .aprm-btn.save { background: #E8A020; border-color: #E8A020; color: #0B1B3A; }
          .aprm-btn:disabled { opacity: .55; cursor: not-allowed; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
