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
    <div className="min-h-screen bg-light">
      {/* Hero Section */}
      <div className="relative bg-secondary text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-90"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Launch Your Tech Career <br />
            <span className="text-blue-300">With Industry Experts</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl">
            Master the latest technologies with our comprehensive training programs.
            Get hands-on experience and build a portfolio that stands out.
          </p>
          <div className="flex space-x-4">
            <Link href="/courses" className="bg-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition shadow-lg transform hover:-translate-y-1">
              Explore Courses
            </Link>
            <Link href="/about" className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-secondary transition">
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-secondary mb-4">Why Choose TechnoBren?</h2>
            <p className="text-xl text-gray-600">We provide more than just training; we provide a pathway to your career.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-light rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-primary rounded-lg flex items-center justify-center mb-6 text-2xl">
                🚀
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Live Projects</h3>
              <p className="text-gray-600">Work on real-world projects and gain practical experience that employers value.</p>
            </div>
            <div className="p-8 bg-light rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-primary rounded-lg flex items-center justify-center mb-6 text-2xl">
                👨‍🏫
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Expert Mentors</h3>
              <p className="text-gray-600">Learn from industry professionals with years of experience in top tech companies.</p>
            </div>
            <div className="p-8 bg-light rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-primary rounded-lg flex items-center justify-center mb-6 text-2xl">
                💼
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Placement Support</h3>
              <p className="text-gray-600">Get dedicated support for resume building, mock interviews, and job placements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-secondary mb-12 text-center">Our Training Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.id} className="bg-white p-8 rounded-xl shadow hover:shadow-lg transition group cursor-pointer">
                <h3 className="text-2xl font-bold mb-4 text-secondary group-hover:text-primary transition">{category.name}</h3>
                <ul className="space-y-3 mb-6">
                  {category.children && category.children.map((child: any) => (
                    <li key={child.id} className="flex items-center text-gray-600">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                      {child.name}
                    </li>
                  ))}
                </ul>
                <Link href={`/courses?category=${category.id}`} className="inline-block text-primary font-semibold hover:underline">
                  View Courses &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of students who have transformed their careers with TechnoBren.</p>
          <Link href="/register" className="bg-white text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg">
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}
