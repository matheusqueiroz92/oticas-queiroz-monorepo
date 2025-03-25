/** @type {import('next').NextConfig} */
const nextConfig = {
  // Preservando outras configurações que você já tenha
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['app.oticasqueiroz.com.br'],
  },
  
  // Adicionando a configuração de rewrites
  async rewrites() {
    return [
      // Não processar solicitações /images/*
      {
        source: '/images/:path*',
        destination: '/api/bypass-images?imagePath=:path*',
      },
    ];
  },
  
  // Outras configurações existentes...
  output: 'standalone',
  // compress: true,
  // poweredByHeader: false,
  // optimizeFonts: true,
}

module.exports = nextConfig;