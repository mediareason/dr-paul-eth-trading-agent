/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false
  },
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig