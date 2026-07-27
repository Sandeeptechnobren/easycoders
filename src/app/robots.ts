import type { MetadataRoute } from 'next';

const SITE_URL = 'https://easycoders.in';

/**
 * Public crawler policy.
 *
 * Allow indexing of all public marketing/info pages.
 * Disallow every authenticated portal so role-gated pages cannot leak
 * into Google's index (they would 401 the bot anyway, but explicit is
 * safer and keeps `site:easycoders.in` results clean).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/courses',
          '/contactus',
          // '/register',
          '/verifyCertificate',
          '/self-assessment',
        ],
        disallow: [
          '/admin/',
          '/hr/',
          '/trainer/',
          '/students/',
          '/student-dashboard/',
          '/student-management/',
          '/college/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
