import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint: {
  //   // ✅ Prevent ESLint from failing production builds
  //   ignoreDuringBuilds: true,
  // },

  // Allow next/image to optimise our handful of external image sources.
  // Currently only Unsplash (used as the fallback course-card image when the
  // backend course has no `image` field). Add to this list before referencing
  // a new external host from <Image src=...>.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
