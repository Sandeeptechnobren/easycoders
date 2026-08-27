'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SelfAssessmentBubble from '@/components/SelfAssessmentBubble';
import AppDownloadDock from '@/components/AppDownloadDock';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useSiteTheme } from '@/context/ThemeContext';
import MusicDock from '@/components/MusicDock';
import IndependenceLoader from '@/components/independence/IndependenceLoader';
import IndependenceBanner from '@/components/independence/IndependenceBanner';
import JetFlypast from '@/components/independence/JetFlypast';
import PointerFX from '@/components/independence/PointerFX';
import TricolourFall from '@/components/independence/TricolourFall';
import GloryWave from '@/components/independence/GloryWave';
import RakhiLoader from '@/components/rakhi/RakhiLoader';
import RakhiBanner from '@/components/rakhi/RakhiBanner';
import PetalFall from '@/components/rakhi/PetalFall';

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
      {/* Bottom-centre music dock. Gated exactly like the rest of this chrome:
          on with the theme, and off the portals — a player floating over an
          attendance table is in the way, not festive. Fetches its own playlist
          from the backend, so gating it here also means the request is never
          made on a portal page.
          To make it permanent, lift this line out of IndependenceChrome and
          render it from Providers directly. */}
      {showBanner && <MusicDock />}
    </>
  );
}

/**
 * Raksha Bandhan chrome. Same shape and same gating as IndependenceChrome:
 * theme-gated, and the decorative pieces stay off the portals, which are work
 * surfaces where falling petals over a data table are a distraction.
 *
 * The loader is NOT gated on showBanner — an admin arriving straight at
 * /admin should still get the themed opening rather than a bare white flash.
 */
function RakhiChrome({ showBanner }: { showBanner: boolean }) {
  const { theme } = useSiteTheme();
  if (theme !== 'rakhi') return null;

  return (
    <>
      <RakhiLoader />
      {showBanner && <RakhiBanner />}
      {/* One-shot on load; unmounts itself once the last petal lands. */}
      {showBanner && <PetalFall />}
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
      <RakhiChrome showBanner={isPublicPage} />
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
