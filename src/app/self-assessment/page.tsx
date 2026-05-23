import type { Metadata } from 'next';
import SelfAssessmentLanding from './SelfAssessmentLanding';

const SITE = 'https://easycoders.in';

export const metadata: Metadata = {
  title: 'Easy Assess — Free 10-Minute Coding Skill Check',
  description:
    'Find out exactly where you stand. Free coding skill assessment with MCQ, coding challenges, typing test, AI hints and a live leaderboard. No credit card required.',
  alternates: { canonical: '/self-assessment' },
  openGraph: {
    title: 'Easy Assess — Free 10-Minute Coding Skill Check',
    description:
      'Free coding skill assessment with MCQ, coding challenges, typing test and AI hints. From the team behind Easy Coders.',
    url: `${SITE}/self-assessment`,
    type: 'website',
    images: [{ url: '/images/easycoder-hero.png', alt: 'Easy Assess by Easy Coders' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Easy Assess — Free 10-Minute Coding Skill Check',
    description:
      'Free coding skill assessment with MCQ, coding challenges, typing test and AI hints.',
  },
};

/* Product JSON-LD — surfaces Easy Assess as a distinct offering of the
 * Organization that the Footer's JSON-LD already declares. Aggregate
 * rating is intentionally omitted until real review data exists. */
const productLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Easy Assess',
  description:
    'Free coding skill assessment platform offering MCQ, coding challenges, typing tests, AI hints and a live leaderboard.',
  url: `${SITE}/self-assessment`,
  brand: { '@type': 'Brand', name: 'Easy Coders' },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: `${SITE}/self-assessment`,
  },
};

export default function Page() {
  return (
    <>
      <SelfAssessmentLanding />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
    </>
  );
}
