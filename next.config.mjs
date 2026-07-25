/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.fontshare.com',
      },
    ],
  },
};

export default nextConfig;
