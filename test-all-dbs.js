const { MongoClient, ObjectId } = require('mongodb');

async function listAllDatabases() {
  console.log('🔍 === LISTANDO TODOS OS BANCOS DE DADOS ===');
  
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB');
    
    // Listar todos os bancos de dados
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    console.log('\n📋 Bancos de dados encontrados:');
    for (const db of dbs.databases) {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
      
      // Para cada banco, listar as coleções
      const database = client.db(db.name);
      try {
        const collections = await database.listCollections().toArray();
        if (collections.length > 0) {
          console.log(`     Coleções:`);
          for (const col of collections) {
            const collection = database.collection(col.name);
            const count = await collection.countDocuments();
            console.log(`       - ${col.name} (${count} documentos)`);
            
            // Se for a coleção products, mostrar alguns exemplos
            if (col.name === 'products' && count > 0) {
              console.log(`         📋 Primeiros 3 produtos:`);
              const samples = await collection.find({}).limit(3).toArray();
              samples.forEach((doc, index) => {
                console.log(`           ${index + 1}. ${doc.name} (ID: ${doc._id})`);
              });
            }
          }
        }
      } catch (error) {
        console.log(`     ❌ Erro ao listar coleções: ${error.message}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.close();
  }
}

listAllDatabases().catch(console.error); 