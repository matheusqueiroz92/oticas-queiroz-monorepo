import { MercadoPagoService } from '../services/MercadoPagoService';
import { OrderService } from '../services/OrderService';
import dotenv from 'dotenv';

dotenv.config();

// Para executar testes
async function testMercadoPagoIntegration() {
  try {
    console.log('Iniciando teste de integração com Mercado Pago...');
    const mpService = new MercadoPagoService();
    const orderService = new OrderService();
    
    // 1. Buscar um pedido existente
    const orderId = '65c6f7a0e6dc2f001e7893c2'; // Substitua por um ID válido do seu sistema
    console.log(`Buscando pedido ${orderId}...`);
    const order = await orderService.getOrderById(orderId);
    console.log('Pedido encontrado:', order._id);
    
    // 2. Criar uma preferência de pagamento
    console.log('Criando preferência de pagamento...');
    const baseUrl = process.env.API_URL || 'http://localhost:3333';
    const preference = await mpService.createPaymentPreference(order, baseUrl);
    console.log('Preferência criada com sucesso:');
    console.log('- ID:', preference.id);
    console.log('- URL de pagamento:', preference.init_point);
    console.log('- URL de sandbox:', preference.sandbox_init_point);
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  } finally {
    process.exit(0);
  }
}

// Executar o teste
testMercadoPagoIntegration();