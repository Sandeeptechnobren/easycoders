import type { MetadataRoute } from 'next';

const SITE_URL = 'https://easycoders.in';

/**
 * XML sitemap consumed by Google / Bing.
 *
 * Only public marketing/info pages are listed. Role-gated portals
 * (admin, hr, trainer, students, …) are intentionally excluded — they
 * are also blocked in robots.ts.
 *
 * `lastModified` uses build time. If a page changes frequently bump its
 * `changeFrequency` and `priority`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/courses`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contactus`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/verifyCertificate`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/self-assessment`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
