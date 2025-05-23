import mongoose from 'mongoose';
import { config } from 'dotenv';
import { Order } from '../schemas/OrderSchema'; // Importar o schema
import { Counter } from '../schemas/CounterSchema'; // Importar o schema

config();

/**
 * Script para resetar o contador serviceOrder para começar em 300000
 */
async function resetServiceOrderCounter() {
  try {
    console.log('🚀 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Conectado ao MongoDB com sucesso');

    console.log('🔄 Resetando contador serviceOrder...');
    
    // Verificar se existem pedidos no sistema
    console.log('📊 Verificando pedidos existentes...');
    const orderCount = await Order.countDocuments();
    console.log(`📈 Total de pedidos no sistema: ${orderCount}`);
    
    let targetValue = 299999; // Padrão: próximo será 300000
    
    if (orderCount === 0) {
      console.log('📋 Sistema sem pedidos, configurando contador para 299999');
      targetValue = 299999;
    } else {
      // Verificar o maior serviceOrder existente
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
          if (lastServiceOrder >= 300000) {
            // Se já existe um serviceOrder >= 300000, usar esse valor
            targetValue = lastServiceOrder;
            console.log(`✅ Usando serviceOrder existente: ${lastServiceOrder}`);
          } else {
            // Se o último serviceOrder é < 300000, resetar para 299999
            targetValue = 299999;
            console.log(`⚠️  Último serviceOrder < 300000, resetando para 299999`);
          }
        } else {
          targetValue = 299999;
          console.log(`❌ ServiceOrder inválido, resetando para 299999`);
        }
      } else {
        targetValue = 299999;
        console.log(`📝 Nenhum serviceOrder válido encontrado, resetando para 299999`);
      }
    }
    
    // Resetar/criar o contador
    console.log(`🎯 Definindo contador para: ${targetValue}`);
    
    const result = await Counter.findOneAndUpdate(
      { _id: 'serviceOrder' },
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
      
      // Verificação adicional
      const verification = await Counter.findById('serviceOrder');
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
    
    // Remover contador existente
    await Counter.deleteOne({ _id: 'serviceOrder' });
    console.log('🗑️  Contador removido');
    
    // Criar novo contador
    const newCounter = new Counter({
      _id: 'serviceOrder',
      sequence: 299999
    });
    
    await newCounter.save();
    console.log('✅ Novo contador criado com sequence: 299999');
    console.log('🎯 Próximo serviceOrder será: 300000');
    
  } catch (error) {
    console.error('💥 Erro durante o reset forçado:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
    process.exit(0);
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--force')) {
  console.log('⚠️  Executando RESET FORÇADO');
  forceResetServiceOrderCounter();
} else {
  console.log('🔄 Executando reset normal');
  resetServiceOrderCounter();
}

export { resetServiceOrderCounter, forceResetServiceOrderCounter };