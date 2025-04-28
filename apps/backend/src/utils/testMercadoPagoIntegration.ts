import { MercadoPagoService } from '../services/MercadoPagoService';
import { OrderService } from '../services/OrderService';
import dotenv from 'dotenv';

dotenv.config();

async function testMercadoPagoIntegration() {
  try {
    console.log('Iniciando teste de integração com Mercado Pago...');
    
    // Buscar pedidos disponíveis
    const orderId = await listOrders();
    if (!orderId) {
      throw new Error("Nenhum pedido encontrado no banco de dados");
    }
    
    const mpService = new MercadoPagoService();
    const orderService = new OrderService();
    
    // Buscar o pedido selecionado
    console.log(`Buscando pedido ${orderId}...`);
    const order = await orderService.getOrderById(orderId);
    console.log('Pedido encontrado:', order._id);
    
    // Criar uma preferência de pagamento
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
    setTimeout(() => process.exit(0), 1000);
  }
}

async function listOrders() {
  try {
    const orderService = new OrderService();
    const result = await orderService.getAllOrders(1, 5); // Lista 5 pedidos
    
    console.log('Pedidos disponíveis:');
    result.orders.forEach(order => {
      console.log(`- ID: ${order._id}, Cliente: ${order.clientId}, Valor: ${order.finalPrice}`);
    });
    
    return result.orders.length > 0 ? result.orders[0]._id : null;
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return null;
  }
}

// Executar o teste
testMercadoPagoIntegration();