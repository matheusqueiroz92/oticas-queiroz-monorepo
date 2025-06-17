const { MongoClient } = require('mongodb');

// Tentar diferentes URIs possíveis
const POSSIBLE_URIS = [
  'mongodb://localhost:27017/oticas-queiroz',
  'mongodb://localhost:27017/oticas_queiroz',
  'mongodb://localhost:27017/oticasqueiroz',
  'mongodb://127.0.0.1:27017/oticas-queiroz',
  'mongodb://127.0.0.1:27017/oticas_queiroz',
  'mongodb://127.0.0.1:27017/oticasqueiroz'
];

const PRODUCT_ID = '6836f27b18f5a6a550eb830a';

async function findDatabase() {
  console.log('🔍 === PROCURANDO BANCO DE DADOS ===');
  
  for (const uri of POSSIBLE_URIS) {
    console.log(`\n🔗 Tentando: ${uri}`);
    const client = new MongoClient(uri);
    
    try {
      await client.connect();
      console.log('✅ Conectado!');
      
      const db = client.db();
      
      // Listar coleções
      const collections = await db.listCollections().toArray();
      console.log('📋 Coleções encontradas:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
      
      // Procurar o produto em diferentes coleções
      const possibleCollections = ['products', 'product', 'Products', 'Product'];
      
      for (const collectionName of possibleCollections) {
        if (collections.some(col => col.name === collectionName)) {
          console.log(`\n🔍 Procurando produto na coleção: ${collectionName}`);
          const collection = db.collection(collectionName);
          
          try {
            const { ObjectId } = require('mongodb');
            const product = await collection.findOne({ _id: new ObjectId(PRODUCT_ID) });
            
            if (product) {
              console.log(`✅ PRODUTO ENCONTRADO!`);
              console.log(`   Nome: ${product.name}`);
              console.log(`   Estoque: ${product.stock}`);
              console.log(`   Tipo: ${product.productType}`);
              console.log(`   URI: ${uri}`);
              console.log(`   Coleção: ${collectionName}`);
              
              await client.close();
              return { uri, collectionName, product };
            } else {
              console.log(`❌ Produto não encontrado em ${collectionName}`);
            }
          } catch (error) {
            console.log(`❌ Erro ao buscar em ${collectionName}:`, error.message);
          }
        }
      }
      
      // Se não encontrou, listar alguns documentos da coleção products
      if (collections.some(col => col.name === 'products')) {
        console.log('\n📋 Primeiros 3 produtos da coleção products:');
        const collection = db.collection('products');
        const samples = await collection.find({}).limit(3).toArray();
        samples.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.name} (ID: ${doc._id})`);
        });
      }
      
      await client.close();
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
      try {
        await client.close();
      } catch (closeError) {
        // Ignorar erro de fechamento
      }
    }
  }
  
  console.log('\n❌ Produto não encontrado em nenhum banco/coleção');
  return null;
}

findDatabase().catch(console.error); 