'use client';

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '@/lib/axios';

interface SqlQuestion {
  id: number;
  question_text: string;
  marks: number;
  code_grading?: 'auto' | 'manual';
  starter_code?: string | null;
  schema_sql?: string | null;
}

interface Props {
  question: SqlQuestion;
  value?: { answer_text?: string };
  onChange: (answer: { answer_text: string }) => void;
}

type RunState = {
  ok: boolean; error: string | null; columns: string[]; rows: string[][];
  row_count: number; truncated: boolean;
} | null;

export default function SqlAnswer({ question, value, onChange }: Props) {
  const isOpen = (question.code_grading ?? 'auto') === 'manual';
  const [sql, setSql] = useState<string>(
    value?.answer_text != null && value.answer_text !== ''
      ? value.answer_text
      : (question.starter_code && question.starter_code.trim() !== '' ? question.starter_code : 'SELECT '),
  );
  const [fontSize, setFontSize] = useState(14);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunState>(null);
  const [showSchema, setShowSchema] = useState(true);

  // Register the initial draft so the query is always submitted even if untouched.
  useEffect(() => {
    onChange({ answer_text: sql });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSql = (v?: string) => {
    const next = v ?? '';
    setSql(next);
    onChange({ answer_text: next });
  };

  const run = async () => {
    setRunning(true); setResult(null);
    try {
      const res = await api.post(
        '/EasyAssist/executeSql',
        { sql, schema_sql: question.schema_sql ?? '' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` } },
      );
      setResult(res.data as RunState);
    } catch {
      setResult({ ok: false, error: 'The SQL engine is temporarily unavailable. Your answer is still saved and will be graded.', columns: [], rows: [], row_count: 0, truncated: false });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="sa-wrap">
      <style>{`
        .sa-wrap { display: flex; flex-direction: column; gap: 14px; }
        .sa-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .sa-mode { font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px; }
        .sa-mode.auto { background: #ecfdf5; color: #047857; }
        .sa-mode.open { background: #eff6ff; color: #1d4ed8; }
        .sa-font { display: inline-flex; align-items: center; gap: 1px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 2px 4px; }
        .sa-font button { border: none; background: transparent; cursor: pointer; color: #475569; font-size: 15px; font-weight: 800; width: 22px; height: 24px; border-radius: 5px; }
        .sa-font button:hover { background: #ede9fe; color: #6d28d9; }
        .sa-font-val { min-width: 28px; text-align: center; font-size: 11.5px; font-weight: 800; color: #0f172a; }
        .sa-schema { background: #0b1020; border-radius: 12px; overflow: hidden; }
        .sa-schema-head { display: flex; align-items: center; justify-content: space-between; padding: 9px 14px; cursor: pointer; color: #cbd5e1; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
        .sa-schema pre { margin: 0; padding: 0 14px 14px; color: #93c5fd; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; white-space: pre-wrap; max-height: 180px; overflow: auto; }
        .sa-editor { border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
        .sa-run { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-weight: 700; font-size: 13px; align-self: flex-start; }
        .sa-run:disabled { opacity: 0.6; cursor: progress; }
        .sa-note { font-size: 12.5px; color: #64748b; line-height: 1.5; }
        .sa-res { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
        .sa-res-title { font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #475569; margin: 0 0 10px; }
        .sa-err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-family: ui-monospace, monospace; font-size: 13px; padding: 10px 12px; border-radius: 10px; white-space: pre-wrap; }
        .sa-ok { color: #047857; font-weight: 600; font-size: 13.5px; }
        .sa-tablewrap { overflow: auto; border: 1px solid #e2e8f0; border-radius: 10px; max-height: 320px; }
        .sa-table { border-collapse: collapse; width: 100%; font-size: 13px; }
        .sa-table th { text-align: left; padding: 8px 12px; background: #f5f3ff; color: #4c1d95; font-weight: 800; white-space: nowrap; position: sticky; top: 0; }
        .sa-table td { padding: 7px 12px; border-top: 1px solid #eef2f7; font-family: ui-monospace, monospace; color: #334155; white-space: nowrap; }
        .sa-null { color: #94a3b8; font-style: italic; }
        .sa-meta { font-size: 11.5px; color: #94a3b8; margin-top: 6px; }
      `}</style>

      <div className="sa-top">
        <div className="sa-font" title="Editor font size">
          <button type="button" onClick={() => setFontSize(s => Math.max(11, s - 1))}>−</button>
          <span className="sa-font-val">{fontSize}px</span>
          <button type="button" onClick={() => setFontSize(s => Math.min(24, s + 1))}>+</button>
        </div>
        <span className={`sa-mode ${isOpen ? 'open' : 'auto'}`}>{isOpen ? 'Open — reviewed by trainer' : 'Auto-graded'}</span>
      </div>

      {question.schema_sql && question.schema_sql.trim() !== '' && (
        <div className="sa-schema">
          <div className="sa-schema-head" onClick={() => setShowSchema(s => !s)}>
            <span>Database schema</span>
            <span>{showSchema ? '▾' : '▸'}</span>
          </div>
          {showSchema && <pre>{question.schema_sql}</pre>}
        </div>
      )}

      <div className="sa-editor">
        <Editor
          height="300px"
          theme="vs-dark"
          language="sql"
          value={sql}
          onChange={handleSql}
          options={{ fontSize, minimap: { enabled: false }, automaticLayout: true, padding: { top: 10 }, scrollBeyondLastLine: false, wordWrap: 'on' }}
        />
      </div>

      {isOpen && <p className="sa-note">Write the SQL that answers the question. Use Run to test it against the schema above. A trainer reviews and scores your query after you submit.</p>}

      <button type="button" className="sa-run" disabled={running} onClick={run}>{running ? 'Running…' : '▶ Run query'}</button>

      {result && (
        <div className="sa-res">
          <p className="sa-res-title">Result</p>
          {result.error ? (
            <div className="sa-err">{result.error}</div>
          ) : result.columns.length > 0 ? (
            <>
              <div className="sa-tablewrap">
                <table className="sa-table">
                  <thead><tr>{result.columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
                  <tbody>
                    {result.rows.length === 0
                      ? <tr><td colSpan={result.columns.length} style={{ textAlign: 'center', color: '#94a3b8', padding: 14 }}>No rows.</td></tr>
                      : result.rows.map((r, ri) => <tr key={ri}>{r.map((v, ci) => <td key={ci}>{v === null ? <span className="sa-null">NULL</span> : v}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
              <div className="sa-meta">{result.rows.length} row{result.rows.length === 1 ? '' : 's'}{result.truncated ? ' (first 1000 shown)' : ''}</div>
            </>
          ) : (
            <div className="sa-ok">Statement(s) executed successfully.</div>
          )}
        </div>
      )}
    </div>
  );
}
