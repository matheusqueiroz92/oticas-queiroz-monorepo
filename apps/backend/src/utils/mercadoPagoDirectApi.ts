import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = 'https://api.mercadopago.com';
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error('ERRO: Token do Mercado Pago não configurado!');
  console.error('Defina MERCADO_PAGO_ACCESS_TOKEN no arquivo .env');
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