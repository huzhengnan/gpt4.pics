/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

export default nextConfig