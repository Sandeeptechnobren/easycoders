'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SelfAssessmentBubble from '@/components/SelfAssessmentBubble';
import AppDownloadDock from '@/components/AppDownloadDock';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useSiteTheme } from '@/context/ThemeContext';
import IndependenceLoader from '@/components/independence/IndependenceLoader';
import IndependenceBanner from '@/components/independence/IndependenceBanner';
import JetFlypast from '@/components/independence/JetFlypast';
import PointerFX from '@/components/independence/PointerFX';
import TricolourFall from '@/components/independence/TricolourFall';
import GloryWave from '@/components/independence/GloryWave';

/**
 * Independence Day chrome. Split into its own component because it must sit
 * INSIDE ThemeProvider to read the theme — a parent cannot consume its own
 * child's context.
 *
 * Both pieces are theme-gated, so with the theme off nothing renders and the
 * site behaves exactly as before. The banner is kept off the portals and the
 * EasyAssess sub-app: it is a marketing announcement, and portals are work
 * surfaces where a promo bar would just be in the way.
 */
function IndependenceChrome({ showBanner }: { showBanner: boolean }) {
  const { theme } = useSiteTheme();
  if (theme !== 'tiranga') return null;

  return (
    <>
      <IndependenceLoader />
      {showBanner && <IndependenceBanner />}
      {/* Site-wide flypast. Kept off the portals: those are work surfaces where
          moving objects over a data table are a distraction, not a flourish. */}
      {showBanner && <JetFlypast />}
      {/* Publishes --ptr-x/--ptr-y once for every parallax layer, and renders
          the ambient tricolour light. Self-disables on touch and reduced motion. */}
      {showBanner && <PointerFX />}
      {/* One-shot celebration on site load. Removes itself once the pieces have
          landed, so nothing keeps animating for the rest of the session. */}
      {showBanner && <TricolourFall />}
      {/* Slow tricolour light sweeping the page — 'glory'. Screen-blended so it
          can only add light, never reduce text contrast. */}
      {showBanner && <GloryWave />}
    </>
  );
}

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
      <IndependenceChrome showBanner={isPublicPage} />
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
