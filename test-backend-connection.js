const axios = require('axios');

const API_BASE = 'http://localhost:3333/api';

async function testBackendConnection() {
  console.log('🔍 === TESTANDO CONEXÃO DO BACKEND ===');
  
  try {
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      login: 'queiroz.oticas.ita@gmail.com',
      password: 'itapetinga69'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Buscar produtos via API
    console.log('\n2️⃣ Buscando produtos via API...');
    const productsResponse = await axios.get(`${API_BASE}/products?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📊 Total de produtos via API: ${productsResponse.data.total}`);
    
    if (productsResponse.data.products && productsResponse.data.products.length > 0) {
      console.log('\n📋 Primeiros produtos via API:');
      productsResponse.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (ID: ${product._id}, Estoque: ${product.stock})`);
      });
      
      // 3. Procurar especificamente pela ARMAÇAO SM METAL FEMININA
      console.log('\n3️⃣ Procurando ARMAÇAO SM METAL FEMININA...');
      const searchResponse = await axios.get(`${API_BASE}/products/search?q=ARMAÇAO SM METAL FEMININA`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (searchResponse.data.products && searchResponse.data.products.length > 0) {
        console.log('✅ PRODUTO ENCONTRADO VIA API!');
        const product = searchResponse.data.products[0];
        console.log(`   Nome: ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Estoque: ${product.stock}`);
        console.log(`   Tipo: ${product.productType}`);
        
        // 4. Tentar buscar por ID específico
        console.log('\n4️⃣ Buscando por ID específico...');
        try {
          const productResponse = await axios.get(`${API_BASE}/products/${product._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log(`✅ Produto encontrado por ID: ${productResponse.data.name}`);
          console.log(`   Estoque atual: ${productResponse.data.stock}`);
        } catch (error) {
          console.log(`❌ Erro ao buscar por ID: ${error.response?.status}`);
        }
        
      } else {
        console.log('❌ ARMAÇAO SM METAL FEMININA não encontrada via API');
      }
      
    } else {
      console.log('❌ Nenhum produto encontrado via API');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testBackendConnection().catch(console.error); 