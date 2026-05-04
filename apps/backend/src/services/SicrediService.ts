import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { getSicrediConfig } from '../config/sicredi';
import type { SicrediConfig } from '../config/sicredi';
import type {
  SicrediBoletoRequest,
  SicrediBoletoResponse,
  SicrediBoletoStatusResponse,
  SicrediCancelBoletoResponse,
} from '../interfaces/ISicredi';
import { logger } from '../config/logger';

export class SicrediError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'SicrediError';
  }
}

export class SicrediService {
  private config: SicrediConfig;
  private api: AxiosInstance;

  // Dynamic OAuth tokens (password grant, expires 300s / 1800s)
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0;
  private refreshTokenExpiry: number = 0;

  constructor() {
    this.config = getSicrediConfig();

    this.api = axios.create({
      baseURL: this.config.baseURL,
      timeout: 30000,
    });

    // Inject auth headers before every request
    this.api.interceptors.request.use(async (cfg) => {
      const token = await this.getValidToken();
      cfg.headers['x-api-key'] = this.config.apiKey;
      cfg.headers['Authorization'] = `Bearer ${token}`;
      cfg.headers['Content-Type'] = 'application/json';
      return cfg;
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Force re-authentication on next request
          this.accessToken = null;
          this.tokenExpiry = 0;
        }
        const msg: string = error.response?.data?.message || error.message;
        const code: string = String(error.response?.status ?? 'ERR');
        throw new SicrediError(msg, code, error.response?.data);
      }
    );
  }

  // Returns a valid access token, refreshing or re-authenticating as needed
  private async getValidToken(): Promise<string> {
    const nowMs = Date.now();
    const bufferMs = 30_000; // 30s safety buffer

    if (this.accessToken && nowMs < this.tokenExpiry - bufferMs) {
      return this.accessToken;
    }

    if (this.refreshToken && nowMs < this.refreshTokenExpiry - bufferMs) {
      await this.refreshAccessToken();
      return this.accessToken!;
    }

    await this.authenticate();
    return this.accessToken!;
  }

  /**
   * Authenticates using Sicredi password grant (API v3.8).
   *
   * POST /auth/openapi/token
   * Headers: x-api-key (static), context: COBRANCA
   * Body: grant_type=password, username={beneficiaryCode}{cooperativeCode},
   *       password={accessCode}, scope=cobranca
   */
  private async authenticate(): Promise<void> {
    const username = `${this.config.beneficiaryCode}${this.config.cooperativeCode}`;

    const body = new URLSearchParams({
      grant_type: 'password',
      username,
      password: this.config.accessCode,
      scope: 'cobranca',
    });

    try {
      const response = await axios.post(this.config.authURL, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': this.config.apiKey,
          context: 'COBRANCA',
        },
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
      this.refreshTokenExpiry = Date.now() + 1_800_000; // 1800s per spec

      logger.info('SICREDI: Autenticação realizada com sucesso');
    } catch (error) {
      logger.error('SICREDI: Erro na autenticação', { error });
      throw new SicrediError('Falha na autenticação com SICREDI', 'AUTH_ERROR', error);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken!,
    });

    try {
      const response = await axios.post(this.config.authURL, body.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': this.config.apiKey,
          context: 'COBRANCA',
        },
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
      this.refreshTokenExpiry = Date.now() + 1_800_000;
    } catch {
      // Refresh failed — fall back to full re-auth
      this.refreshToken = null;
      this.refreshTokenExpiry = 0;
      await this.authenticate();
    }
  }

  /**
   * Registers a boleto with Sicredi.
   *
   * POST /cobranca/boleto/v1/boletos
   * Extra headers: cooperativa, posto
   */
  async generateBoleto(request: SicrediBoletoRequest): Promise<SicrediBoletoResponse> {
    try {
      const response = await this.api.post('/cobranca/boleto/v1/boletos', request, {
        headers: {
          cooperativa: this.config.cooperativeCode,
          posto: this.config.postCode,
        },
      });

      return {
        status: 'success',
        data: {
          nossoNumero: response.data.nossoNumero,
          codigoBarras: response.data.codigoBarras,
          linhaDigitavel: response.data.linhaDigitavel,
          qrCode: response.data.qrCode,
          txid: response.data.txid,
          cooperativa: response.data.cooperativa,
          posto: response.data.posto,
        },
      };
    } catch (error) {
      logger.error('SICREDI: Erro ao registrar boleto', { error });
      return {
        status: 'error',
        error: {
          code: error instanceof SicrediError ? (error.code ?? 'UNKNOWN') : 'UNKNOWN',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          details: error instanceof SicrediError ? error.details : error,
        },
      };
    }
  }

  /**
   * Queries a boleto by nossoNumero.
   *
   * GET /cobranca/boleto/v1/boletos
   * Extra headers: cooperativa, posto
   * Params: codigoBeneficiario, nossoNumero
   */
  async getBoleto(nossoNumero: string): Promise<SicrediBoletoStatusResponse> {
    try {
      const response = await this.api.get('/cobranca/boleto/v1/boletos', {
        headers: {
          cooperativa: this.config.cooperativeCode,
          posto: this.config.postCode,
        },
        params: {
          codigoBeneficiario: this.config.beneficiaryCode,
          nossoNumero,
        },
      });

      return { status: 'success', data: response.data };
    } catch (error) {
      logger.error('SICREDI: Erro ao consultar boleto', { nossoNumero, error });
      return {
        status: 'error',
        error: {
          code: error instanceof SicrediError ? (error.code ?? 'UNKNOWN') : 'UNKNOWN',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          details: error instanceof SicrediError ? error.details : error,
        },
      };
    }
  }

  /**
   * Settles (baixa) a boleto — Sicredi's cancel mechanism.
   *
   * PATCH /cobranca/boleto/v1/boletos/{nossoNumero}/baixa
   * Extra headers: cooperativa, posto, codigoBeneficiario
   */
  async cancelBoleto(nossoNumero: string): Promise<SicrediCancelBoletoResponse> {
    try {
      await this.api.patch(
        `/cobranca/boleto/v1/boletos/${nossoNumero}/baixa`,
        {},
        {
          headers: {
            cooperativa: this.config.cooperativeCode,
            posto: this.config.postCode,
            codigoBeneficiario: this.config.beneficiaryCode,
          },
        }
      );

      return { status: 'success' };
    } catch (error) {
      logger.error('SICREDI: Erro ao cancelar boleto', { nossoNumero, error });
      return {
        status: 'error',
        error: {
          code: error instanceof SicrediError ? (error.code ?? 'UNKNOWN') : 'UNKNOWN',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          details: error instanceof SicrediError ? error.details : error,
        },
      };
    }
  }

  /**
   * Downloads a boleto PDF.
   *
   * GET /cobranca/boleto/v1/boletos/pdf?linhaDigitavel=...
   * Returns raw binary buffer.
   */
  async getBoletoPdf(linhaDigitavel: string): Promise<Buffer> {
    const token = await this.getValidToken();

    const response = await axios.get(`${this.config.baseURL}/cobranca/boleto/v1/boletos/pdf`, {
      headers: {
        'x-api-key': this.config.apiKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: { linhaDigitavel },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      logger.error('SICREDI: Falha no teste de conexão', { error });
      return false;
    }
  }
}
