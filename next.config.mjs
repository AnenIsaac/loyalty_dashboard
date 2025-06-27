/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Reduce verbose logging and Fast Refresh frequency
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Suppress some development logs
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig
