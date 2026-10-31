/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lint stays available via `npm run lint`, but style warnings must not block a production deploy.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
