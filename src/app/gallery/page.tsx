import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import GalleryInner from './GalleryInner';

const SITE = 'https://easycoders.in';

export const metadata: Metadata = {
  title: 'Gallery — Easy Coders Events, Workshops & Student Life',
  description:
    'Photos from Easy Coders — workshops, events, mentor sessions and student wins. See what learning with us actually looks like.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Gallery — Easy Coders',
    description: 'Workshops, events, mentor sessions and student wins at Easy Coders.',
    url: `${SITE}/gallery`,
    type: 'website',
  },
};

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Our Gallery"
        description="Moments from Easy Coders — workshops, events, mentor sessions and the wins in between."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Gallery' },
        ]}
      />
      <GalleryInner />
    </>
  );
}
