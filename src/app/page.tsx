'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
 
import TestimonialCarousel from '@/components/TestimonialCarousel';
import FAQAccordion from '@/components/FAQAccordion';
import CourseGrid from "@/components/CourseGrid";
export default function HomePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCourses([
      { id: 1, level: 'Beginner', title: 'Summer Training', rating: 4.8, views: '120k Views', image:'https://5.imimg.com/data5/SELLER/Default/2023/9/342394080/WQ/GC/AM/7726776/45-days-basic-module-summer-and-internship-training-program.png' },
      { id: 2, level: 'Beginner', title: 'Internship', rating: 4.7, views: '131k Views', image:'https://images.shiksha.com/mediadata/images/articles/1575005482php2pK7B8.jpeg' },
      { id: 3, level: 'Intermediate', title: 'Job Oriented Training', rating: 4.9, views: '150k Views', image:'https://5.imimg.com/data5/SELLER/Default/2022/2/HT/KM/QN/93804707/job-oriented-training1.png' },
      { id: 4, level: 'Beginner', title: 'Language Training', rating: 4.6, views: '189k Views', image:'https://online.stanford.edu/sites/default/files/styles/embedded_large/public/2018-03/cs_programminglanguage_cs242.jpg?itok=OMscvbtw' }
    ]);
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesGlobalFilter = filter === 'All' || course.level === filter;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGlobalFilter && matchesSearch;
  });

  return (
    <div  > 
      <section className="home-header-bg">
        <div className="container">
          <div className="banner-section">
            <div className="banner-content">
              <h1 className="heroTitle">
            Level up your Coding Career with <br/>
            <span>{"{EASYCODERS}"}</span>
            </h1>
            <h3 className="subheroTitle">Become a Data Scientist or Business Analyst. 
           <strong> No Coding knowledge required.</strong></h3>
             <div className="button-container">
             <Link href="/courses" className="btn btn-info">Join Our Courses <i></i></Link>
             <Link href="/about" className="btn btn-default">Checkout All</Link>
             </div>
             
          </div>
          <img src="/images/easycoder-hero.png" alt="Hero Illustration" />
      </div>
        </div>
      </section>

      <section className='section-block'>
        <div className='container'>
<div className='title-section text-center mb-5'>
  <h2 className='heading2'>Explore Top courses</h2>
  <p>Become a Data Scientist or Business Analyst. No coding knowledge required.</p>
</div>
<div className="mainInternalNav">
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

        <div>
      <CourseGrid filteredCourses={filteredCourses} />
    </div>
          </div>
      </section>

      <section className='section-block' style={{ backgroundColor: '#EFF5D0' }}>
        <div className='container'>
          <div className='row'>
            <div className='col-md-3'>
            <div className='title-section'>
                <h2>Success that <br/>speaks for itself</h2>
                <p>Join the 2M+ learners who have skilled up and stood out.</p>
                <a href='#' className='btn btn-primary'>Read all Quotes</a>
              </div>
            </div>
            <div className='col-md-2'>
              </div>
            <div className='col-md-7'>
              <TestimonialCarousel />
            </div>
          </div>
     
        
        </div>
      </section>

      <section className='section-block' style={{ backgroundColor: '#EBF2F5' }}>
        <div className='container'>
          <div className='title-section text-center'>
            <h2>Frequently asked questions</h2>
            <p>Join the 2M+ learners who have skilled up and stood out.</p>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <FAQAccordion />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}