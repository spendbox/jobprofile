/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfjs-dist and mammoth must not be bundled — they use Node.js native APIs
    serverComponentsExternalPackages: ['pdfjs-dist', 'mammoth'],
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
