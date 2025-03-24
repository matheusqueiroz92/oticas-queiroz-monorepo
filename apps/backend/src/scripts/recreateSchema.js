const mongoose = require('mongoose');
const { Schema } = mongoose;

async function recreateSchema() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect('mongodb+srv://matheusqueiroz:Sk7QdHQLjcQeteKj@cluster0.csoxu.mongodb.net/oticasqueiroz?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Conectado ao MongoDB Atlas');

    // 1. Opcional: Fazer backup dos produtos existentes
    const productCollection = mongoose.connection.db.collection('products');
    const existingProducts = await productCollection.find({}).toArray();
    console.log(`Encontrados ${existingProducts.length} produtos para backup`);

    // 2. Excluir a coleção atual (isso removerá todo o schema e documentos)
    if (existingProducts.length > 0) {
      await productCollection.drop();
      console.log('Coleção de produtos removida');
    }

    // 3. Criar novamente o schema correto (esse código replica o seu modelo)
    // Schema base
    const productSchema = new Schema({
      name: { type: String, required: true },
      description: { type: String, required: true },
      image: { type: String, required: false },
      sellPrice: { type: Number, required: true },
      costPrice: { type: Number, required: false },
      brand: { type: String, required: false },
      productType: {
        type: String,
        required: true,
        enum: ["lenses", "clean_lenses", "prescription_frame", "sunglasses_frame"],
      }
    }, { timestamps: true, discriminatorKey: 'productType' });

    // Criar modelo base
    const Product = mongoose.model('Product', productSchema);

    // Discriminators
    const Lens = Product.discriminator('lenses', new Schema({
      lensType: { type: String, required: true }
    }));

    const CleanLens = Product.discriminator('clean_lenses', new Schema({}));

    // Frame schema (comum para ambos tipos de armação)
    const frameFields = {
      typeFrame: { type: String, required: true },
      color: { type: String, required: true },
      shape: { type: String, required: true },
      reference: { type: String, required: true }
    };

    const PrescriptionFrame = Product.discriminator('prescription_frame', 
      new Schema(frameFields)
    );

    const SunglassesFrame = Product.discriminator('sunglasses_frame', 
      new Schema({
        ...frameFields,
        modelSunglasses: { type: String, required: true }
      })
    );

    console.log('Schema recriado com sucesso!');

    // 4. Opcional: Restaurar produtos do backup
    if (existingProducts.length > 0) {
      // Transformar os dados antes de reinseri-los, para garantir compatibilidade com o novo schema
      const fixedProducts = existingProducts.map(product => {
        // Para produtos de óculos de sol, garantir que temos modelSunglasses
        if (product.productType === 'sunglasses_frame') {
          return {
            ...product,
            modelSunglasses: product.modelSunglasses || product.modelGlasses || 'Padrão'
          };
        }
        return product;
      });

      // Referência atualizada à coleção após recriá-la
      const newProductCollection = mongoose.connection.db.collection('products');
      
      // Inserir os produtos novamente
      if (fixedProducts.length > 0) {
        await newProductCollection.insertMany(fixedProducts);
        console.log(`${fixedProducts.length} produtos restaurados`);
      }
    }

    await mongoose.disconnect();
    console.log('Conexão fechada. Processo concluído.');
  } catch (error) {
    console.error('Erro:', error);
  }
}

recreateSchema();