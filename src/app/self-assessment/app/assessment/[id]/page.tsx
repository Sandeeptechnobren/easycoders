'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import AssessmentHeader from './AssessmentHeader';
import ProgressBar from './ProgressBar';
import QuestionRenderer from './QuestionRenderer';
import AssessmentSuccess from './AssessmentSuccess';

type Answer = { selected_option_id: number } | { answer_text: string; language?: string };
type Phase = 'loading' | 'ready' | 'active' | 'submitted' | 'locked';

type AssessmentQuestion = { id: number; [key: string]: unknown };
type QuestionType       = { type_id: number; type_name: string; questions: AssessmentQuestion[] };
type AssessmentData     = {
  id: number; title: string; duration: number; total_marks?: number; passing_score?: number;
  attempted?: boolean; passed?: boolean; can_retake?: boolean;
  retake_available_at?: string | null; last_score_percent?: number | null;
};

/* ──────────────────────────────────────────────────────────────────────────
 * Assessment-take page with a proctoring layer.
 *
 * Flow:
 *   loading     →  fetch assessment data
 *   ready       →  rules briefing; "Start Assessment" button (user gesture)
 *   active      →  fullscreen + timer + violation detection + question UI
 *   submitted   →  AssessmentSuccess result screen
 *
 * Violation rules (active only):
 *   - `visibilitychange` to hidden  → +1 strike  ("You switched away from the assessment.")
 *   - `window.blur`                 → +1 strike  ("Browser window lost focus.")
 *   - `fullscreenchange` to off     → +1 strike  ("You exited full-screen.")
 *
 *   3 strikes → assessment is auto-submitted with whatever answers exist.
 *   The success screen reads `score_force_submitted` to surface a
 *   distinct message for this outcome.
 *
 * Quietly blocked (NOT counted as strikes — just blocked):
 *   - right-click context menu
 *   - copy / cut
 *   - print (Ctrl+P)
 *
 * Edge cases handled:
 *   - blur + visibilitychange dedupe via a 250 ms cooldown so a single
 *     tab-switch doesn't burn two strikes.
 *   - fullscreen-exit triggered by our own submit code is flagged via
 *     `intentionalExitRef` so it never counts as a violation.
 *   - if the user re-focuses the page after a strike, we try to put
 *     them back into fullscreen automatically.
 * ────────────────────────────────────────────────────────────────────────── */

const MAX_VIOLATIONS = 3;
const STRIKE_COOLDOWN_MS = 250;

