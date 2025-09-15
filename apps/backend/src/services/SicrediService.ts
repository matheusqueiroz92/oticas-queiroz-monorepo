import axios, { AxiosInstance } from 'axios';
import { getSicrediConfig, SicrediConfig } from '../config/sicredi';
import {
  SicrediBoletoRequest,
  SicrediBoletoResponse,
  SicrediTokenResponse,
  SicrediBoletoStatusResponse,
  SicrediCancelBoletoRequest,
  SicrediCancelBoletoResponse
} from '../interfaces/ISicredi';

export class SicrediError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'SicrediError';
  }
}

export class SicrediService {
  private config: SicrediConfig;
  private api: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = getSicrediConfig();
    this.api = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para adicionar token automaticamente
    this.api.interceptors.request.use(async (config) => {
      // Tentar autenticação OAuth primeiro se não houver token de acesso
      if (!this.config.accessToken && !this.accessToken) {
        console.log('🔄 SICREDI: Tentando autenticação OAuth...');
        await this.authenticate();
      }

      // Usar o token de acesso da configuração
      if (this.config.accessToken) {
        console.log('🔑 SICREDI: Usando token de acesso da configuração');
        config.headers['x-api-key'] = this.config.accessToken;
      } else if (this.accessToken) {
        console.log('🔑 SICREDI: Usando token OAuth');
        config.headers['x-api-key'] = this.accessToken;
      } else {
        console.log('❌ SICREDI: Nenhum token disponível');
      }
      
      console.log('🌐 SICREDI: URL:', (config.baseURL || '') + (config.url || ''));
      console.log('🔑 SICREDI: Token configurado:', this.config.accessToken ? 'Sim' : 'Não');
      console.log('📋 SICREDI: Headers:', JSON.stringify(config.headers, null, 2));
      console.log('📦 SICREDI: Body:', JSON.stringify(config.data, null, 2));
      
      return config;
    });

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado, tentar renovar
          this.accessToken = null;
          this.tokenExpiry = 0;
        }
        throw new SicrediError(
          error.response?.data?.message || error.message,
          error.response?.data?.code,
          error.response?.data
        );
      }
    );
  }

  /**
   * Verifica se o token precisa ser renovado
   */
  private shouldRefreshToken(): boolean {
    return !this.accessToken || Date.now() >= this.tokenExpiry;
  }

  /**
   * Autentica na API da SICREDI usando token de acesso
   */
  private async authenticate(): Promise<void> {
    try {
      // Se temos um token de acesso configurado, usamos ele diretamente
      if (this.config.accessToken) {
        this.accessToken = this.config.accessToken;
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
        console.log('✅ SICREDI: Token de acesso configurado');
        return;
      }

      // Fallback para OAuth se não houver token de acesso
      const authResponse = await axios.post(
        `${this.config.baseURL}/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData: SicrediTokenResponse = authResponse.data;
      
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

      console.log('✅ SICREDI: Autenticação OAuth realizada com sucesso');
    } catch (error) {
      console.error('❌ SICREDI: Erro na autenticação:', error);
      throw new SicrediError(
        'Falha na autenticação com SICREDI',
        'AUTH_ERROR',
        error
      );
    }
  }

  /**
   * Gera um boleto bancário
   */
  async generateBoleto(request: SicrediBoletoRequest): Promise<SicrediBoletoResponse> {
    try {
      // Tentar autenticação OAuth primeiro se não houver token de acesso
      if (!this.config.accessToken) {
        console.log('🔄 SICREDI: Tentando autenticação OAuth...');
        await this.authenticate();
      }

      const response = await this.api.post('/cobranca/boleto/v1/boletos', {
        ...request,
        cobranca: {
          ...request.cobranca,
          codigoBeneficiario: this.config.cooperativeCode,
          codigoPosto: this.config.postCode,
        }
      });

      return {
        status: 'success',
        data: {
          nossoNumero: response.data.nossoNumero,
          codigoBarras: response.data.codigoBarras,
          linhaDigitavel: response.data.linhaDigitavel,
          pdfUrl: response.data.pdfUrl,
          qrCode: response.data.qrCode,
        }
      };
    } catch (error) {
      console.error('❌ SICREDI: Erro ao gerar boleto:', error);
      return {
        status: 'error',
        error: {
          code: error instanceof SicrediError ? error.code || 'UNKNOWN_ERROR' : 'UNKNOWN_ERROR',
          message: error instanceof SicrediError ? error.message : 'Erro desconhecido',
          details: error instanceof SicrediError ? error.details : error,
        }
      };
    }
  }

  /**
   * Consulta o status de um boleto
   */
  async getBoletoStatus(nossoNumero: string): Promise<SicrediBoletoStatusResponse> {
    try {
      const response = await this.api.get(`/cobranca/boleto/v1/boletos/${nossoNumero}`);

      return {
        status: 'success',
        data: {
          nossoNumero: response.data.nossoNumero,
          seuNumero: response.data.seuNumero,
          status: response.data.status,
          valor: response.data.valor,
          valorPago: response.data.valorPago,
          dataVencimento: response.data.dataVencimento,
          dataPagamento: response.data.dataPagamento,
          dataBaixa: response.data.dataBaixa,
        }
      };
    } catch (error) {
      console.error('❌ SICREDI: Erro ao consultar status do boleto:', error);
      return {
        status: 'error',
        error: {
          code: error instanceof SicrediError ? error.code || 'UNKNOWN_ERROR' : 'UNKNOWN_ERROR',
          message: error instanceof SicrediError ? error.message : 'Erro desconhecido',
          details: error instanceof SicrediError ? error.details : error,
        }
      };
    }
  }

  /**
   * Cancela um boleto
   */
  async cancelBoleto(request: SicrediCancelBoletoRequest): Promise<SicrediCancelBoletoResponse> {
    try {
      const response = await this.api.post(`/cobranca/boleto/v1/boletos/${request.nossoNumero}/cancelar`, {
        motivo: request.motivo,
      });

      return {
        status: 'success',
        data: {
          nossoNumero: response.data.nossoNumero,
          status: 'CANCELADO',
          dataCancelamento: response.data.dataCancelamento,
        }
      };
    } catch (error) {
      console.error('❌ SICREDI: Erro ao cancelar boleto:', error);
      return {
        status: 'error',
        error: {
          code: error instanceof SicrediError ? error.code || 'UNKNOWN_ERROR' : 'UNKNOWN_ERROR',
          message: error instanceof SicrediError ? error.message : 'Erro desconhecido',
          details: error instanceof SicrediError ? error.details : error,
        }
      };
    }
  }

  /**
   * Testa a conectividade com a API da SICREDI
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 SICREDI: Iniciando teste de conexão...');
      console.log('🔍 SICREDI: Base URL:', this.config.baseURL);
      console.log('🔍 SICREDI: Client ID:', this.config.clientId ? 'Configurado' : 'Não configurado');
      console.log('🔍 SICREDI: Access Token:', this.config.accessToken ? 'Configurado' : 'Não configurado');
      
      await this.authenticate();
      console.log('✅ SICREDI: Conexão testada com sucesso');
      return true;
    } catch (error) {
      console.error('❌ SICREDI: Falha no teste de conexão:', error);
      console.error('❌ SICREDI: Detalhes do erro:', error instanceof Error ? error.message : error);
      return false;
    }
  }
}
