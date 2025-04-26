import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testWebhook() {
  try {
    const baseUrl = process.env.API_URL || 'http://localhost:3333';
    const webhookUrl = `${baseUrl}/api/mercadopago/webhook`;
    
    // Simular uma notificação de pagamento
    const webhookData = {
      action: 'payment.created',
      api_version: 'v1',
      data: {
        id: '123456789' // ID do pagamento (substitua por um ID válido para teste)
      },
      date_created: new Date().toISOString(),
      id: Math.floor(Math.random() * 1000000),
      live_mode: false,
      type: 'payment',
      user_id: '123456'
    };
    
    console.log(`Enviando notificação para ${webhookUrl}...`);
    console.log('Dados:', JSON.stringify(webhookData, null, 2));
    
    const response = await axios.post(webhookUrl, webhookData);
    
    console.log('Resposta:', response.status, response.data);
    console.log('Teste concluído!');
  } catch (error) {
    console.error('Erro ao testar webhook:', error);
  }
}

testWebhook();