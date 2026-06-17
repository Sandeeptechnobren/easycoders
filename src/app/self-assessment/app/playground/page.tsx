'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import api from '@/lib/axios';
import { CODING_LANGS, CODING_LANG_LIST, type CodingLangKey } from '@/lib/codingLangs';

/* ──────────────────────────────────────────────────────────────────────────
 * Code Playground — a free, always-available mini-IDE for EasyAssess students.
 * Write code in any of the five languages, feed it input, run it (⌘/Ctrl+Enter
 * or the Run button) via /EasyAssist/executeCode → CodeRunnerService (Paiza).
 *
 * Saving is modelled as NOTEBOOKS with three clear actions (replaces the old
 * single ambiguous "Save" that silently did update-or-create):
 *   • Save        — saves the notebook you're in (new → name it once, then it's
 *                   saved; existing → updates it in place).
 *   • Save as new — always makes a fresh copy under a new name; you switch into it.
 *   • New         — starts a clean blank notebook (warns if there are unsaved edits).
 * A notebook bar shows the current notebook + a Saved/Unsaved badge so you always
 * know what Save will do. Per-language buffers stay lossless — each language keeps
 * its own code AND its open notebook — so switching language never loses work.
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

const WORKSPACE_KEY = 'pg_workspace_v1';
const LEGACY_CODE_KEY = 'pg_code_by_lang_v1';

type Nb = { id: number; title: string } | null;
type RunResult = { display: string; isError: boolean; time: string | null; exitCode: string | null; ok: boolean };

/* Dialog (branded, in-app — replaces window.prompt / window.confirm). */
type Dialog =
  | { kind: 'name'; title: string; label: string; confirmText: string; onConfirm: (value: string) => void }
  | { kind: 'confirm'; title: string; message: string; confirmText: string; danger?: boolean; onConfirm: () => void }
  | null;

function extractRun(data: any): { display: string; isError: boolean } {
  const run = data?.run ?? {};
  const stdout = (run.stdout ?? '').toString();
  const stderr = (run.stderr ?? '').toString();
  const combined = (run.output ?? (stdout + stderr)).toString();
  if (stderr.trim() && !stdout.trim()) return { display: stderr, isError: true };
  return { display: combined.length ? combined : 'Program finished with no output.', isError: false };
}

const emptyOpen = (): Record<CodingLangKey, Nb> => {
  const o = {} as Record<CodingLangKey, Nb>;
  (Object.keys(STARTERS) as CodingLangKey[]).forEach(k => (o[k] = null));
  return o;
};

