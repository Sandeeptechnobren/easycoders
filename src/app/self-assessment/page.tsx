'use client';

import { useRouter } from 'next/navigation';

export default function SelfAssessmentLanding() {
  const router = useRouter();

  return (
    <section
      className="introSection"
      style={{ minHeight: '100vh' }}
    >
      <div className="transparentDiv">
        <div
          className="internalIntro"
          style={{
            maxWidth: 900,
            padding: '0 20px',
          }}
        >
          <h1 style={{ fontSize: 44, fontWeight: 900 }}>
            Self Assessment
          </h1>

          <p
            style={{
              marginTop: 16,
              fontSize: 18,
              maxWidth: 700,
              lineHeight: 1.6,
              opacity: 0.95,
            }}
          >
            Not sure where you stand in your coding journey?
            Take our structured self-assessment to evaluate your
            understanding, identify gaps, and get a clear roadmap
            for improvement.
          </p>

          {/* HIGHLIGHTS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
              marginTop: 40,
              width: '100%',
            }}
          >
            {[
              {
                title: 'Skill Check',
                desc: 'Test your fundamentals with smart questions',
              },
              {
                title: 'Instant Feedback',
                desc: 'Know your strengths & weak areas immediately',
              },
              {
                title: 'Personal Guidance',
                desc: 'Get recommendations on what to learn next',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="courseCard"
                style={{ textAlign: 'left' }}
              >
                <h3 className="cardTitle">{item.title}</h3>
                <p style={{ color: '#555', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 50 }}>
            <button
              className="enrollBtn"
              style={{
                padding: '14px 28px',
                fontSize: 16,
                borderRadius: 14,
              }}
              onClick={() => router.push('/self-assessment/signup')}
            >
              Register for Assessment →
            </button>
          </div>
          <p style={{ marginTop: 20, color: '#ddd' }}>
            Already registered?{' '}
            <span
                style={{ color: '#8B5CF6', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => router.push('/self-assessment/login')}
            >
                Login here
            </span>
            </p>

        </div>
      </div>
    </section>
  );
}
