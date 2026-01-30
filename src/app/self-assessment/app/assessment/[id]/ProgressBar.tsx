// export default function ProgressBar({ current, total }: any) {
//   const percent = Math.round((current / total) * 100);

//   return (
//     <div className="progressWrapper">
//       <div className="progressText">
//         Progress: {current}/{total}
//       </div>
//       <div className="progressBar">
//         <div style={{ width: `${percent}%` }} />
//       </div>
//     </div>
//   );
// }
type Props = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: Props) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="progressWrap">
      <div className="progressText">
        {current} / {total} answered
      </div>
      <div className="progressBar">
        <div className="progressFill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
