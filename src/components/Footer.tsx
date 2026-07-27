'use client';

import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

/* ──────────────────────────────────────────────────────────────────────────
 * Site footer.
 *
 * Re-skinned in May 2026 to match the navy + gold brand palette used by
 * the rest of the site (was a hard #000 slab that clashed with the navy
 * CTA section above it). Also fixed:
 *
 *  1. Every nav item is now a real <Link> — previously they were <li>text</li>
 *     so search engines saw zero internal links from the footer, and users
 *     could not click them.
 *  2. Added LocalBusiness + Organization JSON-LD so Google can render rich
 *     results for the brand panel (address, phone, social profiles).
 *  3. Switched logo from a CSS `invert()` filter hack to a dedicated white
 *     mark via next/image.
 *  4. All external links carry rel="noopener noreferrer".
 *  5. Address block is now wrapped in a semantic <address> element with
 *     microdata-friendly structure.
 *  6. Removed dead links to /terms /privacy /cookies (those pages do not
 *     exist). Linked only to pages that actually ship.
 * ────────────────────────────────────────────────────────────────────────── */

const INSTAGRAM_URL = 'https://www.instagram.com/easycodersjaunpur/';
const YOUTUBE_URL   = 'https://www.youtube.com/@easycoders';
const PHONE_DISPLAY = '+91 7523 930 301';
const PHONE_TEL     = '+917523930301';
const EMAIL         = 'team@easycoders.in';

/** Structured data — helps Google understand who we are, where we are,
 *  what we offer, and how to reach us. */
