import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testMercadoPagoToken() {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    console.log('Testando token do Mercado Pago...');
    console.log('Token: ', accessToken?.substring(0, 10) + '...' + accessToken?.substring(accessToken.length - 5));
    
    const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Métodos de pagamento disponíveis:', response.data.length);
    console.log('Teste concluído com sucesso!');
    
    return true;
  } catch (error) {
    console.error('Erro ao testar token do Mercado Pago:', error);
    return false;
  }
}

testMercadoPagoToken();