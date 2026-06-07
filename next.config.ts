import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Router Cache'i tamamen kapat
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },

  // Vercel CDN ve tarayıcı cache'ini kapat — her F5'te taze sayfa gelsin
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma",        value: "no-cache" },
          { key: "Expires",       value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
