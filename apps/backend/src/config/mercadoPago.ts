import mercadopago from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Mercado Pago
export const initMercadoPago = (): void => {
  // Obtém o access token do arquivo .env
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('ERRO: Token do Mercado Pago não configurado!');
    console.error('Defina MERCADO_PAGO_ACCESS_TOKEN no arquivo .env');
    return;
  }

  // Configura o SDK com o access token
  (mercadopago as any).configure({
    access_token: accessToken
  });

  console.log('SDK do Mercado Pago configurado com sucesso');
};

export default mercadopago;