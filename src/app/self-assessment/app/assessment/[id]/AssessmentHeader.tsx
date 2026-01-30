
// type Props = {
//   title: string;
//   timeLeft: number;
//   onSubmit: () => void;
// };

// export default function AssessmentHeader({ title, timeLeft, onSubmit }: Props) {
//   const minutes = Math.floor(timeLeft / 60);
//   const seconds = timeLeft % 60;

//   return (
//     <div className="assessmentHeader">
//       <h2>{title}</h2>

//       <div className="assessmentHeaderRight">
//         <div className="timer">
//           ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
//         </div>

//         <button className="submitBtn" onClick={onSubmit}>
//           Submit Assessment
//         </button>
//       </div>
//     </div>
//   );
// }
export default function AssessmentHeader({ title, timeLeft, onSubmit }: any) {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;

  return (
    <div
      style={{
        background: '#16316b',
        color: '#fff',
        padding: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h3>{title}</h3>

      <div>
        ⏱ {min}:{sec.toString().padStart(2, '0')}
        <button
          onClick={onSubmit}
          style={{
            marginLeft: 20,
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
