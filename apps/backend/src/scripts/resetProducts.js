const mongoose = require('mongoose');

async function resetProducts() {
  try {
    await mongoose.connect('mongodb+srv://matheusqueiroz:Sk7QdHQLjcQeteKj@cluster0.csoxu.mongodb.net/oticasqueiroz?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Conectado ao MongoDB Atlas');
    
    // Remover a coleção de produtos completamente
    await mongoose.connection.db.collection('products').drop();
    console.log('Coleção de produtos removida');
    
    // Remover também qualquer coleção relacionada
    try {
      await mongoose.connection.db.collection('products.discriminators').drop();
      console.log('Coleção products.discriminators removida');
    } catch (error) {
      console.log('Nenhuma coleção products.discriminators para remover');
    }
    
    await mongoose.disconnect();
    console.log('Operação concluída. Reinicie a aplicação.');
  } catch (error) {
    console.error('Erro:', error);
  }
}

resetProducts();