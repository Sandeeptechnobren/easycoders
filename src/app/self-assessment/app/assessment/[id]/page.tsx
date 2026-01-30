// 'use client';

// import { useParams, useRouter } from 'next/navigation';
// import { useEffect, useState } from 'react';
// import api from '@/lib/axios';

// import AssessmentHeader from './AssessmentHeader';
// import ProgressBar from './ProgressBar';
// import QuestionRenderer from './QuestionRenderer';

// /* ================= TYPES ================= */
// export type AnswerPayload =
//   | { selected_option_id: number }
//   | { answer_text: string };

// export default function AssessmentPage() {
//   const { id } = useParams();
//   const router = useRouter();

//   const [assessment, setAssessment] = useState<any>(null);
//   const [questionTypes, setQuestionTypes] = useState<any[]>([]);
//   const [activeTab, setActiveTab] = useState(0);
//   const [answers, setAnswers] = useState<Record<number, AnswerPayload>>({});
//   const [timeLeft, setTimeLeft] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);

//   /* ================= FETCH ================= */
//   useEffect(() => {
//     const token = localStorage.getItem('assessment_token');
//     if (!token) {
//       router.replace('/self-assessment/login');
//       return;
//     }

//     api
//       .get(`/assessment/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       })
//       .then(res => {
//         const data = res.data.data;
//         setAssessment(data.assessment);
//         setQuestionTypes(data.question_types || []);
//         setTimeLeft(data.assessment.duration * 60);
//       })
//       .catch(() => router.replace('/self-assessment'))
//       .finally(() => setLoading(false));
//   }, [id, router]);

//   /* ================= TIMER ================= */
//   useEffect(() => {
//     if (timeLeft === null) return;

//     if (timeLeft <= 0) {
//       submitAssessment(); // 🔥 AUTO SUBMIT
//       return;
//     }

//     const t = setInterval(() => {
//       setTimeLeft(prev => (prev !== null ? prev - 1 : prev));
//     }, 1000);

//     return () => clearInterval(t);
//   }, [timeLeft]);

//   /* ================= AUTO TAB ================= */
//   useEffect(() => {
//     const current = questionTypes[activeTab]?.questions || [];
//     if (!current.length) return;

//     const answered = current.filter((q:any) => answers[q.id]).length;

//     if (answered === current.length && activeTab < questionTypes.length - 1) {
//       setActiveTab(prev => prev + 1);
//     }
//   }, [answers, activeTab, questionTypes]);

//   /* ================= FINAL SUBMIT ================= */
//   const submitAssessment = async () => {
//     if (!assessment) return;

//     const payload = {
//       answers: Object.entries(answers).map(([qid, value]) => ({
//         question_id: Number(qid),
//         ...value,
//       })),
//     };

//     try {
//       await api.post(
//         `/assessment/${assessment.id}/submit`,
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem(
//               'assessment_token'
//             )}`,
//           },
//         }
//       );

//       router.replace('/self-assessment'); // or result page later
//     } catch (err) {
//       console.error('Submission failed', err);
//       alert('Failed to submit assessment. Try again.');
//     }
//   };

//   if (loading) return <p>Loading assessment...</p>;
//   if (!assessment) return <p>Assessment not found</p>;

//   const totalQuestions = questionTypes.reduce(
//     (sum, t) => sum + t.questions.length,
//     0
//   );

//   return (
//     <div className="assessmentFullscreen">
//       <AssessmentHeader
//         title={assessment.title}
//         timeLeft={timeLeft ?? 0}
//         onSubmit={submitAssessment}
//       />

//       <ProgressBar
//         current={Object.keys(answers).length}
//         total={totalQuestions}
//       />

//       {/* QUESTION TYPE TABS */}
//       <div className="questionTabs">
//         {questionTypes.map((t, i) => (
//           <button
//             key={t.type_id}
//             className={`tab ${i === activeTab ? 'active' : ''}`}
//             onClick={() => setActiveTab(i)}
//           >
//             {t.type_name}
//           </button>
//         ))}
//       </div>

//       {/* QUESTIONS */}
//       <QuestionRenderer
//         questions={questionTypes[activeTab]?.questions || []}
//         answers={answers}
//         setAnswers={setAnswers}
//       />
//     </div>
//   );
// }
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

import AssessmentHeader from './AssessmentHeader';
import ProgressBar from './ProgressBar';
import QuestionRenderer from './QuestionRenderer';

export type AnswerPayload =
  | { selected_option_id: number }
  | { answer_text: string };

export default function AssessmentPage() {
  const { id } = useParams();
  const router = useRouter();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerPayload>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  /* ================= INIT ================= */
  useEffect(() => {
    const token = localStorage.getItem('assessment_token');
    if (!token) {
      router.replace('/self-assessment/login');
      return;
    }

    const startAttempt = api.post(
      `/assessment/${id}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const getDetails = api.get(`/assessment/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    Promise.all([startAttempt, getDetails])
      .then(([startRes, detailRes]) => {
        setAttemptId(startRes.data.attempt_id);

        const data = detailRes.data.data;
        setAssessment(data.assessment);
        setQuestionTypes(data.question_types);
        setTimeLeft(data.assessment.duration * 60);
      })
      .catch(() => router.replace('/self-assessment'))
      .finally(() => setLoading(false));
  }, [id, router]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  /* ================= SUBMIT ================= */
  const submitAssessment = async () => {
    if (!attemptId || submitted) return;

    setSubmitted(true);

    const payload = {
      answers: Object.entries(answers).map(([qid, value]) => ({
        question_id: Number(qid),
        ...value,
      })),
    };

    try {
      await api.post(
        `/assessment/${attemptId}/submit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('assessment_token')}`,
          },
        }
      );

      router.replace('/self-assessment/app');
    } catch (e) {
      console.error('Submission failed', e);
      alert('Submission failed. Please try again.');
      setSubmitted(false);
    }
  };

  if (loading) return <p>Loading assessment...</p>;
  if (!assessment) return <p>Assessment not found.</p>;

  const totalQuestions = questionTypes.reduce(
    (sum, t) => sum + t.questions.length,
    0
  );

  return (
    <div className="assessmentFullscreen">
      <AssessmentHeader
        title={assessment.title}
        timeLeft={timeLeft}
        onSubmit={submitAssessment}
      />

      <ProgressBar
        current={Object.keys(answers).length}
        total={totalQuestions}
      />

      {/* QUESTION TYPE TABS */}
      <div className="questionTabs">
        {questionTypes.map((t, i) => (
          <button
            key={t.type_id}
            className={`tab ${i === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {t.type_name}
          </button>
        ))}
      </div>

      {/* QUESTIONS */}
      <QuestionRenderer
        questions={questionTypes[activeTab]?.questions || []}
        answers={answers}
        setAnswers={setAnswers}
      />
    </div>
  );
}
