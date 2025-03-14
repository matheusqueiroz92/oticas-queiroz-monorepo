/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações existentes...

  // Adicione esta linha para desabilitar o overlay de erro em produção E desenvolvimento
  onDemandEntries: {
    // Período (em ms) onde o servidor aguardará por páginas que não estão sendo usadas
    maxInactiveAge: 60 * 1000,
    // Número de páginas que devem ficar em buffer
    pagesBufferLength: 2,
  },

  // Tente também isto
  // @ts-ignore
  webpack: (config, { dev, isServer }) => {
    // Apenas em desenvolvimento e do lado do cliente
    if (dev && !isServer) {
      // Desabilitando o ErrorOverlay do Next.js
      config.devtool = false;
    }
    return config;
  },
};

module.exports = nextConfig;
