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
  const [showQrEnroll, setShowQrEnroll] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    college: '',
    payment_method: '',
    transaction_number:'',
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

  {/* {showEnrollForm && (
    
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
  )} */}
  {showEnrollForm && (
  <div
    className="enrollOverlay"
    onClick={() => setShowEnrollForm(false)}
    role="dialog"
    aria-modal="true"
  >
    {/* MODAL */}
    <div className="enrollModal" onClick={(e) => e.stopPropagation()}>
      {/* LEFT: Course details */}
      <div className="enrollLeft">
        <div className="enrollHeader">
          <h2 className="courseTitle">{course.title}</h2>
          <p className="courseCategory">{course.category?.name}</p>
        </div>

        {course.offer && (
          <div className="offerBadge">
            🎉 {course.offer}
          </div>
        )}

        <div className="metaCard">
          <div className="metaRow">
            <span className="metaKey">Level:</span>
            <b className="metaVal">{course.level}</b>
          </div>
          <div className="metaRow">
            <span className="metaKey">Duration:</span>
            <b className="metaVal">{course.duration}</b>
          </div>
        </div>

        {course.category?.features?.length > 0 && (
          <div className="featuresBlock">
            <h3 className="featuresTitle">What You Will Get</h3>
            <ul className="featuresList">
              {course.category.features.map((f: any) => (
                <li key={f.id} className="featureItem">
                  <span className="tick">✔</span>
                  <span>{f.feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* RIGHT: Enrollment form */}
      <div className="enrollRight">
        <button
          onClick={() => setShowEnrollForm(false)}
          className="enrollClose"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="enrollFormTitle">Enrollment Form</h2>

        {/* Non-refundable notice */}
        <div className="notice">
          <span className="noticeIcon">⚠️</span>
          <div className="noticeText">
            <b>Note:</b> Registration fee is <b>non-refundable</b>.
          </div>
        </div>

        {/* Payment options */}
        <div className="payMethods">
          <label className={`payOption ${formData.payment_method === 'qr' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment_method"
              value="qr"
              checked={formData.payment_method === 'qr'}
              onChange={handleChange}
            />
            <div className="payOptionBody">
              <div className="payOptTitle">Pay via QR (UPI)</div>
              <div className="payOptSub">Scan QR and enter transaction number.</div>
            </div>
          </label>

          <label className={`payOption ${formData.payment_method === 'office' ? 'active' : ''}`}>
            <input
              type="radio"
              name="payment_method"
              value="office"
              checked={formData.payment_method === 'office'}
              onChange={(e) => {
                // if switching to office, clear transaction_number
                handleChange(e);
                // @ts-ignore (in case your handleChange is typed)
                setFormData?.((prev: any) => ({ ...prev, transaction_number: '' }));
              }}
            />
            <div className="payOptionBody">
              <div className="payOptTitle">Pay at Office</div>
              <div className="payOptSub">Pay in-person at our office counter.</div>
            </div>
          </label>
        </div>

        {/* Hidden QR: only visible after click */}
        {formData.payment_method === 'qr' ? (
          <div className="qrHiddenBox">
            <button
              type="button"
              className="revealBtn"
              onClick={() =>
                // @ts-ignore - you can add local state showQrEnroll if you want
                setShowQrEnroll?.((v: boolean) => !v)
              }
            >
              {/* @ts-ignore */}
              {showQrEnroll ? 'Hide QR Code' : 'Show QR Code'}
            </button>

            {/* @ts-ignore */}
            {showQrEnroll ? (
              <div className="qrReveal">
                <div className="qrWrap">
                  <img
                    className="qrImg"
                    src='/images/TechnobrenQR.jpeg'
                    alt="Temporary Registration Fee QR Code"
                  />
                </div>
                {/* <div className="qrCaption">Temporary QR (replace later)</div> */}
              </div>
            ) : (
              <div className="qrHint">QR code is hidden. Click “Show QR Code” to view and scan.</div>
            )}
          </div>
        ) : (
          <div className="officeInfo">
            <div className="officeBadge">Pay at Office Selected</div>
            <p className="officeText">
              You can pay at the office. After submitting, our team will contact you with office details.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="enrollForm">
          <div className="field">
            <label className="fieldLabel">Full Name</label>
            <input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="formInput"
            />
          </div>

          <div className="field">
            <label className="fieldLabel">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="formInput"
            />
          </div>

          <div className="field">
            <label className="fieldLabel">Phone Number</label>
            <input
              name="phone_number"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              className="formInput"
            />
          </div>

          <div className="field">
            <label className="fieldLabel">College (Optional)</label>
            <input
              name="college"
              placeholder="College (Optional)"
              value={formData.college}
              onChange={handleChange}
              className="formInput"
            />
          </div>

          {/* Transaction number only for QR */}
          {formData.payment_method === 'qr' && (
            <div className="field">
              <label className="fieldLabel">Transaction Number (UTR / UPI Ref No.)</label>
              <input
                name="transaction_number"
                placeholder="Eg: 123456789012 / UPI Ref No."
                value={formData.transaction_number}
                onChange={handleChange}
                required
                className="formInput"
              />
              <div className="helpText">We use this to verify your payment quickly.</div>
            </div>
          )}

          <button type="submit" disabled={submitting} className="formButton">
            {submitting ? 'Submitting...' : 'Submit →'}
          </button>
        </form>
      </div>
    </div>

    {/* CSS */}
    <style jsx>{`
      .enrollOverlay {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 12px;
      }

      .enrollModal {
        width: 100%;
        max-width: 1020px;
        height: min(90vh, 720px);
        background: #fff;
        border-radius: 14px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
      }

      @media (min-width: 900px) {
        .enrollModal {
          grid-template-columns: 1.05fr 0.95fr;
        }
      }

      .enrollLeft {
        padding: 26px;
        background: linear-gradient(180deg, #fbfbff 0%, #ffffff 100%);
        overflow: auto;
        border-bottom: 1px solid #eee;
      }

      @media (min-width: 900px) {
        .enrollLeft {
          border-bottom: none;
          border-right: 1px solid #eee;
        }
      }

      .enrollRight {
        padding: 26px;
        position: relative;
        overflow: auto;
      }

      .enrollClose {
        position: absolute;
        top: 10px;
        right: 12px;
        border: none;
        background: #f3f4f6;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 18px;
      }

      .courseTitle {
        margin: 0 0 6px;
        font-weight: 800;
        color: #0f172a;
      }

      .courseCategory {
        margin: 0;
        color: #64748b;
        font-size: 14px;
      }

      .offerBadge {
        margin-top: 12px;
        background: #e6f7ee;
        color: #008a4e;
        padding: 8px 14px;
        border-radius: 10px;
        font-weight: 700;
        width: fit-content;
        font-size: 13px;
      }

      .metaCard {
        margin-top: 14px;
        border: 1px solid #eee;
        border-radius: 12px;
        padding: 14px;
        background: #fafafa;
      }

      .metaRow {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .metaRow:last-child {
        margin-bottom: 0;
      }

      .metaKey {
        color: #888;
      }

      .metaVal {
        color: #111827;
      }

      .featuresBlock {
        margin-top: 16px;
      }

      .featuresTitle {
        margin: 0 0 10px;
        font-weight: 800;
        color: #0f172a;
      }

      .featuresList {
        padding-left: 0;
        list-style: none;
        margin: 0;
        display: grid;
        gap: 8px;
      }

      .featureItem {
        display: flex;
        gap: 10px;
        font-size: 14px;
        line-height: 1.5;
        color: #111827;
      }

      .tick {
        color: #16a34a;
        font-weight: 900;
      }

      .enrollFormTitle {
        text-align: center;
        margin: 0 0 14px;
        font-weight: 900;
        color: #0f172a;
      }

      .notice {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.18);
        padding: 10px 12px;
        border-radius: 12px;
        margin-bottom: 12px;
      }

      .noticeIcon {
        margin-top: 1px;
      }

      .noticeText {
        font-size: 13px;
        color: #991b1b;
      }

      .payMethods {
        display: grid;
        gap: 10px;
        margin-bottom: 12px;
      }

      .payOption {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        background: #fafafa;
        cursor: pointer;
      }

      .payOption.active {
        border-color: rgba(99, 102, 241, 0.65);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        background: #ffffff;
      }

      .payOption input {
        margin-top: 4px;
      }

      .payOptTitle {
        font-weight: 900;
        font-size: 13px;
        color: #0f172a;
      }

      .payOptSub {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }

      .qrHiddenBox {
        border: 1px dashed #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        background: #fff;
        margin-bottom: 14px;
      }

      .revealBtn {
        width: 100%;
        border: 1px solid #e5e7eb;
        background: #f8fafc;
        color: #0f172a;
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 900;
      }

      .qrHint {
        margin-top: 10px;
        font-size: 12px;
        color: #64748b;
      }

      .qrReveal {
        margin-top: 12px;
        display: grid;
        place-items: center;
        gap: 8px;
      }

      .qrWrap {
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 12px;
      }

      .qrImg {
        width: 240px;
        height: 240px;
        border-radius: 12px;
        object-fit: cover;
      }

      .qrCaption {
        font-size: 12px;
        color: #64748b;
      }

      .officeInfo {
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        background: #f8fafc;
        padding: 12px;
        margin-bottom: 14px;
      }

      .officeBadge {
        display: inline-block;
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.2);
        color: #166534;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 900;
        margin-bottom: 8px;
      }

      .officeText {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.35;
      }

      .enrollForm {
        display: grid;
        gap: 12px;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .fieldLabel {
        font-size: 13px;
        font-weight: 700;
        color: #334155;
      }

      .formInput {
        border: 1px solid #e5e7eb;
        background: #fff;
        padding: 12px;
        border-radius: 12px;
        outline: none;
      }

      .formInput:focus {
        border-color: rgba(99, 102, 241, 0.65);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
      }

      .helpText {
        font-size: 12px;
        color: #64748b;
      }

      .formButton {
        background: #111827;
        color: #fff;
        border: none;
        padding: 12px 16px;
        border-radius: 12px;
        font-weight: 900;
        cursor: pointer;
        margin-top: 6px;
      }

      .formButton:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    `}</style>
  </div>
)}
</div>
  );
}
