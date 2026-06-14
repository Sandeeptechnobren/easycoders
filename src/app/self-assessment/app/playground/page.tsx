'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import api from '@/lib/axios';
import { CODING_LANGS, CODING_LANG_LIST, type CodingLangKey } from '@/lib/codingLangs';

/* ──────────────────────────────────────────────────────────────────────────
 * Code Playground — a free, always-available mini-IDE for EasyAssess students.
 * Write code in any of the five languages, feed it input, run it (⌘/Ctrl+Enter
 * or the Run button) via /EasyAssist/executeCode → CodeRunnerService (Paiza).
 * No question, no grading — just practice.
 * ────────────────────────────────────────────────────────────────────────── */

const STARTERS: Record<CodingLangKey, string> = {
  python:     'a, b = map(int, input().split())\nprint(a + b)\n',
  javascript: "const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split(' ').map(Number);\nconsole.log(a + b);\n",
  java:       'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int a = sc.nextInt(), b = sc.nextInt();\n    System.out.println(a + b);\n  }\n}\n',
  c:          '#include <stdio.h>\n\nint main() {\n  int a, b;\n  scanf("%d %d", &a, &b);\n  printf("%d\\n", a + b);\n  return 0;\n}\n',
  cpp:        '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b << "\\n";\n  return 0;\n}\n',
};

const FILENAME: Record<CodingLangKey, string> = {
  python: 'main.py', javascript: 'main.js', java: 'Main.java', c: 'main.c', cpp: 'main.cpp',
};

const STORE_KEY = 'pg_code_by_lang_v1';

type RunResult = { display: string; isError: boolean; time: string | null; exitCode: string | null; ok: boolean };

function extractRun(data: any): { display: string; isError: boolean } {
  const run = data?.run ?? {};
  const stdout = (run.stdout ?? '').toString();
  const stderr = (run.stderr ?? '').toString();
  const combined = (run.output ?? (stdout + stderr)).toString();
  if (stderr.trim() && !stdout.trim()) return { display: stderr, isError: true };
  return { display: combined.length ? combined : 'Program finished with no output.', isError: false };
}

