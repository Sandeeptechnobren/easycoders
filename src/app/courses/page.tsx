'use client';

import { Suspense, useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Loader from '../loader/page';

const COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97', // coding
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c', // laptop
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159', // dev
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', // teamwork
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085', // programming
  'https://images.unsplash.com/photo-1531482615713-2afd69097998', // ai
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c', // tech
];

function CoursesList() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const categoryId = searchParams.get('category');

  useEffect(() => {
    setLoading(true);
    const endpoint = categoryId
      ? `/courses?category_id=${categoryId}`
      : '/courses';

    api.get(endpoint)
      .then(res => setCourses(res.data?.data ?? res.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) return <Loader />;

  const groupedCourses = courses.reduce((acc: any, course: any) => {
    const categoryName = course.category?.name || 'Other';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(course);
    return acc;
  }, {});

  return (
    <div className="d-flex flex-column gap-5">
      {Object.entries(groupedCourses).map(
        ([categoryName, categoryCourses]: any) => (
          <div key={categoryName}>

            <h2 className="sectionTitle">
              {categoryName} ({categoryCourses.length})
            </h2>

            <div className="cardGrid">
              {categoryCourses.map((course: any, index: number) => (
                <div className="courseCard" key={course.id}>
                  
                  {course.offer && (
                    <span className="badge">{course.offer}</span>
                  )}

                  <div className="cardImage">
                    <img
                      src={
                        course.image ||
                        COURSE_IMAGES[index % COURSE_IMAGES.length] + '?w=400&h=300&fit=crop'
                      }
                      alt={course.title}
                    />
                  </div>

                  <h3 className="cardTitle">{course.title}</h3>

                  <p className="testimonialText">
                    {course.description?.length > 90
                      ? course.description.slice(0, 90) + '...'
                      : course.description}
                  </p>

                  <div className="cardFooter">
                    <span className="views">
                      {course.duration || 'Self paced'}
                    </span>

                    <Link href={`/courses/${course.id}`}>
                      <button className="enrollBtn">
                        Explore →
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <div className="min-h-screen">

      <section className="introSection">
        <div className="transparentDiv">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="internalIntro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <h1 style={{ fontSize: '42px', fontWeight: 900 }}>
                Explore Our Courses
              </h1>
              <p style={{ marginTop: 10, maxWidth: 450 }}>
                Learn industry-ready skills with practical,
                project-based training.
              </p>
            </div>

            <div className="internalIntro introImage" />
          </div>
        </div>
      </section>

      <section className="description">
        <Suspense fallback={<Loader />}>
          <CoursesList />
        </Suspense>
      </section>
    </div>
  );
}
