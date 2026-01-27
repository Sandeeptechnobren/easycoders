'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Loader from '@/app/loader/page';

export default function CourseDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    college: '',
  });

  useEffect(() => {
    if (!id) return;

    api.get(`/courses/${id}`)
      .then(res => setCourse(res.data?.data ?? res.data))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/addenrollmentrequest', {
        course_id: id,
        ...formData,
      });
      alert('Enrollment successful! We will contact you soon.');
      setShowEnrollForm(false);
    } catch {
      alert('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!course) return <div>Course not found</div>;

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="introSection">
        <div className="transparentDiv">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="internalIntro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <h1 style={{ fontSize: '40px', fontWeight: 900 }}>
                {course.title}
              </h1>
              <p style={{ marginTop: 10, maxWidth: 450 }}>
                {course.category?.name} • {course.level}
              </p>
            </div>

            <div className="internalIntro introImage" />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="description">

        {/* MAIN CARD */}
        <div className="courseCard" style={{ marginBottom: 40 }}>
          {course.offer && (
            <span className="badge">{course.offer}</span>
          )}

          <h2 className="sectionTitle">Course Overview</h2>

          <p className="testimonialText">
            {course.description}
          </p>

          <div className="cardGrid" style={{ marginTop: 20 }}>
            <div className="courseCard">
              <h3 className="cardTitle">Duration</h3>
              <p className="testimonialText">{course.duration}</p>
            </div>

            <div className="courseCard">
              <h3 className="cardTitle">Level</h3>
              <p className="testimonialText">{course.level}</p>
            </div>

            <div className="courseCard">
              <h3 className="cardTitle">Fees</h3>
              <p className="testimonialText">
                <del>₹{course.original_price}</del><br />
                <strong>₹{course.discounted_price}</strong>
              </p>
            </div>
          </div>

          {!showEnrollForm && (
            <div style={{ marginTop: 30 }}>
              <button
                onClick={() => setShowEnrollForm(true)}
                className="enrollBtn"
                style={{ padding: '12px 24px', fontSize: 15 }}
              >
                Enroll Now →
              </button>
            </div>
          )}
        </div>

        {/* FEATURES */}
        {course.category?.features?.length > 0 && (
          <div className="courseCard" style={{ marginBottom: 40 }}>
            <h2 className="sectionTitle">What You Will Get</h2>
            <ul>
              {course.category.features.map((f: any) => (
                <li key={f.id} className="testimonialText">
                  {f.feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ENROLL FORM */}
        {/* {showEnrollForm && (
          <div className="courseCard">
            <h2 className="sectionTitle">Enroll for this Course</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['name', 'email', 'phone_number', 'college'].map((field) => (
                <input
                  key={field}
                  name={field}
                  placeholder={field.replace('_', ' ').toUpperCase()}
                  value={(formData as any)[field]}
                  onChange={handleChange}
                  required={field !== 'college'}
                  className="searchInput"
                />
              ))}

              <button
                type="submit"
                disabled={submitting}
                className="enrollBtn"
                style={{ alignSelf: 'flex-start', padding: '10px 20px' }}
              >
                {submitting ? 'Submitting...' : 'Submit Enrollment'}
              </button>
            </form>
          </div>
        )} */}
        {showEnrollForm && (
  <div className="courseCard">
    <h2 className="sectionTitle" style={{ textAlign: 'center' }}>
      Enroll for this Course
    </h2>

    <p style={{ textAlign: 'center', color: '#666', marginBottom: 20 }}>
      Fill in your details and our team will contact you shortly.
    </p>

    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div className="formGroup">
        <label className="formLabel">Full Name</label>
        <input
          name="name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleChange}
          required
          className="formInput"
        />
      </div>

      <div className="formGroup">
        <label className="formLabel">Email Address</label>
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          className="formInput"
        />
      </div>

      <div className="formGroup">
        <label className="formLabel">Phone Number</label>
        <input
          name="phone_number"
          placeholder="Your contact number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          className="formInput"
        />
      </div>

      <div className="formGroup">
        <label className="formLabel">College (Optional)</label>
        <input
          name="college"
          placeholder="Your college name"
          value={formData.college}
          onChange={handleChange}
          className="formInput"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="formButton"
      >
        {submitting ? 'Submitting...' : 'Submit Enrollment →'}
      </button>
    </form>
  </div>
)}

      </section>
    </div>
  );
}
