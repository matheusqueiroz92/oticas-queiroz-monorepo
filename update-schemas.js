const mongoose = require('mongoose');
require('dotenv').config({ path: './apps/backend/.env' });

async function updateSchemas() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado ao MongoDB com sucesso');

    // Atualizar produtos
    console.log('Atualizando schema de produtos...');
    const productsCollection = mongoose.connection.db.collection('products');
    
    // Remover campos obsoletos
    await productsCollection.updateMany(
      {}, 
      { 
        $unset: {
          price: "",
          stock: "",
          category: "",
          modelGlasses: ""
        }
      }
    );
    
    console.log('Campos obsoletos removidos');
    
    // Garantir campos necessários
    console.log('Garantindo campos necessários...');
    
    // Para todos os produtos, garantir productType
    await productsCollection.updateMany(
      { productType: { $exists: false } },
      { $set: { productType: "prescription_frame" } }
    );
    
    // Lentes
    await productsCollection.updateMany(
      { productType: "lenses", lensType: { $exists: false } },
      { $set: { lensType: "Padrão" } }
    );
    
    // Armações
    await productsCollection.updateMany(
      { 
        $or: [
          { productType: "prescription_frame" },
          { productType: "sunglasses_frame" }
        ],
        $or: [
          { typeFrame: { $exists: false } },
          { color: { $exists: false } },
          { shape: { $exists: false } },
          { reference: { $exists: false } }
        ]
      },
      { 
        $set: {
          typeFrame: "Padrão",
          color: "Padrão",
          shape: "Padrão",
          reference: "Padrão"
        }
      }
    );
    
    // Óculos de sol
    await productsCollection.updateMany(
      { productType: "sunglasses_frame", modelSunglasses: { $exists: false } },
      { $set: { modelSunglasses: "Padrão" } }
    );
    
    console.log('Migração de produtos concluída com sucesso');
    
    // Aqui você pode adicionar outras migrações de schema conforme necessário
    
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

updateSchemas();
