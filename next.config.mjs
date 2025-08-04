// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add transpilePackages here
  transpilePackages: ["next-auth", "@auth/core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "assets.vercel.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "tailwindcss.com",
      },
      {
        protocol: "https",
        hostname: "www.prisma.io",
      },
      {
        protocol: "https",
        hostname: "next-auth.js.org",
      },
      {
        protocol: "https",
        hostname: "github.githubassets.com",
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "@auth/prisma-adapter",
      "bcryptjs",
    ],
  },
  typescript: {
    // Similarly to ESLint, this is to ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
