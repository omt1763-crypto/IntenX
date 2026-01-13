/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  webpack: (config, { isServer }) => {
    // Exclude src/ directory from being treated as Next.js pages
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/src/**'],
    }
    return config
  },
  // Allow build to succeed even with export errors
  // These pages use React Router and require client-side rendering
  typescript: {
    // Ignore type errors during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: false,
  },
}
module.exports = nextConfig
