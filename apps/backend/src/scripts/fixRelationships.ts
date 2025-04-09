import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Order } from '../schemas/OrderSchema';
import { User } from '../schemas/UserSchema';
import { Payment } from '../schemas/PaymentSchema';

config(); // Carrega as variáveis de ambiente

async function fixRelationships() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Conectado ao MongoDB com sucesso.');

    // 1. Corrigir relacionamentos de vendas (funcionário -> pedidos)
    console.log('\n1. Atualizando relacionamentos de vendas (funcionários)...');
    const orders = await Order.find({ isDeleted: { $ne: true } });
    console.log(`Encontrados ${orders.length} pedidos para processar.`);

    const employeeSalesMap = new Map<string, Set<string>>();
    
    // Agrupar pedidos por funcionário
    for (const order of orders) {
      if (!order.employeeId) continue;
      
      const employeeId = order.employeeId.toString();
      const orderId = order._id.toString();
      
      if (!employeeSalesMap.has(employeeId)) {
        employeeSalesMap.set(employeeId, new Set<string>());
      }
      
      employeeSalesMap.get(employeeId)?.add(orderId);
    }
    
    // Atualizar vendas dos funcionários
    for (const [employeeId, orderIds] of employeeSalesMap.entries()) {
      const employee = await User.findById(employeeId);
      if (!employee) continue;
      
      // Obter vendas atuais
      const currentSales = employee.sales || [];
      const currentSalesSet = new Set(currentSales.map(id => id.toString()));
      
      // Adicionar novas vendas
      for (const orderId of orderIds) {
        if (!currentSalesSet.has(orderId)) {
          currentSalesSet.add(orderId);
        }
      }
      
      // Atualizar no banco de dados
      const salesArray = Array.from(currentSalesSet);
      await User.findByIdAndUpdate(employeeId, { 
        $set: { sales: salesArray } 
      });
      
      console.log(`Funcionário ${employeeId}: Atualizadas ${salesArray.length} vendas.`);
    }

    // 2. Corrigir relacionamentos de compras (cliente -> pedidos)
    console.log('\n2. Atualizando relacionamentos de compras (clientes)...');
    
    const clientPurchasesMap = new Map<string, Set<string>>();
    
    // Agrupar pedidos por cliente
    for (const order of orders) {
      if (!order.clientId) continue;
      
      const clientId = order.clientId.toString();
      const orderId = order._id.toString();
      
      if (!clientPurchasesMap.has(clientId)) {
        clientPurchasesMap.set(clientId, new Set<string>());
      }
      
      clientPurchasesMap.get(clientId)?.add(orderId);
    }
    
    // Atualizar compras dos clientes
    for (const [clientId, orderIds] of clientPurchasesMap.entries()) {
      const client = await User.findById(clientId);
      if (!client) continue;
      
      // Obter compras atuais
      const currentPurchases = client.purchases || [];
      const currentPurchasesSet = new Set(currentPurchases.map(id => id.toString()));
      
      // Adicionar novas compras
      for (const orderId of orderIds) {
        if (!currentPurchasesSet.has(orderId)) {
          currentPurchasesSet.add(orderId);
        }
      }
      
      // Atualizar no banco de dados
      const purchasesArray = Array.from(currentPurchasesSet);
      await User.findByIdAndUpdate(clientId, { 
        $set: { purchases: purchasesArray } 
      });
      
      console.log(`Cliente ${clientId}: Atualizadas ${purchasesArray.length} compras.`);
    }

    // 3. Corrigir dívidas de clientes com base em pedidos parcelados
    console.log('\n3. Atualizando dívidas dos clientes com base em pedidos parcelados...');
    
    // Encontrar pedidos com pagamento parcelado
    const parceledOrders = orders.filter(order => 
      order.paymentMethod === 'bank_slip' || 
      order.paymentMethod === 'promissory_note'
    );
    
    console.log(`Encontrados ${parceledOrders.length} pedidos parcelados para processar.`);
    
    // Mapear dívidas por cliente
    const clientDebtsMap = new Map<string, number>();
    
    for (const order of parceledOrders) {
      if (!order.clientId || order.status === 'cancelled') continue;
      
      const clientId = order.clientId.toString();
      const debtAmount = order.finalPrice - (order.paymentEntry || 0);
      
      if (debtAmount <= 0) continue;
      
      // Verificar se já existe pagamento para esse pedido que reduza a dívida
      const payments = await Payment.find({ 
        orderId: order._id,
        type: 'debt_payment',
        status: 'completed',
        isDeleted: { $ne: true }
      });
      
      // Calcular pagamentos já realizados
      const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remainingDebt = Math.max(0, debtAmount - paidAmount);
      
      if (remainingDebt <= 0) continue;
      
      const currentDebt = clientDebtsMap.get(clientId) || 0;
      clientDebtsMap.set(clientId, currentDebt + remainingDebt);
    }
    
    // Atualizar dívidas dos clientes
    for (const [clientId, debtAmount] of clientDebtsMap.entries()) {
      const client = await User.findById(clientId);
      if (!client) continue;
      
      // Atualizar no banco de dados (substituir o valor atual pelo calculado)
      await User.findByIdAndUpdate(clientId, { 
        $set: { debts: debtAmount } 
      });
      
      console.log(`Cliente ${clientId}: Dívida atualizada para ${debtAmount}.`);
    }

    console.log('\nProcesso de correção de relacionamentos concluído com sucesso!');
    mongoose.disconnect();
    
  } catch (error) {
    console.error('Erro durante o processo de correção:', error);
    process.exit(1);
  }
}

// Executar script
fixRelationships();