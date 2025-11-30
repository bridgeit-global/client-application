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
  async headers() {
    // Content Security Policy configuration
    // Allows required external services while maintaining security
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js hydration
    const cspPolicy = [
      "default-src 'self'",
      // Scripts: Allow self, inline (Next.js requires), eval (some Next.js features), and Vercel Analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com",
      // Styles: Allow self, inline (Next.js requires), and Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: Allow self, Google Fonts, and data URIs
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: Allow self, data URIs, blob URIs, UploadThing, Supabase, and Mapbox
      "img-src 'self' data: blob: https://utfs.io https://*.supabase.co https://*.supabase.in https://api.mapbox.com https://*.tiles.mapbox.com",
      // Connections: Allow self, Supabase (HTTPS and WebSocket), Mapbox, UploadThing, and Vercel
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.mapbox.com https://events.mapbox.com https://uploadthing.com https://vercel.live https://*.vercel-scripts.com",
      // Frames: Allow self and UploadThing for file uploads
      "frame-src 'self' https://uploadthing.com",
      // Workers: Allow self and blob URIs for service workers
      "worker-src 'self' blob:",
      // Disable plugins/objects
      "object-src 'none'",
      // Base URI: Only allow same origin
      "base-uri 'self'",
      // Form actions: Only allow same origin
      "form-action 'self'",
      // Frame ancestors: Prevent embedding (redundant with X-Frame-Options but more granular)
      "frame-ancestors 'none'",
      // Upgrade insecure requests to HTTPS
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspPolicy,
          },
          {
            key: 'Allow',
            value: 'GET, POST, PUT, PATCH, DELETE, HEAD',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