export default function PlaygroundPage() {
  const [language, setLanguage] = useState<CodingLangKey>('python');

  // Each language keeps its own buffer; persisted to localStorage.
  const [codeByLang, setCodeByLang] = useState<Record<CodingLangKey, string>>(() => {
    const base = { ...STARTERS };
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
        for (const k of Object.keys(base) as CodingLangKey[]) if (typeof saved[k] === 'string') base[k] = saved[k];
      } catch { /* ignore */ }
    }
    return base;
  });
  const code = codeByLang[language];
  const setCode = (v: string) => setCodeByLang(prev => ({ ...prev, [language]: v }));

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(codeByLang)); } catch { /* ignore */ }
  }, [codeByLang]);

  const [stdin, setStdin] = useState<string>('2 3');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [tab, setTab] = useState<'input' | 'output'>('input');

  // Editor controls
  const [fontSize, setFontSize] = useState(14);
  const [wrap, setWrap] = useState(false);
  const [dark, setDark] = useState(true);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  // Copy feedback
  const [copied, setCopied] = useState<'code' | 'out' | null>(null);

  /* ── Fullscreen ── */
  const shellRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const toggleFullscreen = () => {
    const next = !fullscreen;
    setFullscreen(next);
    if (next) shellRef.current?.requestFullscreen?.().catch(() => { /* CSS fallback still applies */ });
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  useEffect(() => {
    // Sync state when the user leaves native fullscreen via Esc.
    const onFs = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  /* ── Run ── */
  const run = useCallback(async () => {
    setRunning(true);
    setTab('output');
    setResult(null);
    try {
      const res = await api.post(
        '/EasyAssist/executeCode',
        { source_code: codeByLang[language], language: CODING_LANGS[language].piston, stdin },
        { headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` } },
      );
      const d = res.data;
      const { display, isError } = extractRun(d);
      setResult({ display, isError, time: d?.time ?? null, exitCode: d?.exit_code ?? null, ok: d?.ok !== false });
    } catch {
      setResult({ display: 'Code runner is temporarily unavailable. Please try again in a moment.', isError: true, time: null, exitCode: null, ok: false });
    } finally {
      setRunning(false);
    }
  }, [codeByLang, language, stdin]);

  // Keep a stable ref so the Monaco ⌘/Ctrl+Enter command always runs the latest.
  const runRef = useRef(run);
  runRef.current = run;

  const onMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
    editor.onDidChangeCursorPosition(e => setCursor({ line: e.position.lineNumber, col: e.position.column }));
  };

  /* ── Resizable split (editor | console) ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [editorPct, setEditorPct] = useState(58);

  const onDragMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setEditorPct(Math.max(34, Math.min(74, pct)));
  }, []);
  const onDragEnd = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
  }, [onDragMove]);
  const onDragStart = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }, [onDragMove, onDragEnd]);
  useEffect(() => () => onDragEnd(), [onDragEnd]);

  const copy = async (what: 'code' | 'out', text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(c => (c === what ? null : c)), 1400); } catch { /* ignore */ }
  };

  const status = useMemo(() => {
    if (running) return { label: 'Running…', cls: 'run' };
    if (!result) return { label: 'Ready', cls: 'idle' };
    if (!result.ok) return { label: 'Runner offline', cls: 'err' };
    const bad = result.isError || (result.exitCode != null && result.exitCode !== '0');
    const t = result.time ? ` · ${result.time}s` : '';
    return bad
      ? { label: `Error${result.exitCode != null ? ` · exit ${result.exitCode}` : ''}${t}`, cls: 'err' }
      : { label: `Success${t}`, cls: 'ok' };
  }, [running, result]);

  return (
    <div className="pg">
      <style>{`
        .pg { padding: 20px clamp(14px,3vw,34px) 36px; max-width: 1360px; margin: 0 auto; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #0f172a; }

        /* Header */
        .pg-eyebrow { display:inline-flex; align-items:center; gap:7px; background:#ede9fe; color:#6d28d9; font-size:11px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; padding:5px 12px; border-radius:999px; }
        .pg-title { font-size:23px; font-weight:800; margin:11px 0 3px; letter-spacing:-.01em; }
        .pg-sub { font-size:13.5px; color:#64748b; margin:0 0 16px; }

        /* Workspace shell */
        .pg-shell { background:#fff; border:1px solid #e6e8f0; border-radius:18px; overflow:hidden; box-shadow:0 14px 40px rgba(15,23,42,.08); }
        .pg-shell.fs { position:fixed; inset:0; z-index:1000; border:none; border-radius:0; box-shadow:none; display:flex; flex-direction:column; }
        .pg-shell.fs .pg-body { flex:1; height:auto; min-height:0; }

        /* Toolbar */
        .pg-bar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:11px 14px; border-bottom:1px solid #eef0f6; background:#fbfbfe; }
        .pg-langs { display:flex; gap:5px; flex-wrap:wrap; }
        .pg-lang { padding:7px 14px; border-radius:9px; border:1.5px solid #e6e8f0; background:#fff; color:#64748b; font-size:12.5px; font-weight:700; cursor:pointer; transition:all .15s ease; }
        .pg-lang:hover { border-color:#c4b5fd; color:#6d28d9; }
        .pg-lang.active { background:#4c1d95; border-color:#4c1d95; color:#fff; }
        .pg-spacer { flex:1 1 auto; }

        .pg-tools { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .pg-seg { display:inline-flex; align-items:center; background:#fff; border:1px solid #e6e8f0; border-radius:9px; overflow:hidden; }
        .pg-seg button { border:none; background:transparent; padding:6px 9px; cursor:pointer; color:#475569; font-size:13px; font-weight:700; line-height:1; }
        .pg-seg button:hover { background:#f1f0fb; color:#4c1d95; }
        .pg-seg .div { width:1px; align-self:stretch; background:#e6e8f0; }
        .pg-seg-ico { padding:0 4px 0 9px; font-size:12px; font-weight:800; color:#6d28d9; }
        .pg-seg-val { min-width:30px; text-align:center; font-size:11.5px; font-weight:800; color:#0f172a; }
        .pg-chip { display:inline-flex; align-items:center; gap:6px; border:1px solid #e6e8f0; background:#fff; border-radius:9px; padding:6px 11px; font-size:12px; font-weight:700; color:#475569; cursor:pointer; transition:all .15s ease; }
        .pg-chip:hover { border-color:#c4b5fd; color:#6d28d9; }
        .pg-chip.on { background:#ede9fe; border-color:#c4b5fd; color:#6d28d9; }
        .pg-kbd { font-size:11px; color:#94a3b8; font-weight:700; display:inline-flex; align-items:center; gap:4px; }
        .pg-kbd kbd { background:#0f172a; color:#e2e8f0; border-radius:5px; padding:2px 6px; font-family:inherit; font-size:10.5px; }

        .pg-run { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:10px; border:none; cursor:pointer; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; font-weight:800; font-size:13.5px; box-shadow:0 4px 14px rgba(99,102,241,.32); transition:transform .12s ease, box-shadow .15s ease; }
        .pg-run:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,.42); }
        .pg-run:disabled { opacity:.7; cursor:progress; }
        .pg-spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:pg-spin .7s linear infinite; }
        @keyframes pg-spin { to { transform:rotate(360deg); } }

        .pg-status { display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:800; padding:5px 11px; border-radius:999px; white-space:nowrap; }
        .pg-status::before { content:''; width:7px; height:7px; border-radius:50%; }
        .pg-status.idle { background:#eef2f7; color:#64748b; } .pg-status.idle::before { background:#94a3b8; }
        .pg-status.run  { background:#fef3c7; color:#92660d; } .pg-status.run::before { background:#d97706; animation:pg-pulse 1s ease-in-out infinite; }
        .pg-status.ok   { background:#dcfce7; color:#166534; } .pg-status.ok::before { background:#16a34a; }
        .pg-status.err  { background:#fee2e2; color:#991b1b; } .pg-status.err::before { background:#dc2626; }
        @keyframes pg-pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }

        /* Split body */
        .pg-body { display:flex; align-items:stretch; height:clamp(440px, calc(100vh - 250px), 720px); }
        @media (max-width:900px){ .pg-body { flex-direction:column; height:auto; } }

        .pg-pane { display:flex; flex-direction:column; min-width:0; min-height:0; }
        .pg-editor-pane { background:#1e1e1e; }
        @media (max-width:900px){ .pg-editor-pane { height:60vh; } .pg-pane { width:100% !important; } }

        .pg-pane-head { display:flex; align-items:center; gap:9px; padding:8px 13px; background:#15151c; border-bottom:1px solid rgba(255,255,255,.06); }
        .pg-dots { display:flex; gap:6px; }
        .pg-dots span { width:11px; height:11px; border-radius:50%; }
        .pg-file { font-size:12.5px; color:#cbd5e1; font-weight:700; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
        .pg-langdot { margin-left:auto; display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:800; color:#a5b4fc; text-transform:uppercase; letter-spacing:.05em; }
        .pg-langdot::before { content:''; width:8px; height:8px; border-radius:50%; background:#818cf8; }

        .pg-monaco { flex:1; min-height:0; }
        .pg-editor-status { display:flex; align-items:center; gap:14px; padding:6px 13px; background:#15151c; border-top:1px solid rgba(255,255,255,.06); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; color:#64748b; }

        /* Divider */
        .pg-divider { width:8px; cursor:col-resize; background:#eef0f6; position:relative; flex-shrink:0; transition:background .15s ease; }
        .pg-divider:hover, .pg-divider:active { background:#c4b5fd; }
        .pg-divider::after { content:''; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:3px; height:34px; border-radius:3px; background:rgba(99,102,241,.45); }
        @media (max-width:900px){ .pg-divider { display:none; } }

        /* Console */
        .pg-console { background:#fff; border-left:1px solid #eef0f6; }
        @media (max-width:900px){ .pg-console { border-left:none; border-top:1px solid #eef0f6; } }
        .pg-tabs { display:flex; align-items:center; gap:2px; padding:8px 10px 0; border-bottom:1px solid #eef0f6; }
        .pg-tab { border:none; background:transparent; padding:8px 14px; font-size:12.5px; font-weight:800; color:#94a3b8; cursor:pointer; border-bottom:2px solid transparent; }
        .pg-tab.active { color:#4c1d95; border-bottom-color:#7c3aed; }
        .pg-tab-actions { margin-left:auto; display:flex; gap:6px; padding-right:4px; }
        .pg-mini { border:1px solid #e6e8f0; background:#fff; color:#475569; font-size:11px; font-weight:700; border-radius:7px; padding:5px 10px; cursor:pointer; transition:all .15s ease; }
        .pg-mini:hover { border-color:#c4b5fd; color:#6d28d9; }
        .pg-mini.done { color:#166534; border-color:#86efac; background:#f0fdf4; }

        .pg-tabbody { flex:1; min-height:0; overflow:auto; padding:13px; }
        .pg-stdin { width:100%; height:100%; min-height:160px; box-sizing:border-box; border:1px solid #e6e8f0; border-radius:10px; padding:11px 12px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; resize:none; color:#0f172a; background:#fafaff; }
        .pg-stdin:focus { outline:none; border-color:#a78bfa; box-shadow:0 0 0 3px rgba(124,58,237,.12); }
        .pg-out { margin:0; height:100%; min-height:160px; box-sizing:border-box; background:#0b1020; color:#e2e8f0; border-radius:10px; padding:13px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; white-space:pre-wrap; word-break:break-word; }
        .pg-out.err { color:#fca5a5; }
        .pg-out.empty { color:#64748b; display:flex; align-items:center; justify-content:center; text-align:center; }
      `}</style>

      {/* Header */}
      <span className="pg-eyebrow">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        Code Playground
      </span>
      <h1 className="pg-title">Write & run code in any language</h1>
      <p className="pg-sub">Pick a language, write code, give it input, and run it — anytime, no test required.</p>

      <div className={`pg-shell ${fullscreen ? 'fs' : ''}`} ref={shellRef}>
        {/* Toolbar */}
        <div className="pg-bar">
          <div className="pg-langs">
            {CODING_LANG_LIST.map(l => (
              <button key={l.key} type="button" className={`pg-lang ${l.key === language ? 'active' : ''}`} onClick={() => setLanguage(l.key)}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="pg-spacer" />

          <div className="pg-tools">
            <span className="pg-kbd"><kbd>⌘/Ctrl</kbd>+<kbd>↵</kbd></span>
            <div className="pg-seg" title="Editor font size">
              <span className="pg-seg-ico">Aa</span>
              <span className="div" />
              <button onClick={() => setFontSize(s => Math.max(11, s - 1))} aria-label="Decrease font size">−</button>
              <span className="pg-seg-val">{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(24, s + 1))} aria-label="Increase font size">+</button>
            </div>
            <button className={`pg-chip ${wrap ? 'on' : ''}`} onClick={() => setWrap(w => !w)} title="Toggle word wrap">Wrap</button>
            <button className="pg-chip" onClick={() => setDark(d => !d)} title="Toggle editor theme">{dark ? '☾ Dark' : '☀ Light'}</button>
            <button className={`pg-chip ${fullscreen ? 'on' : ''}`} onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}>
              {fullscreen
                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg> Exit</>
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg> Fullscreen</>}
            </button>
            <span className={`pg-status ${status.cls}`}>{status.label}</span>
            <button type="button" className="pg-run" disabled={running} onClick={run}>
              {running ? <><span className="pg-spin" /> Running…</> : <>▶ Run</>}
            </button>
          </div>
        </div>

        {/* Split body */}
        <div className="pg-body" ref={containerRef}>
          {/* Editor pane */}
          <div className="pg-pane pg-editor-pane" style={{ width: `${editorPct}%` }}>
            <div className="pg-pane-head">
              <span className="pg-dots"><span style={{ background: '#ff5f56' }} /><span style={{ background: '#ffbd2e' }} /><span style={{ background: '#27c93f' }} /></span>
              <span className="pg-file">{FILENAME[language]}</span>
              <span className="pg-langdot">{CODING_LANGS[language].label}</span>
            </div>
            <div className="pg-monaco">
              <Editor
                height="100%"
                theme={dark ? 'vs-dark' : 'light'}
                language={CODING_LANGS[language].monaco}
                value={code}
                onChange={v => setCode(v ?? '')}
                onMount={onMount}
                options={{
                  fontSize,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  padding: { top: 12 },
                  scrollBeyondLastLine: false,
                  wordWrap: wrap ? 'on' : 'off',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  roundedSelection: true,
                  tabSize: 2,
                }}
              />
            </div>
            <div className="pg-editor-status">
              <span>Ln {cursor.line}, Col {cursor.col}</span>
              <span>{CODING_LANGS[language].label}</span>
              <span>{code.length} chars</span>
            </div>
          </div>

          {/* Divider */}
          <div className="pg-divider" onMouseDown={onDragStart} role="separator" aria-orientation="vertical" />

          {/* Console pane */}
          <div className="pg-pane pg-console" style={{ width: `${100 - editorPct}%` }}>
            <div className="pg-tabs">
              <button className={`pg-tab ${tab === 'input' ? 'active' : ''}`} onClick={() => setTab('input')}>Input</button>
              <button className={`pg-tab ${tab === 'output' ? 'active' : ''}`} onClick={() => setTab('output')}>Output</button>
              <div className="pg-tab-actions">
                {tab === 'output'
                  ? <>
                      <button className={`pg-mini ${copied === 'out' ? 'done' : ''}`} onClick={() => copy('out', result?.display ?? '')}>{copied === 'out' ? 'Copied' : 'Copy'}</button>
                      <button className="pg-mini" onClick={() => setResult(null)}>Clear</button>
                    </>
                  : <>
                      <button className={`pg-mini ${copied === 'code' ? 'done' : ''}`} onClick={() => copy('code', code)}>{copied === 'code' ? 'Copied' : 'Copy code'}</button>
                      <button className="pg-mini" onClick={() => setCode(STARTERS[language])}>Reset</button>
                    </>}
              </div>
            </div>
            <div className="pg-tabbody">
              {tab === 'input'
                ? <textarea className="pg-stdin" placeholder="Standard input (stdin) your program reads — leave empty if none." value={stdin} onChange={e => setStdin(e.target.value)} />
                : (result
                    ? <pre className={`pg-out ${result.isError ? 'err' : ''}`}>{result.display}</pre>
                    : <div className="pg-out empty">Run your code (▶ or ⌘/Ctrl+Enter) to see the output here.</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
