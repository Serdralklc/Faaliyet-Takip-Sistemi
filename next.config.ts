import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },

  async headers() {
    return [
      // Statik görseller: değişmedikleri için agresif cache (~1,4 MB tekrar indirme önlenir)
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/logo.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      // Geri kalan her şey (HTML/RSC/API): taze veri için cache yok
      {
        source: "/((?!images/|fonts/|logo\\.svg).*)",
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
