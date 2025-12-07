/** @type {import('next').NextConfig} */
const nextConfig = {
  // Make sure Prisma's query engine gets bundled with our serverless functions on Vercel
  outputFileTracingIncludes: {
    // Apply to all API routes (pages/api/*)
    '/api/**': ['./node_modules/.prisma/client'],
  },
};

export default nextConfig;