export default function AssessmentPage() {
  const { id } = useParams();
  const router = useRouter();
  void router; // reserved for future explicit nav

  const [assessment, setAssessment]       = useState<AssessmentData | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [activeTab, setActiveTab]         = useState(0);
  const [answers, setAnswers]             = useState<Record<number, Answer>>({});
  const [timeLeft, setTimeLeft]           = useState(0);
  const [phase, setPhase]                 = useState<Phase>('loading');
  const [violations, setViolations]       = useState(0);
  const [warningMsg, setWarningMsg]       = useState<string | null>(null);
  const [lockInfo, setLockInfo]           = useState<{ retakeAt: string | null; passed: boolean; percent: number | null } | null>(null);

  /* ─── Refs used to coordinate the proctoring callbacks ─── */
  const intentionalExitRef = useRef(false);   // true while we ourselves exit FS
  const lastStrikeRef      = useRef(0);        // dedup timestamp
  const submittedRef       = useRef(false);    // hard guard against double-submit
  const answersRef         = useRef<Record<number, Answer>>(answers);  // latest snapshot for forced submit
  const violationsRef      = useRef(violations);
  const assessmentRef      = useRef<AssessmentData | null>(assessment);

  /* Keep refs in sync with state so the long-lived event listeners
   * (registered once in the proctoring useEffect) always see the
   * latest values without having to re-register on every keystroke. */
  useEffect(() => { answersRef.current     = answers;     }, [answers]);
  useEffect(() => { violationsRef.current  = violations;  }, [violations]);
  useEffect(() => { assessmentRef.current  = assessment;  }, [assessment]);

  /* ─── Fetch assessment data ─── */
  useEffect(() => {
    api
      .get(`/assessment/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` },
      })
      .then(res => {
        const d = res.data.data;
        const a = d.assessment;
        // Defense against deep-linking past the dashboard gate: block a
        // re-entry if the user already passed, or failed but is still inside
        // the retake-wait window. (can_retake is computed server-side.)
        if (a.attempted && (a.passed || a.can_retake === false)) {
          setAssessment(a);
          setLockInfo({ retakeAt: a.retake_available_at ?? null, passed: !!a.passed, percent: a.last_score_percent ?? null });
          setPhase('locked');
          return;
        }
        setAssessment(a);
        setQuestionTypes(d.question_types);
        setTimeLeft(a.duration * 60);
        setPhase('ready');
      });
  }, [id]);

  /* ─── Timer (only while active) ─── */
  useEffect(() => {
    if (phase !== 'active') return;
    if (timeLeft <= 0) { submitAssessment('time_expired'); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  /* ─── Submission ─── */
  const submitAssessment = useCallback(async (reason: 'manual' | 'time_expired' | 'forced' = 'manual') => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Exit fullscreen if we're in it — and flag the exit as our own
    // so the violation listener doesn't count it as a strike.
    intentionalExitRef.current = true;
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    }

    const current = assessmentRef.current;
    if (!current) return;

    const payload = {
      answers: Object.entries(answersRef.current).map(([qid, v]) => ({
        question_id: Number(qid),
        ...v,
      })),
    };

    try {
      const res = await api.post(`/assessment/${current.id}/submit`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` },
      });
      if (res.data.status) {
        localStorage.setItem('score',              String(res.data.score));
        localStorage.setItem('score_total',        String(current.total_marks ?? 0));
        localStorage.setItem('score_passing',      String(current.passing_score ?? 40));
        localStorage.setItem('score_assessment_id', String(current.id));
        localStorage.setItem('score_force_submitted', reason === 'forced' ? '1' : '0');
        // The success screen posts feedback against this attempt, and shows the
        // form only when the server says this attempt owes it. Both are read
        // from the submit response so no extra round trip is needed.
        localStorage.setItem('score_attempt_id', String(res.data?.attempt_id ?? ''));
        localStorage.setItem('score_feedback_required', res.data?.feedback_required ? '1' : '0');
        setPhase('submitted');
      } else {
        submittedRef.current = false;
        alert('Failed to submit assessment. Please try again.');
      }
    } catch (error) {
      console.error('Submission failed', error);
      submittedRef.current = false;
      alert('Failed to submit assessment. Please try again.');
    }
  }, []);

  /* ─── Record a violation (called by all three detection rails) ─── */
  const recordViolation = useCallback((reason: string) => {
    if (phase !== 'active' || submittedRef.current) return;

    const now = Date.now();
    if (now - lastStrikeRef.current < STRIKE_COOLDOWN_MS) return; // dedupe burst events
    lastStrikeRef.current = now;

    const next = violationsRef.current + 1;
    setViolations(next);
    setWarningMsg(
      next >= MAX_VIOLATIONS
        ? `Final strike (${next}/${MAX_VIOLATIONS}): ${reason} — your assessment is being submitted.`
        : `Warning ${next}/${MAX_VIOLATIONS}: ${reason} — leaving the assessment again will cost you another strike.`
    );

    if (next >= MAX_VIOLATIONS) {
      // Slight delay so the user actually sees the final warning before
      // the success screen replaces the page.
      setTimeout(() => submitAssessment('forced'), 1200);
    }
  }, [phase, submitAssessment]);

  /* ─── Proctoring listeners (active only) ─── */
  useEffect(() => {
    if (phase !== 'active') return;

    const onVisibility = () => {
      if (document.hidden) recordViolation('You switched away from the assessment tab.');
    };
    const onBlur = () => {
      // Only counts if the page is still visible — visibilitychange will
      // already have fired for tab switches.
      if (!document.hidden) recordViolation('The browser window lost focus.');
    };
    const onFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      if (isFs) return;
      if (intentionalExitRef.current) {
        // Our own submit triggered this exit; don't strike.
        intentionalExitRef.current = false;
        return;
      }
      recordViolation('You exited full-screen mode.');
      // Try to recover automatically (best-effort; may need another gesture).
      tryEnterFullscreen();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [phase, recordViolation]);

  /* ─── Quietly block right-click / copy / cut / print while active ─── */
  useEffect(() => {
    if (phase !== 'active') return;
    const block = (e: Event) => e.preventDefault();
    const blockKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === 'p' || k === 's' || k === 'u')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    window.addEventListener('keydown', blockKey);
    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      window.removeEventListener('keydown', blockKey);
    };
  }, [phase]);

  /* ─── Auto-dismiss the warning banner after 6 seconds ─── */
  useEffect(() => {
    if (!warningMsg) return;
    const t = setTimeout(() => setWarningMsg(null), 6000);
    return () => clearTimeout(t);
  }, [warningMsg]);

  /* ─── Helper: ask the browser for fullscreen mode ─── */
  const tryEnterFullscreen = async () => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    if (document.fullscreenElement) return;
    try {
      if (el.requestFullscreen)              await el.requestFullscreen();
      else if (el.webkitRequestFullscreen)   await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen)       await el.msRequestFullscreen();
    } catch {
      /* Fullscreen denied / unsupported. We still proceed — the
       * visibility + blur listeners still police the user. */
    }
  };

  const startAssessment = async () => {
    await tryEnterFullscreen();
    setPhase('active');
  };

  /* ─── Render branches ─── */

  if (phase === 'submitted') return <AssessmentSuccess />;

  if (phase === 'loading' || !assessment) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ fontWeight: 600 }}>Loading assessment…</p>
        </div>
      </div>
    );
  }

  if (phase === 'locked') {
    const retakeDate = lockInfo?.retakeAt ? new Date(lockInfo.retakeAt) : null;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#0B1B3A 0%,#152D5A 100%)', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>
        <div style={{ background: '#fff', borderRadius: 22, maxWidth: 460, width: '100%', padding: '40px 34px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: lockInfo?.passed ? '#ecfdf5' : '#fef6e7', color: lockInfo?.passed ? '#166534' : '#B97A0F', fontSize: 28 }}>
            {lockInfo?.passed ? '✓' : '⏳'}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#0B1B3A', margin: '0 0 8px' }}>
            {lockInfo?.passed ? 'You already passed this assessment' : 'Retake not available yet'}
          </h1>
          <p style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.6, margin: '0 0 24px' }}>
            {lockInfo?.passed
              ? <>You scored {lockInfo?.percent != null ? <strong>{lockInfo.percent}%</strong> : 'a passing score'} and earned your certificate. Download it from your dashboard.</>
              : <>You scored {lockInfo?.percent != null ? <strong>{lockInfo.percent}%</strong> : 'below the passing mark'}.{' '}
                  {retakeDate ? <>You can retake this assessment on <strong>{retakeDate.toLocaleString()}</strong>.</> : <>Please try again later.</>}</>}
          </p>
          <button
            onClick={() => router.replace('/self-assessment/app')}
            style={{ width: '100%', padding: '13px 24px', borderRadius: 12, border: 'none', background: '#E8A020', color: '#0B1B3A', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'ready') {
    return <ReadyScreen
      title={assessment.title}
      durationMins={assessment.duration}
      totalQuestions={questionTypes.reduce((a, t) => a + t.questions.length, 0)}
      passingScore={assessment.passing_score ?? 40}
      onStart={startAssessment}
    />;
  }

  /* ─── phase === 'active' ─── */

  const totalQuestions = questionTypes.reduce((a, t) => a + t.questions.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Violation banner */}
      {warningMsg && <WarningBanner msg={warningMsg} count={violations} max={MAX_VIOLATIONS} />}

      <AssessmentHeader title={assessment.title} timeLeft={timeLeft} onSubmit={() => submitAssessment('manual')} />
      <ProgressBar current={Object.keys(answers).length} total={totalQuestions} />

      {questionTypes.length > 1 && (
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 28px',
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
          }}
        >
          {questionTypes.map((t, i) => {
            const isActive = i === activeTab;
            const sectionAnswered = t.questions.filter((q: AssessmentQuestion) => answers[q.id] != null).length;
            return (
              <button
                key={t.type_id}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                  background: 'transparent',
                  color: isActive ? '#7c3aed' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {t.type_name}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: isActive ? '#ede9fe' : '#f1f5f9',
                    color: isActive ? '#7c3aed' : '#94a3b8',
                  }}
                >
                  {sectionAnswered}/{t.questions.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <QuestionRenderer
          questions={questionTypes[activeTab]?.questions || []}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={() => submitAssessment('manual')}
          isLastTab={activeTab === questionTypes.length - 1}
          onNextTab={() => setActiveTab(activeTab + 1)}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Pre-start rules briefing.
 * ────────────────────────────────────────────────────────────────────────── */
type ReadyProps = {
  title:          string;
  durationMins:   number;
  totalQuestions: number;
  passingScore:   number;
  onStart:        () => void;
};

function ReadyScreen({ title, durationMins, totalQuestions, passingScore, onStart }: ReadyProps) {
  return (
    <div style={{
      minHeight:    '100vh',
      background:   'linear-gradient(135deg, #0B1B3A 0%, #152D5A 100%)',
      padding:      24,
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'center',
      fontFamily:   'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{
        background:    '#ffffff',
        borderRadius:  24,
        padding:       '40px 36px',
        maxWidth:      560,
        width:         '100%',
        boxShadow:     '0 24px 60px rgba(0,0,0,0.32)',
      }}>
        <div style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           7,
          background:    '#FEF6E7',
          color:         '#92660D',
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding:       '4px 13px',
          borderRadius:  100,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8A020' }} />
          Before you begin
        </div>

        <h1 style={{
          fontFamily:    'Playfair Display, Georgia, serif',
          fontSize:      26,
          fontWeight:    700,
          color:         '#0B1B3A',
          letterSpacing: '-0.01em',
          margin:        '14px 0 8px',
        }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, color: '#4A5568', margin: 0, lineHeight: 1.6, fontWeight: 300 }}>
          Read the rules below carefully — once you start, the assessment will go full-screen and the timer will begin.
        </p>

        {/* Stat strip */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap:                 0,
          background:          '#F4F6FB',
          borderRadius:        14,
          padding:             '14px 12px',
          margin:              '20px 0',
        }}>
          {[
            { label: 'Questions',    value: String(totalQuestions) },
            { label: 'Duration',     value: `${durationMins} min` },
            { label: 'To pass',      value: `${passingScore}%` },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding:     '0 12px',
              borderLeft:  i > 0 ? '1px solid #E5E9F2' : 'none',
              textAlign:   'center',
            }}>
              <p style={{
                fontSize:      10,
                color:         '#94A3B8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight:    700,
                margin:        '0 0 4px',
              }}>
                {s.label}
              </p>
              <div style={{
                fontFamily:    'Playfair Display, Georgia, serif',
                fontSize:      20,
                fontWeight:    700,
                color:         '#0B1B3A',
                letterSpacing: '-0.01em',
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Rules */}
        <div style={{
          background:    '#FEF2F2',
          border:        '1px solid #FECACA',
          borderRadius:  14,
          padding:       '16px 18px',
          marginBottom:  22,
        }}>
          <p style={{
            margin:        '0 0 10px',
            fontSize:      12,
            fontWeight:    700,
            color:         '#991B1B',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Proctoring rules
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'The assessment will run in full-screen mode.',
              'Don\'t switch tabs, apps or windows — each switch counts as a strike.',
              'Don\'t exit full-screen — that\'s also a strike.',
              `After 3 strikes the assessment is auto-submitted with whatever answers you have.`,
              'Right-click and copy / paste are disabled during the assessment.',
            ].map((rule, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, lineHeight: 1.55, color: '#7F1D1D' }}>
                <span style={{ flexShrink: 0, marginTop: 3, color: '#DC2626', fontWeight: 700 }}>•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onStart}
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            8,
            width:          '100%',
            background:     '#E8A020',
            color:          '#0B1B3A',
            border:         'none',
            padding:        '14px 24px',
            borderRadius:   12,
            fontFamily:     'inherit',
            fontSize:       15,
            fontWeight:     700,
            letterSpacing:  '0.01em',
            cursor:         'pointer',
          }}
        >
          I understand — start the assessment →
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Top-of-screen violation banner during active assessment.
 * ────────────────────────────────────────────────────────────────────────── */
function WarningBanner({ msg, count, max }: { msg: string; count: number; max: number }) {
  const isFinal = count >= max;
  return (
    <div
      role="alert"
      style={{
        position:        'sticky',
        top:             0,
        zIndex:          50,
        background:      isFinal ? '#7F1D1D' : '#B91C1C',
        color:           '#FFFFFF',
        padding:         '12px 20px',
        fontSize:        13,
        fontWeight:      600,
        letterSpacing:   '0.01em',
        display:         'flex',
        alignItems:      'center',
        gap:             10,
        justifyContent:  'center',
        textAlign:       'center',
        fontFamily:      'DM Sans, system-ui, sans-serif',
        animation:       'sa-warn-slide 0.25s ease',
      }}
    >
      <style>{`
        @keyframes sa-warn-slide {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <span style={{
        background:    'rgba(255,255,255,0.2)',
        padding:       '2px 8px',
        borderRadius:  100,
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: '0.06em',
      }}>
        {count} / {max}
      </span>
      {msg}
    </div>
  );
}
