import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

export interface SicrediConfig {
  baseURL: string;
  authURL: string;
  // Static x-api-key from Sicredi developer portal
  apiKey: string;
  // Internet Banking password used in password grant
  accessCode: string;
  // 5-char codigoBeneficiario (convenio de cobranca)
  beneficiaryCode: string;
  // 4-char cooperativa
  cooperativeCode: string;
  // 2-char posto (agência)
  postCode: string;
  environment: 'homologation' | 'production';
}

export const getSicrediConfig = (): SicrediConfig => {
  const environment = (process.env.SICREDI_ENVIRONMENT as 'homologation' | 'production') || 'homologation';

  const isProd = environment === 'production';

  const config: SicrediConfig = {
    baseURL: isProd
      ? 'https://api-parceiro.sicredi.com.br'
      : 'https://api-parceiro.sicredi.com.br/sb',
    authURL: isProd
      ? 'https://api-parceiro.sicredi.com.br/auth/openapi/token'
      : 'https://api-parceiro.sicredi.com.br/sb/auth/openapi/token',
    // SICREDI_API_KEY = static x-api-key from developer portal
    // Falls back to SICREDI_ACCESS_TOKEN for backwards compatibility
    apiKey: process.env.SICREDI_API_KEY || process.env.SICREDI_ACCESS_TOKEN || '',
    accessCode: process.env.SICREDI_ACCESS_CODE || '',
    // SICREDI_BENEFICIARY_CODE = 5-char codigoBeneficiario
    // Falls back to SICREDI_CLIENT_ID for backwards compatibility
    beneficiaryCode: process.env.SICREDI_BENEFICIARY_CODE || process.env.SICREDI_CLIENT_ID || '',
    cooperativeCode: process.env.SICREDI_COOPERATIVE_CODE || '',
    postCode: process.env.SICREDI_POST_CODE || '',
    environment,
  };

  const missingFields: string[] = [];
  if (!config.apiKey) missingFields.push('SICREDI_API_KEY');
  if (!config.accessCode) missingFields.push('SICREDI_ACCESS_CODE');
  if (!config.beneficiaryCode) missingFields.push('SICREDI_BENEFICIARY_CODE');
  if (!config.cooperativeCode) missingFields.push('SICREDI_COOPERATIVE_CODE');
  if (!config.postCode) missingFields.push('SICREDI_POST_CODE');

  if (missingFields.length > 0) {
    logger.warn('SICREDI: Configurações ausentes — integração de boletos desabilitada', {
      missingFields,
    });
  }

  return config;
};

export const initSicredi = (): void => {
  try {
    const config = getSicrediConfig();

    if (!config.apiKey || !config.accessCode || !config.beneficiaryCode) {
      logger.warn('SICREDI: Credenciais não configuradas. A integração de boletos não estará disponível.');
      return;
    }

    logger.info('SICREDI: Configuração carregada', {
      environment: config.environment,
      cooperativeCode: config.cooperativeCode,
      postCode: config.postCode,
    });
  } catch (error) {
    logger.error('Erro ao inicializar SICREDI', { error });
  }
};
