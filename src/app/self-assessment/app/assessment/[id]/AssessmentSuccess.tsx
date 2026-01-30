// 'use client';
// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AssessmentSuccess() {
//   const router = useRouter();

//   useEffect(() => {
//     const colors = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#ec4899'];
    
//     // Create confetti burst
//     for (let i = 0; i < 100; i++) {
//       setTimeout(() => {
//         const confetti = document.createElement('div');
//         confetti.className = 'confetti';
//         confetti.style.left = Math.random() * 100 + 'vw';
//         confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
//         confetti.style.width = Math.random() * 8 + 6 + 'px';
//         confetti.style.height = Math.random() * 12 + 8 + 'px';
//         confetti.style.opacity = (Math.random() + 0.5).toString();
        
//         // Randomize shapes (some rounds, some rectangles)
//         if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
        
//         document.body.appendChild(confetti);
        
//         // Cleanup
//         setTimeout(() => confetti.remove(), 4000);
//       }, i * 20); // Staggered entry for a "rain" effect
//     }
//   }, []);

//   return (
//     <div className="success-container">
//       <style>{`
//         .success-container {
//           min-height: 100vh;
//           background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           overflow: hidden;
//           position: relative;
//           font-family: sans-serif;
//         }

//         .confetti {
//           position: fixed;
//           top: -20px;
//           z-index: 999;
//           animation: fall 4s linear forwards;
//         }

//         @keyframes fall {
//           0% { transform: translateY(0) rotate(0deg); }
//           100% { transform: translateY(110vh) rotate(720deg); }
//         }

//         .success-card {
//           background: #fff;
//           padding: 50px;
//           border-radius: 32px;
//           text-align: center;
//           box-shadow: 0 20px 50px rgba(0,0,0,0.2);
//           z-index: 10;
//           max-width: 400px;
//           width: 90%;
//           animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
//         }

//         @keyframes slideUp {
//           from { opacity: 0; transform: translateY(50px); }
//           to { opacity: 1; transform: translateY(0); }
//         }

//         .checkmark-circle {
//           width: 80px;
//           height: 80px;
//           background: #22c55e;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           margin: 0 auto 24px;
//           font-size: 40px;
//           color: white;
//           animation: scaleIn 0.5s 0.2s both;
//         }

//         @keyframes scaleIn {
//           from { transform: scale(0); }
//           to { transform: scale(1); }
//         }

//         .success-card h1 {
//           color: #111827;
//           margin-bottom: 12px;
//           font-size: 28px;
//         }

//         .success-card p {
//           color: #6b7280;
//           font-size: 16px;
//           line-height: 1.5;
//           margin-bottom: 30px;
//         }

//         .home-btn {
//           background: #6366f1;
//           color: white;
//           border: none;
//           padding: 14px 28px;
//           border-radius: 14px;
//           font-weight: 700;
//           cursor: pointer;
//           transition: transform 0.2s;
//         }

//         .home-btn:hover {
//           transform: scale(1.05);
//           background: #4f46e5;
//         }
//       `}</style>

//       <div className="success-card">
//         <div className="checkmark-circle">✓</div>
//         <h1>Great Job!</h1>
//         <p>
//           Your assessment has been submitted successfully. Our team will review your responses shortly.
//         </p>
//         <button className="home-btn" onClick={() => router.replace('/self-assessment/app')}>
//           Return to Dashboard
//         </button>
//       </div>
//     </div>
//   );
// }

'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AssessmentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const score = searchParams.get('score') || '0'; // Get score from URL

  useEffect(() => {
    const colors = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#ec4899'];
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 8 + 6 + 'px';
        confetti.style.height = Math.random() * 12 + 8 + 'px';
        confetti.style.opacity = (Math.random() + 0.5).toString();
        if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
      }, i * 20);
    }
  }, []);

  return (
    <div className="success-container">
      <style>{`
        .success-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: sans-serif;
        }

        .confetti {
          position: fixed;
          top: -20px;
          z-index: 999;
          animation: fall 4s linear forwards;
        }

        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(720deg); }
        }

        .success-card {
          background: #fff;
          padding: 40px;
          border-radius: 32px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          z-index: 10;
          max-width: 450px;
          width: 90%;
          animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .score-circle {
          width: 120px;
          height: 120px;
          border: 8px solid #f0f4ff;
          border-top: 8px solid #22c55e;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          animation: spinIn 1s ease-out forwards;
        }

        .score-value {
          font-size: 32px;
          font-weight: 800;
          color: #16316b;
        }

        .score-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        @keyframes spinIn {
          from { transform: rotate(-180deg); opacity: 0; }
          to { transform: rotate(0deg); opacity: 1; }
        }

        .success-card h1 {
          color: #111827;
          margin-bottom: 8px;
          font-size: 28px;
        }

        .success-card p {
          color: #6b7280;
          font-size: 16px;
          margin-bottom: 30px;
        }

        .home-btn {
          background: #16316b;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .home-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(22, 49, 107, 0.3);
        }
      `}</style>

      <div className="success-card">
        <div className="score-circle">
          <span className="score-value">{score}</span>
          <span className="score-label">Points</span>
        </div>
        
        <h1>Assessment Submitted!</h1>
        <p>
          Congratulations! You scored <strong>{score} points</strong>. 
          Your performance has been recorded.
        </p>

        <button className="home-btn" onClick={() => router.replace('/self-assessment/app')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}