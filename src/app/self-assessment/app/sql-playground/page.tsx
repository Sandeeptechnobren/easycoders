'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const API_BASE = 'https://api.easycoders.in/projects/backend/public/api';
const WS_KEY = 'sql_workspace_v1';

type SampleDb = { key: string; label: string; description: string; tables: Record<string, string[]> };
type StmtRec = {
  phase: string; sql: string; kind?: string;
  columns?: string[]; rows?: string[][]; row_count?: number; affected?: number; error?: string; truncated?: boolean;
};
type RunResult = {
  ok: boolean; error: string | null; columns: string[]; rows: string[][];
  row_count: number; truncated: boolean; statements: StmtRec[]; elapsed_ms: number;
};
type SnippetMeta = { id: number; title: string; language: string; updated_at: string };

const STARTER = `-- Welcome to the SQL Playground.
-- A sample database is loaded for you (pick one above). Write SQL and press Run.
-- Try a query:

SELECT d.name AS department,
       COUNT(*) AS employees,
       ROUND(AVG(e.salary)) AS avg_salary
FROM departments d
JOIN employees e ON e.department_id = d.id
GROUP BY d.name
ORDER BY avg_salary DESC;
`;

function authHeaders(json = true): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('assessment_token') : null;
  const h: Record<string, string> = { Authorization: `Bearer ${t || ''}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export default function SqlPlaygroundPage() {
  const [sql, setSql] = useState(STARTER);
  const [samples, setSamples] = useState<SampleDb[]>([]);
  const [sampleDb, setSampleDb] = useState('company');
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [dark, setDark] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [schemaOpen, setSchemaOpen] = useState(true);

  // AI
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const [aiHint, setAiHint] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Snippets
  const [snips, setSnips] = useState<SnippetMeta[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [curSnip, setCurSnip] = useState<{ id: number; title: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  const hydrated = useRef(false);

  /* hydrate workspace */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WS_KEY);
      if (raw) {
        const w = JSON.parse(raw);
        if (typeof w.sql === 'string') setSql(w.sql);
        if (typeof w.sampleDb === 'string') setSampleDb(w.sampleDb);
      }
    } catch { /* ignore */ }
    hydrated.current = true;
  }, []);

  /* persist workspace */
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(WS_KEY, JSON.stringify({ sql, sampleDb })); } catch { /* ignore */ }
  }, [sql, sampleDb]);

  /* load samples + snippets */
  useEffect(() => {
    fetch(`${API_BASE}/EasyAssist/sql-samples`, { headers: authHeaders(false) })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d?.samples)) setSamples(d.samples); })
      .catch(() => {});
    loadSnips();
  }, []);

  const loadSnips = useCallback(() => {
    fetch(`${API_BASE}/playground/snippets?language=sql`, { headers: authHeaders(false) })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d?.data)) setSnips(d.data); })
      .catch(() => {});
  }, []);

  const run = useCallback(async () => {
    setRunning(true); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/EasyAssist/executeSql`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ sql, sample_db: sampleDb || null }),
      });
      const d = await res.json();
      setResult(d as RunResult);
    } catch {
      setResult({ ok: false, error: 'Could not reach the SQL engine. Please try again.', columns: [], rows: [], row_count: 0, truncated: false, statements: [], elapsed_ms: 0 });
    } finally {
      setRunning(false);
    }
  }, [sql, sampleDb]);

  const askAi = useCallback(async () => {
    if (!aiMsg.trim()) return;
    setAiLoading(true); setAiHint('');
    try {
      const res = await fetch(`${API_BASE}/EasyAssist/getAssistance`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ question_text: 'SQL / DBMS practice in the SQL Playground.', user_code: sql, custom_message: aiMsg }),
      });
      const d = await res.json();
      setAiHint(d?.hint || 'Sorry, EasyAI is temporarily unavailable.');
    } catch {
      setAiHint('Sorry, EasyAI is temporarily unavailable.');
    } finally {
      setAiLoading(false);
    }
  }, [aiMsg, sql]);

  const saveSnippet = useCallback(async (asNew: boolean) => {
    setSaveMsg('');
    if (asNew || !curSnip) {
      const title = window.prompt('Name this SQL snippet:', curSnip ? `${curSnip.title} copy` : 'My query');
      if (!title) return;
      const res = await fetch(`${API_BASE}/playground/snippets`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ title, language: 'sql', code: sql }),
      });
      const d = await res.json();
      if (!res.ok) { setSaveMsg(d?.message || 'Could not save.'); return; }
      setCurSnip({ id: d.data.id, title: d.data.title }); setSaveMsg('Saved ✓'); loadSnips();
    } else {
      const res = await fetch(`${API_BASE}/playground/snippets/${curSnip.id}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify({ code: sql }),
      });
      const d = await res.json();
      if (!res.ok) { setSaveMsg(d?.message || 'Could not save.'); return; }
      setSaveMsg('Saved ✓'); loadSnips();
    }
  }, [sql, curSnip, loadSnips]);

  const openSnippet = useCallback(async (id: number) => {
    const res = await fetch(`${API_BASE}/playground/snippets/${id}`, { headers: authHeaders(false) });
    const d = await res.json();
    if (res.ok && d?.data) {
      setSql(d.data.code || ''); setCurSnip({ id: d.data.id, title: d.data.title }); setDrawer(false); setSaveMsg('');
    }
  }, []);

  const delSnippet = useCallback(async (id: number) => {
    if (!window.confirm('Delete this saved snippet?')) return;
    await fetch(`${API_BASE}/playground/snippets/${id}`, { method: 'DELETE', headers: authHeaders(false) });
    if (curSnip?.id === id) setCurSnip(null);
    loadSnips();
  }, [curSnip, loadSnips]);

  const activeSample = samples.find((s) => s.key === sampleDb);
  // the result table = the last result-producing statement
  const table = (() => {
    if (!result) return null;
    const last = [...(result.statements || [])].reverse().find((s) => s.kind === 'result');
    if (last) return { columns: last.columns || [], rows: last.rows || [], truncated: !!last.truncated };
    if (result.columns?.length) return { columns: result.columns, rows: result.rows, truncated: result.truncated };
    return null;
  })();

  return (
    <div className={`sp-wrap ${dark ? 'dark' : 'light'}`}>
      <style>{styles}</style>

      {/* Header */}
      <div className="sp-head">
        <div className="sp-title">
          <span className="sp-badge">SQL</span>
          <div>
            <h1>SQL Playground</h1>
            <p>Practice DBMS — write SQL, run it against a sample database, see the results.</p>
          </div>
        </div>
        <div className="sp-head-actions">
          <label className="sp-db">
            <span>Sample DB</span>
            <select value={sampleDb} onChange={(e) => setSampleDb(e.target.value)}>
              <option value="">None (empty)</option>
              {samples.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <button className="sp-run" onClick={run} disabled={running}>
            {running ? 'Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      <div className="sp-body">
        {/* Schema browser */}
        {schemaOpen && (
          <aside className="sp-schema">
            <div className="sp-schema-head">
              <span>Schema</span>
              <button onClick={() => setSchemaOpen(false)} title="Hide">‹</button>
            </div>
            {activeSample ? (
              <>
                <p className="sp-schema-desc">{activeSample.description}</p>
                {Object.entries(activeSample.tables).map(([t, cols]) => (
                  <div key={t} className="sp-table">
                    <div className="sp-table-name" onClick={() => setSql((s) => `${s.replace(/\s+$/, '')}\nSELECT * FROM ${t};\n`)} title="Click to add a SELECT">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>
                      {t}
                    </div>
                    <div className="sp-cols">{cols.map((c) => <span key={c} className="sp-col">{c}</span>)}</div>
                  </div>
                ))}
              </>
            ) : <p className="sp-schema-desc">No sample database selected. Create your own tables with CREATE TABLE.</p>}
          </aside>
        )}

        {/* Editor + results */}
        <main className="sp-main">
          <div className="sp-toolbar">
            {!schemaOpen && <button className="sp-tbtn" onClick={() => setSchemaOpen(true)} title="Show schema">Schema</button>}
            <button className="sp-tbtn" onClick={() => setDrawer(true)}>My SQL ({snips.length})</button>
            <button className="sp-tbtn" onClick={() => saveSnippet(false)}>{curSnip ? 'Save' : 'Save…'}</button>
            {curSnip && <button className="sp-tbtn" onClick={() => saveSnippet(true)}>Save as new</button>}
            {curSnip && <span className="sp-cur">{curSnip.title}</span>}
            {saveMsg && <span className="sp-savemsg">{saveMsg}</span>}
            <span className="sp-spacer" />
            <button className="sp-tbtn" onClick={() => setFontSize((f) => Math.max(11, f - 1))}>A−</button>
            <span className="sp-fs">{fontSize}px</span>
            <button className="sp-tbtn" onClick={() => setFontSize((f) => Math.min(22, f + 1))}>A+</button>
            <button className="sp-tbtn" onClick={() => setDark((d) => !d)}>{dark ? 'Light' : 'Dark'}</button>
            <button className="sp-tbtn" onClick={() => setAiOpen((a) => !a)}>EasyAI</button>
          </div>

          <div className="sp-editor">
            <Editor
              height="100%"
              language="sql"
              theme={dark ? 'vs-dark' : 'light'}
              value={sql}
              onChange={(v) => setSql(v ?? '')}
              options={{ fontSize, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 10 }, lineNumbers: 'on', wordWrap: 'on' }}
            />
          </div>

          {aiOpen && (
            <div className="sp-ai">
              <div className="sp-ai-row">
                <input value={aiMsg} onChange={(e) => setAiMsg(e.target.value)} placeholder="Ask EasyAI about your SQL (it gives hints, not the full answer)…"
                  onKeyDown={(e) => { if (e.key === 'Enter') askAi(); }} />
                <button onClick={askAi} disabled={aiLoading}>{aiLoading ? '…' : 'Ask'}</button>
              </div>
              {aiHint && <div className="sp-ai-hint">{aiHint}</div>}
            </div>
          )}

          {/* Results */}
          <div className="sp-results">
            <div className="sp-results-head">
              <span>Results</span>
              {result && <span className="sp-meta">{result.elapsed_ms} ms{table ? ` · ${table.rows.length} row${table.rows.length === 1 ? '' : 's'}` : ''}</span>}
            </div>
            <div className="sp-results-body">
              {!result ? (
                <div className="sp-placeholder">Run a query to see results here.</div>
              ) : result.error ? (
                <div className="sp-error">{result.error}</div>
              ) : (
                <>
                  {table && table.columns.length > 0 ? (
                    <div className="sp-tablewrap">
                      <table className="sp-rtable">
                        <thead><tr>{table.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
                        <tbody>
                          {table.rows.length === 0
                            ? <tr><td colSpan={table.columns.length} className="sp-empty">No rows.</td></tr>
                            : table.rows.map((r, ri) => <tr key={ri}>{r.map((v, ci) => <td key={ci}>{v === null ? <em className="sp-null">NULL</em> : v}</td>)}</tr>)}
                        </tbody>
                      </table>
                      {table.truncated && <div className="sp-trunc">Showing the first 1000 rows.</div>}
                    </div>
                  ) : (
                    <div className="sp-ok">Statement(s) executed successfully.</div>
                  )}
                  {/* run log for multi-statement scripts */}
                  {result.statements.length > 1 && (
                    <div className="sp-log">
                      {result.statements.map((s, i) => (
                        <div key={i} className={`sp-logrow ${s.error ? 'err' : ''}`}>
                          <span className="sp-logmark">{s.error ? '✗' : '✓'}</span>
                          <code>{s.sql}</code>
                          <span className="sp-logres">{s.error ? s.error : s.kind === 'result' ? `${s.row_count} row${s.row_count === 1 ? '' : 's'}` : `${s.affected ?? 0} affected`}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Snippets drawer */}
      {drawer && (
        <div className="sp-drawer-bd" onClick={(e) => { if (e.target === e.currentTarget) setDrawer(false); }}>
          <div className="sp-drawer">
            <div className="sp-drawer-head"><span>My SQL snippets</span><button onClick={() => setDrawer(false)}>✕</button></div>
            <div className="sp-drawer-body">
              {snips.length === 0 ? <div className="sp-placeholder">No saved snippets yet. Write a query and click Save.</div>
                : snips.map((s) => (
                  <div key={s.id} className="sp-snip">
                    <button className="sp-snip-open" onClick={() => openSnippet(s.id)}>{s.title}</button>
                    <button className="sp-snip-del" onClick={() => delSnippet(s.id)} title="Delete">🗑</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = `
  .sp-wrap { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; height: 100%; display: flex; flex-direction: column; min-height: 0; }
  .sp-wrap.dark { background: #0b1020; color: #e2e8f0; }
  .sp-wrap.light { background: #f1f5f9; color: #0f172a; }
  .sp-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 20px; flex-wrap: wrap; border-bottom: 1px solid rgba(148,163,184,0.18); }
  .sp-title { display: flex; align-items: center; gap: 13px; }
  .sp-badge { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(79,70,229,.4); }
  .sp-title h1 { font-size: 18px; font-weight: 800; margin: 0; }
  .sp-title p { font-size: 12.5px; margin: 2px 0 0; opacity: .65; }
  .sp-head-actions { display: flex; align-items: center; gap: 12px; }
  .sp-db { display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; opacity: .7; }
  .sp-db select { font-family: inherit; font-size: 13px; font-weight: 600; padding: 7px 10px; border-radius: 9px; border: 1px solid rgba(148,163,184,.3); background: rgba(148,163,184,.1); color: inherit; }
  .sp-run { border: none; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; font-weight: 800; font-size: 14px; padding: 11px 22px; border-radius: 11px; cursor: pointer; align-self: flex-end; box-shadow: 0 6px 16px rgba(79,70,229,.36); }
  .sp-run:hover { filter: brightness(1.08); } .sp-run:disabled { opacity: .6; cursor: not-allowed; }

  .sp-body { flex: 1; display: flex; min-height: 0; }
  .sp-schema { width: 232px; flex-shrink: 0; border-right: 1px solid rgba(148,163,184,.18); overflow-y: auto; padding: 12px; }
  .sp-schema-head { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .6; margin-bottom: 8px; }
  .sp-schema-head button { background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; opacity: .6; }
  .sp-schema-desc { font-size: 11.5px; opacity: .6; line-height: 1.5; margin: 0 0 12px; }
  .sp-table { margin-bottom: 12px; }
  .sp-table-name { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; cursor: pointer; padding: 5px 7px; border-radius: 8px; }
  .sp-table-name:hover { background: rgba(99,102,241,.16); color: #a5b4fc; }
  .sp-cols { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0 0 22px; }
  .sp-col { font-size: 10.5px; font-family: 'Fira Code', monospace; padding: 1px 6px; border-radius: 5px; background: rgba(148,163,184,.14); opacity: .85; }

  .sp-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; }
  .sp-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-bottom: 1px solid rgba(148,163,184,.14); flex-wrap: wrap; }
  .sp-tbtn { font-family: inherit; font-size: 12.5px; font-weight: 600; padding: 6px 11px; border-radius: 8px; border: 1px solid rgba(148,163,184,.28); background: rgba(148,163,184,.1); color: inherit; cursor: pointer; }
  .sp-tbtn:hover { background: rgba(148,163,184,.2); }
  .sp-cur { font-size: 12px; font-weight: 700; color: #a5b4fc; }
  .sp-savemsg { font-size: 12px; font-weight: 700; color: #34d399; }
  .sp-spacer { flex: 1; } .sp-fs { font-size: 11.5px; opacity: .6; }
  .sp-editor { flex: 1 1 52%; min-height: 160px; }
  .sp-ai { padding: 10px 14px; border-top: 1px solid rgba(148,163,184,.14); background: rgba(99,102,241,.06); }
  .sp-ai-row { display: flex; gap: 8px; }
  .sp-ai-row input { flex: 1; font-family: inherit; font-size: 13px; padding: 9px 12px; border-radius: 9px; border: 1px solid rgba(148,163,184,.3); background: rgba(148,163,184,.08); color: inherit; }
  .sp-ai-row button { border: none; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; font-weight: 700; padding: 0 18px; border-radius: 9px; cursor: pointer; }
  .sp-ai-hint { margin-top: 9px; font-size: 13px; line-height: 1.55; padding: 11px 13px; border-radius: 9px; background: rgba(148,163,184,.1); white-space: pre-wrap; }

  .sp-results { flex: 1 1 48%; display: flex; flex-direction: column; min-height: 120px; border-top: 1px solid rgba(148,163,184,.18); }
  .sp-results-head { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; opacity: .65; }
  .sp-meta { font-weight: 600; opacity: .8; text-transform: none; letter-spacing: 0; }
  .sp-results-body { flex: 1; overflow: auto; padding: 0 14px 14px; }
  .sp-placeholder { opacity: .5; font-size: 13px; padding: 24px 4px; }
  .sp-error { background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.4); color: #fca5a5; font-family: 'Fira Code', monospace; font-size: 13px; padding: 12px 14px; border-radius: 10px; white-space: pre-wrap; }
  .sp-ok { color: #34d399; font-weight: 600; font-size: 13.5px; padding: 10px 2px; }
  .sp-tablewrap { overflow: auto; border: 1px solid rgba(148,163,184,.2); border-radius: 10px; }
  .sp-rtable { border-collapse: collapse; width: 100%; font-size: 13px; }
  .sp-rtable th { text-align: left; padding: 9px 13px; background: rgba(99,102,241,.18); font-weight: 800; white-space: nowrap; position: sticky; top: 0; }
  .sp-rtable td { padding: 8px 13px; border-top: 1px solid rgba(148,163,184,.14); font-family: 'Fira Code', monospace; white-space: nowrap; }
  .sp-null { opacity: .45; font-style: italic; }
  .sp-empty { text-align: center; opacity: .5; padding: 16px; }
  .sp-trunc { font-size: 11.5px; opacity: .6; padding: 7px 4px 0; }
  .sp-log { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
  .sp-logrow { display: flex; align-items: center; gap: 9px; font-size: 11.5px; padding: 5px 9px; border-radius: 7px; background: rgba(148,163,184,.08); }
  .sp-logrow.err { background: rgba(239,68,68,.12); }
  .sp-logmark { color: #34d399; font-weight: 800; } .sp-logrow.err .sp-logmark { color: #fca5a5; }
  .sp-logrow code { flex: 1; font-family: 'Fira Code', monospace; opacity: .8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sp-logres { opacity: .7; white-space: nowrap; }

  .sp-drawer-bd { position: fixed; inset: 0; z-index: 1500; background: rgba(2,6,23,.5); display: flex; justify-content: flex-end; }
  .sp-drawer { width: 320px; max-width: 90vw; background: #fff; color: #0f172a; height: 100%; display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,.3); }
  .sp-drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #eef2f7; font-weight: 800; }
  .sp-drawer-head button { border: none; background: #f1f5f9; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; }
  .sp-drawer-body { flex: 1; overflow-y: auto; padding: 10px; }
  .sp-snip { display: flex; align-items: center; gap: 6px; }
  .sp-snip-open { flex: 1; text-align: left; border: none; background: none; font-family: inherit; font-size: 14px; font-weight: 600; color: #0f172a; padding: 10px 12px; border-radius: 9px; cursor: pointer; }
  .sp-snip-open:hover { background: #eef2ff; color: #4338ca; }
  .sp-snip-del { border: none; background: none; cursor: pointer; padding: 6px 8px; border-radius: 8px; opacity: .6; }
  .sp-snip-del:hover { background: #fef2f2; opacity: 1; }
  @media (max-width: 760px) { .sp-schema { display: none; } }
`;
