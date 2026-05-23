'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SelfAssessmentBubble from '@/components/SelfAssessmentBubble';
import { AuthProvider } from '@/context/AuthContext';

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

  return (
    <AuthProvider>
      {!isSelfAssessment && <Navbar />}
      <main className="flex-grow-1">{children}</main>
      {!isSelfAssessment && <Footer />}
      {!isSelfAssessment && <SelfAssessmentBubble />}
    </AuthProvider>
  );
}
