'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
    setCourses([
      {
        id: 1,
        level: 'Beginner',
        title: 'Summer Training',
        rating: 4.8,
        views: '120k Views',
        image:'https://netmax.co.in/wp-content/uploads/2022/03/Summer-training-in-Himachal-Pradesh-1-1.jpg'
      },
      {
        id: 2,
        level: 'Beginner',
        title: 'Internship',
        rating: 4.7,
        views: '131k Views',
        image:'https://images.shiksha.com/mediadata/images/articles/1575005482php2pK7B8.jpeg'
      },
      {
        id: 3,
        level: 'Intermediate',
        title: 'Job Oriented Training',
        rating: 4.9,
        views: '150k Views',
        image:'https://5.imimg.com/data5/SELLER/Default/2022/2/HT/KM/QN/93804707/job-oriented-training1.png'
      },
      {
        id: 4,
        level: 'Beginner',
        title: 'Language Training',
        rating: 4.6,
        views: '189k Views',
        image:'https://online.stanford.edu/sites/default/files/styles/embedded_large/public/2018-03/cs_programminglanguage_cs242.jpg?itok=OMscvbtw'
      }
    ]);
  }, []);
  return (
    <div className="min-h-screen homePage">
      <section className="introSection">
        <div className="transparentDiv">
          <div className="internalIntro">
            <h1 style={{ fontSize: '40px', fontWeight: 900 }}>
              Level Up Your <br /> Coding Career
            </h1>
            <div className="searchBox">
              <span className="searchIcon">🔍</span>
              <input
                type="search"
                placeholder="Search courses, topics..."
                className="searchInput"
              />
            </div>
          </div>
          <div className="internalIntro introImage"></div>
        </div>
      </section>
      <section className="description">
        <div className="mainInternalNav">
          <div className="internalNav">All</div>
          <div className="internalNav">Beginner</div>
          <div className="internalNav">Intermediate</div>
          <div className="internalNav">Advanced</div>
        </div>
        <h2 className="sectionTitle">Filters Spotlight</h2>
        <div className="cardGrid">
          {courses.map(course => (
            <div className="courseCard" key={course.id}>
              <span className="badge">{course.level}</span>
              <div className="cardImage">
                  <img
                      src={course.image || '/images/fullnobackground.png'}
                      alt={course.title}
                    />
              </div>
              <h3 className="cardTitle">{course.title}</h3>
              <div className="rating">★★★★★ {course.rating}</div>
              <div className="cardFooter">
                <span className="views">{course.views}</span>
                <button className="enrollBtn">Explore</button>
              </div>
            </div>
          ))}
        </div>
        <h2 className="sectionTitle">Testimonials</h2>
        <div className="cardGrid">
          {[
            {
              id: 1,
              name: "Aarav Sharma",
              role: "Frontend Developer",
              feedback:
                "Easy Coders helped me move from basics to building real-world projects confidently.",
              rating: 5,
              // image: "https://randomuser.me/api/portraits/men/32.jpg",
            },
            {
              id: 2,
              name: "Priya Verma",
              role: "Computer Science Student",
              feedback:
                "The learning approach is practical and industry-focused. Highly recommended!",
              rating: 5,
              // image: "https://randomuser.me/api/portraits/women/44.jpg",
            },
            {
              id: 3,
              name: "Rahul Singh",
              role: "Backend Developer",
              feedback:
                "Clear explanations, hands-on coding, and great mentorship throughout the journey.",
              rating: 4.8,
              // image: "https://randomuser.me/api/portraits/men/76.jpg",
            },
          ].map(testimonial => (
            <div className="courseCard testimonialCard" key={testimonial.id}>

              <div className="testimonialImage">
                {/* <img src={testimonial.image} alt={testimonial.name} /> */}
              </div>

              <h3 className="cardTitle">{testimonial.name}</h3>
              <p className="testimonialRole">{testimonial.role}</p>

              <p className="testimonialText">
                “{testimonial.feedback}”
              </p>

              <div className="rating">
                ★★★★★ {testimonial.rating}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
