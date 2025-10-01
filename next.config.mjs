/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'openrouter.ai'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Enable standalone output for Vercel deployment
  output: 'standalone',
};

export default nextConfig;