import { MercadoPagoService } from '../services/MercadoPagoService';
import { OrderService } from '../services/OrderService';
import connectDB from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

async function getMercadoPagoLink() {
  try {
    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    await connectDB();
    console.log('Conectado ao MongoDB!');
    
    // Listar alguns pedidos para escolher
    const orderService = new OrderService();
    const result = await orderService.getAllOrders(1, 5);
    
    console.log('\nPedidos disponíveis:');
    result.orders.forEach((order, index) => {
      console.log(`${index + 1}. ID: ${order._id}, Cliente: ${order.clientId}, Valor: R$${order.finalPrice.toFixed(2)}`);
    });
    
    // Usar o primeiro pedido para teste
    const order = result.orders[0];
    console.log(`\nUsando o pedido: ${order._id}`);
    
    // Criar preferência de pagamento
    const mpService = new MercadoPagoService();
    const baseUrl = process.env.API_URL || 'http://localhost:3333';
    
    console.log('Criando preferência de pagamento...');
    const preference = await mpService.createPaymentPreference(order, baseUrl);
    
    console.log('\n=== LINKS DE PAGAMENTO ===');
    console.log('ID da preferência:', preference.id);
    console.log('\nLink para produção:');
    console.log(preference.init_point);
    console.log('\nLink para sandbox (teste):');
    console.log(preference.sandbox_init_point);
    console.log('\nCopie o link do sandbox e abra no navegador para testar o pagamento');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Dar tempo para completar antes de encerrar
    setTimeout(() => process.exit(0), 1000);
  }
}

getMercadoPagoLink();