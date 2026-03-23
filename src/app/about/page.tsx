'use client';

import { useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/PageHeader';

type CounterItem = {
  value: number;
  label: string;
};

const data: CounterItem[] = [
  { value: 120, label: 'Live Projects' },
  { value: 15, label: 'Expert Trainers' },
  { value: 100, label: 'Hiring Companies' },
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
            const duration = 1200;
            const stepTime = Math.max(Math.floor(duration / end), 20);

            const counter = setInterval(() => {
              start += 1;

              setCounts(prev => {
                const newCounts = [...prev];
                newCounts[index] = start;
                return newCounts;
              });

              if (start >= end) clearInterval(counter);
            }, stepTime);
          });
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (

    <section>
      <PageHeader
        title="We Build Developers"
        description="Tech learning platform focused on real-world development skills and career growth.
"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "About Us" }
        ]}
      />

        <section className="counterSection" ref={ref}>
          <div className="container">
            <div className="row text-center">
              {data.map((item, index) => (
                <div className="col-md-4" key={index}>
                  <div className="counter-box">
                    <figure className='figureCount fontAdlam'>+{counts[index]}</figure>
                    <h4 className='figureTItle '>{item.label}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </section>

     <section className='section-block'>
      <div className='container'>
          <div className='row'>
            <div className='col-md-4'>
                <div className='storyBlock'>
                <h2 className='mb-4'>Our Story</h2>
              <p>EasyCoders was born from a simple problem: students learn syntax, but struggle to build real applications. We decided to flip the learning model — focusing on projects, workflows, and problem-solving.</p>
              <p> Today, we help learners go from zero to job-ready through structured learning paths, mentorship, and industry-style training.</p>
            <hr className='divider'/>
            <h4 className='tagline fontAdlam'>Modern Technology <br/>Develop with US</h4> </div>
            </div>

            <div className='col-md-1'></div>

            <div className='col-md-7'>
              <div className='profileImg'>
                <img src="/images/profile-img.jpg" alt="About Us" />
              </div>
            </div>
          </div>
      </div>
     </section>

     <section className='section-block'>
        <div className='container'>
          <div className='row'>
              <div className='col-md-6'>
                <div className='iconTextBlock'>
                    <img src="/images/icon-mission.svg" alt="Our Mission" />  
                    <h3>Our Mission</h3>
                    <p>To create confident developers by providing practical, project-driven and career-focused technical education.</p>
                </div>
               
              </div>

              <div className='col-md-6'>
                <div className='iconTextBlock'>
                    <img src="/images/icon-vision.svg" alt="Our Vision" />  
                    <h3>Our Vision</h3>
                <p>To become the most trusted platform for learning real-world software development skills globally.</p>
                </div>
                
              </div>
          </div>
        </div>
     </section> 

    </section>
    
  );
}