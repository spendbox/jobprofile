/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse and mammoth must not be bundled — they use Node.js native APIs
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
