
// // export default function QuestionRenderer({ questions, answers, setAnswers }: any) {
// //   return (
// //     <div style={{ padding: 24 }}>
// //       {questions.map((q: any) => (
// //         <div
// //           key={q.id}
// //           style={{
// //             background: '#fff',
// //             padding: 15,
// //             borderRadius: 16,
// //             marginBottom: 20,
// //             boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
// //           }}
// //         >
// //           <h4 style={{ marginBottom: 10 }}>{q.question_text}</h4>

// //           {q.options.map((o: any) => (
// //             <label key={o.id} style={{ display: 'block', marginTop: 8 }}>
// //               <input
// //                 type="radio"
// //                 name={`q-${q.id}`}
// //                 checked={answers[q.id]?.selected_option_id === o.id}
// //                 onChange={() =>
// //                   setAnswers((a: any) => ({
// //                     ...a,
// //                     [q.id]: { selected_option_id: o.id },
// //                   }))
// //                 }
// //               />{' '}
// //               {o.option_text}
// //             </label>
// //           ))}
// //         </div>
// //       ))}
// //     </div>
// //   );
// // }
// import React, { useState } from 'react';

// export default function QuestionRenderer({ questions, answers, setAnswers, onSubmit }: any) {
//   const [currentIndex, setCurrentIndex] = useState(0);

//   const currentQuestion = questions[currentIndex];
//   const isLastQuestion = currentIndex === questions.length - 1;

//   const handleNext = () => {
//     if (!isLastQuestion) {
//       setCurrentIndex((prev) => prev + 1);
//     }
//   };

//   const handleBack = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex((prev) => prev - 1);
//     }
//   };

//   if (!currentQuestion) return <div>No questions available.</div>;

//   return (
//     <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
//       {/* Progress Indicator */}
//       <div style={{ marginBottom: 15, color: '#666', fontSize: '0.9rem' }}>
//         Question {currentIndex + 1} of {questions.length}
//       </div>

//       <div
//         key={currentQuestion.id}
//         style={{
//           background: '#fff',
//           padding: 25,
//           borderRadius: 16,
//           marginBottom: 20,
//           boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
//         }}
//       >
//         <h4 style={{ marginBottom: 20 }}>{currentQuestion.question_text}</h4>

//         {currentQuestion.options.map((o: any) => (
//           <label 
//             key={o.id} 
//             style={{ 
//               display: 'block', 
//               padding: '10px 15px', 
//               border: '1px solid #eee', 
//               borderRadius: 8,
//               marginTop: 10,
//               cursor: 'pointer'
//             }}
//           >
//             <input
//               type="radio"
//               name={`q-${currentQuestion.id}`}
//               checked={answers[currentQuestion.id]?.selected_option_id === o.id}
//               onChange={() =>
//                 setAnswers((a: any) => ({
//                   ...a,
//                   [currentQuestion.id]: { selected_option_id: o.id },
//                 }))
//               }
//             />{' '}
//             <span style={{ marginLeft: 8 }}>{o.option_text}</span>
//           </label>
//         ))}

//         <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between' }}>
//           {/* Back Button */}
//           <button
//             onClick={handleBack}
//             disabled={currentIndex === 0}
//             style={{
//               padding: '10px 20px',
//               borderRadius: 8,
//               border: '1px solid #ddd',
//               backgroundColor: currentIndex === 0 ? '#f5f5f5' : '#fff',
//               cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
//             }}
//           >
//             Back
//           </button>

//           {/* Next or Submit Button */}
//           {!isLastQuestion ? (
//             <button
//               onClick={handleNext}
//               disabled={!answers[currentQuestion.id]} // Optional: disable if no answer
//               style={{
//                 padding: '10px 24px',
//                 borderRadius: 8,
//                 border: 'none',
//                 backgroundColor: '#007bff',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//               }}
//             >
//               Save & Next
//             </button>
//           ) : (
//             <button
//               onClick={onSubmit}
//               style={{
//                 padding: '10px 24px',
//                 borderRadius: 8,
//                 border: 'none',
//                 backgroundColor: '#28a745',
//                 color: '#fff',
//                 fontWeight: 'bold',
//                 cursor: 'pointer',
//               }}
//             >
//               Submit Assessment
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';

export default function QuestionRenderer({ 
  questions, 
  answers, 
  setAnswers, 
  onSubmit, 
  isLastTab, 
  onNextTab 
}: any) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset current index to 0 whenever the tab (questions array) changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [questions]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestionInSection = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!isLastQuestionInSection) {
      setCurrentIndex((prev) => prev + 1);
    } else if (!isLastTab) {
      // If last question of the section, move to next category tab
      onNextTab();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div style={{ padding: '10px', maxWidth: 800, margin: '0 auto' }}>
      <div
        key={currentQuestion.id}
        style={{
          background: '#fff',
          padding: 30,
          borderRadius: 10,
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600 }}>
          QUESTION {currentIndex + 1} OF {questions.length}
        </span>
        <h3 style={{ marginTop: 5, marginBottom: 20, color: '#16316b' }}>
          {currentQuestion.question_text}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentQuestion.options.map((o: any) => {
            const isSelected = answers[currentQuestion.id]?.selected_option_id === o.id;
            return (
              <label
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 10px',
                  borderRadius: 12,
                  border: isSelected ? '2px solid #16316b' : '1px solid #e5e7eb',
                  background: isSelected ? '#f0f4ff' : '#fff',
                  cursor: 'pointer',
                  transition: '0.2s all',
                }}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  checked={isSelected}
                  onChange={() =>
                    setAnswers((a: any) => ({
                      ...a,
                      [currentQuestion.id]: { selected_option_id: o.id },
                    }))
                  }
                  style={{ marginRight: 12, transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '1rem', fontWeight: isSelected ? 600 : 400 }}>
                  {o.option_text}
                </span>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: '1px solid #ddd',
              backgroundColor: currentIndex === 0 ? '#f5f5f5' : '#fff',
              color: '#333',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Back
          </button>

          {isLastQuestionInSection && isLastTab ? (
            <button
              onClick={onSubmit}
              style={{
                padding: '12px 32px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#22c55e',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '12px 32px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: '#16316b',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLastQuestionInSection ? 'Next Section' : 'Save & Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}