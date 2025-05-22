import { API_ROUTES } from "../_constants/api-routes";
import { api } from "./authService";

/**
 * Cria uma preferência de pagamento para um pedido
 * @param orderId ID do pedido
 * @returns Preferência de pagamento com links
 */
export async function createPaymentPreference(orderId: string) {
  try {
    console.log(`Criando preferência de pagamento para o pedido: ${orderId}`);
    
    if (!orderId) {
      throw new Error("ID do pedido é obrigatório");
    }
    
    const response = await api.post(API_ROUTES.MERCADO_PAGO.PREFERENCE(orderId));
    
    console.log(`Preferência criada com sucesso:`, response.data);
    
    if (!response.data || !response.data.id) {
      throw new Error("Resposta inválida da API: ID da preferência não foi retornado");
    }
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao criar preferência de pagamento:`, error);
    
    // Extrair mensagem de erro mais específica se disponível
    let errorMessage = "Falha ao criar preferência de pagamento";
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseError = error.response as any;
      
      if (responseError?.data?.message) {
        errorMessage = responseError.data.message;
      } else if (responseError?.data?.details) {
        errorMessage = responseError.data.details;
      }
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Obtém informações de um pagamento no Mercado Pago
 * @param paymentId ID do pagamento no Mercado Pago
 * @returns Informações detalhadas do pagamento
 */
export async function getPaymentInfo(paymentId: string) {
  try {
    console.log(`Obtendo informações do pagamento: ${paymentId}`);
    
    const response = await api.get(API_ROUTES.MERCADO_PAGO.PAYMENT(paymentId));
    
    console.log(`Informações do pagamento obtidas:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao obter informações do pagamento:`, error);
    
    throw new Error("Falha ao obter informações do pagamento");
  }
}

/**
 * Processa um pagamento recebido
 * @param paymentId ID do pagamento no Mercado Pago
 * @returns Status do processamento
 */
export async function processPayment(paymentId: string) {
  try {
    console.log(`Processando pagamento: ${paymentId}`);
    
    const response = await api.post(API_ROUTES.MERCADO_PAGO.PROCESS_PAYMENT(paymentId));
    
    console.log(`Pagamento processado:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao processar pagamento:`, error);
    
    throw new Error("Falha ao processar pagamento");
  }
}

/**
 * Teste de conexão com o Mercado Pago
 * @returns Resultado do teste
 */
export async function testConnection() {
  try {
    console.log('Testando conexão com Mercado Pago...');
    
    const response = await api.get(API_ROUTES.MERCADO_PAGO.TEST_CONNECTION);
    
    console.log('Resultado do teste:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao testar conexão com Mercado Pago:', error);
    
    throw new Error("Falha ao testar conexão com Mercado Pago");
  }
}

/**
 * Cria uma preferência de teste direto
 * @param amount Valor do teste
 * @param description Descrição do teste
 * @returns Preferência de pagamento criada
 */
export async function createTestPreference(amount: number = 100, description: string = "Teste Óticas Queiroz") {
  try {
    console.log(`Criando preferência de teste com valor ${amount} e descrição "${description}"`);
    
    const response = await api.post(API_ROUTES.MERCADO_PAGO.TEST_PREFERENCE, {
      amount,
      description
    });
    
    console.log(`Preferência de teste criada com sucesso:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao criar preferência de teste:`, error);
    
    // Extrair mensagem de erro mais específica se disponível
    let errorMessage = "Falha ao criar preferência de teste";
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseError = error.response as any;
      
      if (responseError?.data?.message) {
        errorMessage = responseError.data.message;
      } else if (responseError?.data?.details) {
        errorMessage = responseError.data.details;
      }
    }
    
    throw new Error(errorMessage);
  }
}