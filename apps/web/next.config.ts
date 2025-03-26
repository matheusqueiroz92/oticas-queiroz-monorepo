/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Melhora a compatibilidade em produção
  images: {
    domains: ['app.oticasqueiroz.com.br'], // Se você estiver usando o componente Next Image
    unoptimized: true, // Pode ajudar com problemas de otimização
  },
  // Configuração que explicita o caminho base para os arquivos públicos
  assetPrefix: '',
  basePath: '',
}

module.exports = nextConfig