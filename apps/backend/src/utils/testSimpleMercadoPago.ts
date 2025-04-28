import { MercadoPagoAPI } from '../utils/mercadoPagoDirectApi';
import dotenv from 'dotenv';

dotenv.config();

async function testSimpleMercadopago() {
  try {
    console.log('Iniciando teste simples do Mercado Pago...');
    
    // Criar uma preferência de pagamento simples
    const preference = {
      items: [
        {
          id: 'teste-1',
          title: 'Produto de Teste',
          description: 'Descrição do produto de teste',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 100.00
        }
      ],
      back_urls: {
        success: 'http://localhost:3333/success',
        pending: 'http://localhost:3333/pending',
        failure: 'http://localhost:3333/failure'
      },
      notification_url: 'http://localhost:3333/api/mercadopago/webhook',
      statement_descriptor: 'Óticas Queiroz'
    };
    
    console.log('Criando preferência de pagamento...');
    const response = await MercadoPagoAPI.createPreference(preference);
    
    console.log('\n=== LINKS DE PAGAMENTO ===');
    console.log('ID da preferência:', response.body.id);
    console.log('\nLink para produção:');
    console.log(response.body.init_point);
    console.log('\nLink para sandbox (teste):');
    console.log(response.body.sandbox_init_point);
    console.log('\nCopie o link do sandbox e abra no navegador para testar o pagamento');
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testSimpleMercadopago();