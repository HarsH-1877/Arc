/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.fontshare.com' },
      { protocol: 'https', hostname: 'userpic.codeforces.org' },
      { protocol: 'https', hostname: 'assets.leetcode.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