const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization', 'LocalBusiness'],
  name: 'Easy Coders',
  legalName: 'Technobren Infotech Pvt. Ltd.',
  url: 'https://easycoders.in',
  logo: 'https://easycoders.in/images/logo.svg',
  description:
    'Easy Coders is a coding-training institute offering Summer Training, Internship, Job-Oriented Programs and Language Training in MERN, PHP/Laravel, Python/Django and Android development.',
  email: EMAIL,
  telephone: PHONE_TEL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'City Tower, Varanasi–Lucknow Road, Wazidpur',
    addressLocality: 'Jaunpur',
    addressRegion: 'Uttar Pradesh',
    postalCode: '222002',
    addressCountry: 'IN',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: PHONE_TEL,
      contactType: 'customer service',
      email: EMAIL,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  ],
  sameAs: [INSTAGRAM_URL, YOUTUBE_URL],
};

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer className={styles.footer} role="contentinfo">
      {/* Schema.org JSON-LD for the organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
      />

      <div className={styles.inner}>
        {/* ───────── Brand column ───────── */}
        <div className={styles.brandCol}>
          <Link href="/" aria-label="Easy Coders — home" className={styles.brandLink}>
            <Image
              src="/images/logo.svg"
              alt="Easy Coders logo"
              width={170}
              height={56}
              className={styles.logo}
              priority={false}
            />
          </Link>
          <p className={styles.brandTagline}>
            India-based coding institute helping students go from absolute
            beginners to job-ready developers through project-led learning
            and dedicated mentorship.
          </p>
          <div className={styles.socials} aria-label="Easy Coders on social media">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Easy Coders on Instagram"
              className={styles.socialBtn}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.65.07 4.85 0 3.2-.012 3.584-.07 4.85-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.65.07-4.85.07-3.2 0-3.584-.012-4.85-.07-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.212 15.584 2.2 15.2 2.2 12c0-3.2.012-3.584.07-4.85.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.212 8.8 2.2 12 2.2zm0 1.8c-3.142 0-3.512.012-4.75.068-.99.045-1.53.21-1.886.349a3.13 3.13 0 00-1.16.756 3.13 3.13 0 00-.755 1.16c-.14.356-.305.896-.35 1.886C3.012 8.488 3 8.858 3 12s.012 3.512.068 4.75c.045.99.21 1.53.349 1.886a3.13 3.13 0 00.756 1.16 3.13 3.13 0 001.16.755c.356.14.896.305 1.886.35C8.488 20.988 8.858 21 12 21s3.512-.012 4.75-.068c.99-.045 1.53-.21 1.886-.349a3.13 3.13 0 001.16-.756 3.13 3.13 0 00.755-1.16c.14-.356.305-.896.35-1.886.057-1.238.069-1.608.069-4.75s-.012-3.512-.068-4.75c-.045-.99-.21-1.53-.349-1.886a3.13 3.13 0 00-.756-1.16 3.13 3.13 0 00-1.16-.755c-.356-.14-.896-.305-1.886-.35C15.512 3.012 15.142 3 12 3zm0 3.05a5.95 5.95 0 110 11.9 5.95 5.95 0 010-11.9zm0 1.8a4.15 4.15 0 100 8.3 4.15 4.15 0 000-8.3zm6.165-2.025a1.39 1.39 0 110 2.78 1.39 1.39 0 010-2.78z" />
              </svg>
            </a>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Subscribe to Easy Coders on YouTube"
              className={styles.socialBtn}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.51a3.02 3.02 0 00-2.13-2.14C19.55 3.9 12 3.9 12 3.9s-7.55 0-9.37.47A3.02 3.02 0 00.5 6.51 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.49 3.02 3.02 0 002.13 2.14c1.82.47 9.37.47 9.37.47s7.55 0 9.37-.47a3.02 3.02 0 002.13-2.14A31.6 31.6 0 0024 12a31.6 31.6 0 00-.5-5.49zM9.6 15.57V8.43L15.82 12 9.6 15.57z" />
              </svg>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              aria-label={`Email Easy Coders at ${EMAIL}`}
              className={styles.socialBtn}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </a>
          </div>
        </div>

        {/* ───────── Explore column ───────── */}
        <nav className={styles.linkCol} aria-label="Explore">
          <h2 className={styles.colHeading}>Explore</h2>
          <ul className={styles.linkList}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/courses">All Courses</Link></li>
            {/* <li><Link href="/register">Register</Link></li> */}
            <li><Link href="/contactus">Contact</Link></li>
            <li><Link href="/verifyCertificate">Verify Certificate</Link></li>
          </ul>
        </nav>

        {/* ───────── Programs column ───────── */}
        <nav className={styles.linkCol} aria-label="Our programs">
          <h2 className={styles.colHeading}>Programs</h2>
          <ul className={styles.linkList}>
            {/* Category links deep-link to the matching tab on /courses; the
                tech tracks deep-link to a pre-filtered search. Both are wired
                to real query params CoursesList reads (?category / ?search) —
                previously every item pointed at the bare /courses page. */}
            <li><Link href="/courses?category=summer-training">Summer Training</Link></li>
            <li><Link href="/courses?category=internship">Internship</Link></li>
            <li><Link href="/courses?category=internship">Job-Oriented Training</Link></li>
            <li><Link href="/courses?search=MERN">MERN Development</Link></li>
            <li><Link href="/courses?search=PHP">PHP / Laravel</Link></li>
            <li><Link href="/courses?search=Python">Python / Django</Link></li>
            <li><Link href="/courses?search=Android">Android Development</Link></li>
          </ul>
        </nav>

        {/* ───────── Contact column ───────── */}
        <div className={styles.contactCol}>
          <h2 className={styles.colHeading}>Get in touch</h2>
          <address className={styles.address}>
            <strong className={styles.bizName}>Technobren Infotech Pvt. Ltd.</strong>
            <span className={styles.addrLine}>
              City Tower, Varanasi–Lucknow Road,<br />
              Wazidpur, Jaunpur,<br />
              Uttar Pradesh – 222002, India
            </span>
            <a href={`tel:${PHONE_TEL}`} className={styles.contactLink}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
              </svg>
              {PHONE_DISPLAY}
            </a>
            <a href={`mailto:${EMAIL}`} className={styles.contactLink}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              {EMAIL}
            </a>
          </address>
        </div>
      </div>

      {/* ───────── Bottom bar ───────── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <small className={styles.copy}>
            © {year} <strong>Easy Coders</strong> · A unit of Technobren Infotech Pvt. Ltd. · All rights reserved.
          </small>
          <div className={styles.bottomRight}>
            <small className={styles.madeIn}>
              <span className={styles.madeDot} aria-hidden="true" />
              Made with care in Jaunpur, India
            </small>
            <button type="button" className={styles.toTop} onClick={scrollToTop} aria-label="Back to top">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
