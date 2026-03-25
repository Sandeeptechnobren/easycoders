'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import api from "@/lib/axios";

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
    <section>

      {/* Header Section (Same as About Page) */}
      <PageHeader
        title="Let’s Connect"
        description="Have questions about courses, training or career guidance? We’re here to help."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact Us" }
        ]}
      />

      {/* Contact Info + Form Section */}
      <section className="section-block">
        <div className="container">
          <div className="row">

            {/* Left Side - Contact Info */}
            <div className="col-md-5">
              <div className="storyBlock">
                <h2 className="mb-4">Get In Touch</h2>

                <p>
                  <strong>Easy Coders</strong><br />
                  Technobren Infotech Pvt. Ltd<br />
                  City Tower, Varanasi - Lucknow Rd,<br />
                  Wazidpur, Jaunpur, Uttar Pradesh – 222002
                </p>

                <p><strong>Email:</strong> easycoders1@gmail.com</p>

                <hr className="divider" />

                <h4 className="tagline fontAdlam">
                  Build Your Career <br /> With Us
                </h4>

                <div style={{ borderRadius: 14, overflow: "hidden", marginTop: 20 }}>
                  <iframe
                    src="https://www.google.com/maps?q=jaunpur&output=embed"
                    height="220"
                    style={{ border: 0, width: "100%" }}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            <div className="col-md-1"></div>

            {/* Right Side - Contact Form */}
            <div className="col-md-6">
              <div className="iconTextBlock">
                <h3 className="mb-4">Send Us a Message</h3>

                <form
                  onSubmit={handleSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="form-control"
                  />

                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-control"
                  />

                  <textarea
                    rows={5}
                    placeholder="Your Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="form-control"
                    style={{ resize: "none" }}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary mt-2"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section (Same Pattern as About) */}
      <section className="section-block">
        <div className="container text-center">
          <div
            style={{
              padding: "40px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              color: "white"
            }}
          >
            <h2 className="mb-3">Ready to Start Learning?</h2>
            <p>Explore our practical courses and become job-ready.</p>
          </div>
        </div>
      </section>

    </section>
  );
}