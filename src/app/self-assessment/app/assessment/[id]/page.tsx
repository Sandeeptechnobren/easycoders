
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

import AssessmentHeader from './AssessmentHeader';
import ProgressBar from './ProgressBar';
import QuestionRenderer from './QuestionRenderer';
// import AssessmentSuccess from './AssessmentSuccess';
import AssessmentSuccess from './AssessmentSuccess';

type Answer =
  | { selected_option_id: number }
  | { answer_text: string };

export default function AssessmentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [assessment, setAssessment] = useState<any>(null);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  /* FETCH ASSESSMENT */
  useEffect(() => {
    api.get(`/assessment/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('assessment_token')}`,
      },
    }).then(res => {
      const d = res.data.data;
      setAssessment(d.assessment);
      setQuestionTypes(d.question_types);
      setTimeLeft(d.assessment.duration * 60);
    });
  }, [id]);
  useEffect(() => {
    if (!timeLeft || submitted) return;
    if (timeLeft <= 0) {
      submitAssessment();
      return;
    }
    const t = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted]);
  // const submitAssessment = async () => {
  //   if (!assessment || submitted) return;
  //   const payload = {
  //     answers: Object.entries(answers).map(([qid, v]) => ({
  //       question_id: Number(qid),
  //       ...v,
  //     })),
  //   };
  //   await api.post(
  //     `/assessment/${assessment.id}/submit`,
  //     payload,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem('assessment_token')}`,
  //       },
  //     }
  //   );
  //   setSubmitted(true);
  //   setTimeout(() => router.replace('/self-assessment/app'), 4000);
  // };
  const submitAssessment = async () => {
    if (!assessment || submitted) return;
    const payload = {
      answers: Object.entries(answers).map(([qid, v]) => ({
        question_id: Number(qid),
        ...v,
      })),
    };
    try {
      const res = await api.post(
        `/assessment/${assessment.id}/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('assessment_token')}`,
          },
        }
      );
      if (res.data.status) {
        setSubmitted(true);
        console.log(res.data);
        const finalScore = res.data.score || 0;
        router.push(`/self-assessment/app/assessment/success?score=${finalScore}`);
      }
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to submit assessment. Please try again.");
    }
  };
  if (submitted) return <AssessmentSuccess />;
  if (!assessment) return null;
  const totalQuestions = questionTypes.reduce(
    (a, t) => a + t.questions.length,
    0
  );
  return (
    <div style={{ minHeight: '100vh', background: '#e4e6e9', margin:'0px' }}>
      <AssessmentHeader
        title={assessment.title}
        timeLeft={timeLeft}
        onSubmit={submitAssessment}
      />
      <ProgressBar
        current={Object.keys(answers).length}
        total={totalQuestions}
      />
      <div style={{ display: 'flex', paddingBottom: 10, paddingLeft:10 }}>
        {questionTypes.map((t, i) => (
          <button
            key={t.type_id}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: i === activeTab ? '#16316b' : '#e5e7eb',
              color: i === activeTab ? '#fff' : '#000',
              fontWeight: 600,
            }}
          >
            {t.type_name}
          </button>
        ))}
      </div>
    <QuestionRenderer
      questions={questionTypes[activeTab]?.questions || []}
      answers={answers}
      setAnswers={setAnswers}
      onSubmit={submitAssessment}
      isLastTab={activeTab === questionTypes.length - 1}
      onNextTab={() => setActiveTab(activeTab + 1)}
    />
      {/* <div style={{ textAlign: 'right', padding: 24 }}>
        <button
          onClick={submitAssessment}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: '#22c55e',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Submit Assessment
        </button>
      </div> */}
    </div>
  );
}
