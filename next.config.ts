import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // We removed the 'eslint' block from here because 
  // Next.js 16 handles it differently now.
};

export default nextConfig;
