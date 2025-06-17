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

// Função para testar atualização direta do estoque via API
async function testDirectStockUpdate(token, productId, newStock) {
  try {
    console.log(`🔧 Testando atualização DIRETA do estoque para ${newStock}...`);
    
    const response = await axios.put(`${API_BASE}/products/${productId}`, {
      stock: newStock
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Atualização direta bem-sucedida:', response.data.stock);
    return response.data;
  } catch (error) {
    console.log('❌ Erro na atualização direta:', error.response?.data || error.message);
    return null;
  }
}

// Função principal de teste
async function debugTransaction() {
  console.log('🔍 === DEBUG DA TRANSAÇÃO ===');
  
  // 1. Fazer login
  console.log('\n1️⃣ Fazendo login...');
  const token = await login();
  if (!token) {
    console.log('❌ Falha no login');
    return;
  }
  console.log('✅ Login realizado com sucesso');

  // 2. ID específico da ARMAÇAO SM METAL FEMININA
  const productId = '6836f27b18f5a6a550eb830a';
  
  console.log('\n2️⃣ Verificando produto específico...');
  const product = await getProductById(token, productId);
  if (!product) {
    console.log('❌ Produto não encontrado');
    return;
  }
  
  console.log(`✅ Produto encontrado: ${product.name}`);
  console.log(`   Estoque atual: ${product.stock}`);

  // 3. Testar atualização direta do estoque
  console.log('\n3️⃣ Testando atualização direta do estoque...');
  const originalStock = product.stock;
  const newStock = originalStock - 1;
  
  const updatedProduct = await testDirectStockUpdate(token, productId, newStock);
  if (updatedProduct) {
    console.log(`✅ Estoque atualizado diretamente: ${originalStock} → ${updatedProduct.stock}`);
    
    // Aguardar e verificar se persistiu
    await new Promise(resolve => setTimeout(resolve, 2000));
    const verifyProduct = await getProductById(token, productId);
    console.log(`📦 Verificação após 2s: ${verifyProduct?.stock}`);
    
    // Restaurar estoque original
    await testDirectStockUpdate(token, productId, originalStock);
    console.log(`🔄 Estoque restaurado para: ${originalStock}`);
  }

  // 4. Obter ID do funcionário logado
  console.log('\n4️⃣ Obtendo dados do usuário logado...');
  try {
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const employeeId = profileResponse.data._id;
    console.log(`✅ Funcionário logado: ${profileResponse.data.name} (${employeeId})`);

    // 5. Criar pedido simples para testar transação
    console.log('\n5️⃣ Criando pedido para testar transação...');
    
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
        doctorName: 'Dr. Debug',
        clinicName: 'Clínica Debug',
        appointmentDate: new Date().toISOString(),
        rightEye: { sph: '0', cyl: '0', axis: 0, pd: 0 },
        leftEye: { sph: '0', cyl: '0', axis: 0, pd: 0 },
        nd: 0, oc: 0, addition: 0, bridge: 0, rim: 0, vh: 0, sh: 0
      }
    };

    console.log('📤 Enviando pedido...');
    console.log(`   Produto ID: ${productId}`);
    console.log(`   Estoque antes: ${originalStock}`);
    
    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Pedido criado: ${orderResponse.data._id}`);
    console.log(`   Service Order: ${orderResponse.data.serviceOrder}`);

    // 6. Verificar estoque imediatamente
    console.log('\n6️⃣ Verificando estoque imediatamente...');
    const productAfterOrder = await getProductById(token, productId);
    console.log(`📦 Estoque IMEDIATAMENTE após pedido: ${productAfterOrder?.stock}`);
    
    // 7. Aguardar e verificar novamente
    console.log('\n7️⃣ Aguardando 5 segundos e verificando novamente...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const productAfterWait = await getProductById(token, productId);
    console.log(`📦 Estoque APÓS 5 segundos: ${productAfterWait?.stock}`);
    
    // 8. Verificar logs de estoque
    console.log('\n8️⃣ Verificando logs de estoque...');
    try {
      const stockLogsResponse = await axios.get(`${API_BASE}/products/${productId}/stock-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📋 Últimos 5 logs de estoque:');
      const logs = stockLogsResponse.data.slice(-5);
      logs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.operation} - ${log.previousStock} → ${log.newStock} (${log.reason})`);
        console.log(`      Data: ${new Date(log.createdAt).toLocaleString()}`);
        console.log(`      Pedido: ${log.orderId}`);
      });
    } catch (error) {
      console.log('❌ Erro ao buscar logs:', error.response?.status);
    }

    // 9. Análise final
    console.log('\n9️⃣ ANÁLISE FINAL:');
    if (productAfterWait?.stock === originalStock - 1) {
      console.log('✅ TRANSAÇÃO FUNCIONOU CORRETAMENTE!');
    } else {
      console.log('❌ TRANSAÇÃO FALHOU!');
      console.log(`   Esperado: ${originalStock - 1}`);
      console.log(`   Atual: ${productAfterWait?.stock}`);
      console.log('   🔍 Possíveis causas:');
      console.log('     - Transação não está sendo commitada');
      console.log('     - Sessão não está sendo passada corretamente');
      console.log('     - Rollback automático por algum erro');
    }

  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar debug
debugTransaction().catch(console.error); 