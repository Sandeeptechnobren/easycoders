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

  const allowedCategories = [
    'Internship',
    'Job Oriented Programs',
    'Summer Training'
  ];

  useEffect(() => {
    setLoading(true);

    const endpoint = categoryId
      ? `/courses?category_id=${categoryId}`
      : '/courses';

    api.get(endpoint)
      .then(res => {
        const data = res.data?.data ?? res.data;
        setCourses(data);

        // Auto select first available allowed category
        const firstAvailable = data.find((course: any) =>
          allowedCategories.includes(course.category?.name)
        );

        if (firstAvailable) {
          setActiveTab(firstAvailable.category?.name);
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));

  }, [categoryId]);

  if (loading) return <Loader />;

  const categories = allowedCategories.filter(cat =>
    courses.some(course => course.category?.name === cat)
  );

  const filteredCourses = courses.filter(
    course => course.category?.name === activeTab
  );

  return (
   
<div className='section-block'>
          <div className="container">
            <div className='flexCourseBlock'>
              
              <div className="tabCourse">
                  <h4 className='widget-title'>Quick Links</h4>
                     <ul className="tabCard">
        {categories.map(cat => {
          const count = courses.filter(
            c => c.category?.name === cat
          ).length;

          return (
            <li key={cat} className=" ">
              <button
                className={`internalNav  ${activeTab === cat ? 'activeNav' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat} ({count})
              </button>
            </li>
          );
        })}
      </ul>
                
              </div>

              <div className='flexContentBlock'>
                <h3>Popular Courses</h3>
              <div className="cardGrid">
                 {filteredCourses.map((course: any, index: number) => (
          <div key={course.id} className="courseCardBlock">
            {course.offer && (
                    <span className="badge">{course.offer}</span>
                  )}
            <div className="cardImage">

              <img
                src={
                  course.image ||
                  COURSE_IMAGES[index % COURSE_IMAGES.length]
                }
                className="card-img-top"
                style={{ height: 200, objectFit: 'cover' }}
                alt={course.title}
              />
              </div>

              <div className="courseCard">
                <h3 className="cardTitle">{course.title}</h3>

                <p className="cardDescp">
                  {course.description
                    ? course.description.slice(0, 80) + '...'
                    : 'No description available'}
                </p>

                <div className="courFlex">
                  <span className="duration">
                    <i className="icon icon-clock"></i>
                    {course.duration || 'Self paced'}
                  </span>
                    
                </div>  

                <Link href={`/courses/${course.id}`}>
                    <button className="btn btn-default w-100 enrollBtn btn-sm">
                      View Course 
                    </button>
                  </Link>
      

            </div>
          </div>
        ))}
              </div>
            </div>
            </div>
          </div>
        </div>
 
   
 
  );
}

export default function CoursesPage() {
  return (
 
      <section className="inner-block">
      <PageHeader
        title="Explore Top Courses"
        description="Learn industry-ready skills with practical, project-based training."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Courses" }
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