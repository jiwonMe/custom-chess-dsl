const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // MDX support
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],

  // Transpile chesslang modules from parent directory
  transpilePackages: ['chesslang'],

  // Web Worker support and module resolution
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
    }

    // Resolve chesslang modules from parent directory
    const chesslangPath = path.resolve(__dirname, '../src');

    config.resolve.alias = {
      ...config.resolve.alias,
      'chesslang/lexer': path.join(chesslangPath, 'lexer'),
      'chesslang/parser': path.join(chesslangPath, 'parser'),
      'chesslang/compiler': path.join(chesslangPath, 'compiler'),
      'chesslang/engine': path.join(chesslangPath, 'engine'),
      'chesslang/stdlib': path.join(chesslangPath, 'stdlib'),
      'chesslang/types': path.join(chesslangPath, 'types'),
      'chesslang': chesslangPath,
    };

    // Allow resolving .ts files when .js extension is specified (TypeScript ESM style)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };

    return config;
  },
};

module.exports = nextConfig;
