import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  allowedDevOrigins: ['172.16.9.11', '192.168.137.1'],
};

export default nextConfig;
