/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow images from any hostname
      },{
        protocol: 'http',
        hostname: '**', // Allow images from any hostname
      }
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore the re2 module only on the server side
      config.externals = config.externals || [];
      config.externals.push({ re2: 'commonjs re2' });
    }

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;