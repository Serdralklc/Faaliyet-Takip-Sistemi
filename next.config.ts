import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Router Cache'i tamamen kapat — navigasyonda eski sayfa gösterilmesin
  experimental: {
    staleTimes: {
      dynamic: 0,   // force-dynamic sayfalar anında güncellenir
      static: 180,  // statik sayfalar 3 dk cache'de kalabilir
    },
  },
};

export default nextConfig;
