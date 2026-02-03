"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen">

      {/* HERO */}
      <section className="introSection global-header-bg">
        <div className="transparentDiv">
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
            <div className="internalIntro" style={{ alignItems: "flex-start", textAlign: "left" }}>
              <h1 style={{ fontSize: "42px", fontWeight: 900 }}>
                Let’s Talk 👋
              </h1>
              <p style={{ marginTop: 10, maxWidth: 450 }}>
                Have questions about courses, training or careers?  
                Our team is here to help you.
              </p>
            </div>

            <div className="internalIntro introImage" />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="description">

        <div className="cardGrid">

          {/* LEFT – INFO */}
          <div className="courseCard">
            <h3 className="cardTitle">Our Office</h3>

            <p className="testimonialText">
              <strong>Easy Coders</strong><br />
              Technobren Infotech Pvt. Ltd<br />
              City Tower, Varanasi - Lucknow Rd,<br />
              Wazidpur, Jaunpur, Uttar Pradesh – 222002
            </p>

            <p className="testimonialText">
              ✉️ easycoders1@gmail.com
            </p>

            <div style={{ borderRadius: 14, overflow: "hidden", marginTop: 15 }}>
              <iframe
                src="https://www.google.com/maps?q=jaunpur&output=embed"
                height="220"
                style={{ border: 0, width: "100%" }}
                loading="lazy"
              />
            </div>
          </div>

          {/* RIGHT – FORM */}
          {/* <div className="courseCard">
            <h3 className="cardTitle">Send Us a Message</h3>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="searchInput"
              />

              <input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="searchInput"
              />

              <textarea
                placeholder="Your Message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="searchInput"
                style={{ borderRadius: 14 }}
              />

              <button
                type="submit"
                disabled={submitting}
                className="enrollBtn"
                style={{ alignSelf: "flex-end", padding: "10px 20px" }}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div> */}
          <div className="courseCard">
  <h3 className="cardTitle" style={{ textAlign: "center" }}>
    Send Us a Message
  </h3>

  <p style={{ textAlign: "center", color: "#666", marginBottom: 20 }}>
    Have a question? Fill the form and our team will reach out.
  </p>

  <form
    onSubmit={handleSubmit}
    style={{ display: "flex", flexDirection: "column", gap: 18 }}
  >
    <div className="formGroup">
      <label className="formLabel">Full Name</label>
      <input
        placeholder="Enter your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="formInput"
      />
    </div>

    <div className="formGroup">
      <label className="formLabel">Email Address</label>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="formInput"
      />
    </div>

    <div className="formGroup">
      <label className="formLabel">Message</label>
      <textarea
        placeholder="Write your message here..."
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        className="formInput"
        style={{ resize: "none" }}
      />
    </div>

    <button
      type="submit"
      disabled={submitting}
      className="formButton"
      style={{ alignSelf: "flex-end", padding: "10px 24px" }}
    >
      {submitting ? "Sending..." : "Send Message →"}
    </button>
  </form>
</div>

    </div>
        <div
          className="courseCard"
          style={{
            marginTop: 40,
            textAlign: "center",
            background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            color: "white"
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>
            Ready to start your coding journey?
          </h2>
          <p style={{ opacity: 0.9, marginTop: 8 }}>
            Explore our courses and become job-ready.
          </p>
        </div>
      </section>
    </div>
  );
}
