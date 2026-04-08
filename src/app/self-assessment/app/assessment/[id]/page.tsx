'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import AssessmentHeader from './AssessmentHeader';
import ProgressBar from './ProgressBar';
import QuestionRenderer from './QuestionRenderer';
import AssessmentSuccess from './AssessmentSuccess';

type Answer = { selected_option_id: number } | { answer_text: string };

export default function AssessmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api
      .get(`/assessment/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` },
      })
      .then(res => {
        const d = res.data.data;
        setAssessment(d.assessment);
        setQuestionTypes(d.question_types);
        setTimeLeft(d.assessment.duration * 60);
      });
  }, [id]);

  useEffect(() => {
    if (!timeLeft || submitted) return;
    if (timeLeft <= 0) { submitAssessment(); return; }
    const t = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);

  const submitAssessment = async () => {
    if (!assessment || submitted) return;
    const payload = {
      answers: Object.entries(answers).map(([qid, v]) => ({
        question_id: Number(qid),
        ...v,
      })),
    };
    try {
      const res = await api.post(`/assessment/${assessment.id}/submit`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('assessment_token')}` },
      });
      if (res.data.status) {
        setSubmitted(true);
        localStorage.setItem('score', res.data.score);
      }
    } catch (error) {
      console.error('Submission failed', error);
      alert('Failed to submit assessment. Please try again.');
    }
  };

  if (submitted) return <AssessmentSuccess />;
  if (!assessment) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p style={{ fontWeight: 600 }}>Loading assessment…</p>
      </div>
    </div>
  );

  const totalQuestions = questionTypes.reduce((a, t) => a + t.questions.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky header */}
      <AssessmentHeader title={assessment.title} timeLeft={timeLeft} onSubmit={submitAssessment} />

      {/* Progress bar */}
      <ProgressBar current={Object.keys(answers).length} total={totalQuestions} />

      {/* Tab bar */}
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
            const sectionAnswered = t.questions.filter((q: any) => answers[q.id] != null).length;
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

      {/* Question area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <QuestionRenderer
          questions={questionTypes[activeTab]?.questions || []}
          answers={answers}
          setAnswers={setAnswers}
          onSubmit={submitAssessment}
          isLastTab={activeTab === questionTypes.length - 1}
          onNextTab={() => setActiveTab(activeTab + 1)}
        />
      </div>
    </div>
  );
}
