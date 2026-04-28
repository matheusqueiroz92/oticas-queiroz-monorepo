/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['app.oticasqueiroz.com.br', 'api.app.oticasqueiroz.com.br'],
    unoptimized: true,
  },
  assetPrefix: '',
  basePath: '',
}

module.exports = nextConfig
