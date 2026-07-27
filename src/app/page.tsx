'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import api from '@/lib/axios';
import CourseGrid from "@/components/CourseGrid";
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import FAQAccordion from '@/components/FAQAccordion';
import Registration from '@/components/Registration'; // ← adjust path if needed
import TestimonialCarousel from '@/components/TestimonialCarousel';
import GalleryTeaser from '@/components/GalleryTeaser';

/* ──────────────────────────────────────────────────────────────────────
 * FAQ list — kept in one place so it can drive BOTH the on-screen
 * accordion (still rendered by <FAQAccordion />, which has its own copy)
 * AND the FAQPage JSON-LD emitted at the bottom of the page for Google
 * rich results. Edit both lists if you change one.
 * ────────────────────────────────────────────────────────────────────── */
const HOME_FAQS = [
  {
    q: 'Who can join Easy Coders programs?',
    a: 'Students, recent graduates, and working professionals who want to build real-world coding skills can all join. Our programs are designed to accommodate all backgrounds and learning paces.',
  },
  {
    q: 'Do I need prior coding experience?',
    a: 'No prior experience is needed. Many of our programs start from the very basics and gradually move to advanced, project-based learning — so you are always building on solid foundations.',
  },
  {
    q: 'Will I work on real projects?',
    a: 'Yes. You will build hands-on projects that mirror real industry work. These projects strengthen your portfolio and give you tangible skills employers actually look for.',
  },
  {
    q: 'What is the placement support like?',
    a: 'We offer dedicated placement assistance including resume review, mock interviews, and direct referrals to our hiring partner network.',
  },
  {
    q: 'Are there flexible batch timings?',
    a: 'Yes. We offer morning, evening, and weekend batches to accommodate students and working professionals. Online modes are also available for all programs.',
  },
];

/* Shape consumed by <CourseGrid />. */
type HomeCourse = {
  id: number | string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
  rating: number;
  views: string;
  image: string;
  desc?: string;
};

/* Loose shape of /api/courses responses — backend has no formal schema yet so
 * we accept any of these fields and gracefully fall back. */
type ApiCourse = {
  id?: number | string;
  title?: string;
  description?: string;
  rating?: number;
  image?: string;
  image_url?: string;
  category?: { name?: string };
};

/* Fallback course tiles. Used only if /api/courses fails or returns empty.
 * Local images keep the page from depending on external CDNs that can break. */
const FALLBACK_COURSES: HomeCourse[] = [
  { id: 'st', level: 'Beginner',     title: 'Summer Training',      rating: 4.8, views: '', image: '/images/coding.jpg' },
  { id: 'in', level: 'Beginner',     title: 'Internship Program',   rating: 4.7, views: '', image: '/images/appdev.jpg' },
  { id: 'jt', level: 'Intermediate', title: 'Job-Oriented Training', rating: 4.9, views: '', image: '/images/clouddev.jpg' },
  { id: 'lt', level: 'Beginner',     title: 'Language Training',    rating: 4.6, views: '', image: '/images/coding.jpg' },
];

