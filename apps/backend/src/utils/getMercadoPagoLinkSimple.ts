import { MercadoPagoAPI } from '../utils/mercadoPagoDirectApi';
import connectDB from '../config/db';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface OrderProduct {
  _id?: string;
  name?: string;
  description?: string;
  sellPrice?: number;
}

interface Order {
  _id: string;
  clientId: string;
  finalPrice?: number;
  products?: OrderProduct[];
}

interface MercadoPagoItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}

async function getMercadoPagoLinkSimple() {
  try {
    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    await connectDB();
    console.log('Conectado ao MongoDB!');
    
    // Buscar pedidos diretamente usando Mongoose
    const Order = mongoose.model('Order');
    const orders = await Order.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean() as unknown as Order[];
    
    if (!orders || orders.length === 0) {
      throw new Error('Nenhum pedido encontrado no banco de dados');
    }
    
    console.log('\nPedidos disponíveis:');
    orders.forEach((order: Order, index: number) => {
      console.log(`${index + 1}. ID: ${order._id}, Cliente: ${order.clientId}, Valor: R$${order.finalPrice?.toFixed(2) || 'N/A'}`);
    });
    
    // Usar o primeiro pedido para teste
    const order: Order = orders[0];
    console.log(`\nUsando o pedido: ${order._id}`);
    
    // Criar preferência de pagamento diretamente via API
    const baseUrl = process.env.API_URL || 'http://localhost:3333';
    
    // Preparar os itens para a preferência
    const items: MercadoPagoItem[] = [];
    
    // Se o pedido tiver produtos, crie um item para cada produto
    if (order.products && Array.isArray(order.products) && order.products.length > 0) {
      for (let i = 0; i < order.products.length; i++) {
        const product: OrderProduct = order.products[i];
        const item: MercadoPagoItem = {
          id: i.toString(),
          title: `Produto #${i + 1}`,
          description: `Item do pedido ${order._id}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: (order.finalPrice || 100) / order.products.length
        };
        
        // Se for um objeto com _id, use suas propriedades
        if (product && typeof product === 'object' && product._id) {
          item.id = String(product._id);
          
          if (product.name) {
            item.title = product.name;
          }
          
          if (product.description) {
            item.description = product.description;
          }
          
          if (product.sellPrice && typeof product.sellPrice === 'number') {
            item.unit_price = product.sellPrice;
          }
        }
        
        items.push(item);
      }
    } else {
      // Se não tiver produtos, crie um item para o pedido inteiro
      items.push({
        id: `order-${order._id}`,
        title: `Pedido ${order._id}`,
        description: `Pagamento do pedido ${order._id}`,
        quantity: 1,
        currency_id: "BRL",
        unit_price: order.finalPrice || 100
      });
    }
    
    const preference = {
      items,
      external_reference: String(order._id),
      back_urls: {
        success: `${baseUrl}/payment/success`,
        pending: `${baseUrl}/payment/pending`,
        failure: `${baseUrl}/payment/failure`
      },
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      statement_descriptor: "Óticas Queiroz"
    };
    
    console.log('Criando preferência de pagamento...');
    const response = await MercadoPagoAPI.createPreference(preference);
    
    console.log('\n=== LINKS DE PAGAMENTO ===');
    console.log('ID da preferência:', response.body.id);
    console.log('\nLink para produção:');
    console.log(response.body.init_point);
    console.log('\nLink para sandbox (teste):');
    console.log(response.body.sandbox_init_point);
    console.log('\nCopie o link do sandbox e abra no navegador para testar o pagamento');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Dar tempo para completar antes de encerrar
    setTimeout(() => {
      mongoose.disconnect();
      process.exit(0);
    }, 1000);
  }
}

getMercadoPagoLinkSimple();