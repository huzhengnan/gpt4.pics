/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn-dalle.oss-us-west-1.aliyuncs.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-dalle.oss-us-west-1.aliyuncs.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig