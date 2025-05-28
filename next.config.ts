import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    externalDir: true, // src 외부 디렉토리 접근 허용
  },
  
  transpilePackages: [
    '@packages/shared',
    '@packages/ui-kit',
    '@packages/data-client',
  ],

  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
