'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar'; 
import Registration from '@/components/Registration';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import SelfAssessmentBubble from '@/components/SelfAssessmentBubble';
import './globals.css';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSelfAssessment = pathname.startsWith('/self-assessment');
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
        />
      </head>
      <body className="text-dark d-flex flex-column min-vh-100">
        <AuthProvider>
          {!isSelfAssessment && <Navbar />}
          <main className="flex-grow-1">
            {children}
          </main>
          {!isSelfAssessment && <Footer />}
        </AuthProvider>
        {!isSelfAssessment && <SelfAssessmentBubble />}
        {/* <Registration/> */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}