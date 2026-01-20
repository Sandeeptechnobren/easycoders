'use client';

import styles from './about.module.css';

const trainersData = [
  {
    id: 1,
    name: 'Rahul Sharma',
    designation: 'Senior Web Development Trainer',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 2,
    name: 'Anjali Verma',
    designation: 'React & Frontend Trainer',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 3,
    name: 'Amit Patel',
    designation: 'Backend & Laravel Trainer',
    photo: 'https://randomuser.me/api/portraits/men/56.jpg',
  },
];

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>

      {/* ABOUT INTRO */}
      <section className={styles.aboutSection}>
        <h1 className={styles.mainTitle}>About Us</h1>
        <p className={styles.subtitle}>
          Building Skills. Shaping Careers. Empowering Futures.
        </p>

        <p className={styles.description}>
          We are a technology-focused training institute committed to transforming
          beginners into confident, job-ready professionals. Our goal is not just
          to teach tools or languages, but to build strong foundations,
          problem-solving skills, and a real-world development mindset.
        </p>

        <p className={styles.description}>
          At our institute, learning goes beyond theory. Every concept is backed
          by practical examples, live projects, and industry-oriented workflows
          so that students understand how things actually work in real companies.
        </p>
      </section>

      {/* WHAT MAKES US DIFFERENT */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>What Makes Us Different</h2>

        <ul className={styles.featureList}>
          <li>Industry-experienced trainers with real project exposure</li>
          <li>Hands-on training with live coding and assignments</li>
          <li>Structured learning paths from basics to advanced</li>
          <li>Career-oriented approach aligned with industry needs</li>
          <li>Personal mentoring and dedicated doubt-solving sessions</li>
        </ul>
      </section>

      {/* MISSION & VISION */}
      <section className={styles.missionVisionSection}>
        <div className={styles.missionBox}>
          <h3>Our Mission</h3>
          <p>
            To bridge the gap between academic learning and industry expectations
            by delivering practical, affordable, and high-quality technical
            education that prepares students for real-world challenges.
          </p>
        </div>

        <div className={styles.visionBox}>
          <h3>Our Vision</h3>
          <p>
            To become a trusted learning partner for students and professionals
            who want to build successful careers in technology through clarity,
            consistency, and confidence.
          </p>
        </div>
      </section>

      {/* TRAINERS */}
      <section className={styles.teamSection}>
        <h2 className={styles.sectionTitle}> Our Team</h2>
        <p className={styles.teamIntro}>
          Our trainers are the backbone of our institute. Each trainer brings deep
          technical expertise, industry exposure, and a passion for teaching.
        </p>

        {/* <div className={styles.trainerGrid}>
          {trainersData.map(trainer => (
            <div key={trainer.id} className={styles.trainerCard}>
              <img
                src={trainer.photo}
                alt={trainer.name}
                className={styles.trainerImage}
              />
              <h3 className={styles.trainerName}>{trainer.name}</h3>
              <p className={styles.trainerRole}>{trainer.designation}</p>
            </div>
          ))}
        </div> */}
      </section>

    </div>
  );
}