export default function HomePage() {
  const [courses, setCourses] = useState<HomeCourse[]>(FALLBACK_COURSES);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  /* Suppress unused-state lint warnings — `setSearchQuery` and `scrolled` are
   * kept on the state shape so existing filter/scroll handlers continue to
   * work if/when a search input or scroll-aware nav is added. */
  void setSearchQuery; void scrolled;

  /* Pull real courses from the API; fall back to FALLBACK_COURSES on error so
   * the page never looks empty. We tag everything as 'Beginner' by default
   * because the backend course shape has no `level` column. */
  useEffect(() => {
    let cancelled = false;
    api.get('/courses')
      .then(res => {
        if (cancelled) return;
        const raw = (res.data?.data ?? res.data ?? []) as ApiCourse[];
        const rawArr = Array.isArray(raw) ? raw : [];
        // The same subject is offered under more than one programme (e.g.
        // "PHP Laravel Development" exists as both an Internship and a Summer
        // Training course), so /courses returns it more than once. On this
        // home-page teaser — which shows only title/level/rating, not the
        // programme or price — that reads as the same course listed twice.
        // Dedupe by title (case-insensitive) so each subject appears once;
        // the full /courses catalogue still lists every programme.
        const seenTitles = new Set<string>();
        const list = rawArr
          .filter((c) => {
            const key = (c.title ?? '').trim().toLowerCase();
            if (!key) return true;
            if (seenTitles.has(key)) return false;
            seenTitles.add(key);
            return true;
          })
          .slice(0, 8);
        if (list.length === 0) return;
        setCourses(list.map((c, idx): HomeCourse => ({
          id:     c.id ?? idx,
          level:  c.category?.name === 'Job Oriented Programs' ? 'Intermediate' : 'Beginner',
          title:  c.title ?? 'Course',
          rating: typeof c.rating === 'number' ? c.rating : 4.7,
          views:  '',
          image:  c.image_url || c.image || FALLBACK_COURSES[idx % FALLBACK_COURSES.length].image,
          desc:   typeof c.description === 'string' && c.description.trim() ? c.description.trim() : undefined,
        })));
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Show popup after 1.5s delay, unless user already dismissed it today
  useEffect(() => {
  const timer = setTimeout(() => {
    setShowRegistration(true);
  }, 500);

  return () => clearTimeout(timer);
}, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesGlobalFilter = filter === 'All' || course.level === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGlobalFilter && matchesSearch;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --navy: #0B1B3A;
          --navy-mid: #152D5A;
          --gold: #E8A020;
          --gold-light: #F5C356;
          --cream: #FAFAF7;
          --slate: #4A5568;
          --light-blue: #EEF4FF;
          /* Section eyebrows now use the brand GOLD (was a generic indigo
             #1A56DB that belonged to no part of the EasyCoders identity).
             --teal is the logo accent, threaded into interactive states. */
          --accent: #E8A020;
          --teal: #1AA5BB;
          --border: #E2E8F0;
          --radius: 12px;
          --radius-lg: 20px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; color: var(--navy); background: #fff; }

        .hero {
          background: var(--navy);
          position: relative;
          overflow: hidden;
          padding: 128px 0 80px;
          min-height: 92vh;
          display: flex;
          align-items: center;
        }
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          /* Lit by the brand's own colours — teal + gold — instead of a stock
             indigo glow, so the navy reads as a brand stage, not a dark block. */
          background:
            radial-gradient(ellipse 700px 500px at 80% 50%, rgba(26,165,187,0.20) 0%, transparent 70%),
            radial-gradient(ellipse 420px 420px at 10% 80%, rgba(232,160,32,0.16) 0%, transparent 60%);
          pointer-events: none;
        }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 48px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(232,160,32,0.15); border: 1px solid rgba(232,160,32,0.4);
          color: var(--gold-light); font-size: 13px; font-weight: 500;
          letter-spacing: 0.06em; padding: 6px 14px; border-radius: 100px;
          margin-bottom: 28px; text-transform: uppercase;
        }
        .hero-badge span { width: 6px; height: 6px; background: var(--gold); border-radius: 50%; }
        .hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(40px, 5vw, 64px); font-weight: 900;
          color: #fff; line-height: 1.1; margin-bottom: 10px;
        }
        .hero-title .highlight { color: var(--gold); font-style: italic; }
        .hero-subtitle {
          font-size: 17px; color: rgba(255,255,255,0.78);
          line-height: 1.75; margin: 22px 0 38px; font-weight: 300; max-width: 460px;
        }
        .hero-subtitle strong { color: rgba(255,255,255,0.9); font-weight: 500; }
        .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        .btn-primary {
          background: var(--gold); color: var(--navy); border: none;
          padding: 15px 32px; border-radius: var(--radius); font-size: 15px;
          font-weight: 600; text-decoration: none; display: inline-flex;
          align-items: center; gap: 8px; transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: var(--gold-light); transform: translateY(-2px); }
        .btn-outline {
          background: transparent; color: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(255,255,255,0.3); padding: 14px 28px;
          border-radius: var(--radius); font-size: 15px; font-weight: 400;
          text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,255,255,0.7); color: #fff; }
        .hero-trust { display: flex; align-items: center; gap: 14px; margin-top: 40px; }
        .trust-avatars { display: flex; }
        .trust-avatars .av {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--navy-mid); border: 2px solid var(--navy);
          margin-left: -10px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: var(--gold-light); overflow: hidden;
        }
        .trust-avatars .av:first-child { margin-left: 0; }
        .trust-text { font-size: 13px; color: rgba(255,255,255,0.72); line-height: 1.5; }
        .trust-text strong { color: rgba(255,255,255,0.85); font-weight: 500; }
        .hero-visual { position: relative; display: flex; justify-content: center; align-items: center; }
        .hero-img-frame {
          width: 100%; max-width: 480px; height: 480px;
          border-radius: var(--radius-lg); overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08); position: relative;
          background: rgba(255,255,255,0.04);
        }
        .hero-img-frame img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
        .hero-card-float {
          position: absolute; background: var(--cream);
          border-radius: var(--radius); padding: 14px 18px;
          box-shadow: 0 20px 44px rgba(11,27,58,0.34); backdrop-filter: blur(8px);
          border: 1px solid rgba(232,160,32,0.18);
        }
        .card-float-left { left: -24px; bottom: 36px; min-width: 150px; }
        .card-float-right { right: -24px; top: 40px; min-width: 140px; }
        .float-label { font-size: 11px; color: var(--slate); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .float-val { font-size: 22px; font-weight: 700; color: var(--navy); }
        .float-sub { font-size: 12px; color: var(--slate); margin-top: 2px; }
        .float-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; display: inline-block; margin-right: 5px; }
        /* Gold seam bridges the navy hero into the cream stats band. */
        .stats-bar { background: var(--cream); border-top: 2px solid var(--gold); border-bottom: 1px solid var(--border); }
        .stats-inner { display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat-item { padding: 34px 24px; text-align: center; border-right: 1px solid var(--border); }
        .stat-item:last-child { border-right: none; }
        .stat-value { font-family: 'Playfair Display', Georgia, serif; font-size: 36px; font-weight: 700; color: var(--navy); line-height: 1; margin-bottom: 6px; }
        /* Small gold keyline makes the four figures read as the brand's signature numbers. */
        .stat-value::after { content: ''; display: block; width: 28px; height: 2px; background: var(--gold); border-radius: 2px; margin: 10px auto 0; opacity: 0.65; }
        .stat-label { font-size: 13px; color: var(--slate); font-weight: 500; letter-spacing: 0.03em; }
        .section { padding: 90px 0; }
        .section-cream { background: var(--cream); }
        .section-white { background: #fff; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
        }
        .section-label::before { content: ''; width: 24px; height: 2px; background: var(--accent); }
        .section-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(28px, 4vw, 42px); font-weight: 700; color: var(--navy); line-height: 1.2; margin-bottom: 14px; }
        .section-sub { font-size: 17px; color: #3C4860; line-height: 1.7; max-width: 520px; font-weight: 400; font-family: 'DM Sans', sans-serif; }
        .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 44px; gap: 24px; }
        .filter-tabs { display: flex; gap: 8px; background: #F1F4F9; padding: 5px; border-radius: 100px; flex-wrap: wrap; }
        .filter-tab { padding: 8px 20px; border-radius: 100px; font-size: 14px; font-weight: 500; color: var(--slate); cursor: pointer; border: none; background: none; transition: all 0.2s; white-space: nowrap; }
        .filter-tab.active { background: var(--navy); color: #fff; }
        .filter-tab:hover:not(.active) { background: #e0e7ef; }
        .testimonials-section { background: var(--navy); padding: 90px 0; }
        .testimonials-section .section-label { color: var(--gold-light); }
        .testimonials-section .section-label::before { background: var(--gold); }
        .testimonials-section .section-title { color: #fff; }
        .testimonials-section .section-sub { color: rgba(255,255,255,0.7); }
        .testimonials-layout { display: grid; grid-template-columns: 1fr 2fr; align-items: center; gap: 80px; }
        .testimonials-cta-btn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 28px;
          background: transparent; border: 1.5px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.75); padding: 12px 24px; border-radius: var(--radius);
          font-size: 14px; font-weight: 500; text-decoration: none; transition: all 0.2s;
        }
        .testimonials-cta-btn:hover { border-color: var(--gold); color: var(--gold-light); }
        .faq-section { background: var(--cream); padding: 90px 0; }
        .faq-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; align-items: start; }
        .cta-section {
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%);
          padding: 100px 0; text-align: center; position: relative; overflow: hidden;
        }
        .cta-section::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; border: 1px solid rgba(232,160,32,0.12); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
        .cta-section::after { content: ''; position: absolute; width: 900px; height: 900px; border-radius: 50%; border: 1px solid rgba(232,160,32,0.07); top: 50%; left: 50%; transform: translate(-50%,-50%); pointer-events: none; }
        .cta-tag { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
        .cta-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(30px, 4vw, 52px); font-weight: 700; color: #fff; margin-bottom: 18px; line-height: 1.15; position: relative; }
        .cta-sub { font-size: 17px; color: rgba(255,255,255,0.72); margin-bottom: 40px; font-weight: 300; }
        .cta-buttons { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; position: relative; }

        /* ── REGISTRATION TRIGGER BUTTON ──
           Brand-aligned: navy → gold pill instead of indigo/purple gradient
           (project design rule: "never use purple gradients as default").
           Easing is a soft fade-up — bounce/elastic easing is also a
           project rule violation. */
        .reg-trigger {
          position: fixed;
          /* Sits above the SelfAssessmentBubble (52px tall at bottom: 20px)
             so both are visible on the home page instead of the bubble
             covering this button. */
          bottom: 88px;
          right: 20px;
          z-index: 888;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--gold);
          color: var(--navy);
          border: none;
          border-radius: 50px;
          padding: 13px 22px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(11, 27, 58, 0.28);
          transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
          animation: regFadeIn 0.45s ease 1.5s both;
        }
        .reg-trigger:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(11, 27, 58, 0.32); }
        .reg-trigger-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--navy);
          animation: regDot 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes regDot {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
        @keyframes regFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-visual { display: none; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item { border-bottom: 1px solid var(--border); }
          .testimonials-layout { grid-template-columns: 1fr; gap: 40px; }
          .faq-layout { grid-template-columns: 1fr; gap: 40px; }
          .section-header { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 560px) {
          .stats-inner { grid-template-columns: 1fr 1fr; }
          .hero { padding: 80px 0 60px; }
          /* Mobile: bubble is 48px tall, so stack at bottom: 80px (16 + 48 + 16 gap). */
          .reg-trigger { bottom: 80px; right: 16px; padding: 11px 18px; font-size: 13px; }
        }
      `}</style>

      {/* ── REGISTRATION POPUP ── renders only when showRegistration is true */}
      {showRegistration && (
  <Registration onClose={() => setShowRegistration(false)} />
)}

      {/* ── FLOATING TRIGGER BUTTON (always visible so user can reopen) ── */}
      <button
        className="reg-trigger"
        onClick={() => {
          // Clear dismissal so popup reopens
          localStorage.removeItem('reg_popup_dismissed');
          setShowRegistration(true);
        }}
        aria-label="Open registration"
      >
        <span className="reg-trigger-dot" />
        Register Now
      </button>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-badge">
                <span></span>
                Industry-Aligned Coding Programs
              </div>
              <h1 className="hero-title">
                Launch Your<br />
                <span className="highlight">Coding Career</span><br />
                with Confidence
              </h1>
              <p className="hero-subtitle">
                From absolute beginner to job-ready professional.
                <br /><strong>No prior coding knowledge required.</strong> Just your ambition.
              </p>
              <div className="hero-cta">
                <Link href="/courses" className="btn-primary">Explore Courses →</Link>
                <Link href="/about" className="btn-outline">Learn About Us</Link>
              </div>
              <div className="hero-trust">
                <div className="trust-avatars" aria-hidden="true">
                  {['A', 'R', 'S', 'P'].map((letter, i) => (
                    <div key={i} className="av">{letter}</div>
                  ))}
                </div>
                <div className="trust-text">
                  <strong>Trusted by students</strong> across India<br />
                  Mentor-led · project-based · placement-focused
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-img-frame">
                <Image
                  src="/images/easycoder-hero.png"
                  alt="Students learning to code at Easy Coders"
                  width={480}
                  height={480}
                  priority
                  sizes="(max-width: 900px) 100vw, 480px"
                  className="hero-img"
                />
              </div>
              <div className="hero-card-float card-float-left">
                <div className="float-label">Learning Style</div>
                <div className="float-val">Hands-on</div>
                <div className="float-sub"><span className="float-dot"></span>100% project-based</div>
              </div>
              <div className="hero-card-float card-float-right">
                <div className="float-label">Mentor Support</div>
                <div className="float-val">1 : 1</div>
                <div className="float-sub">Live guidance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR — defensible, non-numerical claims ── */}
      <section className="stats-bar" aria-label="Why students choose Easy Coders">
        <div className="container">
          <div className="stats-inner">
            <Reveal className="stat-item" delay={0} y={14}>
              <div className="stat-value"><CountUp end={4} /></div>
              <div className="stat-label">Core programs</div>
            </Reveal>
            <Reveal className="stat-item" delay={90} y={14}>
              <div className="stat-value"><CountUp end={100} suffix="%" /></div>
              <div className="stat-label">Project-based learning</div>
            </Reveal>
            <Reveal className="stat-item" delay={180} y={14}>
              <div className="stat-value">1 : 1</div>
              <div className="stat-label">Mentor support</div>
            </Reveal>
            <Reveal className="stat-item" delay={270} y={14}>
              <div className="stat-value"><CountUp end={3} /></div>
              <div className="stat-label">Flexible batch timings</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── COURSES ── */}
      <section className="section section-white">
        <div className="container">
          <div className="section-header">
            <Reveal>
              <div className="section-label">Our Programs</div>
              <h2 className="section-title">Explore Top Courses</h2>
              <p className="section-sub">Industry-aligned training programs designed to make you job-ready from day one.</p>
            </Reveal>
            <Reveal className="filter-tabs" delay={120} y={10}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  className={`filter-tab ${filter === lvl ? 'active' : ''}`}
                  onClick={() => setFilter(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </Reveal>
          </div>
          <CourseGrid filteredCourses={filteredCourses} loading={loading} />
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonials-layout">
            <div>
              <div className="section-label">Student Stories</div>
              <h2 className="section-title">Success That Speaks For Itself</h2>
              <p className="section-sub">Join the 2M+ learners who have skilled up, stood out, and landed their dream roles.</p>
              <Link href="/about" className="testimonials-cta-btn">Read More About Us →</Link>
            </div>
            <div><TestimonialCarousel /></div>
          </div>
        </div>
      </section>

      {/* ── Gallery teaser (renders only when photos are published) ── */}
      {/* <GalleryTeaser /> */}

      {/* ── FAQ ── */}
      <section className="faq-section">
        <div className="container">
          <div className="faq-layout">
            <div>
              <div className="section-label">FAQ</div>
              <h2 className="section-title">Questions? We Have Answers.</h2>
              <p className="section-sub">Everything you need to know before you begin your learning journey.</p>
            </div>
            <div><FAQAccordion /></div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta-section">
        <div className="container">
          <p className="cta-tag">Ready to begin?</p>
          <h2 className="cta-title">Your Coding Career<br />Starts Today</h2>
          <p className="cta-sub">No experience needed. Just sign up and we&apos;ll handle the rest.</p>
          <div className="cta-buttons">
            <Link href="/courses" className="btn-primary">Browse All Courses →</Link>
            <Link href="/contactus" className="btn-outline">Talk to a Counsellor</Link>
          </div>
        </div>
      </section>

      {/* ── FAQ structured data — surfaces the FAQ as a rich snippet in Google ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: HOME_FAQS.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />

      {/* ── WebSite JSON-LD — enables a sitelinks searchbox on Google ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            url: 'https://easycoders.in',
            name: 'Easy Coders',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://easycoders.in/courses?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </>
  );
}