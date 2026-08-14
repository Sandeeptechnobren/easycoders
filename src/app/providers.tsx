'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SelfAssessmentBubble from '@/components/SelfAssessmentBubble';
import AppDownloadDock from '@/components/AppDownloadDock';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

/* Logged-in portals (and the self-assessment sub-app) don't need the public
 * app-download dock — show it only on the marketing / public pages. */
const PORTAL_PREFIXES = [
  '/admin',
  '/hr',
  '/trainer',
  '/students',
  '/student-dashboard',
  '/college',
  '/self-assessment',
];

/**
 * Client-side providers + conditional chrome.
 *
 * Lives in its own file so `app/layout.tsx` can stay a Server Component
 * — which is the only way `export const metadata = {...}` works in
 * Next.js App Router. Anything that uses hooks (`usePathname`,
 * `useState`, etc.) must be in here, not in layout.tsx.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSelfAssessment = pathname?.startsWith('/self-assessment') ?? false;
  const isPublicPage = !PORTAL_PREFIXES.some((p) => pathname?.startsWith(p));

  return (
    /* ThemeProvider sits OUTSIDE AuthProvider: the site theme is public and must
     * resolve for logged-out visitors too, and it must not wait on the auth
     * round-trip. */
    <ThemeProvider>
      <AuthProvider>
        {!isSelfAssessment && <Navbar />}
        <main className="flex-grow-1">{children}</main>
        {!isSelfAssessment && <Footer />}
        {!isSelfAssessment && <SelfAssessmentBubble />}
        {isPublicPage && <AppDownloadDock />}
      </AuthProvider>
    </ThemeProvider>
  );
}
