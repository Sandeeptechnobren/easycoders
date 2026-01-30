// export default function AssessmentHeader({
//   title,
//   timeLeft,
//   onSubmit,
// }: any) {
//   const min = Math.floor(timeLeft / 60);
//   const sec = timeLeft % 60;

//   return (
//     <div className="assessmentHeader">
//       <h1>{title}</h1>
//       <div className="timer">
//         ⏱ {min}:{sec.toString().padStart(2, '0')}
//         <button className="submitBtn" onClick={onSubmit}>
//           Submit
//         </button>
//       </div>
//     </div>
//   );
// }
type Props = {
  title: string;
  timeLeft: number;
  onSubmit: () => void;
};

export default function AssessmentHeader({ title, timeLeft, onSubmit }: Props) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="assessmentHeader">
      <h2>{title}</h2>

      <div className="assessmentHeaderRight">
        <div className="timer">
          ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
        </div>

        <button className="submitBtn" onClick={onSubmit}>
          Submit Assessment
        </button>
      </div>
    </div>
  );
}
