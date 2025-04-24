import mongoose from 'mongoose';
import { Order } from '../schemas/OrderSchema';
import { User } from '../schemas/UserSchema';
import { LegacyClient } from '../schemas/LegacyClientSchema';
import dotenv from 'dotenv';
import connectDB from '../config/db';

dotenv.config();

// Calcular o débito total de um cliente com base em seus pedidos
async function calculateClientTotalDebt(clientId: string): Promise<number> {
  try {
    // Buscar todos os pedidos do cliente que não estão cancelados
    const clientOrders = await Order.find({ 
      clientId: new mongoose.Types.ObjectId(clientId),
      status: { $ne: 'cancelled' },
      isDeleted: { $ne: true }
    });
    
    // Calcular o débito total
    let totalDebt = 0;
    
    for (const order of clientOrders) {
      // Obter o valor total do pedido
      const orderTotal = order.finalPrice;
      
      // Calcular quanto já foi pago neste pedido (incluindo a entrada)
      const paymentHistory = order.paymentHistory || [];
      const orderPaid = paymentHistory.reduce((sum, entry) => {
        return sum + (entry.amount || 0);
      }, 0);
      
      // Se ainda houver valor a pagar, adicionar ao débito total
      if (orderPaid < orderTotal) {
        totalDebt += (orderTotal - orderPaid);
      }
    }
    
    return totalDebt;
  } catch (error) {
    console.error(`Erro ao calcular débito do cliente ${clientId}:`, error);
    return 0;
  }
}

// Recalcular débitos para todos os clientes
async function recalculateAllDebts() {
  try {
    // Buscar todos os clientes
    const customers = await User.find({ role: 'customer' });
    
    console.log(`Encontrados ${customers.length} clientes para recalcular débitos`);
    
    const results = {
      updated: 0,
      clients: [] as Array<{ id: string; oldDebt: number; newDebt: number; diff: number }>
    };
    
    // Para cada cliente, recalcular o débito
    for (const customer of customers) {
      const oldDebt = customer.debts || 0;
      const newDebt = await calculateClientTotalDebt(customer._id.toString());
      
      // Se o valor do débito mudou, atualizar o cliente
      if (oldDebt !== newDebt) {
        await User.findByIdAndUpdate(customer._id, { debts: newDebt });
        
        results.updated++;
        results.clients.push({
          id: customer._id.toString(),
          oldDebt,
          newDebt,
          diff: newDebt - oldDebt
        });
        
        console.log(`Cliente ${customer.name} (${customer._id}): Débito atualizado de ${oldDebt} para ${newDebt}`);
      }
    }
    
    // Buscar clientes legados
    const legacyClients = await LegacyClient.find({ status: 'active' });
    
    console.log(`Encontrados ${legacyClients.length} clientes legados para recalcular débitos`);
    
    // Para clientes legados, utilizamos uma abordagem diferente, pois a estrutura pode ser diferente
    for (const client of legacyClients) {
      // Para clientes legados, calcular o total das dívidas pendentes
      // Este cálculo pode precisar ser ajustado dependendo da estrutura exata dos dados
      const oldDebt = client.totalDebt || 0;
      
      // Calculamos o valor pago
      const paymentHistory = client.paymentHistory || [];
      const totalPaid = paymentHistory.reduce((sum, entry) => {
        return sum + (entry.amount || 0);
      }, 0);
      
      // Recalcular a dívida total
      // Nota: Isto é uma aproximação; a lógica exata depende da estrutura do sistema
      const newDebt = Math.max(0, oldDebt - totalPaid);
      
      // Se o valor do débito mudou, atualizar o cliente
      if (oldDebt !== newDebt) {
        await LegacyClient.findByIdAndUpdate(client._id, { totalDebt: newDebt });
        
        results.updated++;
        results.clients.push({
          id: client._id.toString(),
          oldDebt,
          newDebt,
          diff: newDebt - oldDebt
        });
        
        console.log(`Cliente legado ${client.name} (${client._id}): Débito atualizado de ${oldDebt} para ${newDebt}`);
      }
    }
    
    console.log('Recálculo de débitos concluído!');
    console.log(`Total de clientes atualizados: ${results.updated}`);
    
    return results;
  } catch (error) {
    console.error('Erro ao recalcular débitos:', error);
    throw error;
  }
}

// Função principal
async function main() {
  await connectDB();
  
  try {
    const results = await recalculateAllDebts();
    console.log('Resultados:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    // Fechar conexão com o banco
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
  }
}

// Executar o script
main().catch(console.error);

// Adicionar em package.json em "scripts":
// "recalculate-debts": "ts-node src/scripts/recalculateAllDebts.ts"