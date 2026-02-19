'use client';

import api from '@/lib/axios';
import { useEffect, useState } from 'react';

export default function Registration() {
  const [show, setShow] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting]= useState(false);
  useEffect(() => {
    setShow(true);
  }, []);
  const closePopup = () => {
    setShow(false);
    localStorage.setItem('reg_popup_dismissed', '1');
  };
useEffect(() => {
  const endpoint = "/courses";
  api.get(endpoint)
    .then((res) => {
      setCourses(res.data?.data ?? res.data);
    })
    .catch((err) => console.error(err));
}, []);

const handleRegistrationSubmit=async (e: React.FormEvent)=> {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  try {
    setSubmitting(true);
    await api.post('/addenrollmentrequest',{
      course_id: selectedCourse,
      // name: (e.target as any).name.value,
      // email: (e.target as any).email.value,
      // phone_number:(e.target as any).phone.value,
      // college:(e.target as any).college.value,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone_number: (form.elements.namedItem("phone") as HTMLInputElement).value,
      college: (form.elements.namedItem("college") as HTMLInputElement).value,
    });
    alert('Registration successful! We will contact you soon.');
    setOpenForm(false);
    setSubmitting(false);
  }
  catch(err){
    console.error(err);
    alert('Something went wrong. Please try again later.');
  }
};
if (!show) return null;
return (
  <>
    <div className="overlay">
      <div className="popup">
        <button className="close" onClick={closePopup}>✕</button>
      <span className="badge">Registrations Open </span>
      <div className="marquee-container">
        <h3 className="marquee-title">🚀 Upcoming Batches Registration</h3>
      </div>
      <p className="subtitle">
          Registration started for <b>Summer Training</b> & <b>Internship</b>
        </p>
        {!openForm ? (
          <>
            <div className="cards">
              <div className="card">
                <h4>Summer Training</h4>
                <p>Learn fundamentals & build projects with mentor support.</p>
                <ul>
                  <li>Beginner friendly</li>
                  <li>Live guidance</li>
                  <li>Certificate</li>
                </ul>
              </div>
              <div className="card">
                <h4>Internship</h4>
                <p>Work on real tasks & improve your portfolio.</p>
                <ul>
                  <li>Real projects</li>
                  <li>Mentorship</li>
                  <li>Internship letter</li>
                </ul>
              </div>
            </div>
            <div className="actions">
              <button className="cta" onClick={() => setOpenForm(true)}>
                Register Now
              </button>
              <button className="secondary" onClick={closePopup}>
                Maybe later
              </button>
            </div>
          </>
        ) : (
          <>
            <h4 className="formTitle">Complete Your Registration</h4>
            <form
              className="form"
              onSubmit={handleRegistrationSubmit}
            >
              {/* <input placeholder="Full Name" required id='name' />
              <input placeholder="Phone Number" required />
              <input type="email" placeholder="Email Address" required />
              <input placeholder="College" required /> */}
<input name="name" placeholder="Full Name" required />
<input name="phone" placeholder="Phone Number" required />
<input name="email" type="email" placeholder="Email Address" required />
<input name="college" placeholder="College" required />

              <select required value={selectedCourse} onChange={(e)=>setSelectedCourse(e.target.value)}>
                <option value="">Select Program</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title} {course.category?.name ? `(${course.category.name})` : ""}
                  </option>
                ))}
              </select>
              {/* <select required>
                <option value="">Select Domain</option>
                <option>Web Development</option>
                <option>App Development</option>
                <option>Data / Analytics</option>
                <option>UI / UX</option>
              </select> */}
              {/* <textarea placeholder="Any questions? (optional)" /> */}
              <div className="actions">
                <button className="cta" type="submit">
                  Submit
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setOpenForm(false)}
                >
                  Back
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
    <style jsx>{`
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0.4,0.7, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .popup {
        background: #0b0f19;
        color: #e9eefc;
        width: 100%;
        max-width: 720px;
        border-radius: 18px;
        padding: 20px;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
      }

      .close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        cursor: pointer;
      }

      .badge {
        display: inline-block;
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(99, 102, 241, 0.4);
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        margin-bottom: 10px;
      }

      .marquee-container {
        overflow: hidden;
        background: rgba(99, 102, 241, 0.1);
        border-radius: 8px;
        padding: 8px 0;
        margin-bottom: 12px;
      }

      .marquee-container .marquee-title {
        animation: scroll 15s linear alternate;
        margin: 0;
        padding: 0 16px;
        white-space: nowrap;
        display: inline-block;
      }

      @keyframes scroll {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(-100%);
        }
      }

      .title {
        margin: 8px 0;
        font-size: 22px;
      }

      .subtitle {
        margin-bottom: 16px;
        color: rgba(233, 238, 252, 0.75);
      }

      .cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      @media (min-width: 640px) {
        .cards {
          grid-template-columns: 1fr 1fr;
        }
      }

      .card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        padding: 14px;
      }

      .card h4 {
        color: #e9eefc;
        margin: 0 0 6px;
      }

      .card p {
        font-size: 14px;
        color: rgba(233, 238, 252, 0.7);
      }

      .card ul {
        color: #e9eefc;
        padding-left: 18px;
        font-size: 14px;
      }

      .actions {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        flex-wrap: wrap;
      }

      .cta {
        background: #e9eefc;
        color: #0b0f19;
        border: none;
        padding: 12px 18px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .secondary {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #e9eefc;
        padding: 12px 18px;
        border-radius: 12px;
        cursor: pointer;
      }

      .formTitle {
        margin-top: 10px;
        font-size: 18px;
      }

      .form {
        display: grid;
        gap: 10px;
        margin-top: 12px;
      }

      .form input,
      .form select,
      .form textarea {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        padding: 12px;
        color: #e9eefc;
        outline: none;
      }

      .form textarea {
        resize: none;
      }
    `}</style>
  </>
);
}
