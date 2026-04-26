/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf2json and mammoth use Node.js native APIs — keep them out of the server bundle
    serverComponentsExternalPackages: ['pdf2json', 'mammoth'],
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
