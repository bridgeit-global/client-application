/** @type {import('next').NextConfig} */
const { version } = require('./package.json');
const webpack = require('webpack');

const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    
    // Define version at build time
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.APP_VERSION': JSON.stringify(version),
      })
    );
    
    return config;
  },
  images: {
    domains: ['utfs.io']
  },
  eslint: {
    ignoreDuringBuilds: true
  },
};

module.exports = nextConfig;
