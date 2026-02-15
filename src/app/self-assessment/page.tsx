'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SelfAssessmentLanding() {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const [text, setText] = useState('');
  const fullText = 'Discover Your True Coding Level';

  useEffect(() => {
    let i = 0;
    const typing = setInterval(() => {
      if (i < fullText.length) {
        setText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typing);
      }
    }, 40);
    return () => clearInterval(typing);
  }, []);

  return (
    <section
      style={{
        height: '100vh',
        background:
          'radial-gradient(circle at 20% 20%, #312e81, #020617)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          width: '100%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          borderRadius: 24,
          padding: '40px 30px',
          boxShadow:
            '0 25px 80px rgba(0,0,0,0.5)',
          textAlign: 'center',
          backdropFilter: 'blur(20px)',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 900,
            marginBottom: 16,
            background:
              'linear-gradient(90deg, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            minHeight: 55,
          }}
        >
          {text}
        </h1>

        <p
          style={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            maxWidth: 680,
            margin: '0 auto',
            lineHeight: 1.6,
            color: '#e5e7eb',
          }}
        >
          Stop guessing your level. Take a 5-minute smart
          self-assessment and get instant clarity on what to
          learn next.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
            marginTop: 40,
          }}
        >
          {[
            {
              icon: '🧠',
              title: 'Concept Clarity',
              desc: 'Test real understanding',
            },
            {
              icon: '⚡',
              title: 'Instant Results',
              desc: 'Know strengths immediately',
            },
            {
              icon: '🎯',
              title: 'Clear Roadmap',
              desc: 'See what to learn next',
            },
          ].map((item, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: 22,
                borderRadius: 18,
                background:
                  hovered === i
                    ? 'linear-gradient(180deg, rgba(167,139,250,0.2), rgba(244,114,182,0.15))'
                    : 'rgba(255,255,255,0.05)',
                transform:
                  hovered === i
                    ? 'translateY(-6px)'
                    : 'translateY(0)',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: 36 }}>
                {item.icon}
              </div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 8,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: '#d1d5db',
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 50 }}>
          <button
            onClick={() =>
              router.push('/self-assessment/signup')
            }
            style={{
              padding: '16px 40px',
              fontSize: 18,
              fontWeight: 800,
              borderRadius: 999,
              border: 'none',
              color: '#020617',
              background:
                'linear-gradient(90deg, #a78bfa, #f472b6)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform =
                'scale(1.05)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                'scale(1)')
            }
          >
            Sign Up -&gt;
          </button>

          <p
            style={{
              marginTop: 10,
              fontSize: 13,
              color: '#c7d2fe',
            }}
          >
            Takes only 5 minutes • 100% Free
          </p>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 14,
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
