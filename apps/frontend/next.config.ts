import type { NextConfig } from 'next';
import FaroSourceMapUploaderPlugin from '@grafana/faro-webpack-plugin';
import { RetryChunkLoadPlugin } from 'webpack-retry-chunk-load-plugin';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  outputFileTracingRoot: undefined,
  transpilePackages: ['@repo/ui', '@repo/styles'],

  // Enable source maps in production for better error debugging in Grafana
  productionBrowserSourceMaps: true,

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 60,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'vumbnail.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'd1.awsstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.example.com',
      },
    ],
  },

  webpack: (config, { isServer, dev }) => {
    config.plugins = config.plugins || [];

    // Safari HMR fix
    if (dev && !isServer) {
      config.optimization = config.optimization || {};
      config.optimization.runtimeChunk = false;
    }

    // Add retry logic for chunk loading failures (poor network, CDN issues)
    if (!isServer) {
      config.plugins.push(
        new RetryChunkLoadPlugin({
          maxRetries: 3,
          retryDelay: 1000, // 1 second
        })
      );
    }

    // Upload source maps to Grafana Faro in production builds
    if (!dev && !isServer && process.env.FARO_SOURCE_MAP_API_KEY) {
      config.plugins.push(
        new FaroSourceMapUploaderPlugin({
          appName: 'starter-client',
          endpoint: 'https://faro-api-prod-us-west-0.grafana.net/faro/api/v1',
          appId: process.env.NEXT_PUBLIC_FARO_APP_ID || '',
          stackId: process.env.FARO_STACK_ID || '',
          verbose: true,
          apiKey: process.env.FARO_SOURCE_MAP_API_KEY,
          gzipContents: true,
        })
      );
    }

    return config;
  },
};

export default nextConfig;
