// @ts-nocheck
import {
  SicrediSyncService,
  SicrediSyncError,
} from "../../../services/SicrediSyncService";
import { PaymentService } from "../../../services/PaymentService";
import { UserService } from "../../../services/UserService";
import { LegacyClientService } from "../../../services/LegacyClientService";
import { OrderService } from "../../../services/OrderService";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

// Mock dos services
jest.mock("../../../services/PaymentService");
jest.mock("../../../services/UserService");
jest.mock("../../../services/LegacyClientService");
jest.mock("../../../services/OrderService");

describe("SicrediSyncService", () => {
  let sicrediSyncService: SicrediSyncService;
  let mockPaymentService: jest.Mocked<PaymentService>;
  let mockUserService: jest.Mocked<UserService>;
  let mockLegacyClientService: jest.Mocked<LegacyClientService>;
  let mockOrderService: jest.Mocked<OrderService>;

  beforeEach(() => {
    // Criar mocks
    mockPaymentService = new PaymentService() as jest.Mocked<PaymentService>;
    mockUserService = new UserService() as jest.Mocked<UserService>;
    mockLegacyClientService =
      new LegacyClientService() as jest.Mocked<LegacyClientService>;
    mockOrderService = new OrderService() as jest.Mocked<OrderService>;

    // Instanciar serviço com mocks
    sicrediSyncService = new SicrediSyncService(
      mockPaymentService,
      mockUserService,
      mockLegacyClientService,
      mockOrderService
    );

    // Limpar timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ==================== startAutoSync ====================

  describe("startAutoSync", () => {
    it("should start auto sync with default interval (30 minutes)", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync();

      expect(sicrediSyncService.isSyncRunning()).toBe(true);
      expect(performSyncSpy).toHaveBeenCalledTimes(1); // Primeira execução imediata
    });

    it("should start auto sync with custom interval", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync(60);

      expect(sicrediSyncService.isSyncRunning()).toBe(true);
      expect(performSyncSpy).toHaveBeenCalledTimes(1);
    });

    it("should execute sync at specified intervals", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync(10); // 10 minutos

      // Primeira execução
      expect(performSyncSpy).toHaveBeenCalledTimes(1);

      // Avançar 10 minutos
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(performSyncSpy).toHaveBeenCalledTimes(2);

      // Avançar mais 10 minutos
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(performSyncSpy).toHaveBeenCalledTimes(3);
    });

    it("should not start if already running", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync();
      sicrediSyncService.startAutoSync(); // Tentar iniciar novamente

      expect(performSyncSpy).toHaveBeenCalledTimes(1); // Apenas primeira execução
    });

    it("should handle errors during first sync gracefully", () => {
      jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockRejectedValue(new Error("Sync failed"));

      expect(() => sicrediSyncService.startAutoSync()).not.toThrow();
      expect(sicrediSyncService.isSyncRunning()).toBe(true);
    });
  });

  // ==================== stopAutoSync ====================

  describe("stopAutoSync", () => {
    it("should stop auto sync when running", () => {
      jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(true);

      sicrediSyncService.stopAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(false);
    });

    it("should clear interval when stopped", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync(10);
      sicrediSyncService.stopAutoSync();

      // Avançar tempo e verificar que não executa mais
      jest.advanceTimersByTime(10 * 60 * 1000);
      expect(performSyncSpy).toHaveBeenCalledTimes(1); // Apenas a primeira execução
    });

    it("should do nothing if not running", () => {
      expect(() => sicrediSyncService.stopAutoSync()).not.toThrow();
      expect(sicrediSyncService.isSyncRunning()).toBe(false);
    });

    it("should allow restart after stop", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync();
      sicrediSyncService.stopAutoSync();
      sicrediSyncService.startAutoSync();

      expect(sicrediSyncService.isSyncRunning()).toBe(true);
      expect(performSyncSpy).toHaveBeenCalledTimes(2); // Duas primeiras execuções
    });
  });

  // ==================== performSync ====================

  describe("performSync", () => {
    it("should sync pending SICREDI payments successfully", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
        {
          _id: "payment2",
          bank_slip: {
            sicredi: { nossoNumero: "456", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100, dataPagamento: new Date() },
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it("should handle payments without nosso número", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          bank_slip: { sicredi: {} }, // Sem nossoNumero
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].paymentId).toBe("payment1");
    });

    it("should handle API errors gracefully", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: false,
        error: "API Error",
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].error).toContain("API Error");
    });

    it("should count payment statuses correctly", async () => {
      const mockPayments = [
        {
          _id: "p1",
          bank_slip: {
            sicredi: { nossoNumero: "1", status: "PENDENTE" },
          },
        },
        {
          _id: "p2",
          bank_slip: {
            sicredi: { nossoNumero: "2", status: "PENDENTE" },
          },
        },
        {
          _id: "p3",
          bank_slip: {
            sicredi: { nossoNumero: "3", status: "PENDENTE" },
          },
        },
        {
          _id: "p4",
          bank_slip: {
            sicredi: { nossoNumero: "4", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);

      (mockPaymentService.checkSicrediBoletoStatus as any) = jest
        .fn()
        .mockResolvedValueOnce({
          success: true,
          data: { status: "PAGO", valorPago: 100 },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { status: "VENCIDO" },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { status: "CANCELADO" },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { status: "PENDENTE" },
        });

      const result = await sicrediSyncService.performSync();

      expect(result.summary.paid).toBe(1);
      expect(result.summary.overdue).toBe(1);
      expect(result.summary.cancelled).toBe(1);
      expect(result.summary.pending).toBe(1);
    });

    it("should update payment counter when status changes", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100 },
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.updatedPayments).toBeGreaterThan(0);
    });

    it("should throw SicrediSyncError on general failure", async () => {
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        // @ts-ignore
        .mockRejectedValue(new Error("Database error") as any);

      await expect(sicrediSyncService.performSync()).rejects.toThrow(
        SicrediSyncError
      );
      await expect(sicrediSyncService.performSync()).rejects.toThrow(
        "Falha na sincronização com SICREDI"
      );
    });

    it("should handle empty payment list", async () => {
      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: [] } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  // ==================== syncClientPayments ====================

  describe("syncClientPayments", () => {
    it("should sync specific client payments", async () => {
      const clientId = "client123";
      const mockPayments = [
        {
          _id: "payment1",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100 },
      } as any);

      const result = await sicrediSyncService.syncClientPayments(clientId);

      expect(mockPaymentService.getAllPayments).toHaveBeenCalledWith(
        1,
        1000,
        expect.objectContaining({
          customerId: clientId,
          paymentMethod: "sicredi_boleto",
        })
      );
      expect(result.totalProcessed).toBe(1);
    });

    it("should handle client with no payments", async () => {
      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: [] } as any);

      const result = await sicrediSyncService.syncClientPayments("client123");

      expect(result.totalProcessed).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    it("should collect errors for failed payments", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          bank_slip: { sicredi: {} }, // Sem nossoNumero - vai falhar
        },
        {
          _id: "payment2",
          bank_slip: {
            sicredi: { nossoNumero: "456", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      // @ts-ignore
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO" },
      } as any);

      const result = await sicrediSyncService.syncClientPayments("client123");

      expect(result.totalProcessed).toBe(2);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].paymentId).toBe("payment1");
    });

    it("should throw SicrediSyncError on failure", async () => {
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockRejectedValue(new Error("API Error"));

      await expect(
        sicrediSyncService.syncClientPayments("client123")
      ).rejects.toThrow(SicrediSyncError);
      await expect(
        sicrediSyncService.syncClientPayments("client123")
      ).rejects.toThrow("Falha ao sincronizar cliente");
    });
  });

  // ==================== updateClientDebt (private method) ====================

  describe("updateClientDebt (via performSync)", () => {
    it("should update regular customer debt when paid", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          customerId: "customer123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100, dataPagamento: new Date() },
      } as any);

      (mockUserService.getUserById as any) = jest.fn().mockResolvedValue({
        _id: "customer123",
        name: "Test Customer",
        debts: 500,
      } as any);

      (mockUserService.updateUser as any) = jest.fn().mockResolvedValue({} as any);

      const result = await sicrediSyncService.performSync();

      expect(mockUserService.getUserById).toHaveBeenCalledWith("customer123");
      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        "customer123",
        expect.objectContaining({ debts: 400 }) // 500 - 100
      );
      expect(result.updatedDebts).toBe(1);
    });

    it("should update legacy client debt when paid", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          legacyClientId: "legacy123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100, dataPagamento: new Date() },
      } as any);

      (mockLegacyClientService.getLegacyClientById as any) = jest
        .fn()
        .mockResolvedValue({
          _id: "legacy123",
          name: "Legacy Customer",
          totalDebt: 300,
        } as any);

      (mockLegacyClientService.updateLegacyClient as any) = jest
        .fn()
        .mockResolvedValue({} as any);

      const result = await sicrediSyncService.performSync();

      expect(mockLegacyClientService.getLegacyClientById).toHaveBeenCalledWith(
        "legacy123"
      );
      expect(mockLegacyClientService.updateLegacyClient).toHaveBeenCalledWith(
        "legacy123",
        expect.objectContaining({ totalDebt: 200 }) // 300 - 100
      );
      expect(result.updatedDebts).toBe(1);
    });

    it("should not allow negative debt", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          customerId: "customer123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 200, dataPagamento: new Date() },
      } as any);

      (mockUserService.getUserById as any) = jest.fn().mockResolvedValue({
        _id: "customer123",
        name: "Test Customer",
        debts: 50, // Menor que o valor pago
      } as any);

      (mockUserService.updateUser as any) = jest.fn().mockResolvedValue({} as any);

      await sicrediSyncService.performSync();

      expect(mockUserService.updateUser).toHaveBeenCalledWith(
        "customer123",
        expect.objectContaining({ debts: 0 }) // Math.max(0, 50 - 200)
      );
    });

    it("should handle payment without customer ID", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          // Sem customerId nem legacyClientId
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100, dataPagamento: new Date() },
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].error).toContain("cliente associado");
    });

    it("should handle customer not found", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          customerId: "customer123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100, dataPagamento: new Date() },
      } as any);

      (mockUserService.getUserById as any) = jest.fn().mockResolvedValue(null);

      const result = await sicrediSyncService.performSync();

      // Deve processar sem erro (cliente não encontrado é tratado silenciosamente)
      expect(result.totalProcessed).toBe(1);
    });

    it("should handle debt update error", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          customerId: "customer123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 100, dataPagamento: new Date() },
      } as any);

      (mockUserService.getUserById as any) = jest.fn().mockResolvedValue({
        _id: "customer123",
        debts: 500,
      } as any);

      (mockUserService.updateUser as any) = jest
        .fn()
        .mockRejectedValue(new Error("Update failed"));

      const result = await sicrediSyncService.performSync();

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].error).toContain("débito do cliente");
    });
  });

  // ==================== isSyncRunning ====================

  describe("isSyncRunning", () => {
    it("should return false initially", () => {
      expect(sicrediSyncService.isSyncRunning()).toBe(false);
    });

    it("should return true when sync is running", () => {
      jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync();

      expect(sicrediSyncService.isSyncRunning()).toBe(true);
    });

    it("should return false after stopping sync", () => {
      jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      sicrediSyncService.startAutoSync();
      sicrediSyncService.stopAutoSync();

      expect(sicrediSyncService.isSyncRunning()).toBe(false);
    });
  });

  // ==================== getSyncStats ====================

  describe("getSyncStats", () => {
    it("should return correct statistics", async () => {
      const mockPayments = [
        {
          _id: "p1",
          bank_slip: { sicredi: { status: "PAGO" } },
        },
        {
          _id: "p2",
          bank_slip: { sicredi: { status: "PAGO" } },
        },
        {
          _id: "p3",
          bank_slip: { sicredi: { status: "VENCIDO" } },
        },
        {
          _id: "p4",
          bank_slip: { sicredi: { status: "CANCELADO" } },
        },
        {
          _id: "p5",
          bank_slip: { sicredi: { status: "PENDENTE" } },
        },
        {
          _id: "p6",
          bank_slip: { sicredi: {} }, // Sem status
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);

      const stats = await sicrediSyncService.getSyncStats();

      expect(stats.totalSicrediPayments).toBe(6);
      expect(stats.paidPayments).toBe(2);
      expect(stats.overduePayments).toBe(1);
      expect(stats.cancelledPayments).toBe(1);
      expect(stats.pendingPayments).toBe(2); // PENDENTE + sem status
    });

    it("should handle empty payment list", async () => {
      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: [] } as any);

      const stats = await sicrediSyncService.getSyncStats();

      expect(stats.totalSicrediPayments).toBe(0);
      expect(stats.paidPayments).toBe(0);
      expect(stats.overduePayments).toBe(0);
      expect(stats.cancelledPayments).toBe(0);
      expect(stats.pendingPayments).toBe(0);
    });

    it("should handle payments without bank_slip data", async () => {
      const mockPayments = [
        { _id: "p1" }, // Sem bank_slip
        { _id: "p2", bank_slip: {} }, // Sem sicredi
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);

      const stats = await sicrediSyncService.getSyncStats();

      expect(stats.totalSicrediPayments).toBe(2);
      expect(stats.pendingPayments).toBe(2); // Contados como pendentes
    });

    it("should throw SicrediSyncError on failure", async () => {
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        // @ts-ignore
        .mockRejectedValue(new Error("Database error") as any);

      await expect(sicrediSyncService.getSyncStats()).rejects.toThrow(
        SicrediSyncError
      );
      await expect(sicrediSyncService.getSyncStats()).rejects.toThrow(
        "Falha ao obter estatísticas"
      );
    });
  });

  // ==================== EDGE CASES & CONCURRENCY ====================

  describe("Edge Cases & Concurrency", () => {
    it("should handle very large payment lists", async () => {
      const largePaymentList = Array.from({ length: 1000 }, (_, i) => ({
        _id: `payment${i}`,
        bank_slip: {
          sicredi: { nossoNumero: `${i}`, status: "PENDENTE" },
        },
      })) as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: largePaymentList } as any);
      // @ts-ignore
      // @ts-ignore
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO" },
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(1000);
    });

    it("should handle concurrent performSync calls", async () => {
      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: [] } as any);

      const promises = [
        sicrediSyncService.performSync(),
        sicrediSyncService.performSync(),
        sicrediSyncService.performSync(),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toHaveProperty("totalProcessed");
        expect(result).toHaveProperty("errors");
      });
    });

    it("should handle mixed success and failure in payment processing", async () => {
      const mockPayments = [
        {
          _id: "p1",
          bank_slip: {
            sicredi: { nossoNumero: "1", status: "PENDENTE" },
          },
        },
        { _id: "p2", bank_slip: { sicredi: {} } }, // Vai falhar
        {
          _id: "p3",
          bank_slip: {
            sicredi: { nossoNumero: "3", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      // @ts-ignore
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO" },
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.totalProcessed).toBe(3);
      expect(result.errors.length).toBe(1);
      expect(result.summary.paid).toBe(2); // p1 e p3 foram pagos
    });

    it("should handle start/stop cycles", () => {
      const performSyncSpy = jest
        .spyOn(sicrediSyncService as any, "performSync")
        .mockResolvedValue({} as any);

      // Ciclo 1
      sicrediSyncService.startAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(true);

      sicrediSyncService.stopAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(false);

      // Ciclo 2
      sicrediSyncService.startAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(true);

      sicrediSyncService.stopAutoSync();
      expect(sicrediSyncService.isSyncRunning()).toBe(false);

      // Deve ter executado apenas 2 vezes (primeira execução de cada ciclo)
      expect(performSyncSpy).toHaveBeenCalledTimes(2);
    });

    it("should handle undefined payment IDs", async () => {
      const mockPayments = [
        {
          // Sem _id
          bank_slip: { sicredi: {} },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].paymentId).toBe("unknown");
    });

    it("should handle payment with zero value", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          customerId: "customer123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      // @ts-ignore
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO", valorPago: 0 }, // Valor zero
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.updatedDebts).toBe(0); // Não deve atualizar débito
    });

    it("should handle payment without valorPago", async () => {
      const mockPayments = [
        {
          _id: "payment1",
          customerId: "customer123",
          bank_slip: {
            sicredi: { nossoNumero: "123", status: "PENDENTE" },
          },
        },
      ] as any;

      // @ts-ignore
      (mockPaymentService.getAllPayments as any) = jest
        .fn()
        .mockResolvedValue({ payments: mockPayments } as any);
      (mockPaymentService.checkSicrediBoletoStatus as any) = jest.fn().mockResolvedValue({
        success: true,
        data: { status: "PAGO" }, // Sem valorPago
      } as any);

      const result = await sicrediSyncService.performSync();

      expect(result.updatedDebts).toBe(0); // Não deve atualizar débito
    });
  });
});
