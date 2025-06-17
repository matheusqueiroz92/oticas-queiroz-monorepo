const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017/oticas-queiroz';
const PRODUCT_ID = '6836f27b18f5a6a550eb830a';

async function findProduct() {
  console.log('🔍 === PROCURANDO PRODUTO ESPECÍFICO ===');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    const db = client.db();
    const collection = db.collection('products');
    
    // 1. Verificar se a coleção existe e tem documentos
    const count = await collection.countDocuments();
    console.log(`📊 Total de produtos na coleção: ${count}`);
    
    // 2. Listar alguns produtos para ver a estrutura
    console.log('\n📋 Primeiros 5 produtos:');
    const samples = await collection.find({}).limit(5).toArray();
    samples.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name} (ID: ${doc._id}, Tipo: ${doc.productType}, Estoque: ${doc.stock})`);
    });
    
    // 3. Procurar especificamente pelo ID
    console.log(`\n🔍 Procurando produto com ID: ${PRODUCT_ID}`);
    const product = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
    
    if (product) {
      console.log('✅ PRODUTO ENCONTRADO!');
      console.log(`   Nome: ${product.name}`);
      console.log(`   Estoque: ${product.stock}`);
      console.log(`   Tipo: ${product.productType}`);
      console.log(`   Documento completo:`, JSON.stringify(product, null, 2));
      
      // 4. Testar atualização direta
      console.log('\n🔧 Testando atualização direta...');
      const originalStock = product.stock;
      const newStock = originalStock - 1;
      
      const updateResult = await collection.updateOne(
        { _id: new ObjectId(PRODUCT_ID) },
        { $set: { stock: newStock } }
      );
      
      console.log(`📝 Resultado da atualização:`, updateResult);
      
      // Verificar se foi atualizado
      const updatedProduct = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
      console.log(`📦 Estoque após atualização: ${updatedProduct?.stock}`);
      
      if (updatedProduct?.stock === newStock) {
        console.log('✅ ATUALIZAÇÃO FUNCIONOU NO MONGODB!');
        
        // Restaurar estoque original
        await collection.updateOne(
          { _id: new ObjectId(PRODUCT_ID) },
          { $set: { stock: originalStock } }
        );
        console.log(`🔄 Estoque restaurado para: ${originalStock}`);
      } else {
        console.log('❌ ATUALIZAÇÃO FALHOU NO MONGODB!');
      }
      
    } else {
      console.log('❌ Produto não encontrado');
      
      // Procurar por nome similar
      console.log('\n🔍 Procurando por nome similar...');
      const similarProducts = await collection.find({
        name: { $regex: /ARMAÇAO.*METAL.*FEMININA/i }
      }).toArray();
      
      if (similarProducts.length > 0) {
        console.log('📋 Produtos similares encontrados:');
        similarProducts.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.name} (ID: ${doc._id})`);
        });
      } else {
        console.log('❌ Nenhum produto similar encontrado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

findProduct().catch(console.error); 