'use client';

import { useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';

type CounterItem = {
  value: number;
  label: string;
  suffix?: string;
};

const data: CounterItem[] = [
  { value: 120, label: 'Live Projects', suffix: '+' },
  { value: 15, label: 'Expert Trainers', suffix: '+' },
  { value: 100, label: 'Hiring Companies', suffix: '+' },
];

export default function AboutPage() {
  const [counts, setCounts] = useState(data.map(() => 0));
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          data.forEach((item, index) => {
            let start = 0;
            const end = item.value;
            const duration = 1400;
            const stepTime = Math.max(Math.floor(duration / end), 16);
            const counter = setInterval(() => {
              start += 1;
              setCounts(prev => {
                const next = [...prev];
                next[index] = start;
                return next;
              });
              if (start >= end) clearInterval(counter);
            }, stepTime);
          });
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --primary: #0f172a;
          --accent: #f97316;
          --accent-light: #fff7ed;
          --muted: #64748b;
          --border: #e2e8f0;
          --surface: #f8fafc;
          --white: #ffffff;
          --radius: 16px;
          --success: #16a34a;
        }

        .ab-page {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
        }

        /* ── STATS BAND ── */
        .stats-band {
          background: var(--primary);
          padding: 56px 24px;
        }

        .stats-inner {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }

        .stat-item {
          text-align: center;
          padding: 0 32px;
          position: relative;
        }

        .stat-item:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0; top: 20%;
          height: 60%;
          width: 1px;
          background: rgba(255,255,255,.15);
        }

        .stat-number {
          font-family: 'Playfair Display', serif;
          font-size: clamp(40px, 5vw, 60px);
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          display: block;
          letter-spacing: -.03em;
        }

        .stat-number span {
          color: var(--accent);
        }

        .stat-label {
          font-size: 13px;
          color: rgba(255,255,255,.55);
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-top: 10px;
          display: block;
        }

        /* ── SHARED LAYOUT ── */
        .ab-section {
          padding: 80px 24px;
        }

        .ab-section.alt {
          background: var(--white);
        }

        .ab-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        /* ── STORY SECTION ── */
        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: center;
        }

        @media (max-width: 860px) {
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .stats-inner { grid-template-columns: 1fr; gap: 40px; }
          .stat-item::after { display: none; }
          .mv-grid { grid-template-columns: 1fr !important; }
        }

        .story-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
          margin-bottom: 18px;
        }

        .story-eyebrow::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .story-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 700;
          color: var(--primary);
          line-height: 1.2;
          margin: 0 0 20px;
          letter-spacing: -.02em;
        }

        .story-title em {
          font-style: italic;
          color: var(--accent);
        }

        .story-body p {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.8;
          margin-bottom: 14px;
        }

        .story-divider {
          width: 48px;
          height: 3px;
          background: var(--accent);
          border-radius: 2px;
          margin: 24px 0;
          border: none;
        }

        .story-tagline {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
          line-height: 1.4;
          margin: 0;
        }

        /* Story image */
        .story-img-wrap {
          position: relative;
        }

        .story-img-wrap img {
          width: 100%;
          border-radius: 20px;
          display: block;
          object-fit: cover;
          aspect-ratio: 4/3;
        }

        .story-img-badge {
          position: absolute;
          bottom: -18px;
          left: -18px;
          background: var(--primary);
          color: var(--white);
          padding: 16px 22px;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(15,23,42,.2);
        }

        .badge-num {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          display: block;
          line-height: 1;
          color: var(--accent);
        }

        .badge-txt {
          font-size: 12px;
          color: rgba(255,255,255,.65);
          margin-top: 4px;
          display: block;
        }

        /* ── MISSION / VISION ── */
        .mv-header {
          text-align: center;
          margin-bottom: 52px;
        }

        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
          margin-bottom: 14px;
        }

        .section-eyebrow::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 700;
          color: var(--primary);
          margin: 0;
          letter-spacing: -.02em;
          line-height: 1.2;
        }

        .mv-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .mv-card {
          background: var(--surface);
          border: .5px solid var(--border);
          border-radius: 20px;
          padding: 36px;
          position: relative;
          overflow: hidden;
          transition: transform .25s, box-shadow .25s;
        }

        .mv-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(15,23,42,.08);
        }

        .mv-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--accent);
          border-radius: 20px 20px 0 0;
        }

        .mv-icon-wrap {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .mv-icon-wrap img {
          width: 28px; height: 28px;
          object-fit: contain;
        }

        .mv-icon-svg {
          color: var(--accent);
        }

        .mv-card-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 12px;
        }

        .mv-card-text {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.75;
          margin: 0;
        }

        /* ── VALUES STRIP ── */
        .values-strip {
          background: var(--primary);
          padding: 56px 24px;
        }

        .values-inner {
          max-width: 1120px;
          margin: 0 auto;
        }

        .values-heading {
          font-family: 'Playfair Display', serif;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,.4);
          letter-spacing: .1em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .values-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .value-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,.07);
          border: .5px solid rgba(255,255,255,.12);
          color: rgba(255,255,255,.85);
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 500;
          transition: background .2s;
        }

        .value-pill:hover {
          background: rgba(249,115,22,.15);
          border-color: rgba(249,115,22,.3);
          color: #fff;
        }

        .value-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
      `}</style>

      <section className="ab-page inner-block">
        <PageHeader
          title="We Build Developers"
          description="Tech learning platform focused on real-world development skills and career growth."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'About Us' },
          ]}
        />

        {/* ── STATS BAND ── */}
        <div className="stats-band" ref={ref}>
          <div className="stats-inner">
            {data.map((item, i) => (
              <div className="stat-item" key={i}>
                <span className="stat-number">
                  {counts[i]}<span>{item.suffix}</span>
                </span>
                <span className="stat-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STORY ── */}
        <section className="ab-section alt">
          <div className="ab-container">
            <div className="story-grid">

              <div className="story-body">
                <div className="story-eyebrow">Our Story</div>
                <h2 className="story-title">
                  Born from a <em>real problem</em>, built for real careers
                </h2>
                <p>EasyCoders was born from a simple problem: students learn syntax, but struggle to build real applications. We decided to flip the learning model — focusing on projects, workflows, and problem-solving.</p>
                <p>Today, we help learners go from zero to job-ready through structured learning paths, mentorship, and industry-style training.</p>
                <hr className="story-divider" />
                <p className="story-tagline">Modern Technology.<br />Develop with Us.</p>
              </div>

              <div className="story-img-wrap">
                <img src="/images/profile-img.jpg" alt="About EasyCoders" />
                <div className="story-img-badge">
                  <span className="badge-num">5+</span>
                  <span className="badge-txt">Years of Excellence</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section className="ab-section">
          <div className="ab-container">
            <div className="mv-header">
              <div className="section-eyebrow">Our Purpose</div>
              <h2 className="section-title">What drives everything we do</h2>
            </div>

            <div className="mv-grid">
              <div className="mv-card">
                <div className="mv-icon-wrap">
                  <svg className="mv-icon-svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 className="mv-card-title">Our Mission</h3>
                <p className="mv-card-text">To create confident developers by providing practical, project-driven and career-focused technical education that bridges the gap between learning and doing.</p>
              </div>

              <div className="mv-card">
                <div className="mv-icon-wrap">
                  <svg className="mv-icon-svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="4"/>
                    <line x1="12" y1="2" x2="12" y2="4"/>
                    <line x1="12" y1="20" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="4" y2="12"/>
                    <line x1="20" y1="12" x2="22" y2="12"/>
                  </svg>
                </div>
                <h3 className="mv-card-title">Our Vision</h3>
                <p className="mv-card-text">To become the most trusted platform for learning real-world software development skills globally — empowering every learner to build, ship, and grow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── VALUES STRIP ── */}
        <div className="values-strip">
          <div className="values-inner">
            <p className="values-heading">What we stand for</p>
            <div className="values-list">
              {['Project-First Learning', 'Industry Mentors', 'Career Support', 'Hands-On Training', 'Real Codebase Experience', 'Community Growth', 'Placement Ready', 'Continuous Learning'].map(v => (
                <span className="value-pill" key={v}>
                  <span className="value-dot" />
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

      </section>
    </>
  );
}