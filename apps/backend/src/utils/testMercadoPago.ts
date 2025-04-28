import { MercadoPagoAPI } from './mercadoPagoDirectApi';

async function testMercadoPago() {
  try {
    const preference = {
      items: [
        {
          id: 'test',
          title: 'Produto de teste',
          description: 'Descrição de teste',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: 100
        }
      ],
      back_urls: {
        success: 'http://localhost:3333/success',
        pending: 'http://localhost:3333/pending',
        failure: 'http://localhost:3333/failure'
      },
      statement_descriptor: 'Teste'
    };
    
    const response = await MercadoPagoAPI.createPreference(preference);
    console.log('Resposta do Mercado Pago:', response);
  } catch (error) {
    console.error('Erro ao testar Mercado Pago:', error);
  }
}

testMercadoPago();