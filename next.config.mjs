/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "bcryptjs"];
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;