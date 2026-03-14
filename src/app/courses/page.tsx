'use client';

import { useState } from 'react';
import CourseGrid from '@/components/CourseGrid';
import Breadcrumb from '@/components/Breadcrumb';

type Course = {
  id: number | string;
  level: string;
  image: string;
  title: string;
  rating: string | number;
  views: string | number;
};

export default function CoursesPage() {

  const [filter, setFilter] = useState('All');

  const courses: Course[] = [
    { id: 1, level: 'Beginner', title: 'Summer Training', rating: 4.8, views: '120k Views', image:'https://5.imimg.com/data5/SELLER/Default/2023/9/342394080/WQ/GC/AM/7726776/45-days-basic-module-summer-and-internship-training-program.png' },
    { id: 2, level: 'Beginner', title: 'Internship', rating: 4.7, views: '131k Views', image:'https://images.shiksha.com/mediadata/images/articles/1575005482php2pK7B8.jpeg' },
    { id: 3, level: 'Intermediate', title: 'Job Oriented Training', rating: 4.9, views: '150k Views', image:'https://5.imimg.com/data5/SELLER/Default/2022/2/HT/KM/QN/93804707/job-oriented-training1.png' },
    { id: 4, level: 'Beginner', title: 'Language Training', rating: 4.6, views: '189k Views', image:'https://online.stanford.edu/sites/default/files/styles/embedded_large/public/2018-03/cs_programminglanguage_cs242.jpg?itok=OMscvbtw' }
  ];

  const filteredCourses =
    filter === 'All'
      ? courses
      : courses.filter((course) => course.level === filter);

  return (
    
    <section className="inner-block">
      <div className='home-header-bg innerBanner'>
        <div className='container'>
          <div className="title-section  mb-5">
                <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Courses' }
                ]}
              />
              <h1 className="heading1">Explore Top courses</h1>
              <p>Learn industry-ready skills with practical, project-based training.</p>
            </div>
          </div> 
        </div>

        <div className='section-block'>
          <div className="container">
            <div className='flexCourseBlock'>
              
              <div className="tabCourse">
                  <h4 className='widget-title'>Quick Links</h4>
                  <div className='tabCard'>
                      {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                      <div
                        key={lvl}
                        className={`internalNav ${filter === lvl ? 'activeNav' : ''}`}
                        onClick={() => setFilter(lvl)}
                      >
                        {lvl}
                      </div>
                    ))} 
                  </div>
              </div>

              <div className='flexContentBlock'>
                <h3>Popular Courses</h3>
              <CourseGrid filteredCourses={filteredCourses} />
            </div>
            </div>
          </div>
        </div>
     
    </section>
  );
}