'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ================= HERO + CAROUSEL ================= */}
      <section className="relative">

        <div id="heroCarousel" className="carousel slide m-5" data-bs-ride="carousel">

          {/* INDICATORS */}
          <div className="carousel-indicators">
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
          </div>

          {/* CAROUSEL ITEMS */}
          <div className="carousel-inner">

            {/* SLIDE 1 */}
            <div className="carousel-item active" data-bs-interval="5000">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
                className="d-block w-[100%] opacity-40"
                alt="Coding Class"
                height='300px'
              />
              <div className="carousel-caption d-none d-md-block">
                <h1 className="display-4 fw-bold text-[#00c2ff] text-shadow-lg">Learn From Experts</h1>
                <p className="lead">Master real-world development with hands-on training.</p>
              </div>
            </div>

            {/* SLIDE 2 */}
            <div className="carousel-item" data-bs-interval="5000">
              <img
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
                className="d-block w-100 opacity-40"
                alt="Developers Working"
                height='300px'

              />
              <div className="carousel-caption d-none d-md-block">
                <h1 className="display-4 fw-bold text-[#14f4ff]">Build Live Projects</h1>
                <p className="lead">Get industry experience before even stepping into a job.</p>
              </div>
            </div>

            {/* SLIDE 3 */}
            <div className="carousel-item">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80"
                className="d-block w-100 opacity-40"
                alt="Students Coding"
                height='300px'

              />
              <div className="carousel-caption d-none d-md-block text-center">
                <h1 className="display-4 fw-bold text-[#00c2ff]">Become Job-Ready</h1>
                <p className="lead">Crack interviews with confidence and skill.</p>
              </div>
            </div>

          </div>

          {/* PREV/NEXT BUTTONS */}
          <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon"></span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon"></span>
          </button>

        </div>

        {/* Neon glows */}
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-[#00c2ff] opacity-20 blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-[#14f4ff] opacity-20 blur-[150px]"></div>

      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-1 bg-black my-4">
        <div className="container px-4">

          <h2 className="text-center text-4xl fw-bold mb-5">
            Why Choose <span className="text-[#00c2ff]">Easy Coders?</span>
          </h2>

          <div className="row g-4">

            {/* CARD */}
            <div className="col-md-4">
              <div className="p-4 rounded-3 bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#00c2ff] shadow-sm hover-shadow-lg transition-all">
                <div className="fs-1 mb-3 text-[#00c2ff]">🚀</div>
                <h3 className="fw-bold mb-3">Real Live Projects</h3>
                <p className="text-gray-400">Work on real production-level applications with hands-on guidance.</p>
              </div>
            </div>

            {/* CARD */}
            <div className="col-md-4">
              <div className="p-4 rounded-3 bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#00c2ff] shadow-sm hover-shadow-lg transition-all">
                <div className="fs-1 mb-3 text-[#00c2ff]">👨‍🏫</div>
                <h3 className="fw-bold mb-3">Mentors From Industry</h3>
                <p className="text-gray-400">Learn from expert engineers working in top IT companies.</p>
              </div>
            </div>

            {/* CARD */}
            <div className="col-md-4">
              <div className="p-4 rounded-3 bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#00c2ff] shadow-sm hover-shadow-lg transition-all">
                <div className="fs-1 mb-3 text-[#00c2ff]">💼</div>
                <h3 className="fw-bold mb-3">Placement Assistance</h3>
                <p className="text-gray-400">Mock interviews, resume preparation, referrals, and more.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= TRAINING PROGRAMS ================= */}
      {/* <section className="py-24 bg-black">
        <div className="container px-4">

          <h2 className="text-center text-4xl fw-bold mb-5">
            Our Training Programs
          </h2>

          <div className="row g-4">

            {categories.map((category) => (
              <div key={category.id} className="col-md-4">
                <div className="p-4 rounded-3 bg-[#0f0f0f] border border-[#1a1a1a] group hover:border-[#00c2ff] hover-shadow-lg transition-all">

                  <h3 className="fw-bold fs-4 mb-3 group-hover:text-[#00c2ff]">{category.name}</h3>

                  <ul className="list-unstyled mb-3">
                    {category.children?.map((child: any) => (
                      <li key={child.id} className="d-flex align-items-center text-gray-400 mb-2">
                        <span className="me-2 w-2 h-2 rounded-circle bg-[#00c2ff]"></span>
                        {child.name}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/courses?category=${category.id}`} className="text-[#00c2ff] fw-semibold">
                    View Courses →
                  </Link>

                </div>
              </div>
            ))}

          </div>

        </div>
      </section> */}

      {/* ================= CTA ================= */}
      <section className="py-5 bg-[#080808] text-center">
        <div className="container">

          <h2 className="text-4xl fw-bold mb-4 text-[#00c2ff]">Ready to Begin Your Journey?</h2>
          <p className="fs-5 mb-5 text-gray-300">
            Join thousands of learners already achieving success with TechnoBren.
          </p>

          <Link
            href="/register"
            className="btn px-5 py-3 fw-bold bg-[#00c2ff] text-black rounded-3 shadow-lg hover:bg-[#14f4ff]"
          >
            Register Now
          </Link>

        </div>
      </section>

    </div>
  );
}
