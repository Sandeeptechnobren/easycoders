'use client';

import PageHeader from "@/components/PageHeader";
import api from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.post("/contact", { name, email, message });
      alert("Thank you! We will contact you shortly.");
      router.push("/");
    } catch {
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --primary: #0f172a;
          --accent: #f97316;
          --accent-light: #fff7ed;
          --muted: #64748b;
          --border: #e2e8f0;
          --surface: #f8fafc;
          --white: #ffffff;
          --radius: 16px;
          --indigo: #6366f1;
        }

        .ct-page {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
        }

        /* ── MAIN SECTION ── */
        .ct-section {
          padding: 72px 24px 96px;
        }

        .ct-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .ct-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }

        @media (max-width: 860px) {
          .ct-grid { grid-template-columns: 1fr; gap: 40px; }
          .cta-inner { flex-direction: column !important; text-align: center; padding: 40px 28px !important; }
          .cta-inner h2 { font-size: 24px !important; }
        }

        /* ── LEFT: INFO ── */
        .ct-info { display: flex; flex-direction: column; gap: 28px; }

        .ct-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--accent-light);
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 4px 13px;
          border-radius: 100px;
          width: fit-content;
        }

        .ct-eyebrow::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
        }

        .ct-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3.5vw, 38px);
          font-weight: 700;
          color: var(--primary);
          line-height: 1.2;
          letter-spacing: -.02em;
          margin: 0;
        }

        .ct-title em { font-style: italic; color: var(--accent); }

        /* Info cards */
        .info-cards { display: flex; flex-direction: column; gap: 14px; }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 14px;
          padding: 18px 20px;
          transition: box-shadow .2s;
        }

        .info-card:hover { box-shadow: 0 4px 20px rgba(15,23,42,.06); }

        .info-icon {
          width: 40px; height: 40px;
          border-radius: 11px;
          background: var(--accent-light);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          color: var(--accent);
        }

        .info-card-body {}
        .info-card-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .info-card-value {
          font-size: 14px;
          color: var(--primary);
          line-height: 1.6;
          font-weight: 500;
        }
        .info-card-value a {
          color: var(--accent);
          text-decoration: none;
        }
        .info-card-value a:hover { text-decoration: underline; }

        /* Divider */
        .ct-divider {
          width: 44px; height: 3px;
          background: var(--accent);
          border-radius: 2px;
          border: none;
        }

        .ct-tagline {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 600;
          color: var(--primary);
          line-height: 1.5;
          margin: 0;
        }

        /* Map */
        .map-wrap {
          border-radius: 14px;
          overflow: hidden;
          border: .5px solid var(--border);
          box-shadow: 0 2px 12px rgba(15,23,42,.05);
        }

        .map-wrap iframe {
          display: block;
          width: 100%;
          height: 200px;
          border: 0;
        }

        /* ── RIGHT: FORM ── */
        .ct-form-card {
          background: var(--white);
          border: .5px solid var(--border);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 4px 24px rgba(15,23,42,.07);
        }

        .form-heading {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          margin: 0 0 6px;
          letter-spacing: -.01em;
        }

        .form-sub {
          font-size: 14px;
          color: var(--muted);
          margin: 0 0 28px;
          line-height: 1.55;
        }

        .ct-form { display: flex; flex-direction: column; gap: 16px; }

        .field-group { display: flex; flex-direction: column; gap: 6px; }

        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .field-input,
        .field-textarea {
          border: .5px solid var(--border);
          background: var(--surface);
          padding: 12px 14px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: var(--primary);
          outline: none;
          transition: border-color .2s, box-shadow .2s, background .2s;
          width: 100%;
          box-sizing: border-box;
        }

        .field-input::placeholder,
        .field-textarea::placeholder { color: #94a3b8; }

        .field-input:focus,
        .field-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(249,115,22,.1);
          background: var(--white);
        }

        .field-textarea { resize: none; }

        .submit-btn {
          width: 100%;
          background: var(--primary);
          color: var(--white);
          border: none;
          padding: 14px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          letter-spacing: .01em;
          transition: background .2s, transform .15s;
          margin-top: 4px;
        }

        .submit-btn:hover { background: var(--accent); transform: translateY(-1px); }
        .submit-btn:disabled { opacity: .65; cursor: not-allowed; transform: none; }

        /* ── CTA BAND ── */
        .cta-band {
          background: var(--primary);
          padding: 56px 24px;
        }

        .cta-inner-wrap {
          max-width: 1120px;
          margin: 0 auto;
        }

        .cta-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          background: rgba(255,255,255,.05);
          border: .5px solid rgba(255,255,255,.1);
          border-radius: 20px;
          padding: 44px 52px;
        }

        .cta-text h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(22px, 3vw, 32px);
          font-weight: 700;
          color: var(--white);
          margin: 0 0 8px;
          line-height: 1.25;
          letter-spacing: -.02em;
        }

        .cta-text h2 em { font-style: italic; color: var(--accent); }

        .cta-text p {
          font-size: 15px;
          color: rgba(255,255,255,.55);
          margin: 0;
          line-height: 1.6;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: var(--white);
          border: none;
          padding: 14px 28px;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          transition: background .2s, transform .15s;
          flex-shrink: 0;
        }

        .cta-btn:hover { background: #ea6500; transform: translateY(-1px); color: white; text-decoration: none; }
      `}</style>

      <section className="ct-page inner-block">
        <PageHeader
          title="Let's Connect"
          description="Have questions about courses, training or career guidance? We're here to help."
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Contact Us" },
          ]}
        />

        {/* ── MAIN ── */}
        <section className="ct-section">
          <div className="ct-container">
            <div className="ct-grid">

              {/* LEFT INFO */}
              <div className="ct-info">
                <div>
                  <div className="ct-eyebrow">Contact Us</div>
                    <h2 className="ct-title" style={{ marginTop: 14 }}>
                      We&apos;d love to <em>hear from you</em>
                    </h2>
                </div>

                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div className="info-card-body">
                      <div className="info-card-label">Address</div>
                      <div className="info-card-value">
                        Technobren Infotech Pvt. Ltd<br />
                        City Tower, Varanasi–Lucknow Rd,<br />
                        Wazidpur, Jaunpur, UP – 222002
                      </div>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div className="info-card-body">
                      <div className="info-card-label">Email</div>
                      <div className="info-card-value">
                        <a href="mailto:team@easycoders.in">team@easycoders.in</a>
                      </div>
                    </div>
                    <br />
                    <div className="info-icon">
                      <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
    <path d="M160.2 25C152.3 6.1 131.7-3.9 112.1 1.4l-5.5 1.5c-64.6 17.6-119.8 80.2-103.7 156.4 37.1 175 174.8 312.7 349.8 349.8 76.3 16.2 138.8-39.1 156.4-103.7l1.5-5.5c5.4-19.7-4.7-40.3-23.5-48.1l-97.3-40.5c-16.5-6.9-35.6-2.1-47 11.8l-38.6 47.2C233.9 335.4 177.3 277 144.8 205.3L189 169.3c13.9-11.3 18.6-30.4 11.8-47L160.2 25z"/>
  </svg>
                    </div>
                    <div className="info-card-body">
                      <div className="info-card-label">Tel.</div>
                      <div className="info-card-value">
                        <a href="tel:+917523930301">+91 7523930301</a>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="ct-divider" />

                <p className="ct-tagline">Build Your Career<br />With Us</p>

                <div className="map-wrap">
                  <iframe
                    src="https://www.google.com/maps?q=jaunpur&output=embed"
                    loading="lazy"
                    title="Office Location"
                  />
                </div>
              </div>

              {/* RIGHT FORM */}
              <div className="ct-form-card">
                <h3 className="form-heading">Send Us a Message</h3>
                <p className="form-sub">Fill in the details below and our team will get back to you within 24 hours.</p>

                <form className="ct-form" onSubmit={handleSubmit}>
                  <div className="field-group">
                    <label className="field-label">Full Name</label>
                    <input
                      className="field-input"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Email Address</label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Your Message</label>
                    <textarea
                      className="field-textarea"
                      rows={5}
                      placeholder="Tell us how we can help…"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" disabled={submitting} className="submit-btn">
                    {submitting ? "Sending…" : "Send Message →"}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <div className="cta-band">
          <div className="cta-inner-wrap">
            <div className="cta-inner">
              <div className="cta-text">
                <h2>Ready to Start <em>Learning?</em></h2>
                <p>Explore our practical courses and become job-ready with industry mentors.</p>
              </div>
              <Link href="/courses" className="cta-btn">
                Explore Courses →
              </Link>
            </div>
          </div>
        </div>

      </section>
    </>
  );
}