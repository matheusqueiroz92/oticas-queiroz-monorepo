const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017/oticas-queiroz';
const PRODUCT_ID = '6836f27b18f5a6a550eb830a';

async function testDirectMongo() {
  console.log('🔍 === TESTE DIRETO NO MONGODB ===');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db();
    const collection = db.collection('products');
    
    // 1. Buscar produto atual
    console.log('\n1️⃣ Buscando produto atual...');
    const { ObjectId } = require('mongodb');
    const product = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
    if (!product) {
      console.log('❌ Produto não encontrado');
      return;
    }
    
    console.log(`✅ Produto encontrado: ${product.name}`);
    console.log(`   Estoque atual: ${product.stock}`);
    console.log(`   Tipo: ${product.productType}`);
    
    // 2. Testar atualização direta com $set
    console.log('\n2️⃣ Testando atualização com $set...');
    const originalStock = product.stock;
    const newStock = originalStock - 1;
    
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(PRODUCT_ID) },
      { $set: { stock: newStock } }
    );
    
    console.log(`📝 Resultado da atualização:`, updateResult);
    
    // 3. Verificar se foi atualizado
    const updatedProduct = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
    console.log(`📦 Estoque após $set: ${updatedProduct?.stock}`);
    
    // 4. Testar atualização com $inc
    console.log('\n3️⃣ Testando atualização com $inc...');
    const incResult = await collection.updateOne(
      { _id: new ObjectId(PRODUCT_ID) },
      { $inc: { stock: -1 } }
    );
    
    console.log(`📝 Resultado do $inc:`, incResult);
    
    // 5. Verificar novamente
    const incProduct = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
    console.log(`📦 Estoque após $inc: ${incProduct?.stock}`);
    
    // 6. Restaurar estoque original
    console.log('\n4️⃣ Restaurando estoque original...');
    await collection.updateOne(
      { _id: new ObjectId(PRODUCT_ID) },
      { $set: { stock: originalStock } }
    );
    
    const restoredProduct = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
    console.log(`🔄 Estoque restaurado: ${restoredProduct?.stock}`);
    
    // 7. Testar transação
    console.log('\n5️⃣ Testando com transação...');
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        const transactionResult = await collection.updateOne(
          { _id: new ObjectId(PRODUCT_ID) },
          { $inc: { stock: -1 } },
          { session }
        );
        
        console.log(`📝 Resultado da transação:`, transactionResult);
        
        const transactionProduct = await collection.findOne(
          { _id: new ObjectId(PRODUCT_ID) },
          { session }
        );
        console.log(`📦 Estoque durante transação: ${transactionProduct?.stock}`);
      });
      
      const finalProduct = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
      console.log(`📦 Estoque após transação: ${finalProduct?.stock}`);
      
      // Restaurar novamente
      await collection.updateOne(
        { _id: new ObjectId(PRODUCT_ID) },
        { $set: { stock: originalStock } }
      );
      
    } finally {
      await session.endSession();
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

testDirectMongo().catch(console.error); 