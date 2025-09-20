const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['openweathermap.org'],
    unoptimized: true,
  },
  // Replit environment configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  },
  // Allow all hosts for Replit proxy
  devIndicators: {
    autoPrerender: false,
  },
}

export default nextConfig
