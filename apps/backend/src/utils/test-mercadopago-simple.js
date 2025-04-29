require('dotenv').config();
const axios = require('axios');

// Configuração do Mercado Pago
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!mercadoPagoToken) {
  console.error('ERRO: Token do Mercado Pago não definido!');
  console.error('Defina a variável MERCADO_PAGO_ACCESS_TOKEN no arquivo .env');
  process.exit(1);
}

console.log(`Token: ${mercadoPagoToken.substring(0, 10)}...${mercadoPagoToken.substring(mercadoPagoToken.length - 5)}`);
console.log(`Ambiente: ${mercadoPagoToken.startsWith('TEST-') ? 'SANDBOX (TESTE)' : 'PRODUÇÃO'}`);

// Função para testar uma chamada simples
async function testMercadoPagoConnection() {
  try {
    console.log('Testando conexão com o Mercado Pago...');
    
    const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`
      }
    });
    
    console.log('Conexão bem-sucedida!');
    console.log(`Métodos de pagamento disponíveis: ${response.data.length}`);
    return true;
  } catch (error) {
    console.error('ERRO ao testar conexão:');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Função para criar uma preferência de teste
async function createTestPreference() {
  try {
    console.log('Criando preferência de teste...');
    
    const preference = {
      items: [
        {
          id: `test-${Date.now()}`,
          title: 'Produto de Teste',
          description: 'Descrição do produto de teste',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 100
        }
      ],
      back_urls: {
        success: 'http://localhost:3000/payment/success',
        pending: 'http://localhost:3000/payment/pending',
        failure: 'http://localhost:3000/payment/failure'
      },
      notification_url: 'http://localhost:3333/api/mercadopago/webhook',
      auto_return: 'approved',
      statement_descriptor: 'Óticas Queiroz'
    };
    
    const response = await axios.post('https://api.mercadopago.com/checkout/preferences', preference, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Preferência criada com sucesso!');
    console.log('\n=== LINKS DE PAGAMENTO ===');
    console.log(`ID: ${response.data.id}`);
    console.log(`Link de produção: ${response.data.init_point}`);
    console.log(`Link de sandbox: ${response.data.sandbox_init_point}`);
    
    return response.data;
  } catch (error) {
    console.error('ERRO ao criar preferência:');
    console.error(JSON.stringify(error.response?.data || error.message, null, 2));
    return null;
  }
}

// Função principal
async function main() {
  console.log('=== TESTE SIMPLES DO MERCADO PAGO ===\n');
  
  // Testar conexão
  const connectionOk = await testMercadoPagoConnection();
  if (!connectionOk) {
    console.error('\nFalha na conexão com o Mercado Pago. Verifique o token.');
    process.exit(1);
  }
  
  console.log('\n');
  
  // Criar preferência
  const preference = await createTestPreference();
  if (!preference) {
    console.error('\nFalha ao criar preferência de pagamento.');
    process.exit(1);
  }
  
  console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
  console.log('Você pode copiar o link de sandbox e testar no navegador.');
}

// Executar o teste
main().catch(error => {
  console.error('Erro não tratado:', error);
  process.exit(1);
});