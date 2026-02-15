'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCourses([
      { id: 1, level: 'Beginner', title: 'Summer Training', rating: 4.8, views: '120k Views', image:'https://netmax.co.in/wp-content/uploads/2022/03/Summer-training-in-Himachal-Pradesh-1-1.jpg' },
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
    <div className="min-h-screen">
      <style jsx>{`
        .introSection { padding: 40px 20px; text-align: center; }
        .transparentDiv { display: flex; flex-direction: column; align-items: center; max-width: 1200px; margin: 0 auto; gap: 20px; }
        .heroTitle { font-size: 28px !important; line-height: 1.2; }
        .introImage img { max-height: 200px; width: auto; margin-top: 20px; }
        
        /* Grid adjustments: Mobile-first (1 column) */
        .cardGrid { display: grid; grid-template-columns: 1fr; gap: 20px; padding: 20px; }
        
        .mainInternalNav { display: flex; overflow-x: auto; gap: 10px; padding: 10px 0; white-space: nowrap; -ms-overflow-style: none; scrollbar-width: none; }
        .mainInternalNav::-webkit-scrollbar { display: none; }

        /* Desktop Breakpoints */
        @media (min-width: 768px) {
          .introSection { text-align: left; padding: 60px 40px; }
          .transparentDiv { flex-direction: row; justify-content: space-between; text-align: left; }
          .heroTitle { font-size: 40px !important; }
          .cardGrid { grid-template-columns: repeat(2, 1fr); }
          .introImage img { max-height: 280px; margin-top: 0; }
        }

        @media (min-width: 1024px) {
          .cardGrid { grid-template-columns: repeat(3, 1fr); }
          .introSection { padding: 80px 100px; }
        }
      `}</style>

      <section className="introSection global-header-bg">
        <div className="transparentDiv">
          <div className="internalIntro">
            <h1 className="heroTitle" style={{ fontWeight: 800, color: 'white' }}>
              Level Up Your <br /> Coding Career
            </h1>
            <div className="searchBox">
              <span className="searchIcon">🔍</span>
              <input
                type="search"
                placeholder="Search courses..."
                className="searchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="introImage d-none d-md-block">
            <img src="/images/illustrations.png" alt="Hero Illustration" />
          </div>
        </div>
      </section>

      <section className="description px-4 md:px-10">
        <div className="mainInternalNav">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
            <div 
              key={lvl} 
              className={`internalNav ${filter === lvl ? 'activeNav' : ''}`}
              style={filter === lvl ? { background: '#8B5CF6', color: 'white', borderColor: '#8B5CF6' } : {}}
              onClick={() => setFilter(lvl)}
            >
              {lvl}
            </div>
          ))}
        </div>

        <h2 className="sectionTitle">
          {searchQuery ? `Search results for "${searchQuery}"` : "Filters Spotlight"}
        </h2>

        <div className="cardGrid">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <div className="courseCard" key={course.id}>
                <span className="badge">{course.level}</span>
                <div className="cardImage">
                  <img src={course.image} alt={course.title} />
                </div>
                <h3 className="cardTitle">{course.title}</h3>
                <div className="rating">★★★★★ {course.rating}</div>
                <div className="cardFooter">
                  <span className="views">{course.views}</span>
                  <Link href={`/courses`} className="enrollBtn">
                    Explore
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center w-full py-10 opacity-50">
              <h3>No courses found matches your criteria.</h3>
            </div>
          )}
        </div>

        <h2 className="sectionTitle">Success Stories</h2>
        <div className="cardGrid">
          {[
            { id: 1, name: "Aarav Sharma", role: "Frontend Developer", feedback: "Easy Coders helped me move from basics to building real-world projects confidently." },
            { id: 2, name: "Priya Verma", role: "Computer Science Student", feedback: "The learning approach is practical and industry-focused. Highly recommended!" },
            { id: 3, name: "Rahul Singh", role: "Backend Developer", feedback: "Clear explanations, hands-on coding, and great mentorship." },
          ].map(testimonial => (
            <div className="courseCard testimonialCard" key={testimonial.id}>
              <h3 className="cardTitle">{testimonial.name}</h3>
              <p className="testimonialRole">{testimonial.role}</p>
              <p className="testimonialText">“{testimonial.feedback}”</p>
              <div className="rating">★★★★★ 5.0</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}