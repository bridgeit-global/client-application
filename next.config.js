/** @type {import('next').NextConfig} */
const { version } = require('./package.json');
const path = require('path');

const nextConfig = {
  // Turbopack configuration for development
  // Note: resolveAlias may not be fully supported in Next.js 16 Turbopack
  // If issues persist, consider using webpack for development (remove --turbo flag)
  turbopack: {
    root: __dirname,
  },
  // Webpack configuration for both development and production builds
  webpack: (config, { isServer }) => {
    // Handle canvas native module (used by pdfjs-dist)
    // Disable for client-side, allow for server-side
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }
    
    // Handle keyv dynamic requires (used by mapbox-gl-geocoder and flat-cache)
    // Use mock for client-side builds to avoid dynamic require issues
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        keyv: path.resolve(__dirname, 'lib/mocks/keyv/index.js'),
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  // Externalize native Node.js packages for server-side
  // Removed @mapbox/mapbox-sdk as it's only used client-side via @mapbox/mapbox-gl-geocoder
  // Note: canvas is handled via webpack alias (disabled for client-side)
  // The version mismatch warning can be ignored as canvas@3.2.0 works with pdfjs-dist via pnpm override
  // Environment variables
  env: {
    APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
    ],
  },
  async headers() {
    // Content Security Policy configuration
    // Allows required external services while maintaining security
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js hydration
    const cspPolicy = [
      "default-src 'self'",
      // Scripts: Allow self, inline (Next.js requires), eval (some Next.js features), and Vercel Analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com https://challenges.cloudflare.com",
      // Styles: Allow self, inline (Next.js requires), and Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: Allow self, Google Fonts, and data URIs
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: Allow self, data URIs, blob URIs, UploadThing, Supabase, and Mapbox
      "img-src 'self' data: blob: https://utfs.io https://*.supabase.co https://*.supabase.in https://api.mapbox.com https://*.tiles.mapbox.com",
      // Connections: Allow self, Supabase (HTTPS and WebSocket), Mapbox, UploadThing, and Vercel
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.mapbox.com https://events.mapbox.com https://*.uploadthing.com https://vercel.live https://*.vercel-scripts.com https://*.amazonaws.com",
      // Frames: Allow self and UploadThing for file uploads
      "frame-src 'self' https://uploadthing.com https://challenges.cloudflare.com",
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
