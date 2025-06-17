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
    console.error('Erro no login:', error.response?.data || error.message);
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

// Função para testar atualização direta do estoque
async function testDirectStockUpdate(token, productId) {
  try {
    console.log('🔧 Testando atualização DIRETA do estoque...');
    
    // Buscar produto antes
    const productBefore = await getProductById(token, productId);
    console.log(`📦 Estoque ANTES da atualização direta: ${productBefore?.stock}`);
    
    // Tentar atualizar estoque diretamente via API (se houver endpoint)
    try {
      const updateResponse = await axios.put(`${API_BASE}/products/${productId}/stock`, {
        stock: (productBefore?.stock || 10) - 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Atualização direta bem-sucedida:', updateResponse.data);
    } catch (error) {
      console.log('ℹ️ Endpoint de atualização direta não disponível:', error.response?.status);
    }
    
    // Verificar se mudou
    const productAfter = await getProductById(token, productId);
    console.log(`📦 Estoque DEPOIS da atualização direta: ${productAfter?.stock}`);
    
  } catch (error) {
    console.error('Erro no teste direto:', error);
  }
}

// Função principal de teste
async function testSpecificProduct() {
  console.log('🎯 === TESTE ESPECÍFICO DA ARMAÇÃO SM METAL FEMININA ===');
  
  // 1. Fazer login
  console.log('\n1️⃣ Fazendo login...');
  const token = await login();
  if (!token) {
    console.log('❌ Falha no login');
    return;
  }
  console.log('✅ Login realizado com sucesso');

  // 2. ID específico da ARMAÇAO SM METAL FEMININA
  const productId = '6836f27b18f5a6a550eb830a'; // ID da imagem do MongoDB
  
  console.log('\n2️⃣ Verificando produto específico...');
  const product = await getProductById(token, productId);
  if (!product) {
    console.log('❌ Produto não encontrado');
    return;
  }
  
  console.log(`✅ Produto encontrado: ${product.name}`);
  console.log(`   Estoque atual: ${product.stock}`);
  console.log(`   Tipo: ${product.productType}`);
  console.log(`   ID: ${product._id}`);

  // 3. Testar atualização direta
  await testDirectStockUpdate(token, productId);

  // 4. Obter ID do funcionário logado
  console.log('\n3️⃣ Obtendo dados do usuário logado...');
  try {
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const employeeId = profileResponse.data._id;
    console.log(`✅ Funcionário logado: ${profileResponse.data.name}`);

    // 5. Criar pedido com este produto específico
    console.log('\n4️⃣ Criando pedido com ARMAÇAO SM METAL FEMININA...');
    
    const orderData = {
      clientId: '6841e70918f5a6a550eb9617',
      employeeId: employeeId,
      products: [{ 
        _id: productId,
        productType: 'prescription_frame'
      }],
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      totalPrice: 199,
      finalPrice: 199,
      prescriptionData: {
        doctorName: 'Dr. Teste',
        clinicName: 'Clínica Teste',
        appointmentDate: new Date().toISOString(),
        rightEye: { sph: '0', cyl: '0', axis: 0, pd: 0 },
        leftEye: { sph: '0', cyl: '0', axis: 0, pd: 0 },
        nd: 0, oc: 0, addition: 0, bridge: 0, rim: 0, vh: 0, sh: 0
      }
    };

    console.log('📤 Criando pedido...');
    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Pedido criado: ${orderResponse.data._id}`);
    console.log(`   Service Order: ${orderResponse.data.serviceOrder}`);

    // 6. Aguardar e verificar estoque
    console.log('\n5️⃣ Aguardando e verificando estoque...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const productAfterOrder = await getProductById(token, productId);
    console.log(`📦 Estoque DEPOIS do pedido: ${productAfterOrder?.stock}`);
    
    if (productAfterOrder?.stock === product.stock - 1) {
      console.log('✅ ESTOQUE ATUALIZADO CORRETAMENTE!');
    } else {
      console.log('❌ ESTOQUE NÃO FOI ATUALIZADO!');
      console.log(`   Esperado: ${product.stock - 1}`);
      console.log(`   Atual: ${productAfterOrder?.stock}`);
      
      // 7. Verificar logs de estoque
      console.log('\n6️⃣ Verificando logs de estoque...');
      try {
        const stockLogsResponse = await axios.get(`${API_BASE}/products/${productId}/stock-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('📋 Últimos logs de estoque:');
        const logs = stockLogsResponse.data.slice(-3); // Últimos 3 logs
        logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.operation} - ${log.previousStock} → ${log.newStock} (${log.reason})`);
          console.log(`      Data: ${new Date(log.createdAt).toLocaleString()}`);
          console.log(`      Pedido: ${log.orderId}`);
        });
      } catch (error) {
        console.log('❌ Erro ao buscar logs:', error.response?.status);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar teste
testSpecificProduct().catch(console.error); 