import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ContactUsInner from './ContactUsInner';

const SITE = 'https://easycoders.in';

export const metadata: Metadata = {
  title: 'Contact Easy Coders — Talk to a Counsellor',
  description:
    'Get in touch with Easy Coders. Office in Jaunpur, India. Email team@easycoders.in or call +91 7523 930 301. We respond to every enquiry within 24 hours.',
  alternates: { canonical: '/contactus' },
  openGraph: {
    title: 'Contact Easy Coders — Talk to a Counsellor',
    description:
      'Office in Jaunpur, India. Email team@easycoders.in or call +91 7523 930 301. We respond within 24 hours.',
    url: `${SITE}/contactus`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Easy Coders',
    description:
      'Office in Jaunpur, India. Email team@easycoders.in or call +91 7523 930 301.',
  },
};

export default function ContactUsPage() {
  return (
    <>
      <PageHeader
        title="Let's connect"
        description="Have questions about courses, batches or career guidance? Our team usually replies within 24 hours."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Contact Us' },
        ]}
      />
      <ContactUsInner />
    </>
  );
}
