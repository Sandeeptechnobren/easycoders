'use client';
import { useState, useEffect, useRef } from 'react';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  accent: string;
};

const testimonials: Testimonial[] = [
  {
    quote: 'Easy Coders helped me move from basics to building real-world projects confidently. Within 3 months I had my first job offer.',
    name: 'Aarav Sharma',
    role: 'Frontend Developer',
    initials: 'AS',
    accent: '#E8A020',
  },
  {
    quote: 'The learning approach is practical and industry-focused. They don\'t just teach syntax — they teach you how to think like a developer.',
    name: 'Priya Verma',
    role: 'Computer Science Student',
    initials: 'PV',
    accent: '#1AA5BB',
  },
  {
    quote: 'Clear explanations, hands-on coding, and great mentorship. I went from zero to building full-stack apps in under 6 months.',
    name: 'Rahul Singh',
    role: 'Backend Developer',
    initials: 'RS',
    accent: '#22c55e',
  },
];

export default function TestimonialCarousel() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    if (animating || index === active) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(index);
      setAnimating(false);
    }, 300);
  };

  const next = () => goTo((active + 1) % testimonials.length);
  const prev = () => goTo((active - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [active]);

  const t = testimonials[active];

  return (
    <>
      <style>{`
        .tc-wrap {
          position: relative;
          user-select: none;
        }

        .tc-quote-icon {
          font-family: Georgia, serif;
          font-size: 80px;
          line-height: 1;
          color: rgba(232,160,32,0.25);
          margin-bottom: -20px;
          display: block;
        }

        .tc-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 40px 44px;
          transition: opacity 0.3s ease, transform 0.3s ease;
          min-height: 220px;
        }

        .tc-card.fade-out {
          opacity: 0;
          transform: translateY(8px);
        }

        .tc-text {
          font-size: 18px;
          line-height: 1.75;
          color: rgba(255,255,255,0.85);
          font-weight: 300;
          font-style: italic;
          margin: 0 0 32px;
          font-family: 'Playfair Display', Georgia, serif;
        }

        .tc-author {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .tc-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.05em;
          font-family: 'DM Sans', sans-serif;
        }

        .tc-name {
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 3px;
          font-family: 'DM Sans', sans-serif;
        }

        .tc-role {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif;
        }

        .tc-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 28px;
        }

        .tc-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .tc-dot {
          width: 6px;
          height: 6px;
          border-radius: 100px;
          background: rgba(255,255,255,0.2);
          cursor: pointer;
          transition: all 0.3s;
          border: none;
          padding: 0;
        }

        .tc-dot.active {
          width: 24px;
          background: #E8A020;
        }

        .tc-arrows {
          display: flex;
          gap: 10px;
        }

        .tc-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .tc-arrow:hover {
          border-color: #E8A020;
          color: #E8A020;
        }

        .tc-star {
          color: #E8A020;
          font-size: 13px;
          letter-spacing: 2px;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="tc-wrap">
        <div className={`tc-card ${animating ? 'fade-out' : ''}`}>
          <div className="tc-star">★★★★★</div>
          <p className="tc-text">{t.quote}</p>
          <div className="tc-author">
            <div className="tc-avatar" style={{ background: t.accent }}>
              {t.initials}
            </div>
            <div>
              <div className="tc-name">{t.name}</div>
              <div className="tc-role">{t.role}</div>
            </div>
          </div>
        </div>

        <div className="tc-controls">
          <div className="tc-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`tc-dot ${i === active ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <div className="tc-arrows">
            <button className="tc-arrow" onClick={prev} aria-label="Previous">&#8592;</button>
            <button className="tc-arrow" onClick={next} aria-label="Next">&#8594;</button>
          </div>
        </div>
      </div>
    </>
  );
}