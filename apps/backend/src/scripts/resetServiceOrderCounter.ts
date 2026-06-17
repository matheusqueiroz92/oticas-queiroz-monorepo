import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Order } from '../schemas/OrderSchema';
import { Counter } from '../schemas/CounterSchema';
import {
  SERVICE_ORDER_COUNTER_ID,
  SERVICE_ORDER_COUNTER_INITIAL,
  SERVICE_ORDER_START,
} from '../constants/serviceOrder';

config();

/**
 * Script para resetar o contador serviceOrder com base no maior número existente
 */
async function resetServiceOrderCounter() {
  try {
    console.log('🚀 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Conectado ao MongoDB com sucesso');

    console.log('🔄 Resetando contador serviceOrder...');
    
    console.log('📊 Verificando pedidos existentes...');
    const orderCount = await Order.countDocuments();
    console.log(`📈 Total de pedidos no sistema: ${orderCount}`);
    
    let targetValue = SERVICE_ORDER_COUNTER_INITIAL;
    
    if (orderCount === 0) {
      console.log(`📋 Sistema sem pedidos, configurando contador para ${SERVICE_ORDER_COUNTER_INITIAL}`);
      targetValue = SERVICE_ORDER_COUNTER_INITIAL;
    } else {
      console.log('🔍 Buscando o maior serviceOrder existente...');
      const lastOrder = await Order.findOne(
        { serviceOrder: { $exists: true, $ne: null } },
        { serviceOrder: 1 },
        { sort: { serviceOrder: -1 } }
      );
      
      console.log('📄 Último pedido encontrado:', lastOrder);
      
      if (lastOrder && lastOrder.serviceOrder) {
        const lastServiceOrder = parseInt(lastOrder.serviceOrder);
        console.log(`🔢 Último serviceOrder: ${lastServiceOrder}`);
        
        if (!isNaN(lastServiceOrder)) {
          if (lastServiceOrder >= SERVICE_ORDER_START) {
            targetValue = lastServiceOrder;
            console.log(`✅ Usando serviceOrder existente: ${lastServiceOrder}`);
          } else {
            targetValue = SERVICE_ORDER_COUNTER_INITIAL;
            console.log(`⚠️  Último serviceOrder < ${SERVICE_ORDER_START}, resetando para ${SERVICE_ORDER_COUNTER_INITIAL}`);
          }
        } else {
          targetValue = SERVICE_ORDER_COUNTER_INITIAL;
          console.log(`❌ ServiceOrder inválido, resetando para ${SERVICE_ORDER_COUNTER_INITIAL}`);
        }
      } else {
        targetValue = SERVICE_ORDER_COUNTER_INITIAL;
        console.log(`📝 Nenhum serviceOrder válido encontrado, resetando para ${SERVICE_ORDER_COUNTER_INITIAL}`);
      }
    }
    
    console.log(`🎯 Definindo contador para: ${targetValue}`);
    
    const result = await Counter.findOneAndUpdate(
      { _id: SERVICE_ORDER_COUNTER_ID },
      { sequence: targetValue },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    console.log('💾 Resultado da atualização:', result);
    
    if (result) {
      console.log('✅ Contador serviceOrder resetado com sucesso!');
      console.log(`📊 Valor atual do contador: ${result.sequence}`);
      console.log(`🎯 Próximo serviceOrder será: ${result.sequence + 1}`);
      
      const verification = await Counter.findById(SERVICE_ORDER_COUNTER_ID);
      console.log('🔍 Verificação final:', verification);
      
    } else {
      console.error('❌ Falha ao resetar contador serviceOrder');
    }

  } catch (error) {
    console.error('💥 Erro durante o reset:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
    process.exit(0);
  }
}

/**
 * Função alternativa para casos extremos - remove tudo e recria
 */
async function forceResetServiceOrderCounter() {
  try {
    console.log('🚀 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Conectado ao MongoDB com sucesso');

    console.log('🗑️  RESET FORÇADO - Removendo contador existente...');
    
    await Counter.deleteOne({ _id: SERVICE_ORDER_COUNTER_ID });
    console.log('🗑️  Contador removido');
    
    const newCounter = new Counter({
      _id: SERVICE_ORDER_COUNTER_ID,
      sequence: SERVICE_ORDER_COUNTER_INITIAL
    });
    
    await newCounter.save();
    console.log(`✅ Novo contador criado com sequence: ${SERVICE_ORDER_COUNTER_INITIAL}`);
    console.log(`🎯 Próximo serviceOrder será: ${SERVICE_ORDER_START}`);
    
  } catch (error) {
    console.error('💥 Erro durante o reset forçado:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
    process.exit(0);
  }
}

const args = process.argv.slice(2);

if (args.includes('--force')) {
  console.log('⚠️  Executando RESET FORÇADO');
  forceResetServiceOrderCounter();
} else {
  console.log('🔄 Executando reset normal');
  resetServiceOrderCounter();
}

export { resetServiceOrderCounter, forceResetServiceOrderCounter };
