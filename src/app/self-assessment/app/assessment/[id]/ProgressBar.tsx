// // export default function ProgressBar({ current, total }: any) {
// //   const percent = Math.round((current / total) * 100);

// //   return (
// //     <div className="progressWrapper">
// //       <div className="progressText">
// //         Progress: {current}/{total}
// //       </div>
// //       <div className="progressBar">
// //         <div style={{ width: `${percent}%` }} />
// //       </div>
// //     </div>
// //   );
// // }
// type Props = {
//   current: number;
//   total: number;
// };

// export default function ProgressBar({ current, total }: Props) {
//   const percent = Math.round((current / total) * 100);

//   return (
//     <div className="progressWrap">
//       <div className="progressText">
//         {current} / {total} answered
//       </div>
//       <div className="progressBar">
//         <div className="progressFill" style={{ width: `${percent}%` }} />
//       </div>
//     </div>
//   );
// }
export default function ProgressBar({ current, total }: any) {
  const percent = Math.round((current / total) * 100);

  return (
    <div style={{ padding: '0 16px' , marginTop:'5px'}}>
      <div
        style={{
          height: 10,
          background: '#e5e7eb',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div style={{
            height: '100%',
            width: `${percent}%`,
            background: '#16316b',
            transition: 'width 0.3s',
          }}
        />
      </div>
      <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
        {current} / {total} answered
      </p>
    </div>
  );
}
