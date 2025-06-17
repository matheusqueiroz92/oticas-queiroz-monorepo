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

    console.log('Dados do pedido:', orderData);

    const response = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar pedido:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    return null;
  }
}

// Função principal de teste
async function testStockUpdate() {
  console.log('=== TESTE DE ATUALIZAÇÃO DE ESTOQUE ===');
  
  // 1. Fazer login
  console.log('1. Fazendo login...');
  const token = await login();
  if (!token) {
    console.log('❌ Falha no login');
    return;
  }
  console.log('✅ Login realizado com sucesso');

  // 2. Buscar produtos
  console.log('\n2. Buscando produtos...');
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

  // 3. Obter ID do funcionário logado (do token)
  console.log('\n3. Obtendo dados do usuário logado...');
  try {
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const employeeId = profileResponse.data._id;
    console.log(`✅ Funcionário logado: ${profileResponse.data.name}`);
    console.log(`   ID: ${employeeId}`);

    // 4. Criar pedido de teste
    console.log('\n4. Criando pedido de teste...');
    const order = await createTestOrder(token, testProduct._id, employeeId);
    if (!order) {
      console.log('❌ Falha ao criar pedido');
      return;
    }
    console.log(`✅ Pedido criado com sucesso: ${order._id}`);

    // 5. Verificar se o estoque foi atualizado
    console.log('\n5. Verificando atualização do estoque...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos

    const updatedProductsData = await getProducts(token);
    const updatedProduct = (updatedProductsData.products || updatedProductsData)
      .find(p => p._id === testProduct._id);

    if (updatedProduct) {
      console.log(`   Estoque anterior: ${testProduct.stock}`);
      console.log(`   Estoque atual: ${updatedProduct.stock}`);
      
      if (updatedProduct.stock === testProduct.stock - 1) {
        console.log('✅ ESTOQUE ATUALIZADO CORRETAMENTE!');
      } else {
        console.log('❌ ESTOQUE NÃO FOI ATUALIZADO!');
        console.log(`   Diferença esperada: -1, diferença real: ${updatedProduct.stock - testProduct.stock}`);
      }
    } else {
      console.log('❌ Produto não encontrado após atualização');
    }

  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error.response?.data || error.message);
  }
}

// Executar teste
testStockUpdate().catch(console.error); 