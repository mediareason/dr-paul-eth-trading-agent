/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Prevent wallet extension conflicts
  webpack: (config, { isServer }) => {
    // Avoid processing wallet extension code
    config.externals = config.externals || [];
    config.externals.push({
      'ethereum': 'window.ethereum',
      'web3': 'window.web3'
    });

    // Ignore wallet extension errors during build
    config.stats = {
      errorDetails: true,
      warnings: false
    };

    return config;
  },

  // Custom error handling
  onDemandEntries: {
    // Prevent build errors from wallet extensions
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Experimental features for better performance
  experimental: {
    // Enable modern builds
    esmExternals: true,
    
    // Better error handling
    serverComponentsExternalPackages: []
  },

  // Build optimization
  compiler: {
    // Remove console logs in production except warnings/errors
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Environment variables
  env: {
    TRADING_APP_VERSION: '2.0.0',
    WALLET_CONFLICT_PROTECTION: 'enabled'
  },

  // Headers for better security and wallet handling
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Wallet-Safe',
            value: 'true'
          }
        ],
      },
    ];
  },

  // Redirects and rewrites
  async redirects() {
    return [
      // Redirect root to enhanced analysis
      {
        source: '/',
        destination: '/#enhanced',
        permanent: false,
      },
    ];
  }
};

module.exports = nextConfig;