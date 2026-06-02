'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Course = {
  id: number | string;
  level: string;
  image: string;
  title: string;
  rating: string | number;
  views: string | number;
};

type CourseGridProps = {
  filteredCourses: Course[];
  loading?: boolean;
};

const levelColors: Record<string, { bg: string; color: string }> = {
  Beginner: { bg: '#EAF7F0', color: '#0F6E56' },
  Intermediate: { bg: '#EEF4FF', color: '#185FA5' },
  Advanced: { bg: '#FFF4E5', color: '#854F0B' },
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const decimal = rating - full;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= full ? '#E8A020' : i === full + 1 && decimal >= 0.5 ? 'url(#half)' : '#E2E8F0'}>
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="#E8A020" />
              <stop offset="50%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

export default function CourseGrid({ filteredCourses, loading = false }: CourseGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .cg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
          gap: 24px;
        }

        .cg-card {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .cg-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(11,27,58,0.1);
          border-color: #CBD5E1;
        }

        .cg-image-wrap {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          background: #F1F5F9;
        }

        .cg-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }

        .cg-card:hover .cg-image-wrap img {
          transform: scale(1.04);
        }

        .cg-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
        }

        .cg-body {
          padding: 20px 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .cg-title {
          font-size: 17px;
          font-weight: 600;
          color: #0B1B3A;
          line-height: 1.35;
          font-family: 'Playfair Display', Georgia, serif;
          margin: 0;
        }

        .cg-desc {
          font-size: 13px;
          color: #4A5568;
          line-height: 1.6;
          margin: 0;
          font-weight: 300;
          font-family: 'DM Sans', sans-serif;
        }

        .cg-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }

        .cg-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #4A5568;
          font-family: 'DM Sans', sans-serif;
        }

        .cg-rating-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cg-rating-val {
          font-size: 13px;
          font-weight: 600;
          color: #0B1B3A;
        }

        .cg-stat {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748B;
        }

        .cg-btn {
          display: block;
          width: 100%;
          text-align: center;
          background: #0B1B3A;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          margin-top: 6px;
          transition: background 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.01em;
        }

        .cg-btn:hover {
          background: #152D5A;
          transform: translateY(-1px);
          color: #fff;
        }

        .cg-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #94A3B8;
        }

        .cg-empty-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.4;
        }

        .cg-empty h3 {
          font-size: 16px;
          font-weight: 500;
          color: #94A3B8;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Staggered card entrance (runs once the grid scrolls into view).
           Kept on the 'animation' property so the card's own hover 'transition'
           is untouched. Easing is ease-out-expo — no bounce. ── */
        @keyframes cgIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }

        /* ── Skeleton loaders shown while /api/courses is in flight.
           Neutrals tinted toward the brand navy/cream, never flat gray. ── */
        .cg-skel {
          background: #fff;
          border: 1px solid #E8ECF5;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cg-skel-img { aspect-ratio: 16/9; }
        .cg-skel-body { padding: 20px 22px 22px; display: flex; flex-direction: column; gap: 13px; }
        .cg-skel-line { height: 12px; border-radius: 6px; }
        .cg-skel-line.w90 { width: 90%; }
        .cg-skel-line.w65 { width: 65%; }
        .cg-skel-line.w40 { width: 40%; }
        .cg-skel-btn { height: 42px; border-radius: 10px; margin-top: 6px; }
        .cg-skel-img,
        .cg-skel-line,
        .cg-skel-btn {
          background: linear-gradient(100deg, #EAEEF6 28%, #F6F8FC 50%, #EAEEF6 72%);
          background-size: 220% 100%;
          animation: cgShimmer 1.5s ease-in-out infinite;
        }
        @keyframes cgShimmer {
          from { background-position: 220% 0; }
          to   { background-position: -220% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .cg-card { animation: none !important; opacity: 1 !important; transform: none !important; }
          .cg-skel-img, .cg-skel-line, .cg-skel-btn { animation: none !important; }
        }
      `}</style>

      <div className="cg-grid" ref={gridRef}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="cg-skel" key={`skel-${i}`}>
              <div className="cg-skel-img" />
              <div className="cg-skel-body">
                <div className="cg-skel-line w90" />
                <div className="cg-skel-line w65" />
                <div className="cg-skel-line w40" />
                <div className="cg-skel-btn" />
              </div>
            </div>
          ))
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course, i) => {
            const badge = levelColors[course.level] ?? { bg: '#F1F5F9', color: '#4A5568' };
            const ratingNum = typeof course.rating === 'string' ? parseFloat(course.rating) : course.rating;
            return (
              <div
                className="cg-card"
                key={course.id}
                style={{
                  opacity: inView ? undefined : 0,
                  animation: inView ? `cgIn .55s cubic-bezier(.16,1,.3,1) ${Math.min(i, 7) * 70}ms both` : 'none',
                }}
              >
                <div className="cg-image-wrap">
                  <img src={course.image} alt={course.title} loading="lazy" />
                  <span
                    className="cg-badge"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {course.level}
                  </span>
                </div>

                <div className="cg-body">
                  <h3 className="cg-title">{course.title}</h3>
                  <p className="cg-desc">Learn to build secure, scalable, and high-performance real-world applications.</p>

                  <div className="cg-divider" />

                  <div className="cg-meta">
                    <div className="cg-rating-row">
                      <StarRating rating={ratingNum} />
                      <span className="cg-rating-val">{ratingNum.toFixed(1)}</span>
                    </div>
                  </div>

                  <Link href="/courses" className="cg-btn">
                    View Course →
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="cg-empty">
            <div className="cg-empty-icon">◎</div>
            <h3>No courses match your criteria.</h3>
          </div>
        )}
      </div>
    </>
  );
}