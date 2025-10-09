/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Security headers to control iframe embedding
  async headers() {
    // Parse allowed parent origins from environment
    const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS || '';
    const origins = allowedOrigins.split(',').map(origin => origin.trim()).filter(Boolean);
    
    // Create frame-ancestors directive for CSP
    const frameAncestors = origins.length > 0
      ? `frame-ancestors 'self' ${origins.join(' ')};`
      : "frame-ancestors 'none';"; // Block all if no allowed origins
    
    return [
      {
        source: '/(.*)',
        headers: origins.length === 0
          ? [
              // No embedding allowed at all
              { key: 'X-Frame-Options', value: 'DENY' },
              { key: 'Content-Security-Policy', value: frameAncestors },
            ]
          : [
              // Allow embedding only from allowed origins (and self) via CSP; omit XFO to avoid conflicts
              { key: 'Content-Security-Policy', value: frameAncestors },
            ],
      },
    ];
  },
}

module.exports = nextConfig


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "dalgo",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
