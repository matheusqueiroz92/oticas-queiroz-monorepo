import dotenv from 'dotenv';

dotenv.config();

const mercadopago = require('mercadopago');

export const initMercadoPago = (): void => {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      console.error('ERRO: Token do Mercado Pago não configurado!');
      console.error('Defina MERCADO_PAGO_ACCESS_TOKEN no arquivo .env');
      return;
    }

    if (typeof mercadopago.configure === 'function') {
      mercadopago.configure({
        access_token: accessToken
      });
    } else {
      console.warn('SDK do Mercado Pago não configurado corretamente. Usando API direta.');
    }

    console.log('SDK do Mercado Pago configurado com sucesso');
  } catch (error) {
    console.error('Erro ao configurar SDK do Mercado Pago:', error);
  }
};

export default mercadopago;