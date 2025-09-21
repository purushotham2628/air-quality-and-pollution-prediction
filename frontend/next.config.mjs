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
  // Enable standalone output for better deployment
  output: 'standalone',
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // Allow all hosts for Replit proxy
  devIndicators: {
    autoPrerender: false,
  },
  // Allow all hosts for Replit 
  async rewrites() {
    return []
  },
  // Allow cross-origin for Replit
  allowedDevOrigins: ['127.0.0.1'],
  // Configure webpack for development
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

export default nextConfig
