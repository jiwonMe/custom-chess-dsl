/** @type {import('next').NextConfig} */
const nextConfig = {
  // MDX support
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Transpile chesslang package
  transpilePackages: ['chesslang'],

  // Web Worker support
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
    }

    // Handle chesslang imports
    config.resolve.alias = {
      ...config.resolve.alias,
      chesslang: require('path').resolve(__dirname, '../src'),
    };

    return config;
  },
};

module.exports = nextConfig;
