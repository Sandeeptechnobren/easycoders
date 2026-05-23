import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import AboutInner from './AboutInner';

const SITE = 'https://easycoders.in';

export const metadata: Metadata = {
  title: 'About Easy Coders — Project-Led Coding Training in India',
  description:
    'Easy Coders is a coding-training institute helping students go from beginners to job-ready developers through project-led learning, 1:1 mentor support and dedicated placement assistance.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Easy Coders',
    description:
      'Project-led coding training that bridges the gap between learning syntax and shipping real applications.',
    url: `${SITE}/about`,
    type: 'website',
    images: [{ url: '/images/aboutus.png', alt: 'About Easy Coders' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Easy Coders',
    description:
      'Project-led coding training that bridges the gap between learning syntax and shipping real applications.',
    images: ['/images/aboutus.png'],
  },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="We build developers"
        description="A coding-training institute helping students go from absolute beginners to job-ready developers through project-led learning and 1:1 mentor support."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About Us' },
        ]}
      />
      <AboutInner />
    </>
  );
}
