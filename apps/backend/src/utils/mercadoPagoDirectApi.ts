import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = 'https://api.mercadopago.com';
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

// Verificação mais robusta do token
if (!accessToken) {
  console.error('\x1b[31m%s\x1b[0m', '--------------------------------------------------------------');
  console.error('\x1b[31m%s\x1b[0m', 'ERRO CRÍTICO: TOKEN DO MERCADO PAGO NÃO CONFIGURADO!');
  console.error('\x1b[31m%s\x1b[0m', 'Defina MERCADO_PAGO_ACCESS_TOKEN no arquivo .env');
  console.error('\x1b[31m%s\x1b[0m', 'A integração com o Mercado Pago não funcionará sem este token.');
  console.error('\x1b[31m%s\x1b[0m', '--------------------------------------------------------------');
}

// Testar o token ao inicializar
if (accessToken) {
  axios.get(`${baseURL}/v1/payment_methods`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  }).then(() => {
    console.log('\x1b[32m%s\x1b[0m', 'Conexão com Mercado Pago estabelecida com sucesso!');
  }).catch(error => {
    console.error('\x1b[31m%s\x1b[0m', 'ERRO AO CONECTAR COM MERCADO PAGO:');
    console.error('\x1b[31m%s\x1b[0m', error.response?.data?.message || error.message);
    console.error('\x1b[31m%s\x1b[0m', 'Verifique se o token está correto e tem as permissões necessárias.');
  });
}

const api = axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

export const MercadoPagoAPI = {
  /**
   * Cria uma preferência de pagamento
   */
  createPreference: async (preference: any): Promise<any> => {
    try {
      const response = await api.post('/checkout/preferences', preference);
      return {
        body: {
          id: response.data.id,
          init_point: response.data.init_point,
          sandbox_init_point: response.data.sandbox_init_point
        }
      };
    } catch (error) {
      console.error('Erro ao criar preferência:', error);
      throw error;
    }
  },

  /**
   * Obtém informações de um pagamento
   */
  getPayment: async (paymentId: string): Promise<any> => {
    try {
      const response = await api.get(`/v1/payments/${paymentId}`);
      return {
        body: response.data
      };
    } catch (error) {
      console.error('Erro ao obter informações do pagamento:', error);
      throw error;
    }
  }
};