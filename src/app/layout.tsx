import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Providers from './providers';
import './globals.css';

/* ──────────────────────────────────────────────────────────────────────────
 * Site-wide SEO metadata.
 *
 * Individual pages may extend / override via their own `export const metadata`
 * (or `generateMetadata`). The `template` below means a page setting
 * `title: 'Courses'` renders as "Courses | Easy Coders" in the browser tab
 * and in Google search results.
 * ────────────────────────────────────────────────────────────────────────── */

const SITE_URL  = 'https://easycoders.in';
const SITE_NAME = 'Easy Coders';
const DEFAULT_DESCRIPTION =
  'Easy Coders is a coding-training institute in Jaunpur, India offering Summer Training, Internship, Job-Oriented Programs and Language Training in MERN, PHP/Laravel, Python/Django and Android. Beginner-friendly, project-based and mentor-led.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Easy Coders — Coding Training, Internships & Placements',
    template: '%s | Easy Coders',
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'coding institute India',
    'coding training Jaunpur',
    'MERN training',
    'PHP Laravel training',
    'Python Django course',
    'Android development course',
    'summer training',
    'internship for students',
    'job oriented programs',
    'Easy Coders',
    'Technobren Infotech',
  ],
  authors: [{ name: 'Technobren Infotech Pvt. Ltd.' }],
  creator: 'Easy Coders',
  publisher: 'Technobren Infotech Pvt. Ltd.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Easy Coders — Coding Training, Internships & Placements',
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/images/easycoder-hero.png',
        width: 1200,
        height: 630,
        alt: 'Easy Coders — Coding Training & Placements',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Easy Coders — Coding Training, Internships & Placements',
    description: DEFAULT_DESCRIPTION,
    images: ['/images/easycoder-hero.png'],
  },
  icons: {
    icon: [
      { url: '/images/logo.svg', type: 'image/svg+xml' },
      { url: '/images/ec_logo.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/images/ec_logo.png',
    apple: '/images/ec_logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'education',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1B3A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for faster web font load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* External CSS frameworks */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.theme.default.min.css"
        />
      </head>
      <body className="text-dark d-flex flex-column min-vh-100">
        <Providers>{children}</Providers>
        <Script
          src="https://code.jquery.com/jquery-3.6.0.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
