// Importação com CommonJS
const mercadopago = require('mercadopago');
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Mercado Pago
export const initMercadoPago = (): void => {
  try {
    // Obtém o access token do arquivo .env
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('ERRO: Token do Mercado Pago não configurado!');
      console.error('Defina MERCADO_PAGO_ACCESS_TOKEN no arquivo .env');
      return;
    }

    // Configuração para a versão 2.x
    // A API mudou: agora usamos setAccessToken em vez de configure
    mercadopago.configure({
      access_token: accessToken
    });

    console.log('SDK do Mercado Pago configurado com sucesso');
  } catch (error) {
    console.error('Erro ao configurar SDK do Mercado Pago:', error);
  }
};

// Exportar o módulo configurado
export default mercadopago;