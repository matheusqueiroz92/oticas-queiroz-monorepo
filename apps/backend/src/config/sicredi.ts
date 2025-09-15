import dotenv from 'dotenv';

dotenv.config();

export interface SicrediConfig {
  baseURL: string;
  clientId: string;
  clientSecret: string;
  cooperativeCode: string;
  postCode: string;
  accessCode: string; // Código de acesso do Internet Banking
  accessToken: string; // Token de acesso para requisições
  environment: 'homologation' | 'production';
}

export const getSicrediConfig = (): SicrediConfig => {
  const environment = (process.env.SICREDI_ENVIRONMENT as 'homologation' | 'production') || 'homologation';
  
  const config: SicrediConfig = {
    baseURL: environment === 'production' 
      ? 'https://api-parceiro.sicredi.com.br'
      : 'https://api-parceiro.sicredi.com.br/sb',
    clientId: process.env.SICREDI_CLIENT_ID || '',
    clientSecret: process.env.SICREDI_CLIENT_SECRET || '',
    cooperativeCode: process.env.SICREDI_COOPERATIVE_CODE || '',
    postCode: process.env.SICREDI_POST_CODE || '',
    accessCode: process.env.SICREDI_ACCESS_CODE || '',
    accessToken: process.env.SICREDI_ACCESS_TOKEN || '',
    environment
  };

  // Validação das configurações obrigatórias
  const requiredFields = ['clientId', 'clientSecret', 'cooperativeCode', 'postCode', 'accessToken'];
  const missingFields = requiredFields.filter(field => !config[field as keyof SicrediConfig]);

  if (missingFields.length > 0) {
    console.error('❌ Configurações obrigatórias da SICREDI não encontradas:');
    missingFields.forEach(field => {
      console.error(`   - SICREDI_${field.toUpperCase()}`);
    });
    console.error('A integração com SICREDI não funcionará sem estas configurações.');
  } else {
    console.log(`✅ Configuração SICREDI carregada para ambiente: ${environment}`);
    console.log('🔑 SICREDI: Usando autenticação OAuth padrão');
  }

  return config;
};

export const initSicredi = (): void => {
  try {
    const config = getSicrediConfig();
    
    if (!config.clientId || !config.clientSecret) {
      console.warn('⚠️  SICREDI: Credenciais não configuradas. A integração de boletos não estará disponível.');
      return;
    }

    console.log(`🚀 SICREDI: Configurado para ambiente ${config.environment}`);
    console.log(`📋 SICREDI: Cooperativa ${config.cooperativeCode}, Posto ${config.postCode}`);
  } catch (error) {
    console.error('❌ Erro ao inicializar SICREDI:', error);
  }
};
