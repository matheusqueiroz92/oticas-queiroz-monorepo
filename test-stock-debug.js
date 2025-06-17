const axios = require('axios');

const API_BASE = 'http://localhost:3333/api';

// Função para fazer login e obter token
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      login: 'queiroz.oticas.ita@gmail.com',
      password: 'itapetinga69'
    });
    return response.data.token;
  } catch (error) {
    console.error('Erro no login:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('URL:', error.config?.url);
    return null;
  }
}

// Função para buscar produtos
async function getProducts(token) {
  try {
    const response = await axios.get(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error.response?.data || error.message);
    return null;
  }
}

// Função para buscar um produto específico por ID
async function getProductById(token, productId) {
  try {
    const response = await axios.get(`${API_BASE}/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produto por ID:', error.response?.data || error.message);
    return null;
  }
}

// Função para criar um pedido de teste
async function createTestOrder(token, productId, employeeId) {
  try {
    const orderData = {
      clientId: '6841e70918f5a6a550eb9617', // ID do cliente fornecido
      employeeId: employeeId,
      products: [{ 
        _id: productId,
        productType: 'prescription_frame' // Tipo necessário para validação
      }], // Produto como objeto com _id e tipo
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      totalPrice: 100,
      finalPrice: 100,
      prescriptionData: {
        doctorName: 'Dr. Teste',
        clinicName: 'Clínica Teste',
        appointmentDate: new Date().toISOString(),
        rightEye: { sph: '0', cyl: '0', axis: 0, pd: 0 },
        leftEye: { sph: '0', cyl: '0', axis: 0, pd: 0 },
        nd: 0, oc: 0, addition: 0, bridge: 0, rim: 0, vh: 0, sh: 0
      }
    };

    console.log('📤 Enviando pedido para o backend...');
    console.log('Dados do pedido:', JSON.stringify(orderData, null, 2));

    const response = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📥 Resposta do backend:');
    console.log('Status:', response.status);
    console.log('Pedido criado:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar pedido:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    return null;
  }
}

// Função principal de teste
async function testStockUpdateDetailed() {
  console.log('🔍 === TESTE DETALHADO DE ATUALIZAÇÃO DE ESTOQUE ===');
  
  // 1. Fazer login
  console.log('\n1️⃣ Fazendo login...');
  const token = await login();
  if (!token) {
    console.log('❌ Falha no login');
    return;
  }
  console.log('✅ Login realizado com sucesso');

  // 2. Buscar produtos
  console.log('\n2️⃣ Buscando produtos...');
  const productsData = await getProducts(token);
  if (!productsData) {
    console.log('❌ Falha ao buscar produtos');
    return;
  }

  const products = productsData.products || productsData;
  const frameProducts = products.filter(p => 
    (p.productType === 'prescription_frame' || p.productType === 'sunglasses_frame') && 
    p.stock > 0
  );

  if (frameProducts.length === 0) {
    console.log('❌ Nenhuma armação com estoque encontrada');
    return;
  }

  const testProduct = frameProducts[0];
  console.log(`✅ Produto para teste encontrado: ${testProduct.name}`);
  console.log(`   Estoque atual: ${testProduct.stock}`);
  console.log(`   ID: ${testProduct._id}`);
  console.log(`   Tipo: ${testProduct.productType}`);

  // 3. Obter ID do funcionário logado
  console.log('\n3️⃣ Obtendo dados do usuário logado...');
  try {
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const employeeId = profileResponse.data._id;
    console.log(`✅ Funcionário logado: ${profileResponse.data.name}`);
    console.log(`   ID: ${employeeId}`);

    // 4. Verificar estoque antes da criação
    console.log('\n4️⃣ Verificando estoque ANTES da criação do pedido...');
    const productBefore = await getProductById(token, testProduct._id);
    if (productBefore) {
      console.log(`📦 Estoque ANTES: ${productBefore.stock}`);
    }

    // 5. Criar pedido de teste
    console.log('\n5️⃣ Criando pedido de teste...');
    const order = await createTestOrder(token, testProduct._id, employeeId);
    if (!order) {
      console.log('❌ Falha ao criar pedido');
      return;
    }
    console.log(`✅ Pedido criado com sucesso!`);
    console.log(`   ID do pedido: ${order._id}`);
    console.log(`   Service Order: ${order.serviceOrder}`);

    // 6. Aguardar um pouco para processamento
    console.log('\n6️⃣ Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 3 segundos

    // 7. Verificar estoque após criação
    console.log('\n7️⃣ Verificando estoque APÓS a criação do pedido...');
    const productAfter = await getProductById(token, testProduct._id);
    
    if (productAfter) {
      console.log(`📦 Estoque DEPOIS: ${productAfter.stock}`);
      console.log(`📊 Comparação:`);
      console.log(`   Estoque anterior: ${productBefore?.stock || 'N/A'}`);
      console.log(`   Estoque atual: ${productAfter.stock}`);
      console.log(`   Diferença: ${productAfter.stock - (productBefore?.stock || 0)}`);
      
      if (productAfter.stock === (productBefore?.stock || 0) - 1) {
        console.log('✅ ESTOQUE ATUALIZADO CORRETAMENTE!');
      } else {
        console.log('❌ ESTOQUE NÃO FOI ATUALIZADO!');
        console.log(`   Esperado: ${(productBefore?.stock || 0) - 1}`);
        console.log(`   Atual: ${productAfter.stock}`);
      }
    } else {
      console.log('❌ Não foi possível verificar o estoque após criação');
    }

    // 8. Verificar logs de estoque (se houver endpoint)
    console.log('\n8️⃣ Tentando verificar logs de estoque...');
    try {
      const stockLogsResponse = await axios.get(`${API_BASE}/products/${testProduct._id}/stock-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📋 Logs de estoque encontrados:');
      console.log(JSON.stringify(stockLogsResponse.data, null, 2));
    } catch (error) {
      console.log('ℹ️ Endpoint de logs de estoque não disponível ou erro:', error.response?.status);
    }

  } catch (error) {
    console.error('❌ Erro ao obter perfil do usuário:', error.response?.data || error.message);
  }
}

// Executar teste
testStockUpdateDetailed().catch(console.error); 