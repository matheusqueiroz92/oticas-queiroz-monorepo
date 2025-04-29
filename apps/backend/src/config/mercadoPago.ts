import dotenv from 'dotenv';

dotenv.config();

const mercadopago = require('mercadopago');

export const initMercadoPago = (): void => {
  try {
    // Escolher token baseado no ambiente
    const accessToken = process.env.NODE_ENV === 'production'
      ? process.env.MERCADO_PAGO_PROD_TOKEN
      : process.env.MERCADO_PAGO_TEST_TOKEN;

    if (!accessToken) {
      console.error('ERRO: Token do Mercado Pago não configurado!');
      console.error(`Defina MERCADO_PAGO_${process.env.NODE_ENV === 'production' ? 'PROD' : 'TEST'}_TOKEN no arquivo .env`);
      return;
    }

    // Configuração do SDK
    if (typeof mercadopago.configure === 'function') {
      mercadopago.configure({
        access_token: accessToken
      });
      
      console.log(`SDK do Mercado Pago configurado com sucesso para ambiente ${process.env.NODE_ENV}`);
    } else {
      console.warn('SDK do Mercado Pago não configurado corretamente. Usando API direta.');
    }
  } catch (error) {
    console.error('Erro ao configurar SDK do Mercado Pago:', error);
  }
};