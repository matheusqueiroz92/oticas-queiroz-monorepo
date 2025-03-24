const mongoose = require('mongoose');

async function checkSchema() {
  try {
    await mongoose.connect('mongodb+srv://matheusqueiroz:Sk7QdHQLjcQeteKj@cluster0.csoxu.mongodb.net/oticasqueiroz?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Conectado ao MongoDB Atlas');

    // Examinar a coleção de discriminadores se existir
    let discriminators;
    try {
      discriminators = await mongoose.connection.db.collection('products.discriminators').find({}).toArray();
      if (discriminators.length > 0) {
        console.log('Discriminadores encontrados:');
        discriminators.forEach(disc => {
          console.log(`Discriminador: ${disc.name}`);
          if (disc.name === 'sunglasses_frame') {
            console.log('Schema de óculos de sol:');
            console.log(JSON.stringify(disc.schema, null, 2));
          }
        });
      } else {
        console.log('Nenhum discriminador encontrado na coleção products.discriminators');
      }
    } catch (err) {
      console.log('Não foi possível acessar discriminadores:', err.message);
    }

    // Examinar um documento real de óculos de sol
    const sunglasses = await mongoose.connection.db.collection('products').findOne({ productType: 'sunglasses_frame' });
    if (sunglasses) {
      console.log('\nExemplo de documento de óculos de sol encontrado:');
      console.log(JSON.stringify(sunglasses, null, 2));
    } else {
      console.log('Nenhum documento de óculos de sol encontrado');
    }

    // Examinar diretamente o schema mongoose depois de definir o modelo
    console.log('\nCriando modelo para examinar o schema:');
    
    // Definindo um produto base primeiro
    const productSchema = new mongoose.Schema({
      name: String,
      productType: String
    }, { discriminatorKey: 'productType' });
    
    const Product = mongoose.model('ProductTest', productSchema);
    
    // Criando o discriminator para óculos de sol
    const SunglassesFrame = Product.discriminator('sunglasses_frame', 
      new mongoose.Schema({
        // Este é apenas para examinar, não afeta o banco de dados
        modelSunglasses: { type: String }
      })
    );
    
    // Examinando o schema interno
    console.log('Campos no schema de SunglassesFrame:');
    SunglassesFrame.schema.eachPath((path, schemaType) => {
      const isRequired = schemaType.isRequired ? 'Sim' : 'Não';
      console.log(`- Campo: ${path}, Obrigatório: ${isRequired}`);
    });

    await mongoose.disconnect();
    console.log('\nConexão fechada.');
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkSchema();