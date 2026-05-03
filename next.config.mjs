/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // These must not be bundled — they use Node.js native APIs or require file system access
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'docx'],
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
