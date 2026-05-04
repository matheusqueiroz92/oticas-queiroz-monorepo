// @ts-nocheck
import axios from "axios";
import { SicrediService, SicrediError } from "../../../services/SicrediService";
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Mocks de configuração (plain functions — não jest.fn para não serem afetados por clearAllMocks)
jest.mock("../../../config/sicredi", () => ({
  getSicrediConfig: () => ({
    baseURL: "https://api-parceiro.sicredi.com.br/sb",
    authURL: "https://api-parceiro.sicredi.com.br/sb/auth/openapi/token",
    apiKey: "test-api-key-12345",
    accessCode: "senha123",
    beneficiaryCode: "12345",
    cooperativeCode: "6789",
    postCode: "03",
    environment: "homologation",
  }),
}));

jest.mock("../../../config/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Resposta de token válida
const makeTokenResponse = (overrides = {}) => ({
  data: {
    access_token: "jwt-access-token-xyz",
    refresh_token: "jwt-refresh-token-abc",
    expires_in: 300,
    token_type: "Bearer",
    scope: "cobranca",
    ...overrides,
  },
  status: 200,
});

// Resposta de boleto registrado
const boletoResponse = {
  nossoNumero: "000012345",
  codigoBarras: "74891234567890123456789012345678901234567890123",
  linhaDigitavel: "74891.23456 78901.234567 89012.345678 9 01234567890123",
  cooperativa: "6789",
  posto: "03",
  txid: null,
  qrCode: null,
};

// Request de boleto válido
const boletoRequest = {
  tipoCobranca: "NORMAL" as const,
  codigoBeneficiario: "12345",
  especieDocumento: "RECIBO" as const,
  seuNumero: "0000000001",
  dataVencimento: "2026-06-01",
  valor: 150.0,
  pagador: {
    tipoPessoa: "PESSOA_FISICA" as const,
    documento: "12345678901",
    nome: "João da Silva",
    endereco: "Rua das Flores, 123",
    cidade: "São Paulo",
    uf: "SP",
    cep: "01234567",
  },
};

describe("SicrediService", () => {
  let service: SicrediService;
  let axiosPostSpy: jest.SpyInstance;
  let apiPostSpy: jest.SpyInstance;
  let apiGetSpy: jest.SpyInstance;
  let apiPatchSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new SicrediService();
    // Espionar axios.post global (usado pela autenticação)
    axiosPostSpy = jest.spyOn(axios, "post");
    // Espionar métodos da instância interna da API
    apiPostSpy = jest.spyOn((service as any).api, "post");
    apiGetSpy = jest.spyOn((service as any).api, "get");
    apiPatchSpy = jest.spyOn((service as any).api, "patch");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==================== Autenticação ====================

  describe("autenticação (authenticate)", () => {
    it("deve usar grant_type=password na requisição de token", async () => {
      axiosPostSpy.mockResolvedValueOnce(makeTokenResponse());

      const result = await service.testConnection();

      expect(result).toBe(true);
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);

      const [url, body, config] = axiosPostSpy.mock.calls[0];
      expect(url).toBe("https://api-parceiro.sicredi.com.br/sb/auth/openapi/token");
      expect(body).toContain("grant_type=password");
      expect(body).toContain("scope=cobranca");
    });

    it("deve concatenar beneficiaryCode+cooperativeCode como username", async () => {
      axiosPostSpy.mockResolvedValueOnce(makeTokenResponse());

      await service.testConnection();

      const body = axiosPostSpy.mock.calls[0][1] as string;
      // "12345" + "6789" = "123456789"
      expect(body).toContain("username=123456789");
      expect(body).toContain("password=senha123");
    });

    it("deve enviar x-api-key e context: COBRANCA nos headers", async () => {
      axiosPostSpy.mockResolvedValueOnce(makeTokenResponse());

      await service.testConnection();

      const config = axiosPostSpy.mock.calls[0][2];
      expect(config.headers["x-api-key"]).toBe("test-api-key-12345");
      expect(config.headers["context"]).toBe("COBRANCA");
      expect(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    });

    it("deve retornar false quando a autenticação falha", async () => {
      axiosPostSpy.mockRejectedValueOnce(new Error("Network error"));

      const result = await service.testConnection();

      expect(result).toBe(false);
    });

    it("deve reutilizar o token em cache (não re-autenticar antes de expirar)", async () => {
      axiosPostSpy.mockResolvedValue(makeTokenResponse());

      // Força autenticação e armazena token
      await service.testConnection();
      // Segunda chamada não deve re-autenticar (token ainda válido)
      await service.testConnection();

      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== generateBoleto ====================

  describe("generateBoleto", () => {
    beforeEach(() => {
      // Garante token disponível
      (service as any).accessToken = "jwt-access-token-xyz";
      (service as any).tokenExpiry = Date.now() + 300_000;
    });

    it("deve retornar dados do boleto em caso de sucesso", async () => {
      apiPostSpy.mockResolvedValueOnce({ data: boletoResponse, status: 201 });

      const result = await service.generateBoleto(boletoRequest);

      expect(result.status).toBe("success");
      expect(result.data?.nossoNumero).toBe("000012345");
      expect(result.data?.codigoBarras).toBeDefined();
      expect(result.data?.linhaDigitavel).toBeDefined();
    });

    it("deve chamar o endpoint correto para registro", async () => {
      apiPostSpy.mockResolvedValueOnce({ data: boletoResponse, status: 201 });

      await service.generateBoleto(boletoRequest);

      const [url] = apiPostSpy.mock.calls[0];
      expect(url).toBe("/cobranca/boleto/v1/boletos");
    });

    it("deve enviar cooperativa e posto como headers HTTP", async () => {
      apiPostSpy.mockResolvedValueOnce({ data: boletoResponse, status: 201 });

      await service.generateBoleto(boletoRequest);

      const [, , config] = apiPostSpy.mock.calls[0];
      expect(config.headers.cooperativa).toBe("6789");
      expect(config.headers.posto).toBe("03");
    });

    it("deve retornar status error quando a API retorna erro", async () => {
      apiPostSpy.mockRejectedValueOnce(
        new SicrediError("Campo codigoBeneficiario inválido", "400")
      );

      const result = await service.generateBoleto(boletoRequest);

      expect(result.status).toBe("error");
      expect(result.error?.message).toContain("codigoBeneficiario");
    });

    it("deve incluir qrCode e txid quando retornados pela API (HIBRIDO)", async () => {
      apiPostSpy.mockResolvedValueOnce({
        data: {
          ...boletoResponse,
          qrCode: "00020101...",
          txid: "abc123txid",
        },
        status: 201,
      });

      const result = await service.generateBoleto({
        ...boletoRequest,
        tipoCobranca: "HIBRIDO",
      });

      expect(result.status).toBe("success");
      expect(result.data?.qrCode).toBe("00020101...");
      expect(result.data?.txid).toBe("abc123txid");
    });
  });

  // ==================== getBoleto ====================

  describe("getBoleto", () => {
    beforeEach(() => {
      (service as any).accessToken = "jwt-access-token-xyz";
      (service as any).tokenExpiry = Date.now() + 300_000;
    });

    it("deve usar GET /cobranca/boleto/v1/boletos (não path param)", async () => {
      apiGetSpy.mockResolvedValueOnce({
        data: {
          nossoNumero: "000012345",
          linhaDigitavel: "74891.23456...",
          codigoBarras: "74891234...",
          carteira: "1",
          seuNumero: "0000000001",
          situacao: "A VENCER",
          valor: 150.0,
        },
      });

      const result = await service.getBoleto("000012345");

      expect(result.status).toBe("success");
      const [url] = apiGetSpy.mock.calls[0];
      expect(url).toBe("/cobranca/boleto/v1/boletos");
    });

    it("deve enviar nossoNumero e codigoBeneficiario como query params", async () => {
      apiGetSpy.mockResolvedValueOnce({ data: { nossoNumero: "000012345" } });

      await service.getBoleto("000012345");

      const [, config] = apiGetSpy.mock.calls[0];
      expect(config.params.nossoNumero).toBe("000012345");
      expect(config.params.codigoBeneficiario).toBe("12345");
    });

    it("deve enviar cooperativa e posto como headers", async () => {
      apiGetSpy.mockResolvedValueOnce({ data: { nossoNumero: "000012345" } });

      await service.getBoleto("000012345");

      const [, config] = apiGetSpy.mock.calls[0];
      expect(config.headers.cooperativa).toBe("6789");
      expect(config.headers.posto).toBe("03");
    });

    it("deve retornar erro quando o boleto não é encontrado", async () => {
      apiGetSpy.mockRejectedValueOnce(
        new SicrediError("Boleto não encontrado", "404")
      );

      const result = await service.getBoleto("999999999");

      expect(result.status).toBe("error");
      expect(result.error?.code).toBe("404");
    });
  });

  // ==================== cancelBoleto ====================

  describe("cancelBoleto", () => {
    beforeEach(() => {
      (service as any).accessToken = "jwt-access-token-xyz";
      (service as any).tokenExpiry = Date.now() + 300_000;
    });

    it("deve usar PATCH /baixa para cancelar (não POST /cancelar)", async () => {
      apiPatchSpy.mockResolvedValueOnce({ status: 200, data: {} });

      const result = await service.cancelBoleto("000012345");

      expect(result.status).toBe("success");
      const [url] = apiPatchSpy.mock.calls[0];
      expect(url).toBe("/cobranca/boleto/v1/boletos/000012345/baixa");
    });

    it("deve enviar cooperativa, posto e codigoBeneficiario como headers", async () => {
      apiPatchSpy.mockResolvedValueOnce({ status: 200, data: {} });

      await service.cancelBoleto("000012345");

      const [, , config] = apiPatchSpy.mock.calls[0];
      expect(config.headers.cooperativa).toBe("6789");
      expect(config.headers.posto).toBe("03");
      expect(config.headers.codigoBeneficiario).toBe("12345");
    });

    it("deve retornar erro quando o cancelamento falha", async () => {
      apiPatchSpy.mockRejectedValueOnce(
        new SicrediError("Boleto já baixado", "422")
      );

      const result = await service.cancelBoleto("000012345");

      expect(result.status).toBe("error");
      expect(result.error?.message).toBe("Boleto já baixado");
    });
  });

  // ==================== Refresh Token ====================
  // Testam getValidToken() diretamente — os spies em api.get/post/patch
  // substituem o método e bypassam os interceptors do axios, então a lógica
  // de renovação de token é testada chamando o método privado diretamente.

  describe("refresh token (getValidToken)", () => {
    it("deve retornar token em cache quando ainda é válido", async () => {
      (service as any).accessToken = "token-valido";
      (service as any).tokenExpiry = Date.now() + 300_000;

      const token = await (service as any).getValidToken();

      expect(token).toBe("token-valido");
      expect(axiosPostSpy).not.toHaveBeenCalled();
    });

    it("deve usar refresh_token quando access_token expirou mas refresh é válido", async () => {
      (service as any).accessToken = "token-expirado";
      (service as any).tokenExpiry = Date.now() - 1000;
      (service as any).refreshToken = "refresh-token-valido";
      (service as any).refreshTokenExpiry = Date.now() + 1_800_000;

      axiosPostSpy.mockResolvedValueOnce(
        makeTokenResponse({ access_token: "token-renovado" })
      );

      const token = await (service as any).getValidToken();

      expect(token).toBe("token-renovado");
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const body = axiosPostSpy.mock.calls[0][1] as string;
      expect(body).toContain("grant_type=refresh_token");
      expect(body).toContain("refresh_token=refresh-token-valido");
    });

    it("deve fazer re-autenticação completa quando refresh_token também expirou", async () => {
      (service as any).accessToken = "token-expirado";
      (service as any).tokenExpiry = Date.now() - 1000;
      (service as any).refreshToken = null;
      (service as any).refreshTokenExpiry = 0;

      axiosPostSpy.mockResolvedValueOnce(makeTokenResponse());

      const token = await (service as any).getValidToken();

      expect(token).toBe("jwt-access-token-xyz");
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
      const body = axiosPostSpy.mock.calls[0][1] as string;
      expect(body).toContain("grant_type=password");
    });

    it("deve fazer re-auth completa quando refresh_token está inválido", async () => {
      (service as any).accessToken = "token-expirado";
      (service as any).tokenExpiry = Date.now() - 1000;
      (service as any).refreshToken = "refresh-invalido";
      (service as any).refreshTokenExpiry = Date.now() + 1_800_000;

      // Refresh falha → re-auth com password grant
      axiosPostSpy.mockRejectedValueOnce(new Error("refresh inválido"));
      axiosPostSpy.mockResolvedValueOnce(makeTokenResponse());

      const token = await (service as any).getValidToken();

      expect(token).toBe("jwt-access-token-xyz");
      expect(axiosPostSpy).toHaveBeenCalledTimes(2);
      const secondBody = axiosPostSpy.mock.calls[1][1] as string;
      expect(secondBody).toContain("grant_type=password");
    });
  });
});
