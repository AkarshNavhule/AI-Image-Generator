/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'v3.fal.media',
            port: '',
            pathname: '/files/**', // or more specific if needed
          },
        ],
      },
    reactStrictMode: true
};

export default nextConfig;
