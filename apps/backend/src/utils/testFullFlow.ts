import connectDB from '../config/db';
import { MercadoPagoService } from '../services/MercadoPagoService';
import { OrderService } from '../services/OrderService';
import { MercadoPagoAPI } from '../utils/mercadoPagoDirectApi';

async function testFullFlow() {
  try {
    console.log('Iniciando teste completo de integração com Mercado Pago...');
    
    // 1. Conectar ao banco de dados
    await connectDB();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // 2. Testar o token do Mercado Pago
    console.log('Testando token do Mercado Pago...');
    try {
      await MercadoPagoAPI.getPayment('1'); // Testando apenas a conexão, o ID não importa
      console.log('✅ Token do Mercado Pago válido');
    } catch (error) {
      if (error instanceof Error && 'response' in error && (error.response as { status?: number })?.status === 404) {
        console.log('✅ Token do Mercado Pago válido (erro 404 esperado)');
      } else {
        if (error instanceof Error) {
          throw new Error(`❌ Token do Mercado Pago inválido: ${error.message}`);
        } else {
          throw new Error('❌ Token do Mercado Pago inválido: erro desconhecido');
        }
      }
    }
    
    // 3. Buscar um pedido para teste
    const orderService = new OrderService();
    const result = await orderService.getAllOrders(1, 1);
    if (!result.orders.length) {
      throw new Error('❌ Nenhum pedido encontrado para teste');
    }
    
    const order = result.orders[0];
    console.log(`✅ Pedido de teste obtido: ${order._id}`);
    
    // 4. Criar uma preferência de pagamento
    const mpService = new MercadoPagoService();
    const baseUrl = process.env.API_URL || 'http://localhost:3333';
    
    console.log('Criando preferência de pagamento...');
    const preference = await mpService.createPaymentPreference(order, baseUrl);
    console.log(`✅ Preferência criada com sucesso: ${preference.id}`);
    console.log(`🔗 Link de pagamento: ${preference.init_point}`);
    console.log(`🔗 Link de sandbox: ${preference.sandbox_init_point}`);
    
    console.log('\n✅ Teste completo executado com sucesso!');
    
    return {
      success: true,
      paymentLink: preference.sandbox_init_point,
      preferenceId: preference.id
    };
  } catch (error) {
    console.error('❌ ERRO no teste:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  } finally {
    // Aguardar um pouco antes de encerrar
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(0);
  }
}

// Executar o teste
testFullFlow();