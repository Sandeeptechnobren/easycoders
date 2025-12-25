import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import NotificationPopup from '@/components/NotificationPopup';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
                />
            </head>
            <body className="bg-black text-white">
                {/* ⬅ Wrap everything in AuthProvider so Navbar can update live */}
                <AuthProvider>
                    <Navbar />

                    <main className="mt-[72px]">
                        {children}
                    </main>

                    <Footer />
                </AuthProvider>

                <Script
                    src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"
                    strategy="afterInteractive"
                />
                <NotificationPopup />
            </body>
        </html>
    );
}