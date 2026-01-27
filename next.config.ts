import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "content.r9cdn.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cf.bstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pics.avs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.worldota.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "photos.hotellook.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
