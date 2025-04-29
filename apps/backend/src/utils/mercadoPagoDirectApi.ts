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
      console.log('[MercadoPagoAPI] Enviando preferência para o Mercado Pago...');
      
      // Verificação básica dos dados mínimos necessários
      if (!preference.items || preference.items.length === 0) {
        throw new Error('Preferência inválida: items são obrigatórios');
      }
      
      // Verificar cada item
      for (const item of preference.items) {
        if (!item.title || !item.id) {
          throw new Error('Item inválido: title e id são obrigatórios');
        }
        
        // Garantir que unit_price seja um número
        if (!item.unit_price || typeof item.unit_price !== 'number' || isNaN(item.unit_price) || item.unit_price <= 0) {
          throw new Error(`Valor inválido para o item ${item.id}: ${item.unit_price}`);
        }
      }
      
      // Log do tipo de token usado (produção ou teste)
      const tokenType = process.env.NODE_ENV === 'production' 
        ? 'produção' 
        : 'teste';
      console.log(`[MercadoPagoAPI] Usando token de ${tokenType}`);
      
      const response = await api.post('/checkout/preferences', preference);
      console.log('[MercadoPagoAPI] Preferência criada com sucesso:', response.data);
      
      if (!response.data || !response.data.id) {
        throw new Error('Resposta inválida da API do Mercado Pago: ID não encontrado');
      }
      
      return {
        body: {
          id: response.data.id,
          init_point: response.data.init_point,
          sandbox_init_point: response.data.sandbox_init_point
        }
      };
    } catch (error: any) {
      console.error('[MercadoPagoAPI] Erro detalhado ao criar preferência:', error);
      
      // Extrair mensagem de erro mais detalhada
      if (error.response) {
        console.error('[MercadoPagoAPI] Status do erro:', error.response.status);
        console.error('[MercadoPagoAPI] Cabeçalhos da resposta:', error.response.headers);
        console.error('[MercadoPagoAPI] Resposta de erro da API:', error.response.data);
        
        if (error.response.data && error.response.data.cause) {
          console.error('[MercadoPagoAPI] Causa do erro:', error.response.data.cause);
        }
      }
      
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
  },

  /**
   * Obtém os métodos de pagamento disponíveis
   * Útil para verificar se a conexão está funcionando
   */
  getPaymentMethods: async (): Promise<any> => {
    try {
      const response = await api.get('/v1/payment_methods');
      return {
        body: response.data
      };
    } catch (error) {
      console.error('Erro ao obter métodos de pagamento:', error);
      throw error;
    }
  }
};