'use client';

import { Suspense, useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useSearchParams } from 'next/navigation';
import Loader from '../loader/page';

const COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c'
];

function CoursesList() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');

  const allowedCategories = ['Internship', 'Job Oriented Programs', 'Summer Training'];

  useEffect(() => {
    setLoading(true);
    const endpoint = categoryId ? `/courses?category_id=${categoryId}` : '/courses';

    api.get(endpoint)
      .then(res => {
        const data = res.data?.data ?? res.data;
        setCourses(data);
        const firstAvailable = data.find((course: any) =>
          allowedCategories.includes(course.category?.name)
        );
        if (firstAvailable) setActiveTab(firstAvailable.category?.name);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) return <Loader />;

  const categories = allowedCategories.filter(cat =>
    courses.some(course => course.category?.name === cat)
  );

  const filteredCourses = courses.filter(course => course.category?.name === activeTab);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --primary: #0f172a;
          --accent: #f97316;
          --accent-light: #fff7ed;
          --muted: #64748b;
          --border: #e2e8f0;
          --surface: #f8fafc;
          --white: #ffffff;
          --radius: 16px;
          --shadow: 0 4px 24px rgba(15,23,42,0.08);
          --shadow-hover: 0 12px 40px rgba(15,23,42,0.14);
        }

        .courses-wrapper {
          font-family: 'DM Sans', sans-serif;
          background: #f8fafc;
          min-height: 60vh;
          padding: 72px 0 96px;
        }

        .courses-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Section Header */
        .section-header {
          text-align: center;
          margin-bottom: 56px;
        }

        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 16px;
        }

        .section-eyebrow::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
        }

        .section-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 700;
          color: var(--primary);
          line-height: 1.18;
          margin: 0 0 14px;
          letter-spacing: -0.02em;
        }

        .section-title span {
          color: var(--accent);
        }

        .section-subtitle {
          font-size: 16px;
          color: var(--muted);
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.65;
          font-weight: 400;
        }

        /* Tab Navigation */
        .tab-nav-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 48px;
        }

        .tab-nav {
          display: inline-flex;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 5px;
          gap: 4px;
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          flex-wrap: wrap;
          justify-content: center;
        }

        .tab-btn {
          background: transparent;
          border: none;
          padding: 10px 22px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-btn:hover {
          color: var(--primary);
          background: var(--surface);
        }

        .tab-btn.active {
          background: var(--primary);
          color: var(--white);
          box-shadow: 0 2px 8px rgba(15,23,42,0.2);
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          background: rgba(255,255,255,0.2);
          color: inherit;
          transition: background 0.25s;
        }

        .tab-btn:not(.active) .tab-count {
          background: var(--border);
          color: var(--muted);
        }

        /* Results count */
        .results-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .results-count {
          font-size: 14px;
          color: var(--muted);
          font-weight: 400;
        }

        .results-count strong {
          color: var(--primary);
          font-weight: 600;
        }

        /* Course Grid */
        .course-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 28px;
        }

        /* Course Card */
        .course-card {
          background: var(--white);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
          animation: fadeUp 0.5s ease forwards;
          opacity: 0;
        }

        .course-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-hover);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .course-card:nth-child(1) { animation-delay: 0.05s; }
        .course-card:nth-child(2) { animation-delay: 0.1s; }
        .course-card:nth-child(3) { animation-delay: 0.15s; }
        .course-card:nth-child(4) { animation-delay: 0.2s; }
        .course-card:nth-child(5) { animation-delay: 0.25s; }
        .course-card:nth-child(6) { animation-delay: 0.3s; }

        /* Card Image */
        .card-image-wrap {
          position: relative;
          overflow: hidden;
          height: 200px;
        }

        .card-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .course-card:hover .card-image-wrap img {
          transform: scale(1.05);
        }

        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,0.35) 0%, transparent 60%);
        }

        /* Offer Badge */
        .offer-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: var(--accent);
          color: white;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 6px;
          z-index: 2;
        }

        /* Category chip on image */
        .card-cat-chip {
          position: absolute;
          bottom: 12px;
          left: 14px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          color: var(--primary);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          z-index: 2;
        }

        /* Card Body */
        .card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 12px;
        }

        .card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
          line-height: 1.3;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .card-desc {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.6;
          margin: 0;
          flex: 1;
        }

        /* Card Meta */
        .card-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-top: 4px;
          border-top: 1px solid var(--border);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
        }

        .meta-icon {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }

        /* CTA Button */
        .view-btn {
          display: block;
          width: 100%;
          padding: 12px 20px;
          background: var(--primary);
          color: var(--white);
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: background 0.2s ease, transform 0.2s ease;
          text-decoration: none;
          margin-top: auto;
          letter-spacing: 0.01em;
        }

        .view-btn:hover {
          background: var(--accent);
          transform: translateY(-1px);
          color: white;
          text-decoration: none;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 72px 24px;
          grid-column: 1 / -1;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--muted);
          font-size: 15px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .courses-wrapper { padding: 48px 0 72px; }
          .course-grid { grid-template-columns: 1fr; }
          .tab-nav { width: 100%; border-radius: 12px; }
          .tab-btn { flex: 1; justify-content: center; font-size: 13px; padding: 9px 14px; }
        }
      `}</style>

      <div className="courses-wrapper">
        <div className="courses-container">

          {/* Section Header */}
          <div className="section-header">
            <div className="section-eyebrow">Our Programs</div>
            <h2 className="section-title">
              Learn Skills That <span>Get You Hired</span>
            </h2>
            <p className="section-subtitle">
              Industry-aligned programs designed with top companies to fast-track your career.
            </p>
          </div>

          {/* Tab Navigation */}
          {categories.length > 0 && (
            <div className="tab-nav-wrapper">
              <nav className="tab-nav" role="tablist">
                {categories.map(cat => {
                  const count = courses.filter(c => c.category?.name === cat).length;
                  return (
                    <button
                      key={cat}
                      role="tab"
                      aria-selected={activeTab === cat}
                      className={`tab-btn ${activeTab === cat ? 'active' : ''}`}
                      onClick={() => setActiveTab(cat)}
                    >
                      {cat}
                      <span className="tab-count">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Results meta */}
          {filteredCourses.length > 0 && (
            <div className="results-meta">
              <p className="results-count">
                Showing <strong>{filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</strong> in <strong>{activeTab}</strong>
              </p>
            </div>
          )}

          {/* Course Grid */}
          <div className="course-grid">
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <h4>No courses found</h4>
                <p>Try selecting a different category above.</p>
              </div>
            ) : (
              filteredCourses.map((course: any, index: number) => (
                <div key={course.id} className="course-card">
                  {/* Image */}
                  <div className="card-image-wrap">
                    <img
                      src={course.image || `${COURSE_IMAGES[index % COURSE_IMAGES.length]}?w=600&auto=format`}
                      alt={course.title}
                    />
                    <div className="card-overlay" />
                    {course.offer && (
                      <span className="offer-badge">{course.offer}</span>
                    )}
                    {course.category?.name && (
                      <span className="card-cat-chip">{course.category.name}</span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="card-body">
                    <h3 className="card-title">{course.title}</h3>
                    <p className="card-desc">
                      {course.description
                        ? course.description.slice(0, 90) + '…'
                        : 'Gain industry-ready skills through hands-on, project-based training.'}
                    </p>

                    {/* Meta */}
                    <div className="card-meta">
                      <span className="meta-item">
                        <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {course.duration || 'Self-paced'}
                      </span>
                      {course.level && (
                        <span className="meta-item">
                          <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          {course.level}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                      <span className="view-btn">View Course →</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default function CoursesPage() {
  return (
    <section className="inner-block">
      <PageHeader
        title="Explore Top Courses"
        description="Learn industry-ready skills with practical, project-based training."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Courses' }
        ]}
      />
      <section>
        <Suspense fallback={<Loader />}>
          <CoursesList />
        </Suspense>
      </section>
    </section>
  );
}