
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Très important pour Capacitor
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true, // Requis pour l'export statique avec next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'https://3000-firebase-studio-1750673315832.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev',
    'http://3000-firebase-studio-1750673315832.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev',
    'http://localhost:3000',
  ],
};

module.exports = nextConfig;
