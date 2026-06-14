'use client';

import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '@/lib/axios';
import { CODING_LANGS, CODING_LANG_LIST, toLangKey, type CodingLangKey } from '@/lib/codingLangs';

type SampleCase = { stdin: string; expected_output: string };

interface CodingQuestion {
  id: number;
  question_text: string;
  marks: number;
  code_grading?: 'auto' | 'manual';
  starter_code?: string | null;
  languages?: string[];
  sample_test_cases?: SampleCase[];
}

interface Props {
  question: CodingQuestion;
  value?: { answer_text?: string; language?: string };
  onChange: (answer: { answer_text: string; language: string }) => void;
}

/* Pull the display + comparison output out of a Piston run payload. */
function extractRun(data: any): { display: string; stdout: string; isError: boolean } {
  const run = data?.run ?? {};
  const stdout = (run.stdout ?? '').toString();
  const stderr = (run.stderr ?? '').toString();
  const combined = (run.output ?? (stdout + stderr)).toString();
  if (stderr.trim() && !stdout.trim()) {
    return { display: stderr, stdout, isError: true };
  }
  return { display: combined.length ? combined : 'Program finished with no output.', stdout, isError: false };
}

export default function CodingAnswer({ question, value, onChange }: Props) {
  /* Languages the admin allowed for this question (fall back to all). */
  const allowed = useMemo(() => {
    const keys = (question.languages ?? [])
      .map(toLangKey)
      .filter((k): k is CodingLangKey => !!k);
    return keys.length ? keys : CODING_LANG_LIST.map(l => l.key);
  }, [question.languages]);

  const initialLang: CodingLangKey =
    toLangKey(value?.language) && allowed.includes(toLangKey(value?.language)!)
      ? (toLangKey(value?.language) as CodingLangKey)
      : allowed[0];

  const [language, setLanguage] = useState<CodingLangKey>(initialLang);
  const [code, setCode] = useState<string>(
    value?.answer_text != null && value.answer_text !== ''
      ? value.answer_text
      : (question.starter_code && question.starter_code.trim() !== ''
          ? question.starter_code
          : CODING_LANGS[initialLang].starter),
  );

  const samples = question.sample_test_cases ?? [];
  const isOpen = (question.code_grading ?? 'auto') === 'manual';

  const [fontSize, setFontSize] = useState(14);

  const [stdin, setStdin] = useState<string>(samples[0]?.stdin ?? '');
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [customOut, setCustomOut] = useState<{ display: string; isError: boolean } | null>(null);
  const [sampleResults, setSampleResults] = useState<Record<number, { got: string; passed: boolean; isError: boolean }>>({});

  /* Register the initial draft so the code + language is always submitted,
     even if the student never edits it. */
  useEffect(() => {
    onChange({ answer_text: code, language });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushAnswer = (nextCode: string, nextLang: CodingLangKey) =>
    onChange({ answer_text: nextCode, language: nextLang });

  const handleCode = (v?: string) => {
    const next = v ?? '';
    setCode(next);
    pushAnswer(next, language);
  };

  const handleLang = (l: CodingLangKey) => {
    setLanguage(l);
    pushAnswer(code, l);
  };

  const execute = async (input: string) => {
    const res = await api.post(
      '/EasyAssist/executeCode',
      { source_code: code, language: CODING_LANGS[language].piston, stdin: input },
      { headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` } },
    );
    return extractRun(res.data);
  };

  const runCustom = async () => {
    setRunningKey('custom');
    setCustomOut(null);
    try {
      const r = await execute(stdin);
      setCustomOut({ display: r.display, isError: r.isError });
    } catch {
      setCustomOut({ display: 'Code runner is temporarily unavailable. Your answer is still saved and will be graded.', isError: true });
    } finally {
      setRunningKey(null);
    }
  };

  const runSample = async (i: number) => {
    setRunningKey(`sample-${i}`);
    try {
      const r = await execute(samples[i].stdin);
      const passed = r.stdout.trim() === (samples[i].expected_output ?? '').trim();
      setSampleResults(s => ({ ...s, [i]: { got: r.display, passed, isError: r.isError } }));
    } catch {
      setSampleResults(s => ({ ...s, [i]: { got: 'Runner unavailable — try again in a moment.', passed: false, isError: true } }));
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <div className="ca-wrap">
      <style>{`
        .ca-wrap { display: flex; flex-direction: column; gap: 16px; }
        .ca-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .ca-langs { display: flex; gap: 6px; flex-wrap: wrap; }
        .ca-lang {
          padding: 7px 14px; border-radius: 999px; border: 1.5px solid #e2e8f0;
          background: #fff; color: #64748b; font-size: 12.5px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
        }
        .ca-lang:hover { border-color: #c4b5fd; color: #6d28d9; }
        .ca-lang.active { background: #4c1d95; border-color: #4c1d95; color: #fff; }
        .ca-mode {
          font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          padding: 5px 11px; border-radius: 999px;
        }
        .ca-mode.auto { background: #ecfdf5; color: #047857; }
        .ca-mode.open { background: #eff6ff; color: #1d4ed8; }
        .ca-top-right { display: flex; align-items: center; gap: 10px; }
        .ca-font { display: inline-flex; align-items: center; gap: 1px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 2px 4px; }
        .ca-font-ico { font-size: 11px; font-weight: 800; color: #6d28d9; padding: 0 4px; }
        .ca-font button { border: none; background: transparent; cursor: pointer; color: #475569; font-size: 15px; font-weight: 800; width: 22px; height: 24px; border-radius: 5px; line-height: 1; }
        .ca-font button:hover { background: #ede9fe; color: #6d28d9; }
        .ca-font-val { min-width: 28px; text-align: center; font-size: 11.5px; font-weight: 800; color: #0f172a; }
        .ca-editor { border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
        .ca-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
        .ca-panel-title { font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #475569; margin: 0 0 10px; }
        .ca-io textarea {
          width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 10px 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 13px; resize: vertical; color: #0f172a; background: #f8fafc;
        }
        .ca-io textarea:focus { outline: none; border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .ca-run {
          display: inline-flex; align-items: center; gap: 7px; margin-top: 10px;
          padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-weight: 700; font-size: 13px;
        }
        .ca-run:disabled { opacity: 0.6; cursor: progress; }
        .ca-out {
          margin-top: 12px; background: #0b1020; color: #e2e8f0; border-radius: 10px; padding: 12px 14px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
          white-space: pre-wrap; word-break: break-word; max-height: 220px; overflow: auto;
        }
        .ca-out.err { color: #fca5a5; }
        .ca-samples { display: flex; flex-direction: column; gap: 10px; }
        .ca-sample { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; }
        .ca-sample-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .ca-sample-tag { font-size: 11px; font-weight: 800; color: #64748b; letter-spacing: 0.04em; text-transform: uppercase; }
        .ca-runmini {
          display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 8px;
          border: 1.5px solid #c4b5fd; background: #f5f3ff; color: #6d28d9; font-weight: 700; font-size: 12px; cursor: pointer;
        }
        .ca-runmini:disabled { opacity: 0.6; cursor: progress; }
        .ca-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 640px) { .ca-grid { grid-template-columns: 1fr; } }
        .ca-cell-lbl { font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .ca-pre { background: #f1f5f9; border-radius: 8px; padding: 8px 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; white-space: pre-wrap; word-break: break-word; color: #334155; margin: 0; }
        .ca-verdict { font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 999px; }
        .ca-verdict.pass { background: #dcfce7; color: #166534; }
        .ca-verdict.fail { background: #fee2e2; color: #991b1b; }
        .ca-note { font-size: 12.5px; color: #64748b; line-height: 1.5; }
      `}</style>

      <div className="ca-top">
        <div className="ca-langs">
          {allowed.map(k => (
            <button
              key={k}
              type="button"
              className={`ca-lang ${k === language ? 'active' : ''}`}
              onClick={() => handleLang(k)}
            >
              {CODING_LANGS[k].label}
            </button>
          ))}
        </div>
        <div className="ca-top-right">
          <div className="ca-font" title="Editor font size">
            <span className="ca-font-ico">Aa</span>
            <button type="button" onClick={() => setFontSize(s => Math.max(11, s - 1))} aria-label="Decrease font size">−</button>
            <span className="ca-font-val">{fontSize}px</span>
            <button type="button" onClick={() => setFontSize(s => Math.min(24, s + 1))} aria-label="Increase font size">+</button>
          </div>
          <span className={`ca-mode ${isOpen ? 'open' : 'auto'}`}>
            {isOpen ? 'Open — reviewed by trainer' : 'Auto-graded'}
          </span>
        </div>
      </div>

      <div className="ca-editor">
        <Editor
          height="360px"
          theme="vs-dark"
          language={CODING_LANGS[language].monaco}
          value={code}
          onChange={handleCode}
          options={{ fontSize, minimap: { enabled: false }, automaticLayout: true, padding: { top: 10 }, scrollBeyondLastLine: false }}
        />
      </div>

      {/* Sample test cases (auto-graded questions). Run your code against each. */}
      {!isOpen && samples.length > 0 && (
        <div className="ca-panel">
          <p className="ca-panel-title">Sample test cases</p>
          <div className="ca-samples">
            {samples.map((s, i) => {
              const r = sampleResults[i];
              return (
                <div key={i} className="ca-sample">
                  <div className="ca-sample-head">
                    <span className="ca-sample-tag">Sample {i + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r && <span className={`ca-verdict ${r.passed ? 'pass' : 'fail'}`}>{r.passed ? '✓ Passed' : '✗ Failed'}</span>}
                      <button type="button" className="ca-runmini" disabled={runningKey === `sample-${i}`} onClick={() => runSample(i)}>
                        {runningKey === `sample-${i}` ? 'Running…' : '▶ Run'}
                      </button>
                    </div>
                  </div>
                  <div className="ca-grid">
                    <div>
                      <div className="ca-cell-lbl">Input</div>
                      <pre className="ca-pre">{s.stdin || '(none)'}</pre>
                    </div>
                    <div>
                      <div className="ca-cell-lbl">Expected output</div>
                      <pre className="ca-pre">{s.expected_output || '(none)'}</pre>
                    </div>
                  </div>
                  {r && (
                    <div style={{ marginTop: 8 }}>
                      <div className="ca-cell-lbl">Your output</div>
                      <pre className="ca-pre" style={r.isError ? { color: '#b91c1c' } : undefined}>{r.got}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom run / playground — primary surface for open questions. */}
      <div className="ca-panel ca-io">
        <p className="ca-panel-title">{isOpen ? 'Run your code' : 'Run with custom input'}</p>
        {isOpen && (
          <p className="ca-note" style={{ marginTop: -4, marginBottom: 10 }}>
            Write whatever solution meets the requirement above. Use the box below to feed your own input and test it. A trainer reviews and scores your code after you submit.
          </p>
        )}
        <textarea
          rows={3}
          placeholder="Standard input (stdin) for your program — leave empty if none."
          value={stdin}
          onChange={e => setStdin(e.target.value)}
        />
        <button type="button" className="ca-run" disabled={runningKey === 'custom'} onClick={runCustom}>
          {runningKey === 'custom' ? 'Running…' : '▶ Run'}
        </button>
        {customOut && <div className={`ca-out ${customOut.isError ? 'err' : ''}`}>{customOut.display}</div>}
      </div>
    </div>
  );
}
