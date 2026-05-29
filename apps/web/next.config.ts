import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "app.oticasqueiroz.com.br",
      },
      {
        protocol: "https",
        hostname: "api.app.oticasqueiroz.com.br",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
