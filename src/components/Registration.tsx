'use client';

import api from '@/lib/axios';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function Registration() {
  const [show, setShow] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [panelPlacement, setPanelPlacement] = useState<'down' | 'up'>('down');
  const [panelMaxHeight, setPanelMaxHeight] = useState<number>(220);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setShow(true);
  }, []);

  const closePopup = () => {
    setShow(false);
    localStorage.setItem('reg_popup_dismissed', '1');
  };

  // Fetch courses once
  useEffect(() => {
    api
      .get('/courses')
      .then((res) => setCourses(res.data?.data ?? res.data))
      .catch((err) => console.error(err));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setCourseOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCourses = courses.filter((c) => {
    const label = `${c.title} ${c.category?.name ? `(${c.category.name})` : ''}`.toLowerCase();
    return label.includes(courseSearch.toLowerCase());
  });

  // Auto-place dropdown above/below depending on space
  const computeDropdownPlacement = () => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const gap = 10; // space between button and panel
    const margin = 12; // safe margin from viewport edges
    const desiredPanelHeight = 320; // target available height for list+search

    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;

    // Prefer side with more space, but try to keep at least some usable height
    const placeDown = spaceBelow >= Math.min(desiredPanelHeight, 180) || spaceBelow >= spaceAbove;

    const available = placeDown ? spaceBelow : spaceAbove;

    // Set max height for scroll area (minus search + padding)
    const computedMaxHeight = Math.max(160, Math.min(available - 70, 360)); // 70 ~ header/search/padding

    setPanelPlacement(placeDown ? 'down' : 'up');
    setPanelMaxHeight(computedMaxHeight);
  };

  // Compute placement when opening, and on resize/scroll while open
  useLayoutEffect(() => {
    if (!courseOpen) return;

    computeDropdownPlacement();

    const onResize = () => computeDropdownPlacement();
    const onScroll = () => computeDropdownPlacement();

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true); // true catches scroll in containers too
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseOpen]);

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;

    if (!selectedCourse) {
      alert('Please select a program.');
      return;
    }

    try {
      setSubmitting(true);

      await api.post('/addenrollmentrequest', {
        course_id: selectedCourse,
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        phone_number: (form.elements.namedItem('phone') as HTMLInputElement).value,
        college: (form.elements.namedItem('college') as HTMLInputElement).value,
      });

      alert('Registration successful! We will contact you soon.');
      setOpenForm(false);
      setSelectedCourse('');
      setCourseSearch('');
      setCourseOpen(false);
      setSubmitting(false);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Something went wrong. Please try again later.');
    }
  };

  if (!show) return null;

  const selectedLabel = selectedCourse
    ? (() => {
        const c = courses.find((x) => String(x.id) === String(selectedCourse));
        return c ? `${c.title}${c.category?.name ? ` (${c.category.name})` : ''}` : 'Selected program';
      })()
    : '';

  return (
    <>
      <div className="overlay">
        <div className="popup">
          <button className="close" onClick={closePopup}>
            ✕
          </button>

          <span className="badge">Registrations Open</span>

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

              <form className="form" onSubmit={handleRegistrationSubmit}>
                <input name="name" placeholder="Full Name" required />
                <input name="phone" placeholder="Phone Number" required />
                <input name="email" type="email" placeholder="Email Address" required />
                <input name="college" placeholder="College" required />
                <div className="selectWrap" ref={dropdownRef}>
                  <label className="selectLabel">Select Program</label>
                  <button
                    ref={buttonRef}
                    type="button"
                    className={`selectButton ${courseOpen ? 'open' : ''}`}
                    onClick={() => setCourseOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={courseOpen}
                  >
                    <span className={`selectValue ${selectedCourse ? '' : 'placeholder'}`}>
                      {selectedCourse ? selectedLabel : 'Select Program'}
                    </span>
                    <span className="chev">▾</span>
                  </button>
                  {courseOpen && (
                    <div
                      ref={panelRef}
                      className={`selectPanel ${panelPlacement === 'up' ? 'up' : 'down'}`}
                      style={
                        {
                          '--listMax': `${panelMaxHeight}px`,
                        } as React.CSSProperties
                      }
                    >
                      <input
                        className="selectSearch"
                        placeholder="Search program..."
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        autoFocus
                      />

                      <div className="selectList" role="listbox">
                        {filteredCourses.length === 0 ? (
                          <div className="selectEmpty">No programs found</div>
                        ) : (
                          filteredCourses.map((course) => {
                            const active = String(course.id) === String(selectedCourse);

                            return (
                              <button
                                key={course.id}
                                type="button"
                                className={`selectItem ${active ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedCourse(String(course.id));
                                  setCourseOpen(false);
                                  setCourseSearch('');
                                }}
                                role="option"
                                aria-selected={active}
                              >
                                <span className="selectItemTitle">{course.title}</span>
                                {course.category?.name && (
                                  <span className="selectItemTag">{course.category.name}</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <input type="hidden" name="course_id" value={selectedCourse} required />
                      {!selectedCourse && <p className="selectHint">Please select a program</p>}
                    </div>
                  )}
                </div>

                <div className="actions">
                  <button className="cta" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setOpenForm(false);
                      setCourseOpen(false);
                    }}
                    disabled={submitting}
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
          background: rgba(0, 0, 0, 0.75);
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

        .cta:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e9eefc;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
        }

        .secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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
        .form textarea {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          color: #e9eefc;
          outline: none;
        }

        /* ===== Custom Dropdown Styles ===== */

        .selectWrap {
          position: relative;
          display: grid;
          gap: 6px;
        }

        .selectLabel {
          font-size: 13px;
          color: rgba(233, 238, 252, 0.75);
          padding-left: 4px;
        }

        .selectButton {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px;
          color: #e9eefc;
          outline: none;
          cursor: pointer;
          transition: border 0.15s ease, box-shadow 0.15s ease;
        }

        .selectButton.open {
          border-color: rgba(99, 102, 241, 0.65);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        .selectValue {
          text-align: left;
          font-size: 14px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .selectValue.placeholder {
          color: rgba(233, 238, 252, 0.6);
        }

        .chev {
          opacity: 0.9;
          font-size: 14px;
        }

        .selectPanel {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 99999;

          background: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 10px;

          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.65);

          /* crisp visibility */
          backdrop-filter: blur(6px);
        }

        .selectPanel.down {
          top: calc(100% + 10px);
        }

        .selectPanel.up {
          bottom: calc(100% + 10px);
        }

        .selectSearch {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e9eefc;
          outline: none;
        }

        .selectSearch:focus {
          border-color: rgba(99, 102, 241, 0.65);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        .selectList {
          margin-top: 10px;
          max-height: var(--listMax, 220px);
          overflow: auto;
          display: grid;
          gap: 8px;
          padding-right: 4px;
        }

        .selectItem {
          width: 100%;
          text-align: left;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 10px 12px;
          color: #e9eefc;
          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: transform 0.1s ease, border 0.15s ease;
        }

        .selectItem:hover {
          transform: translateY(-1px);
          border-color: rgba(99, 102, 241, 0.45);
        }

        .selectItem.active {
          border-color: rgba(99, 102, 241, 0.75);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }

        .selectItemTitle {
          font-size: 14px;
        }

        .selectItemTag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.18);
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: rgba(233, 238, 252, 0.95);
          white-space: nowrap;
        }

        .selectEmpty {
          padding: 12px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(233, 238, 252, 0.7);
          text-align: center;
          font-size: 13px;
        }

        .selectHint {
          margin: 10px 4px 0;
          font-size: 12px;
          color: rgba(233, 238, 252, 0.65);
        }
      `}</style>
    </>
  );
}