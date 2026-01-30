// 'use client';

// import { useRouter } from 'next/navigation';

// export default function SelfAssessmentLanding() {
//   const router = useRouter();

//   return (
//     <section
//       className="introSection"
//       style={{ minHeight: '100vh' }}
//     >
//       <div className="transparentDiv">
//         <div
//           className="internalIntro"
//           style={{
//             maxWidth: 900,
//             padding: '0 20px',
//           }}
//         >
//           <h1 style={{ fontSize: 44, fontWeight: 900 }}>
//             Self Assessment
//           </h1>

//           <p
//             style={{
//               marginTop: 16,
//               fontSize: 18,
//               maxWidth: 700,
//               lineHeight: 1.6,
//               opacity: 0.95,
//             }}
//           >
//             Not sure where you stand in your coding journey?
//             Take our structured self-assessment to evaluate your
//             understanding, identify gaps, and get a clear roadmap
//             for improvement.
//           </p>

//           {/* HIGHLIGHTS */}
//           <div
//             style={{
//               display: 'grid',
//               gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
//               gap: 20,
//               marginTop: 40,
//               width: '100%',
//             }}
//           >
//             {[
//               {
//                 title: 'Skill Check',
//                 desc: 'Test your fundamentals with smart questions',
//               },
//               {
//                 title: 'Instant Feedback',
//                 desc: 'Know your strengths & weak areas immediately',
//               },
//               {
//                 title: 'Personal Guidance',
//                 desc: 'Get recommendations on what to learn next',
//               },
//             ].map((item, i) => (
//               <div
//                 key={i}
//                 className="courseCard"
//                 style={{ textAlign: 'left' }}
//               >
//                 <h3 className="cardTitle">{item.title}</h3>
//                 <p style={{ color: '#555', lineHeight: 1.6 }}>
//                   {item.desc}
//                 </p>
//               </div>
//             ))}
//           </div>

//           {/* CTA */}
//           <div style={{ marginTop: 50 }}>
//             <button
//               className="enrollBtn"
//               style={{
//                 padding: '14px 28px',
//                 fontSize: 16,
//                 borderRadius: 14,
//               }}
//               onClick={() => router.push('/self-assessment/signup')}
//             >
//               Register for Assessment →
//             </button>
//           </div>
//           <p style={{ marginTop: 20, color: '#ddd' }}>
//             Already registered?{' '}
//             <span
//                 style={{ color: '#8B5CF6', cursor: 'pointer', fontWeight: 600 }}
//                 onClick={() => router.push('/self-assessment/login')}
//             >
//                 Login here
//             </span>
//             </p>

//         </div>
//       </div>
//     </section>
//   );
// }
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SelfAssessmentLanding() {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, #1e1b4b, #020617)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          width: '100%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          borderRadius: 28,
          padding: '70px 30px',
          boxShadow:
            '0 40px 120px rgba(0,0,0,0.6)',
          textAlign: 'center',
        }}
      >
        {/* TITLE */}
        <h1
          style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: '-1px',
            marginBottom: 20,
            background:
              'linear-gradient(90deg, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Self Assessment
        </h1>

        {/* DESCRIPTION */}
        <p
          style={{
            maxWidth: 760,
            margin: '0 auto',
            fontSize: 18,
            lineHeight: 1.8,
            color: '#e5e7eb',
          }}
        >
          Confused about your real coding level?  
          Take our smart self-assessment to measure your skills,
          discover weak areas, and get a clear learning direction —
          without guesswork.
        </p>

        {/* FEATURE CARDS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 30,
            marginTop: 70,
          }}
        >
          {[
            {
              icon: '🧠',
              title: 'Concept Clarity',
              desc: 'Questions designed to test real understanding',
            },
            {
              icon: '⚡',
              title: 'Instant Insights',
              desc: 'Know your strengths and gaps immediately',
            },
            {
              icon: '🧭',
              title: 'Clear Roadmap',
              desc: 'Personalized guidance on what to learn next',
            },
          ].map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: 32,
                borderRadius: 22,
                background:
                  hovered === i
                    ? 'linear-gradient(180deg, rgba(167,139,250,0.18), rgba(244,114,182,0.12))'
                    : 'rgba(255,255,255,0.06)',
                transform:
                  hovered === i
                    ? 'translateY(-10px) scale(1.03)'
                    : 'translateY(0) scale(1)',
                boxShadow:
                  hovered === i
                    ? '0 30px 60px rgba(0,0,0,0.5)'
                    : '0 15px 30px rgba(0,0,0,0.35)',
                transition:
                  'all 0.35s ease',
                cursor: 'default',
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 14,
                }}
              >
                {item.icon}
              </div>

              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: '#d1d5db',
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 80 }}>
          <button
            onClick={() =>
              router.push('/self-assessment/signup')
            }
            style={{
              padding: '18px 44px',
              fontSize: 18,
              fontWeight: 800,
              borderRadius: 999,
              border: 'none',
              color: '#020617',
              background:
                'linear-gradient(90deg, #a78bfa, #f472b6)',
              cursor: 'pointer',
              boxShadow:
                '0 20px 40px rgba(167,139,250,0.45)',
              transition:
                'all 0.3s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform =
                'translateY(-4px)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                'translateY(0)')
            }
          >
            Start Free Assessment →
          </button>

          <p
            style={{
              marginTop: 18,
              fontSize: 14,
              color: '#c7d2fe',
            }}
          >
            ⏱ Takes 10–15 minutes · No payment required
          </p>
        </div>

        {/* LOGIN */}
        <p
          style={{
            marginTop: 30,
            fontSize: 15,
            color: '#e5e7eb',
          }}
        >
          Already registered?{' '}
          <span
            style={{
              color: '#a78bfa',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
            onClick={() =>
              router.push('/self-assessment/login')
            }
          >
            Login here
          </span>
        </p>
      </div>
    </section>
  );
}
