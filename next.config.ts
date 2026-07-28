import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob public URLs for admin-uploaded story photos.
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