export default function PlaygroundPage() {
  const [language, setLanguage] = useState<CodingLangKey>('python');

  // Per-language workspace (lossless): the code, the open notebook, and the
  // "baseline" (= last-saved content) used to tell whether there are edits.
  const [codeByLang, setCodeByLang] = useState<Record<CodingLangKey, string>>({ ...STARTERS });
  const [openByLang, setOpenByLang] = useState<Record<CodingLangKey, Nb>>(emptyOpen);
  const [baselineByLang, setBaselineByLang] = useState<Record<CodingLangKey, string>>({ ...STARTERS });
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved workspace once on mount (client only → no SSR mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_KEY);
      if (raw) {
        const w = JSON.parse(raw);
        const cb = { ...STARTERS } as Record<CodingLangKey, string>;
        const ob = emptyOpen();
        const bb = { ...STARTERS } as Record<CodingLangKey, string>;
        for (const k of Object.keys(STARTERS) as CodingLangKey[]) {
          if (typeof w?.codeByLang?.[k] === 'string') cb[k] = w.codeByLang[k];
          ob[k] = w?.openByLang?.[k] ?? null;
          bb[k] = typeof w?.baselineByLang?.[k] === 'string' ? w.baselineByLang[k] : cb[k];
        }
        setCodeByLang(cb); setOpenByLang(ob); setBaselineByLang(bb);
        if (w?.language && w.language in STARTERS) setLanguage(w.language);
      } else {
        // Migrate the old code-only store so existing scratch isn't lost.
        const old = JSON.parse(localStorage.getItem(LEGACY_CODE_KEY) || '{}');
        const cb = { ...STARTERS } as Record<CodingLangKey, string>;
        const bb = { ...STARTERS } as Record<CodingLangKey, string>;
        let any = false;
        for (const k of Object.keys(STARTERS) as CodingLangKey[]) {
          if (typeof old?.[k] === 'string') { cb[k] = old[k]; bb[k] = old[k]; any = true; }
        }
        if (any) { setCodeByLang(cb); setBaselineByLang(bb); }
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist the workspace (only after the initial restore, so we never clobber it).
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ language, codeByLang, openByLang, baselineByLang })); } catch { /* ignore */ }
  }, [hydrated, language, codeByLang, openByLang, baselineByLang]);

  const code = codeByLang[language];
  const setCode = (v: string) => setCodeByLang(prev => ({ ...prev, [language]: v }));
  const openNb = openByLang[language];
  const baseline = baselineByLang[language];
  const dirty = code !== baseline;

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

  /* ── Notebooks (server-backed, per-student) ── */
  type SnipRow = { id: number; title: string; language: string; updated_at: string };
  const [snippets, setSnippets] = useState<SnipRow[]>([]);
  const [snipMeta, setSnipMeta] = useState({ used: 0, max_snippets: 50, max_kb: 100 });
  const [savedOpen, setSavedOpen] = useState(false);
  const [snipBusy, setSnipBusy] = useState(false);
  const [snipMsg, setSnipMsg] = useState<string | null>(null);

  /* ── Branded dialog state ── */
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogVal, setDialogVal] = useState('');
  const dialogInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (dialog?.kind === 'name') { const t = setTimeout(() => dialogInputRef.current?.select(), 30); return () => clearTimeout(t); }
  }, [dialog]);
  const closeDialog = () => setDialog(null);
  const submitDialog = () => {
    if (!dialog) return;
    if (dialog.kind === 'name') {
      const v = dialogVal.trim();
      if (!v) return;
      setDialog(null);
      dialog.onConfirm(v);
    } else {
      setDialog(null);
      dialog.onConfirm();
    }
  };
  const askName = (o: { title: string; label: string; initial: string; confirmText: string; onConfirm: (v: string) => void }) => {
    setDialogVal(o.initial);
    setDialog({ kind: 'name', title: o.title, label: o.label, confirmText: o.confirmText, onConfirm: o.onConfirm });
  };
  const askConfirm = (o: { title: string; message: string; confirmText: string; danger?: boolean; onConfirm: () => void }) => {
    setDialog({ kind: 'confirm', ...o });
  };

  const authH = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` } });
  const flash = (m: string) => { setSnipMsg(m); setTimeout(() => setSnipMsg(s => (s === m ? null : s)), 2400); };
  const langLabel = (l: string) => (l in CODING_LANGS ? CODING_LANGS[l as CodingLangKey].label : l);

  const loadSnippets = useCallback(async () => {
    try {
      const res = await api.get('/playground/snippets', { headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` } });
      setSnippets(res.data?.data ?? []);
      if (res.data?.meta) setSnipMeta(res.data.meta);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { loadSnippets(); }, [loadSnippets]);

  const createNotebook = async (title: string) => {
    setSnipBusy(true);
    try {
      const res = await api.post('/playground/snippets', { title, language, code }, authH());
      const id = res.data.data.id; const t = res.data.data.title;
      setOpenByLang(prev => ({ ...prev, [language]: { id, title: t } }));
      setBaselineByLang(prev => ({ ...prev, [language]: code }));
      flash(`Saved “${t}”.`);
      loadSnippets();
    } catch (e: any) { flash(e?.response?.data?.message || 'Could not save.'); }
    finally { setSnipBusy(false); }
  };

  // Save: update the open notebook, or name + create a new one.
  const onSave = async () => {
    if (openNb) {
      setSnipBusy(true);
      try {
        await api.put(`/playground/snippets/${openNb.id}`, { language, code }, authH());
        setBaselineByLang(prev => ({ ...prev, [language]: code }));
        flash(`Saved “${openNb.title}”.`);
        loadSnippets();
      } catch (e: any) { flash(e?.response?.data?.message || 'Could not save.'); }
      finally { setSnipBusy(false); }
    } else {
      askName({
        title: 'Save notebook', label: 'Notebook name',
        initial: `${CODING_LANGS[language].label} notebook`, confirmText: 'Save',
        onConfirm: createNotebook,
      });
    }
  };

  // Save as new: always a fresh copy under a new name; you switch into it.
  const onSaveAsNew = () => {
    askName({
      title: 'Save as new notebook', label: 'New notebook name',
      initial: openNb ? `${openNb.title} copy` : `${CODING_LANGS[language].label} notebook`,
      confirmText: 'Save copy', onConfirm: createNotebook,
    });
  };

  // New: a clean blank notebook (warns if there are unsaved edits).
  const onNew = () => {
    const fresh = () => {
      setCodeByLang(prev => ({ ...prev, [language]: '' }));
      setOpenByLang(prev => ({ ...prev, [language]: null }));
      setBaselineByLang(prev => ({ ...prev, [language]: '' }));
      setResult(null);
    };
    if (dirty) {
      askConfirm({
        title: 'Start a new notebook?',
        message: openNb
          ? `You have unsaved changes in “${openNb.title}”. Starting a new notebook will discard them.`
          : 'You have unsaved code. Starting a new notebook will discard it.',
        confirmText: 'Discard & start new', danger: true, onConfirm: fresh,
      });
    } else fresh();
  };

  const openSaved = async (id: number) => {
    setSnipBusy(true);
    try {
      const res = await api.get(`/playground/snippets/${id}`, authH());
      const s = res.data.data;
      const lang: CodingLangKey = (s.language in CODING_LANGS) ? s.language : 'python';
      const apply = () => {
        setLanguage(lang);
        setCodeByLang(prev => ({ ...prev, [lang]: s.code ?? '' }));
        setOpenByLang(prev => ({ ...prev, [lang]: { id: s.id, title: s.title } }));
        setBaselineByLang(prev => ({ ...prev, [lang]: s.code ?? '' }));
        setSavedOpen(false);
        flash(`Opened “${s.title}”.`);
      };
      const targetDirty = (codeByLang[lang] ?? '') !== (baselineByLang[lang] ?? '');
      if (targetDirty) {
        const t = openByLang[lang]?.title;
        askConfirm({
          title: 'Open this notebook?',
          message: t
            ? `You have unsaved changes in “${t}” (${CODING_LANGS[lang].label}). Opening will discard them.`
            : `You have unsaved ${CODING_LANGS[lang].label} code. Opening will discard it.`,
          confirmText: 'Discard & open', danger: true, onConfirm: apply,
        });
      } else apply();
    } catch { flash('Could not open that notebook.'); }
    finally { setSnipBusy(false); }
  };

  const renameSaved = (id: number, current: string) => {
    askName({
      title: 'Rename notebook', label: 'Notebook name', initial: current, confirmText: 'Rename',
      onConfirm: async (title) => {
        if (title === current) return;
        try {
          await api.put(`/playground/snippets/${id}`, { title }, authH());
          setOpenByLang(prev => {
            const next = { ...prev };
            (Object.keys(next) as CodingLangKey[]).forEach(k => { if (next[k]?.id === id) next[k] = { id, title }; });
            return next;
          });
          loadSnippets();
        } catch (e: any) { flash(e?.response?.data?.message || 'Could not rename.'); }
      },
    });
  };

  const deleteSaved = (id: number, title: string) => {
    askConfirm({
      title: 'Delete notebook?', message: `“${title}” will be permanently deleted. This can’t be undone.`,
      confirmText: 'Delete', danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/playground/snippets/${id}`, authH());
          setOpenByLang(prev => {
            const next = { ...prev };
            (Object.keys(next) as CodingLangKey[]).forEach(k => { if (next[k]?.id === id) next[k] = null; });
            return next;
          });
          loadSnippets();
        } catch (e: any) { flash(e?.response?.data?.message || 'Could not delete.'); }
      },
    });
  };

  // Notebook-bar state badge.
  const nbName = openNb ? openNb.title : 'Untitled notebook';
  const nbState = openNb
    ? (dirty ? { t: 'Unsaved', cls: 'dirty' } : { t: 'Saved', cls: 'saved' })
    : (dirty ? { t: 'Unsaved', cls: 'dirty' } : { t: 'New notebook', cls: 'neutral' });

  return (
    <div className="pg">
      <style>{`
        .pg { padding: 20px clamp(14px,3vw,34px) 36px; max-width: 1360px; margin: 0 auto; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #0f172a; }

        /* Header */
        .pg-eyebrow { display:inline-flex; align-items:center; gap:7px; background:#ede9fe; color:#6d28d9; font-size:11px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; padding:5px 12px; border-radius:999px; }
        .pg-title { font-size:23px; font-weight:800; margin:11px 0 3px; letter-spacing:-.01em; }
        .pg-sub { font-size:13.5px; color:#64748b; margin:0 0 16px; }

        /* Workspace shell */
        .pg-shell { position:relative; background:#fff; border:1px solid #e6e8f0; border-radius:18px; overflow:hidden; box-shadow:0 14px 40px rgba(15,23,42,.08); }
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

        /* Notebook bar (the save/notebook row) */
        .pg-nbbar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:9px 14px; border-bottom:1px solid #eef0f6; background:#fff; }
        .pg-nb-id { display:flex; align-items:center; gap:9px; min-width:0; }
        .pg-nb-ico { color:#7c3aed; flex-shrink:0; display:inline-flex; }
        .pg-nb-name { font-size:13.5px; font-weight:800; color:#0f172a; max-width:230px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .pg-nb-state { font-size:10.5px; font-weight:800; padding:3px 9px; border-radius:999px; white-space:nowrap; text-transform:uppercase; letter-spacing:.04em; display:inline-flex; align-items:center; gap:5px; }
        .pg-nb-state::before { content:''; width:6px; height:6px; border-radius:50%; }
        .pg-nb-state.saved { background:#dcfce7; color:#166534; } .pg-nb-state.saved::before { background:#16a34a; }
        .pg-nb-state.dirty { background:#fef3c7; color:#92660d; } .pg-nb-state.dirty::before { background:#d97706; }
        .pg-nb-state.neutral { background:#eef2f7; color:#64748b; } .pg-nb-state.neutral::before { background:#94a3b8; }
        .pg-nb-actions { margin-left:auto; display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
        .pg-sv { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px; border:1.5px solid #4c1d95; background:#4c1d95; color:#fff; font-size:12.5px; font-weight:800; cursor:pointer; transition:all .15s ease; }
        .pg-sv:hover:not(:disabled) { background:#3b0f78; border-color:#3b0f78; }
        .pg-sv.ghost { background:#fff; border-color:#e6e8f0; color:#475569; }
        .pg-sv.ghost:hover:not(:disabled) { border-color:#c4b5fd; color:#6d28d9; background:#faf5ff; }
        .pg-sv:disabled { opacity:.5; cursor:not-allowed; }
        @media (max-width:620px){ .pg-nb-actions { width:100%; margin-left:0; } .pg-sv { flex:1; justify-content:center; } }

        /* Split body */
        .pg-body { display:flex; align-items:stretch; height:clamp(440px, calc(100vh - 296px), 720px); }
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

        /* Notebooks drawer */
        .pg-drawer-backdrop { position:absolute; inset:0; z-index:30; background:rgba(8,13,25,.45); display:flex; justify-content:flex-end; animation:pg-fade .15s ease; }
        @keyframes pg-fade { from{opacity:0;} to{opacity:1;} }
        .pg-drawer { width:min(380px,92%); background:#fff; height:100%; display:flex; flex-direction:column; box-shadow:-10px 0 40px rgba(8,13,25,.25); animation:pg-slide .2s ease; }
        @keyframes pg-slide { from{transform:translateX(24px);opacity:.5;} to{transform:none;opacity:1;} }
        .pg-drawer-head { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid #eef0f6; }
        .pg-drawer-head b { font-size:14px; font-weight:800; color:#0f172a; }
        .pg-drawer-usage { font-size:11px; font-weight:800; color:#6d28d9; background:#ede9fe; border-radius:999px; padding:3px 10px; }
        .pg-drawer-x { margin-left:auto; border:none; background:transparent; cursor:pointer; color:#94a3b8; font-size:18px; line-height:1; }
        .pg-drawer-list { flex:1; overflow:auto; padding:8px; }
        .pg-drawer-empty { padding:34px 18px; text-align:center; color:#94a3b8; font-size:13px; line-height:1.5; }
        .pg-snip { border:1px solid #eef0f6; border-radius:12px; padding:10px 12px; margin-bottom:8px; transition:border-color .15s; }
        .pg-snip:hover { border-color:#c4b5fd; }
        .pg-snip.open { border-color:#7c3aed; background:#faf5ff; }
        .pg-snip-main { cursor:pointer; }
        .pg-snip-title { display:block; font-size:13.5px; font-weight:700; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .pg-snip-meta { font-size:11.5px; color:#94a3b8; }
        .pg-snip-acts { display:flex; gap:6px; margin-top:8px; }
        .pg-snip-acts button { border:1px solid #e6e8f0; background:#fff; color:#475569; font-size:11px; font-weight:700; border-radius:7px; padding:4px 10px; cursor:pointer; }
        .pg-snip-acts button:hover { border-color:#c4b5fd; color:#6d28d9; }
        .pg-snip-acts button.del:hover { border-color:#fca5a5; color:#dc2626; background:#fef2f2; }

        /* Branded dialog */
        .pg-dialog-back { position:absolute; inset:0; z-index:60; background:rgba(8,13,25,.5); display:flex; align-items:center; justify-content:center; padding:18px; animation:pg-fade .15s ease; }
        .pg-dialog { width:min(390px,100%); background:#fff; border-radius:16px; box-shadow:0 24px 60px rgba(8,13,25,.42); overflow:hidden; animation:pg-pop .2s cubic-bezier(.16,1,.3,1); }
        @keyframes pg-pop { from{opacity:0;transform:translateY(10px) scale(.98);} to{opacity:1;transform:none;} }
        .pg-dialog-body { padding:20px 22px 4px; }
        .pg-dialog-title { font-size:16px; font-weight:800; color:#0f172a; margin:0 0 7px; }
        .pg-dialog-msg { font-size:13px; color:#64748b; line-height:1.6; margin:0 0 12px; }
        .pg-dialog-label { display:block; font-size:11px; font-weight:800; color:#6d28d9; text-transform:uppercase; letter-spacing:.05em; margin:6px 0 6px; }
        .pg-dialog-input { width:100%; box-sizing:border-box; border:1.5px solid #e6e8f0; border-radius:10px; padding:10px 12px; font-size:14px; font-family:inherit; font-weight:600; color:#0f172a; outline:none; transition:border-color .15s, box-shadow .15s; margin-bottom:8px; }
        .pg-dialog-input:focus { border-color:#a78bfa; box-shadow:0 0 0 3px rgba(124,58,237,.14); }
        .pg-dialog-foot { display:flex; justify-content:flex-end; gap:9px; padding:14px 22px 18px; }
        .pg-dialog-btn { padding:9px 16px; border-radius:9px; font-size:13px; font-weight:800; cursor:pointer; border:1.5px solid transparent; transition:all .15s ease; }
        .pg-dialog-btn.cancel { background:#fff; border-color:#e6e8f0; color:#475569; }
        .pg-dialog-btn.cancel:hover { border-color:#c4b5fd; color:#6d28d9; }
        .pg-dialog-btn.go { background:#4c1d95; color:#fff; }
        .pg-dialog-btn.go:hover:not(:disabled) { background:#3b0f78; }
        .pg-dialog-btn.go.danger { background:#dc2626; }
        .pg-dialog-btn.go.danger:hover:not(:disabled) { background:#b91c1c; }
        .pg-dialog-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Toast */
        .pg-toast { position:absolute; bottom:16px; left:50%; transform:translateX(-50%); z-index:40; background:#0f172a; color:#fff; font-size:12.5px; font-weight:700; padding:9px 16px; border-radius:10px; box-shadow:0 8px 24px rgba(8,13,25,.35); animation:pg-fade .15s ease; }
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

        {/* Notebook bar — current notebook + the three save actions */}
        <div className="pg-nbbar">
          <div className="pg-nb-id">
            <span className="pg-nb-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M8 4v15"/></svg>
            </span>
            <span className="pg-nb-name" title={nbName}>{nbName}</span>
            <span className={`pg-nb-state ${nbState.cls}`}>{nbState.t}</span>
          </div>
          <div className="pg-nb-actions">
            <button className="pg-sv" onClick={onSave} disabled={snipBusy || !dirty} title={openNb ? `Update “${openNb.title}”` : 'Save this notebook'}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save
            </button>
            <button className="pg-sv ghost" onClick={onSaveAsNew} disabled={snipBusy || !code.trim()} title="Save a copy as a new notebook">Save as new</button>
            <button className="pg-sv ghost" onClick={onNew} title="Start a blank notebook">＋ New</button>
            <button className="pg-sv ghost" onClick={() => { loadSnippets(); setSavedOpen(true); }} title="Your saved notebooks">
              My Notebooks{snippets.length ? ` · ${snippets.length}` : ''}
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

        {/* Notebooks drawer */}
        {savedOpen && (
          <div className="pg-drawer-backdrop" onClick={() => setSavedOpen(false)}>
            <div className="pg-drawer" onClick={e => e.stopPropagation()}>
              <div className="pg-drawer-head">
                <b>My Notebooks</b>
                <span className="pg-drawer-usage">{snipMeta.used}/{snipMeta.max_snippets}</span>
                <button className="pg-drawer-x" onClick={() => setSavedOpen(false)} aria-label="Close">✕</button>
              </div>
              <div className="pg-drawer-list">
                {snippets.length === 0 ? (
                  <div className="pg-drawer-empty">No notebooks yet.<br />Write some code, then hit <strong>Save</strong> to keep it here.</div>
                ) : snippets.map(s => (
                  <div key={s.id} className={`pg-snip ${openNb?.id === s.id ? 'open' : ''}`}>
                    <div className="pg-snip-main" onClick={() => openSaved(s.id)}>
                      <span className="pg-snip-title">{s.title}</span>
                      <span className="pg-snip-meta">{langLabel(s.language)} · {new Date(s.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="pg-snip-acts">
                      <button onClick={() => openSaved(s.id)}>Open</button>
                      <button onClick={() => renameSaved(s.id, s.title)}>Rename</button>
                      <button className="del" onClick={() => deleteSaved(s.id, s.title)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Branded dialog (name / confirm) */}
        {dialog && (
          <div className="pg-dialog-back" onClick={closeDialog}>
            <div className="pg-dialog" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
              <div className="pg-dialog-body">
                <h3 className="pg-dialog-title">{dialog.title}</h3>
                {dialog.kind === 'name' ? (
                  <>
                    <label className="pg-dialog-label">{dialog.label}</label>
                    <input
                      ref={dialogInputRef}
                      className="pg-dialog-input"
                      value={dialogVal}
                      onChange={e => setDialogVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitDialog(); } else if (e.key === 'Escape') { closeDialog(); } }}
                      maxLength={80}
                      autoFocus
                      spellCheck={false}
                    />
                  </>
                ) : (
                  <p className="pg-dialog-msg">{dialog.message}</p>
                )}
              </div>
              <div className="pg-dialog-foot">
                <button className="pg-dialog-btn cancel" onClick={closeDialog}>Cancel</button>
                <button
                  className={`pg-dialog-btn go ${dialog.kind === 'confirm' && dialog.danger ? 'danger' : ''}`}
                  onClick={submitDialog}
                  disabled={dialog.kind === 'name' && !dialogVal.trim()}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {snipMsg && <div className="pg-toast">{snipMsg}</div>}
      </div>
    </div>
  );
}
