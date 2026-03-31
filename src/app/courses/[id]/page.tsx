'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';
import Loader from '@/app/loader/page';
import PageHeader from '@/components/PageHeader';

const COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
  'https://images.unsplash.com/photo-1587620962725-abab7fe55159',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
];

export default function CourseDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQrEnroll, setShowQrEnroll] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    college: '',
    payment_method: '',
    transaction_number: '',
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
      await api.post('/addenrollmentrequest', { course_id: id, ...formData });
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

        :root {
          --primary: #0f172a;
          --accent: #f97316;
          --accent-light: #fff7ed;
          --muted: #64748b;
          --border: #e2e8f0;
          --surface: #f8fafc;
          --white: #ffffff;
          --radius: 16px;
          --success: #16a34a;
          --success-bg: #f0fdf4;
          --danger: #dc2626;
          --danger-bg: #fef2f2;
          --indigo: #6366f1;
          --indigo-bg: #eef2ff;
        }

        /* ── PAGE ── */
        .cd-page {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          min-height: 60vh;
        }

        .cd-wrap {
          max-width: 1160px;
          margin: 0 auto;
          padding: 56px 24px 96px;
        }

        /* ── GRID ── */
        .cd-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .cd-grid { grid-template-columns: 1fr; }
          .cd-sidebar { position: static !important; }
        }

        /* ── LEFT CONTENT ── */
        .cd-left { display: flex; flex-direction: column; gap: 32px; }

        /* Offer pill */
        .offer-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          padding: 5px 14px;
          border-radius: 100px;
          width: fit-content;
        }

        .offer-pill::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--accent);
        }

        /* Title */
        .cd-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 700;
          color: var(--primary);
          line-height: 1.2;
          letter-spacing: -.02em;
          margin: 0;
        }

        /* Description */
        .cd-desc {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.75;
          margin: 0;
        }

        /* Meta chips */
        .cd-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary);
          box-shadow: 0 1px 4px rgba(15,23,42,.05);
        }

        .meta-chip svg { opacity: .55; flex-shrink: 0; }

        /* Features */
        .features-block {
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: var(--radius);
          padding: 28px;
          box-shadow: 0 2px 12px rgba(15,23,42,.04);
        }

        .features-heading {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 20px;
          letter-spacing: -.01em;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: var(--surface);
          border-radius: 10px;
          border: .5px solid var(--border);
          font-size: 14px;
          color: var(--primary);
          line-height: 1.5;
        }

        .feature-tick {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--success-bg);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .feature-tick svg { color: var(--success); }

        /* ── SIDEBAR ── */
        .cd-sidebar {
          position: sticky;
          top: 24px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .sidebar-card {
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(15,23,42,.08);
        }

        /* Sidebar image */
        .sidebar-img-wrap {
          position: relative;
          height: 220px;
          overflow: hidden;
        }

        .sidebar-img-wrap img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
        }

        .sidebar-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15,23,42,.5) 0%, transparent 60%);
        }

        .sidebar-cat-chip {
          position: absolute;
          bottom: 12px; left: 14px;
          background: rgba(255,255,255,.9);
          backdrop-filter: blur(6px);
          color: var(--primary);
          font-size: 11px; font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        /* Sidebar body */
        .sidebar-body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sidebar-title {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: var(--primary);
          line-height: 1.3;
          margin: 0;
        }

        .sidebar-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: var(--surface);
          border-radius: 10px;
          border: .5px solid var(--border);
        }

        .sidebar-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }

        .sidebar-meta-key { color: var(--muted); }
        .sidebar-meta-val { font-weight: 600; color: var(--primary); }

        /* Enroll button */
        .enroll-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: var(--primary);
          color: var(--white);
          border: none;
          border-radius: 12px;
          padding: 16px 20px;
          cursor: pointer;
          transition: background .2s, transform .15s;
          text-align: left;
        }

        .enroll-btn:hover {
          background: var(--accent);
          transform: translateY(-1px);
        }

        .enroll-label { font-size: 13px; font-weight: 500; opacity: .85; }
        .enroll-sub { font-size: 11px; opacity: .65; margin-top: 2px; }

        .enroll-price-wrap { text-align: right; }
        .enroll-price { font-size: 22px; font-weight: 700; display: block; }
        .enroll-original {
          font-size: 13px;
          text-decoration: line-through;
          opacity: .55;
        }

        /* ── MODAL OVERLAY ── */
        .enroll-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,.65);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 16px;
          animation: fadeIn .2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .enroll-modal {
          background: var(--white);
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          max-height: 92vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 24px 64px rgba(15,23,42,.22);
          animation: slideUp .25s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Modal header */
        .modal-header {
          padding: 24px 24px 0;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 18px; right: 18px;
          width: 34px; height: 34px;
          border-radius: 50%;
          border: .5px solid var(--border);
          background: var(--surface);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          color: var(--muted);
          transition: background .15s;
        }

        .modal-close:hover { background: var(--border); color: var(--primary); }

        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 4px;
          padding-right: 40px;
        }

        .modal-subtitle { font-size: 13px; color: var(--muted); margin: 0 0 16px; }

        /* Modal body */
        .modal-body { padding: 20px 24px 28px; display: flex; flex-direction: column; gap: 16px; }

        /* Notice */
        .notice-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          background: var(--danger-bg);
          border: .5px solid rgba(220,38,38,.2);
          padding: 11px 14px;
          border-radius: 12px;
        }

        .notice-text { font-size: 13px; color: #991b1b; line-height: 1.5; }

        /* Payment options */
        .pay-grid { display: grid; gap: 10px; }

        .pay-option {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 14px;
          border-radius: 12px;
          border: .5px solid var(--border);
          background: var(--surface);
          cursor: pointer;
          transition: border-color .2s, box-shadow .2s, background .2s;
        }

        .pay-option.active {
          border-color: var(--indigo);
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
          background: var(--white);
        }

        .pay-option input[type="radio"] { margin-top: 3px; accent-color: var(--indigo); }

        .pay-opt-title { font-weight: 600; font-size: 14px; color: var(--primary); }
        .pay-opt-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }

        /* QR box */
        .qr-box {
          border: 1px dashed var(--border);
          border-radius: 14px;
          padding: 14px;
          background: var(--white);
        }

        .qr-reveal-btn {
          width: 100%;
          border: .5px solid var(--border);
          background: var(--surface);
          color: var(--primary);
          padding: 11px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          transition: background .15s;
        }

        .qr-reveal-btn:hover { background: var(--border); }

        .qr-hint { font-size: 12px; color: var(--muted); margin-top: 10px; }

        .qr-img-wrap {
          margin-top: 14px;
          display: flex;
          justify-content: center;
        }

        .qr-frame {
          background: var(--surface);
          border: .5px solid var(--border);
          border-radius: 16px;
          padding: 14px;
        }

        .qr-frame img {
          width: 220px; height: 220px;
          border-radius: 10px;
          object-fit: cover;
          display: block;
        }

        /* Office info */
        .office-box {
          border-radius: 12px;
          border: .5px solid var(--border);
          background: var(--surface);
          padding: 14px;
        }

        .office-badge {
          display: inline-block;
          background: var(--success-bg);
          border: .5px solid rgba(22,163,74,.2);
          color: #166534;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .office-text { font-size: 13px; color: var(--muted); line-height: 1.55; margin: 0; }

        /* Form fields */
        .form-fields { display: flex; flex-direction: column; gap: 14px; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .field-input {
          border: .5px solid var(--border);
          background: var(--white);
          padding: 12px 14px;
          border-radius: 10px;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--primary);
          transition: border-color .2s, box-shadow .2s;
          width: 100%;
          box-sizing: border-box;
        }

        .field-input::placeholder { color: #94a3b8; }

        .field-input:focus {
          border-color: var(--indigo);
          box-shadow: 0 0 0 3px rgba(99,102,241,.1);
        }

        .help-text { font-size: 12px; color: var(--muted); }

        /* Submit button */
        .submit-btn {
          width: 100%;
          background: var(--primary);
          color: var(--white);
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          margin-top: 4px;
          transition: background .2s, transform .15s;
          letter-spacing: .01em;
        }

        .submit-btn:hover { background: var(--accent); transform: translateY(-1px); }
        .submit-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }

        /* Divider */
        .modal-divider {
          height: .5px;
          background: var(--border);
          margin: 0 24px;
        }
      `}</style>

      <div className="cd-page inner-block">
        <PageHeader
          title={course.title}
          description="Learn industry-ready skills with practical, project-based training."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Courses', href: '/courses' },
            { label: course?.title || 'Course' },
          ]}
        />

        <div className="cd-wrap">
          <div className="cd-grid">

            {/* ── LEFT ── */}
            <div className="cd-left">

              {/* Offer + Title */}
              <div>
                {course.offer && (
                  <div className="offer-pill" style={{ marginBottom: 14 }}>{course.offer}</div>
                )}
                <h1 className="cd-title">{course.title}</h1>
              </div>

              {/* Description */}
              {course.description && (
                <p className="cd-desc">{course.description}</p>
              )}

              {/* Meta chips */}
              <div className="cd-meta">
                {course.duration && (
                  <span className="meta-chip">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {course.duration}
                  </span>
                )}
                {course.level && (
                  <span className="meta-chip">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    {course.level}
                  </span>
                )}
                {course.category?.name && (
                  <span className="meta-chip">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    {course.category.name}
                  </span>
                )}
              </div>

              {/* Features */}
              {course.category?.features?.length > 0 && (
                <div className="features-block">
                  <h2 className="features-heading">What You Will Get</h2>
                  <ul className="features-grid">
                    {course.category.features.map((f: any) => (
                      <li key={f.id} className="feature-item">
                        <span className="feature-tick">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                        {f.feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ── SIDEBAR ── */}
            <aside className="cd-sidebar">
              <div className="sidebar-card">
                {/* Image */}
                <div className="sidebar-img-wrap">
                  <img
                    src={course.image || `${COURSE_IMAGES[course.id % COURSE_IMAGES.length]}?w=600&auto=format`}
                    alt={course.title}
                  />
                  <div className="sidebar-img-overlay" />
                  {course.category?.name && (
                    <span className="sidebar-cat-chip">{course.category.name}</span>
                  )}
                </div>

                {/* Body */}
                <div className="sidebar-body">
                  <h3 className="sidebar-title">{course.title}</h3>

                  <div className="sidebar-meta">
                    {course.level && (
                      <div className="sidebar-meta-row">
                        <span className="sidebar-meta-key">Level</span>
                        <span className="sidebar-meta-val">{course.level}</span>
                      </div>
                    )}
                    {course.duration && (
                      <div className="sidebar-meta-row">
                        <span className="sidebar-meta-key">Duration</span>
                        <span className="sidebar-meta-val">{course.duration}</span>
                      </div>
                    )}
                    {course.category?.name && (
                      <div className="sidebar-meta-row">
                        <span className="sidebar-meta-key">Category</span>
                        <span className="sidebar-meta-val">{course.category.name}</span>
                      </div>
                    )}
                  </div>

                  {!showEnrollForm && (
                    <button className="enroll-btn" onClick={() => setShowEnrollForm(true)}>
                      <div>
                        <div className="enroll-label">Enrol Now</div>
                        <div className="enroll-sub">Limited seats — quick discount</div>
                      </div>
                      <div className="enroll-price-wrap">
                        <span className="enroll-price">₹{course.discounted_price}</span>
                        {course.original_price && (
                          <span className="enroll-original">₹{course.original_price}</span>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </aside>

          </div>
        </div>
      </div>

      {/* ── ENROLLMENT MODAL ── */}
      {showEnrollForm && (
        <div className="enroll-overlay" onClick={() => setShowEnrollForm(false)} role="dialog" aria-modal="true">
          <div className="enroll-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="modal-header">
              <button className="modal-close" onClick={() => setShowEnrollForm(false)} aria-label="Close">✕</button>
              <h2 className="modal-title">Enrollment Form</h2>
              <p className="modal-subtitle">{course.title} · {course.category?.name}</p>
            </div>

            <div className="modal-divider" />

            <div className="modal-body">

              {/* Non-refundable notice */}
              <div className="notice-box">
                <span style={{ fontSize: 16 }}>⚠️</span>
                <p className="notice-text"><strong>Note:</strong> Registration fee is <strong>non-refundable</strong>. Please review details before submitting.</p>
              </div>

              {/* Payment method */}
              <div>
                <p className="field-label" style={{ marginBottom: 10 }}>Select Payment Method</p>
                <div className="pay-grid">
                  <label className={`pay-option ${formData.payment_method === 'qr' ? 'active' : ''}`}>
                    <input type="radio" name="payment_method" value="qr" checked={formData.payment_method === 'qr'} onChange={handleChange} />
                    <div>
                      <div className="pay-opt-title">Pay via QR (UPI)</div>
                      <div className="pay-opt-sub">Scan QR and enter transaction number.</div>
                    </div>
                  </label>
                  <label className={`pay-option ${formData.payment_method === 'office' ? 'active' : ''}`}>
                    <input type="radio" name="payment_method" value="office" checked={formData.payment_method === 'office'}
                      onChange={e => { handleChange(e); setFormData(prev => ({ ...prev, transaction_number: '' })); }} />
                    <div>
                      <div className="pay-opt-title">Pay at Office</div>
                      <div className="pay-opt-sub">Pay in-person at our office counter.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* QR section */}
              {formData.payment_method === 'qr' && (
                <div className="qr-box">
                  <button type="button" className="qr-reveal-btn" onClick={() => setShowQrEnroll(v => !v)}>
                    {showQrEnroll ? '▲ Hide QR Code' : '▼ Show QR Code to Scan'}
                  </button>
                  {!showQrEnroll && (
                    <p className="qr-hint">QR code is hidden. Click above to reveal and scan.</p>
                  )}
                  {showQrEnroll && (
                    <div className="qr-img-wrap">
                      <div className="qr-frame">
                        <img src="/images/TechnobrenQR.jpeg" alt="UPI QR Code" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Office info */}
              {formData.payment_method === 'office' && (
                <div className="office-box">
                  <div className="office-badge">Pay at Office Selected</div>
                  <p className="office-text">After submitting, our team will contact you with office details and confirm your slot.</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="form-fields">
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input className="field-input" name="name" placeholder="Your full name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Email Address</label>
                  <input className="field-input" type="email" name="email" placeholder="you@email.com" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="field-group">
                  <label className="field-label">Phone Number</label>
                  <input className="field-input" name="phone_number" placeholder="+91 00000 00000" value={formData.phone_number} onChange={handleChange} required />
                </div>
                <div className="field-group">
                  <label className="field-label">College <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span></label>
                  <input className="field-input" name="college" placeholder="Your college name" value={formData.college} onChange={handleChange} />
                </div>
                {formData.payment_method === 'qr' && (
                  <div className="field-group">
                    <label className="field-label">Transaction / UTR Number</label>
                    <input className="field-input" name="transaction_number" placeholder="e.g. 123456789012" value={formData.transaction_number} onChange={handleChange} required />
                    <span className="help-text">We use this to verify your payment quickly.</span>
                  </div>
                )}
                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? 'Submitting…' : 'Submit Enrollment →'}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}
    </>
  );
}