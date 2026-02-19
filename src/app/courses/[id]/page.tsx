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
      <section className="introSection global-header-bg">
        <div className="transparentDiv">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="internalIntro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <h1 style={{ fontSize: '42px', fontWeight: 900 }}>
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
      <section className="description">
  <div className="courseCard mainCard">
    {course.offer && (
      <span className="badge">{course.offer}</span>
    )}
<div style={{display: 'flex',alignItems: 'center',flexWrap: 'wrap'}}>
  <h2 className="sectionTitle">Course Overview</h2>
  {!showEnrollForm && (
    <button
      onClick={() => setShowEnrollForm(true)}
      className="enrollBtn"
      style={{ marginLeft: 'auto' }}
    >
      Enroll Now →
    </button>
  )}
</div>
    <p className="testimonialText">
      {course.description}
    </p>
    <div className="cardGrid">
      <div className="courseCard infoCard">
        <div className="infoRow">
          <h3>Duration</h3>
          <p>{course.duration}</p>
        </div>
        <div className="infoRow">
          <h3>Level</h3>
          <p>{course.level}</p>
        </div>
        <div className="infoRow">
          <h3>Fees</h3>
          <p>
            <del>₹{course.original_price}</del>
            <br />
            <strong>₹{course.discounted_price}</strong>
          </p>
        </div>
      </div>
      {course.category?.features?.length > 0 && (
        <div className="courseCard featureCard">
          <h3 className="sectionTitle">What You Will Get</h3>
          <ul className="featureList">
            {course.category.features.map((f: any) => (
              <li key={f.id}>{f.feature}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </div>
</section>

  {showEnrollForm && (
    
    <div style={{ position: 'fixed', top: 0,left: 0,width: '100vw',height: '100vh',backgroundColor: 'rgba(0,0,0,0.6)',display: 'flex',justifyContent: 'center',alignItems: 'center',zIndex: 9999,}}
      onClick={() => setShowEnrollForm(false)}
    >
      <div
        style={{
          background: '#ffffff',
          padding: '35px',
          borderRadius: '12px 0px 0px 12px',
          width: '80%',
          height: '90%',
          maxWidth: '520px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 style={{ marginBottom: 5, fontWeight: 700 }}>
            {course.title}
          </h2>

          <p style={{ color: '#555', fontSize: 14 }}>
            {course.category?.name}
          </p>
        </div>
        {course.offer && (
          <div
            style={{
              background: '#e6f7ee',
              color: '#008a4e',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              width: 'fit-content',
              fontSize: 13
            }}
          >
            🎉 {course.offer}
          </div>
        )}
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: '15px',
            background: '#fafafa'
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: '#888' }}>Level:</span>
            <b style={{ marginLeft: 6 }}>{course.level}</b>
          </div>
          <div>
            <span style={{ color: '#888' }}>Duration:</span>
            <b style={{ marginLeft: 6 }}>{course.duration}</b>
          </div>
        </div>
        {course.category?.features?.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 10, fontWeight: 600 }}>
              What You Will Get
            </h3>
            <ul style={{ paddingLeft: 18 }}>
              {course.category.features.map((f: any) => (
                <li
                  key={f.id}
                  style={{
                    marginBottom: 6,
                    fontSize: 14,
                    lineHeight: 1.5
                  }}
                >
                  ✔ {f.feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div
        style={{
          background: '#fff',
          padding: '40px',
          borderRadius: '0px 12px 12px 0px',
          width: '80%',
          height: '90%',
          maxWidth: '500px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowEnrollForm(false)}
          style={{
            position: 'absolute',
            top: 10,
            right: 15,
            border: 'none',
            background: 'none',
            fontSize: 20,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          Enrollment Form
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="formInput"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="formInput"
          />

          <input
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            className="formInput"
          />

          <input
            name="college"
            placeholder="College (Optional)"
            value={formData.college}
            onChange={handleChange}
            className="formInput"
          />

          <button
            type="submit"
            disabled={submitting}
            className="formButton"
          >
            {submitting ? 'Submitting...' : 'Submit →'}
          </button>
        </form>
      </div>
    </div>
  )}
</div>
  );
}
