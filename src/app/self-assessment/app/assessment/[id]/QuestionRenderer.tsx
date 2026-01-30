// 'use client';

// import { AnswerPayload } from './page';

// type Props = {
//   questions: any[];
//   answers: Record<number, AnswerPayload>;
//   setAnswers: React.Dispatch<
//     React.SetStateAction<Record<number, AnswerPayload>>
//   >;
// };

// export default function QuestionRenderer({
//   questions,
//   answers,
//   setAnswers,
// }: Props) {
//   return (
//     <div className="questionList">
//       {questions.map(q => (
//         <div key={q.id} className="questionCard">
//           <h3>{q.question_text}</h3>

//           {/* MCQ / TRUE-FALSE */}
//           {q.options?.map((opt: any) => (
//             <label key={opt.id} className="optionRow">
//               <input
//                 type="radio"
//                 name={`q_${q.id}`}
//                 checked={
//                   (answers[q.id] as any)?.selected_option_id === opt.id
//                 }
//                 onChange={() =>
//                   setAnswers(prev => ({
//                     ...prev,
//                     [q.id]: { selected_option_id: opt.id },
//                   }))
//                 }
//               />
//               {opt.option_text}
//             </label>
//           ))}

//           {/* NUMERIC / TEXT */}
//           {!q.options?.length && (
//             <input
//               className="textAnswer"
//               placeholder="Type your answer"
//               value={(answers[q.id] as any)?.answer_text || ''}
//               onChange={e =>
//                 setAnswers(prev => ({
//                   ...prev,
//                   [q.id]: { answer_text: e.target.value },
//                 }))
//               }
//             />
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }
import { AnswerPayload } from './page';

type Props = {
  questions: any[];
  answers: Record<number, AnswerPayload>;
  setAnswers: React.Dispatch<
    React.SetStateAction<Record<number, AnswerPayload>>
  >;
};

export default function QuestionRenderer({
  questions,
  answers,
  setAnswers,
}: Props) {
  const handleOptionSelect = (qid: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [qid]: { selected_option_id: optionId },
    }));
  };

  const handleTextChange = (qid: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [qid]: { answer_text: text },
    }));
  };

  return (
    <div className="questionsWrap">
      {questions.map((q, index) => (
        <div key={q.id} className="questionCard">
          <h4>
            Q{index + 1}. {q.question_text}
          </h4>

          {/* MCQ / TRUE_FALSE */}
          {q.options?.length > 0 && (
            <div className="options">
              {q.options.map((opt: any) => (
                <label key={opt.id} className="option">
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    checked={
                      (answers[q.id] as any)?.selected_option_id === opt.id
                    }
                    onChange={() => handleOptionSelect(q.id, opt.id)}
                  />
                  {opt.option_text}
                </label>
              ))}
            </div>
          )}

          {/* TEXT / NUMERIC */}
          {!q.options?.length && (
            <textarea
              className="textAnswer"
              placeholder="Write your answer here..."
              value={(answers[q.id] as any)?.answer_text || ''}
              onChange={e => handleTextChange(q.id, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
