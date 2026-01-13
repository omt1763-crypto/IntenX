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
}
module.exports = nextConfig
