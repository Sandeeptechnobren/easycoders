'use client';

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="introSection global-header-bg">
        <div className="transparentDiv">
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>

            <div className="internalIntro" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <h1 style={{ fontSize: '42px', fontWeight: 900 }}>
                We Build Developers,<br />Not Just Courses
              </h1>
              <p style={{ marginTop: 15, fontSize: 16, maxWidth: 500 }}>
                EasyCoders is a modern tech learning platform focused on real-world
                development skills and career growth.
              </p>
            </div>

            <div className="internalIntro introImage" />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="description">

        {/* STATS STRIP */}
        <div className="cardGrid" style={{ marginBottom: 40 }}>
          {[
            // { label: "Students Trained", value: "5,00+" },
            { label: "Live Projects", value: "120+" },
            { label: "Expert Trainers", value: "15+" },
            { label: "Placement Support", value: "100%" },
          ].map((stat, i) => (
            <div key={i} className="courseCard" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#8B5CF6' }}>
                {stat.value}
              </h2>
              <p className="testimonialRole">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* STORY */}
        <div className="courseCard" style={{ marginBottom: 40 }}>
          <h2 className="sectionTitle">Our Story</h2>
          <p className="testimonialText">
            EasyCoders was born from a simple problem: students learn syntax,
            but struggle to build real applications. We decided to flip the
            learning model — focusing on projects, workflows, and problem-solving.
          </p>
          <p className="testimonialText">
            Today, we help learners go from zero to job-ready through
            structured learning paths, mentorship, and industry-style training.
          </p>
        </div>

        {/* MISSION / VISION */}
        <div className="cardGrid" style={{ marginBottom: 40 }}>
          <div className="courseCard">
            <h3 className="cardTitle">Our Mission</h3>
            <p className="testimonialText">
              To create confident developers by providing practical,
              project-driven and career-focused technical education.
            </p>
          </div>

          <div className="courseCard">
            <h3 className="cardTitle">Our Vision</h3>
            <p className="testimonialText">
              To become the most trusted platform for learning real-world
              software development skills globally.
            </p>
          </div>
        </div>

        {/* TEAM */}
        {/* <h2 className="sectionTitle">Meet The Team</h2>
        <div className="cardGrid">
          {[
            { name: "Rahul Sharma", role: "Senior Web Trainer" },
            { name: "Anjali Verma", role: "React Trainer" },
            { name: "Amit Patel", role: "Backend Trainer" }
          ].map((t, i) => (
            <div key={i} className="courseCard testimonialCard">
              <div className="testimonialImage" />
              <h3 className="cardTitle">{t.name}</h3>
              <p className="testimonialRole">{t.role}</p>
            </div>
          ))}
        </div> */}

      </section>
    </div>
  );
}
