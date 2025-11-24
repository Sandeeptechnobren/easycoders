import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import "./globals.css";
import Navbar from "@/components/Navbar";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black pt-16">
        <div className="">
          <Navbar />
        </div>
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}

