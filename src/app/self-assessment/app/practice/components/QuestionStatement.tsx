// 'use client';

// export default function QuestionStatement({ activeQuestion }: { activeQuestion: any }) {
//   if (!activeQuestion) return <div className="p-4">Select a challenge...</div>;

//   return (
//     <div className="questionStatement">
//       <div className="terminalHeader">Problem: {activeQuestion.title}</div>
//       <div className="problemBody" style={{ padding: '15px', lineHeight: '1.6' }}>
//         <p>{activeQuestion.description}</p>
//         <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
//           <strong>Expected Output:</strong> 
//           <code style={{ background: '#eee', padding: '2px 5px' }}>
//             {activeQuestion.expected_output}
//           </code>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

export default function QuestionStatement({ activeQuestion }: { activeQuestion: any }) {
  return (
    <div className="questionStatement">
      <div className="terminalHeader">Problem Statement</div>
      <div className="problemBody" style={{ padding: '15px' }}>
        {activeQuestion ? (
          <>
            <h3 style={{ color: '#137175' }}>{activeQuestion.title}</h3>
            <p>{activeQuestion.description}</p>
            <small style={{ color: '#666' }}>Difficulty: {activeQuestion.difficulty}</small>
          </>
        ) : (
          <p>Select a question to begin.</p>
        )}
      </div>
    </div>
  );
}