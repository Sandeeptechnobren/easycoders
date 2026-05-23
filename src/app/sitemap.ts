import type { MetadataRoute } from 'next';

const SITE_URL = 'https://easycoders.in';
const API_URL  = 'https://api.easycoders.in/projects/backend/public/api';

/**
 * XML sitemap consumed by Google / Bing.
 *
 * Includes:
 *  - Static public marketing/info pages
 *  - Every course detail page (`/courses/{id}`) pulled from the API at
 *    build time, so Google can discover and index each program directly
 *
 * Role-gated portals (admin, hr, trainer, students, …) are intentionally
 * excluded — they are also blocked in robots.ts.
 */
type ApiCourseLite = { id: number };

async function fetchCourseIds(): Promise<number[]> {
  try {
    const res = await fetch(`${API_URL}/courses`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    if (!Array.isArray(data)) return [];
    return (data as ApiCourseLite[])
      .map(c => Number(c.id))
      .filter(id => Number.isFinite(id));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const courseIds = await fetchCourseIds();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                  lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/about`,             lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/courses`,           lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/contactus`,         lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/register`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/verifyCertificate`, lastModified: now, changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${SITE_URL}/self-assessment`,   lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const courseEntries: MetadataRoute.Sitemap = courseIds.map(id => ({
    url: `${SITE_URL}/courses/${id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticEntries, ...courseEntries];
}
