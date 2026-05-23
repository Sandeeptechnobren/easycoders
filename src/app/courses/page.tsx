import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import CoursesList from './CoursesList';
import type { ApiCourse } from '@/lib/course';

const SITE = 'https://easycoders.in';

export const metadata: Metadata = {
  title: 'Courses — MERN, PHP/Laravel, Python & Android Training',
  description:
    'Explore Easy Coders training programs — MERN, PHP/Laravel, Python and Android development available as Summer Training, Internship or Job-Oriented Programs. Beginner-friendly, mentor-led, project-based.',
  alternates: { canonical: '/courses' },
  openGraph: {
    title: 'Courses — MERN, PHP/Laravel, Python & Android Training',
    description:
      'Explore Easy Coders training programs across Summer Training, Internship and Job-Oriented Programs.',
    url: `${SITE}/courses`,
    type: 'website',
  },
};

/* Server-side ItemList JSON-LD. Pulls the live course list at request time
 * (with a 1-hour revalidate) so Google sees every course as part of the
 * organisation's catalog. Falls back gracefully when the API is unreachable. */
async function fetchCoursesForLd(): Promise<ApiCourse[]> {
  try {
    const res = await fetch(
      'https://api.easycoders.in/projects/backend/public/api/courses',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const allCourses = await fetchCoursesForLd();

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Easy Coders — Course Catalogue',
    numberOfItems: allCourses.length,
    itemListElement: allCourses.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE}/courses/${c.id}`,
      name: `${c.title}${c.category?.name ? ` — ${c.category.name}` : ''}`,
    })),
  };

  return (
    <>
      <PageHeader
        title="Explore Top Courses"
        description="Industry-aligned coding programs designed to take you from beginner to job-ready, with hands-on projects and 1:1 mentor guidance."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Courses' },
        ]}
      />
      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>Loading courses…</div>}>
        <CoursesList />
      </Suspense>

      {/* ItemList JSON-LD — surfaces the full catalogue to Google. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </>
  );
}
