import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import CourseDetail from './CourseDetail';
import { type ApiCourse, courseImage } from '@/lib/course';

const SITE = 'https://easycoders.in';
const API  = 'https://api.easycoders.in/api';

/* ──────────────────────────────────────────────────────────────────────────
 * /courses/[id] — server-component shell.
 *
 * Pulls the course on the server so we can emit per-course metadata
 * (title, description, OG image, canonical) AND Course JSON-LD for Google
 * rich-result eligibility. The interactive bits (enroll modal, related-rail
 * scroller) live in the sibling CourseDetail client component.
 *
 * Falls back cleanly when the course is missing or the API is down.
 * ────────────────────────────────────────────────────────────────────────── */

async function fetchCourse(id: string): Promise<ApiCourse | null> {
  try {
    const res = await fetch(`${API}/courses/${id}`, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as ApiCourse;
  } catch {
    return null;
  }
}

async function fetchAllCourses(): Promise<ApiCourse[]> {
  try {
    const res = await fetch(`${API}/courses`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const course = await fetchCourse(id);

  if (!course) {
    return {
      title: 'Course not found',
      robots: { index: false, follow: true },
    };
  }

  const desc = (course.description ?? '').replace(/\s+/g, ' ').slice(0, 160);
  const img  = courseImage(course);

  return {
    title: `${course.title}${course.category?.name ? ` — ${course.category.name}` : ''}`,
    description: desc || `${course.title} training at Easy Coders. Mentor-led, project-based, beginner-friendly.`,
    alternates: { canonical: `/courses/${id}` },
    openGraph: {
      title: course.title,
      description: desc,
      url: `${SITE}/courses/${id}`,
      type: 'website',
      images: img ? [{ url: img, alt: course.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: course.title,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default async function CourseDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [course, allCourses] = await Promise.all([
    fetchCourse(id),
    fetchAllCourses(),
  ]);

  if (!course) {
    // Trigger Next's 404 instead of rendering a half-page.
    notFound();
  }

  /* "Also available as…" → same title, different category, current course
   * excluded. Limit to 3 so the rail never overflows. */
  const related = allCourses
    .filter(c => c.title === course.title && c.id !== course.id)
    .slice(0, 3);

  /* Course JSON-LD. Google can render rich-result panels for educational
   * courses (provider name, price, currency, duration). */
  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'Easy Coders',
      sameAs: SITE,
    },
    ...(course.category?.name && { courseMode: course.category.name }),
    ...(course.duration && { timeRequired: course.duration }),
    ...(course.discounted_price && {
      offers: {
        '@type': 'Offer',
        price: String(course.discounted_price).replace(/[^0-9.]/g, ''),
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/courses/${id}`,
        ...(course.original_price && {
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: String(course.original_price).replace(/[^0-9.]/g, ''),
            priceCurrency: 'INR',
          },
        }),
      },
    }),
  };

  return (
    <>
      <PageHeader
        title={course.title}
        description={course.category?.name ? `${course.category.name} program` : 'Industry-aligned coding training'}
        breadcrumbs={[
          { label: 'Home',    href: '/' },
          { label: 'Courses', href: '/courses' },
          { label: course.title },
        ]}
      />

      <CourseDetail course={course} related={related} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
    </>
  );
}
