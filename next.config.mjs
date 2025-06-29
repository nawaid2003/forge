// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // Disable fs for client-side
      net: false, // Disable net for client-side
      tls: false, // Disable tls for client-side
      child_process: false, // Disable child_process if used
    };
    return config;
  },
};

export default nextConfig;
