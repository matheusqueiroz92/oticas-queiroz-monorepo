import mongoose from 'mongoose';
import { Order } from '../schemas/OrderSchema';
import { Counter } from '../schemas/CounterSchema';
import { CounterService } from '../services/CounterService';
import {
  SERVICE_ORDER_COUNTER_ID,
  SERVICE_ORDER_COUNTER_INITIAL,
  SERVICE_ORDER_START,
} from '../constants/serviceOrder';
import dotenv from 'dotenv';
import connectDB from '../config/db';

dotenv.config();

/**
 * Script para migrar pedidos existentes para o novo sistema de serviceOrder automático
 */
async function migrateServiceOrder() {
  try {
    console.log('🚀 Iniciando migração do serviceOrder...');
    
    await connectDB();

    // 1. Buscar todos os pedidos existentes que não têm serviceOrder ou têm serviceOrder inválido
    const ordersWithoutServiceOrder = await Order.find({
      $or: [
        { serviceOrder: { $exists: false } },
        { serviceOrder: null },
        { serviceOrder: "" }
      ]
    }).sort({ createdAt: 1 }); // Ordenar por data de criação para manter ordem

    console.log(`📊 Encontrados ${ordersWithoutServiceOrder.length} pedidos sem serviceOrder`);

    if (ordersWithoutServiceOrder.length === 0) {
      console.log('✅ Todos os pedidos já possuem serviceOrder. Migração não necessária.');
      return;
    }

    // 2. Verificar se já existe um contador para serviceOrder
    let currentCounter = await CounterService.getCurrentSequence(SERVICE_ORDER_COUNTER_ID);
    
    if (currentCounter === null) {
      console.log(`📝 Criando contador inicial para serviceOrder começando em ${SERVICE_ORDER_START}`);
      currentCounter = SERVICE_ORDER_COUNTER_INITIAL;
    } else {
      console.log(`📝 Contador atual encontrado: ${currentCounter}`);
    }

    // 3. Atualizar pedidos em lotes para melhor performance
    const batchSize = 100;
    let updatedCount = 0;
    let currentNumber = currentCounter + 1;

    for (let i = 0; i < ordersWithoutServiceOrder.length; i += batchSize) {
      const batch = ordersWithoutServiceOrder.slice(i, i + batchSize);
      
      console.log(`🔄 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(ordersWithoutServiceOrder.length / batchSize)}`);

      const bulkOps = batch.map(order => ({
        updateOne: {
          filter: { _id: order._id },
          update: { 
            $set: { 
              serviceOrder: currentNumber.toString() 
            } 
          }
        }
      }));

      // Incrementar currentNumber para cada pedido no lote
      currentNumber += batch.length;

      try {
        const result = await Order.bulkWrite(bulkOps);
        updatedCount += result.modifiedCount;
        console.log(`✅ Lote processado: ${result.modifiedCount} pedidos atualizados`);
      } catch (error) {
        console.error(`❌ Erro ao processar lote:`, error);
        throw error;
      }
    }

    // 4. Atualizar o contador para o próximo número disponível
    await CounterService.resetCounter(SERVICE_ORDER_COUNTER_ID, currentNumber - 1);

    console.log(`✅ Migração concluída com sucesso!`);
    console.log(`📊 Total de pedidos atualizados: ${updatedCount}`);
    console.log(`🔢 Próximo serviceOrder será: ${currentNumber}`);

    // 5. Verificar a migração
    const ordersStillWithoutServiceOrder = await Order.countDocuments({
      $or: [
        { serviceOrder: { $exists: false } },
        { serviceOrder: null },
        { serviceOrder: "" }
      ]
    });

    if (ordersStillWithoutServiceOrder === 0) {
      console.log('🎉 Verificação concluída: Todos os pedidos agora possuem serviceOrder!');
    } else {
      console.warn(`⚠️  Ainda existem ${ordersStillWithoutServiceOrder} pedidos sem serviceOrder`);
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

/**
 * Função para reverter a migração (em caso de problemas)
 */
async function rollbackMigration() {
  try {
    console.log('🔄 Iniciando rollback da migração...');
    
    await connectDB();

    // Remover serviceOrder de todos os pedidos que começam com "3"
    const result = await Order.updateMany(
      { serviceOrder: /^3\d{5}$/ }, // ServiceOrder com 6 dígitos começando com 3
      { $unset: { serviceOrder: "" } }
    );

    console.log(`✅ Rollback concluído: ${result.modifiedCount} pedidos tiveram serviceOrder removido`);

    // Remover contador
    await Counter.deleteOne({ _id: SERVICE_ORDER_COUNTER_ID });
    console.log('✅ Contador removido');

  } catch (error) {
    console.error('❌ Erro durante o rollback:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    await rollbackMigration();
  } else {
    await migrateServiceOrder();
  }
}

// Executar o script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
}

export { migrateServiceOrder, rollbackMigration };