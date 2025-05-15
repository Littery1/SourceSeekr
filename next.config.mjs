/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Disable Edge Runtime for routes using Prisma
  experimental: {
    instrumentationHook: false, // Disable instrumentation hook to avoid Edge runtime issues
    serverComponentsExternalPackages: ["@prisma/client", "@auth/prisma-adapter", "bcryptjs"],
    // Explicitly specify middleware to run in Node.js runtime
    runtime: 'nodejs',
  },
  typescript: {
    // Similarly to ESLint, this is to ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;