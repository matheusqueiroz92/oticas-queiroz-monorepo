import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PaymentService, PaymentError } from "../../../services/PaymentService";
import { PaymentValidationService, PaymentValidationError } from "../../../services/PaymentValidationService";
import type { IPayment, CreatePaymentDTO } from "../../../interfaces/IPayment";
import type { IPaymentRepository } from "../../../repositories/interfaces/IPaymentRepository";
import { Types } from "mongoose";

// Mock do PaymentRepository
const mockPaymentRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  exists: jest.fn(),
  count: jest.fn(),
  findByOrderId: jest.fn(),
  findByClientId: jest.fn(),
  findByCashRegisterId: jest.fn(),
  findByType: jest.fn(),
  findByPaymentMethod: jest.fn(),
  findByStatus: jest.fn(),
  findByDateRange: jest.fn(),
  findChecksByStatus: jest.fn(),
  findDailyPayments: jest.fn(),
  findWithMongoFilters: jest.fn(),
  calculateTotalByPeriod: jest.fn(),
  getPaymentMethodStats: jest.fn(),
  findPendingByClientId: jest.fn(),
  cancel: jest.fn(),
  getRevenueSummary: jest.fn(),
} as jest.Mocked<IPaymentRepository>;

// Mock do PaymentValidationService  
const mockPaymentValidationService = {
  validatePayment: jest.fn(),
  normalizePaymentMethod: jest.fn(),
  validateAmount: jest.fn(),
  validateAndGetOpenRegister: jest.fn(),
  validateOrder: jest.fn(),
  validateCustomer: jest.fn(),
  validateLegacyClient: jest.fn(),
  validateInstallments: jest.fn(),
  validateClientDebtData: jest.fn(),
  isInstallmentPaymentMethod: jest.fn(),
} as any;

// Mock do PaymentCalculationService
const mockPaymentCalculationService = {
  calculateTotalAmount: jest.fn(),
  calculateInstallmentValue: jest.fn(),
} as any;

// Mock do PaymentExportService
const mockPaymentExportService = {
  exportPayments: jest.fn(),
  exportFinancialReport: jest.fn(),
} as any;

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getPaymentRepository: () => mockPaymentRepository,
    }),
  },
}));

// Mock dos serviços
jest.mock("../../../services/PaymentValidationService", () => ({
  PaymentValidationService: jest.fn(() => mockPaymentValidationService),
  PaymentValidationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = "PaymentValidationError";
    }
  },
}));

jest.mock("../../../services/PaymentCalculationService", () => ({
  PaymentCalculationService: jest.fn(() => mockPaymentCalculationService),
}));

jest.mock("../../../services/PaymentExportService", () => ({
  PaymentExportService: jest.fn(() => mockPaymentExportService),
}));

// Mock do NodeCache
jest.mock("node-cache", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

describe("PaymentService", () => {
  let paymentService: PaymentService;
  let mockCache: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockCashRegisterId = new Types.ObjectId().toString();

  const mockPaymentData: Omit<IPayment, "_id"> = {
    amount: 100,
    date: new Date("2024-01-15"),
    type: "sale",
    paymentMethod: "credit",
    status: "pending",
    cashRegisterId: mockCashRegisterId,
    createdBy: mockUserId,
  };

  const mockCreatedPayment: IPayment = {
    _id: "payment-id",
    ...mockPaymentData,
  };

  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();
    
    // Configurar mock do cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    paymentService = new PaymentService();
    
    // Substituir os serviços internos
    (paymentService as any).validationService = mockPaymentValidationService;
    (paymentService as any).calculationService = mockPaymentCalculationService;
    (paymentService as any).exportService = mockPaymentExportService;
    (paymentService as any).cache = mockCache;
  });

  describe("Constructor", () => {
    it("should create instance correctly", () => {
      expect(paymentService).toBeInstanceOf(PaymentService);
    });
  });

  describe("createPayment", () => {
    it("should create a payment successfully", async () => {
      mockPaymentValidationService.validatePayment.mockResolvedValue(mockCashRegisterId);
      mockPaymentValidationService.normalizePaymentMethod.mockReturnValue("credit");
      mockPaymentRepository.create.mockResolvedValue(mockCreatedPayment);

      const result = await paymentService.createPayment(mockPaymentData);

      expect(result).toEqual(mockCreatedPayment);
      expect(mockPaymentValidationService.validatePayment).toHaveBeenCalledWith(mockPaymentData);
      expect(mockPaymentValidationService.normalizePaymentMethod).toHaveBeenCalledWith("credit");
      expect(mockPaymentRepository.create).toHaveBeenCalledWith({
        ...mockPaymentData,
        paymentMethod: "credit",
        cashRegisterId: mockCashRegisterId,
        date: mockPaymentData.date
      });
      expect(mockCache.del).toHaveBeenCalled();
    });

    it("should handle PaymentValidationError", async () => {
      const validationError = new PaymentValidationError("Não há caixa aberto no momento");
      mockPaymentValidationService.validatePayment.mockRejectedValue(validationError);

      await expect(paymentService.createPayment(mockPaymentData)).rejects.toThrow(
        new PaymentError("Não há caixa aberto no momento")
      );

      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it("should handle generic errors", async () => {
      const genericError = new Error("Database connection failed");
      mockPaymentValidationService.validatePayment.mockRejectedValue(genericError);

      await expect(paymentService.createPayment(mockPaymentData)).rejects.toThrow(
        "Database connection failed"
      );

      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it("should set current date if not provided", async () => {
      const paymentWithoutDate = {
        amount: 100,
        type: "sale" as const,
        paymentMethod: "credit" as const,
        status: "pending" as const,
        cashRegisterId: mockCashRegisterId,
        createdBy: mockUserId,
      };

      mockPaymentValidationService.validatePayment.mockResolvedValue(mockCashRegisterId);
      mockPaymentValidationService.normalizePaymentMethod.mockReturnValue("credit");
      mockPaymentRepository.create.mockResolvedValue(mockCreatedPayment);

      await paymentService.createPayment(paymentWithoutDate as Omit<IPayment, "_id">);

      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...paymentWithoutDate,
          paymentMethod: "credit",
          cashRegisterId: mockCashRegisterId,
          date: expect.any(Date)
        })
      );
    });

    it("should handle different payment methods", async () => {
      const pixPayment = { ...mockPaymentData, paymentMethod: "pix" as const };

      mockPaymentValidationService.validatePayment.mockResolvedValue(mockCashRegisterId);
      mockPaymentValidationService.normalizePaymentMethod.mockReturnValue("pix");
      mockPaymentRepository.create.mockResolvedValue({ ...mockCreatedPayment, paymentMethod: "pix" });

      const result = await paymentService.createPayment(pixPayment);

      expect(result.paymentMethod).toBe("pix");
      expect(mockPaymentValidationService.normalizePaymentMethod).toHaveBeenCalledWith("pix");
    });
  });

  describe("getPaymentById", () => {
    it("should return payment from cache", async () => {
      mockCache.get.mockReturnValue(mockCreatedPayment);

      const result = await paymentService.getPaymentById("payment-id");

      expect(result).toEqual(mockCreatedPayment);
      expect(mockCache.get).toHaveBeenCalledWith("payment_payment-id");
      expect(mockPaymentRepository.findById).not.toHaveBeenCalled();
    });

    it("should fetch payment from repository when not in cache", async () => {
      mockCache.get.mockReturnValue(null);
      mockPaymentRepository.findById.mockResolvedValue(mockCreatedPayment);

      const result = await paymentService.getPaymentById("payment-id");

      expect(result).toEqual(mockCreatedPayment);
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith("payment-id");
      expect(mockCache.set).toHaveBeenCalledWith("payment_payment-id", mockCreatedPayment);
    });

    it("should throw error if payment not found", async () => {
      mockCache.get.mockReturnValue(null);
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(paymentService.getPaymentById("non-existent")).rejects.toThrow(
        new PaymentError("Pagamento não encontrado")
      );
    });
  });

  describe("getAllPayments", () => {
    it("should return payments from cache", async () => {
      const cachedResult = {
        payments: [mockCreatedPayment],
        total: 1,
      };
      mockCache.get.mockReturnValue(cachedResult);

      const result = await paymentService.getAllPayments(1, 10);

      expect(result).toEqual(cachedResult);
      expect(mockCache.get).toHaveBeenCalledWith("payments_1_10_{}");
      expect(mockPaymentRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch payments from repository when not in cache", async () => {
      mockCache.get.mockReturnValue(null);
      const repositoryResult = {
        items: [mockCreatedPayment],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getAllPayments(1, 10);

      expect(result).toEqual({
        payments: [mockCreatedPayment],
        total: 1,
      });
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10, {});
      expect(mockCache.set).toHaveBeenCalledWith("payments_1_10_{}", result, 300);
    });

    it("should use default pagination", async () => {
      mockCache.get.mockReturnValue(null);
      const repositoryResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      await paymentService.getAllPayments();

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should apply filters", async () => {
      mockCache.get.mockReturnValue(null);
      const filters = { type: "sale" as const };
      const repositoryResult = {
        items: [mockCreatedPayment],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getAllPayments(1, 10, filters);

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10, filters);
    });
  });

  describe("getDailyPayments", () => {
    it("should return payments from cache", async () => {
      const testDate = new Date("2024-01-15T00:00:00.000Z");
      const cachedPayments = [mockCreatedPayment];
      const expectedCacheKey = `daily_payments_${testDate.toDateString()}_all`;
      mockCache.get.mockReturnValue(cachedPayments);

      const result = await paymentService.getDailyPayments(testDate);

      expect(result).toEqual(cachedPayments);
      expect(mockCache.get).toHaveBeenCalledWith(expectedCacheKey);
      expect(mockPaymentRepository.findAll).not.toHaveBeenCalled();
    });

    it("should fetch payments from repository when not in cache", async () => {
      const testDate = new Date("2024-01-15T00:00:00.000Z");
      const expectedCacheKey = `daily_payments_${testDate.toDateString()}_all`;
      mockCache.get.mockReturnValue(null);
      const repositoryResult = {
        items: [mockCreatedPayment],
        total: 1,
        page: 1,
        limit: 1000,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getDailyPayments(testDate);

      expect(result).toEqual([mockCreatedPayment]);
      
      const callArgs = mockPaymentRepository.findAll.mock.calls[0];
      expect(callArgs[0]).toBe(1);
      expect(callArgs[1]).toBe(1000);
      expect(callArgs[2]).toEqual({
        date: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        }
      });
      
      expect(mockCache.set).toHaveBeenCalledWith(expectedCacheKey, [mockCreatedPayment], 300);
    });

    it("should filter by payment type", async () => {
      const testDate = new Date("2024-01-15");
      mockCache.get.mockReturnValue(null);
      const repositoryResult = {
        items: [mockCreatedPayment],
        total: 1,
        page: 1,
        limit: 1000,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      await paymentService.getDailyPayments(testDate, "sale");

      const callArgs = mockPaymentRepository.findAll.mock.calls[0];
      expect(callArgs[2]).toEqual({
        date: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        },
        type: "sale"
      });
    });
  });

  describe("cancelPayment", () => {
    it("should cancel payment successfully", async () => {
      const cancelledPayment = { ...mockCreatedPayment, status: "cancelled" as const };
      mockPaymentRepository.findById.mockResolvedValue(mockCreatedPayment);
      mockPaymentRepository.update.mockResolvedValue(cancelledPayment);

      const result = await paymentService.cancelPayment("payment-id", mockUserId);

      expect(result).toEqual(cancelledPayment);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith("payment-id", {
        status: "cancelled"
      });
      expect(mockCache.del).toHaveBeenCalled();
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(paymentService.cancelPayment("non-existent", mockUserId)).rejects.toThrow(
        new PaymentError("Pagamento não encontrado")
      );
    });

    it("should throw error if payment already cancelled", async () => {
      const cancelledPayment = { ...mockCreatedPayment, status: "cancelled" as const };
      mockPaymentRepository.findById.mockResolvedValue(cancelledPayment);

      await expect(paymentService.cancelPayment("payment-id", mockUserId)).rejects.toThrow(
        new PaymentError("Pagamento já foi cancelado")
      );
    });

    it("should throw error if update fails", async () => {
      mockPaymentRepository.findById.mockResolvedValue(mockCreatedPayment);
      mockPaymentRepository.update.mockResolvedValue(null);

      await expect(paymentService.cancelPayment("payment-id", mockUserId)).rejects.toThrow(
        new PaymentError("Erro ao cancelar pagamento")
      );
    });
  });

  describe("softDeletePayment", () => {
    it("should soft delete payment successfully", async () => {
      const deletedPayment = { ...mockCreatedPayment, isDeleted: true };
      mockPaymentRepository.softDelete.mockResolvedValue(deletedPayment);

      const result = await paymentService.softDeletePayment("payment-id", mockUserId);

      expect(result).toEqual(deletedPayment);
      expect(mockPaymentRepository.softDelete).toHaveBeenCalledWith("payment-id", mockUserId);
      expect(mockCache.del).toHaveBeenCalled();
    });

    it("should throw error if soft delete fails", async () => {
      mockPaymentRepository.softDelete.mockResolvedValue(null);

      await expect(paymentService.softDeletePayment("payment-id", mockUserId)).rejects.toThrow(
        new PaymentError("Erro ao excluir pagamento")
      );
    });
  });

  describe("getDeletedPayments", () => {
    it("should return deleted payments", async () => {
      const repositoryResult = {
        items: [{ ...mockCreatedPayment, isDeleted: true }],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getDeletedPayments(1, 10);

      expect(result).toEqual({
        payments: repositoryResult.items,
        total: 1,
      });
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10, { isDeleted: true });
    });

    it("should use default pagination", async () => {
      const repositoryResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      await paymentService.getDeletedPayments();

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10, { isDeleted: true });
    });
  });

  describe("exportPayments", () => {
    it("should export payments successfully", async () => {
      const exportResult = {
        buffer: Buffer.from("test"),
        contentType: "application/xlsx",
        filename: "payments.xlsx"
      };
      mockPaymentExportService.exportPayments.mockResolvedValue(exportResult);

      const options = { format: "excel" as const, filename: "test-payments" };
      const filters = { type: "sale" as const };

      const result = await paymentService.exportPayments(options, filters);

      expect(result).toEqual(exportResult);
      expect(mockPaymentExportService.exportPayments).toHaveBeenCalledWith(options, filters);
    });

    it("should export payments without filters", async () => {
      const exportResult = {
        buffer: Buffer.from("test"),
        contentType: "application/xlsx",
        filename: "payments.xlsx"
      };
      mockPaymentExportService.exportPayments.mockResolvedValue(exportResult);

      const options = { format: "excel" as const, filename: "test-payments" };

      await paymentService.exportPayments(options);

      expect(mockPaymentExportService.exportPayments).toHaveBeenCalledWith(options, {});
    });
  });

  describe("exportFinancialReport", () => {
    it("should export financial report successfully", async () => {
      const exportResult = {
        buffer: Buffer.from("report"),
        contentType: "application/xlsx",
        filename: "financial-report.xlsx"
      };
      mockPaymentExportService.exportFinancialReport.mockResolvedValue(exportResult);

      const reportData = {
        date: "2024-01-15",
        totalSales: 1000,
        totalDebtPayments: 500,
        totalExpenses: 200,
        dailyBalance: 1300,
        totalByCreditCard: 300,
        totalByDebitCard: 400,
        totalByCash: 300,
        totalByPix: 500,
        payments: [mockCreatedPayment]
      };

      const options = { format: "excel" as const, filename: "financial-report" };

      const result = await paymentService.exportFinancialReport(reportData, options);

      expect(result).toEqual(exportResult);
      expect(mockPaymentExportService.exportFinancialReport).toHaveBeenCalledWith(reportData, options);
    });
  });

  describe("updateCheckCompensationStatus", () => {
    const mockCheckPayment: IPayment = {
      _id: "check-payment-id",
      amount: 500,
      date: new Date("2024-01-15"),
      type: "sale",
      paymentMethod: "check",
      status: "pending",
      cashRegisterId: mockCashRegisterId,
      createdBy: mockUserId,
      check: {
        bank: "Banco do Brasil",
        checkNumber: "123456",
        checkDate: new Date("2024-01-20"),
        accountHolder: "João Silva",
        branch: "1234",
        accountNumber: "56789",
        compensationStatus: "pending"
      }
    };

    it("should update check compensation status to compensated", async () => {
      const updatedPayment = {
        ...mockCheckPayment,
        status: "completed" as const,
        check: {
          ...mockCheckPayment.check!,
          compensationStatus: "compensated" as const
        }
      };

      mockPaymentRepository.findById.mockResolvedValue(mockCheckPayment);
      mockPaymentRepository.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.updateCheckCompensationStatus("check-payment-id", "compensated");

      expect(result).toEqual(updatedPayment);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith("check-payment-id", {
        status: "completed",
        check: {
          ...mockCheckPayment.check!,
          compensationStatus: "compensated"
        }
      });
    });

    it("should update check compensation status to rejected with reason", async () => {
      const updatedPayment = {
        ...mockCheckPayment,
        status: "cancelled" as const,
        check: {
          ...mockCheckPayment.check!,
          compensationStatus: "rejected" as const,
          rejectionReason: "Insufficient funds"
        }
      };

      mockPaymentRepository.findById.mockResolvedValue(mockCheckPayment);
      mockPaymentRepository.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.updateCheckCompensationStatus(
        "check-payment-id", 
        "rejected", 
        "Insufficient funds"
      );

      expect(result).toEqual(updatedPayment);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith("check-payment-id", {
        status: "cancelled",
        check: {
          ...mockCheckPayment.check!,
          compensationStatus: "rejected",
          rejectionReason: "Insufficient funds"
        }
      });
    });

    it("should update check compensation status to pending", async () => {
      const updatedPayment = {
        ...mockCheckPayment,
        status: "pending" as const,
        check: {
          ...mockCheckPayment.check!,
          compensationStatus: "pending" as const
        }
      };

      mockPaymentRepository.findById.mockResolvedValue(mockCheckPayment);
      mockPaymentRepository.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.updateCheckCompensationStatus("check-payment-id", "pending");

      expect(result).toEqual(updatedPayment);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith("check-payment-id", {
        status: "pending",
        check: {
          ...mockCheckPayment.check!,
          compensationStatus: "pending"
        }
      });
    });

    it("should throw error if payment not found", async () => {
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(
        paymentService.updateCheckCompensationStatus("non-existent", "compensated")
      ).rejects.toThrow(new PaymentError("Pagamento não encontrado"));
    });

    it("should throw error if payment is not a check", async () => {
      const nonCheckPayment = { ...mockCreatedPayment, paymentMethod: "cash" as const };
      mockPaymentRepository.findById.mockResolvedValue(nonCheckPayment);

      await expect(
        paymentService.updateCheckCompensationStatus("payment-id", "compensated")
      ).rejects.toThrow(new PaymentError("Este pagamento não é um cheque"));
    });

    it("should throw error if update fails", async () => {
      mockPaymentRepository.findById.mockResolvedValue(mockCheckPayment);
      mockPaymentRepository.update.mockResolvedValue(null);

      await expect(
        paymentService.updateCheckCompensationStatus("check-payment-id", "compensated")
      ).rejects.toThrow(new PaymentError("Erro ao atualizar status do cheque"));
    });
  });

  describe("getChecksByStatus", () => {
    const mockCheckPayment: IPayment = {
      _id: "check-1",
      ...mockCreatedPayment,
      paymentMethod: "check",
      check: {
        bank: "Banco do Brasil",
        checkNumber: "123456",
        checkDate: new Date("2024-01-20"),
        accountHolder: "João Silva",
        branch: "1234",
        accountNumber: "56789",
        compensationStatus: "pending"
      }
    };

    it("should get checks by status without date range", async () => {
      const repositoryResult = {
        items: [mockCheckPayment],
        total: 1,
        page: 1,
        limit: 1000
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getChecksByStatus("pending");

      expect(result).toEqual([mockCheckPayment]);
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, {
        paymentMethod: "check",
        "check.compensationStatus": "pending"
      });
    });

    it("should get checks by status with date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const repositoryResult = {
        items: [{ ...mockCheckPayment, check: { ...mockCheckPayment.check!, compensationStatus: "compensated" as const } }],
        total: 1,
        page: 1,
        limit: 1000
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getChecksByStatus("compensated", startDate, endDate);

      expect(result).toEqual(repositoryResult.items);
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, {
        paymentMethod: "check",
        "check.compensationStatus": "compensated",
        date: {
          $gte: startDate,
          $lte: endDate
        }
      });
    });

    it("should get rejected checks", async () => {
      const rejectedCheck = { 
        ...mockCheckPayment, 
        check: { 
          ...mockCheckPayment.check!, 
          compensationStatus: "rejected" as const,
          rejectionReason: "Insufficient funds"
        }
      };
      const repositoryResult = {
        items: [rejectedCheck],
        total: 1,
        page: 1,
        limit: 1000
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getChecksByStatus("rejected");

      expect(result).toEqual([rejectedCheck]);
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, {
        paymentMethod: "check",
        "check.compensationStatus": "rejected"
      });
    });
  });

  describe("recalculateClientDebts", () => {
    it("should return mock result for client debt recalculation", async () => {
      const result = await paymentService.recalculateClientDebts("client123");
      
      expect(result).toEqual({
        updated: 0,
        clients: []
      });
    });

    it("should work without client id", async () => {
      const result = await paymentService.recalculateClientDebts();
      
      expect(result).toEqual({
        updated: 0,
        clients: []
      });
    });
  });

  describe("getPaymentStatusSummary", () => {
    it("should calculate payment status summary for an order", async () => {
      const orderPayments = [
        { ...mockCreatedPayment, amount: 100, status: "completed" as const },
        { ...mockCreatedPayment, amount: 50, status: "pending" as const }
      ];
      const repositoryResult = {
        items: orderPayments,
        total: 2,
        page: 1,
        limit: 1000
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getPaymentStatusSummary("order-id");

      expect(result).toEqual({
        totalAmount: 150,
        paidAmount: 100,
        pendingAmount: 50,
        status: "partial",
        payments: orderPayments
      });
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, { orderId: "order-id" });
    });

    it("should return paid status when fully paid", async () => {
      const orderPayments = [
        { ...mockCreatedPayment, amount: 100, status: "completed" as const }
      ];
      const repositoryResult = {
        items: orderPayments,
        total: 1,
        page: 1,
        limit: 1000
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getPaymentStatusSummary("order-id");

      expect(result.status).toBe("paid");
      expect(result.paidAmount).toBe(100);
      expect(result.pendingAmount).toBe(0);
    });

    it("should return pending status when no payments completed", async () => {
      const orderPayments = [
        { ...mockCreatedPayment, amount: 100, status: "pending" as const },
        { ...mockCreatedPayment, amount: 50, status: "pending" as const }
      ];
      const repositoryResult = {
        items: orderPayments,
        total: 2,
        page: 1,
        limit: 1000
      };
      mockPaymentRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await paymentService.getPaymentStatusSummary("order-id");

      expect(result.status).toBe("pending");
      expect(result.paidAmount).toBe(0);
      expect(result.pendingAmount).toBe(150);
    });
  });

  describe("Edge Cases and Additional Coverage", () => {
    it("should handle invalidateCache with single string key", () => {
      (paymentService as any).invalidateCache("single-key");

      expect(mockCache.del).toHaveBeenCalledWith("single-key");
    });

    it("should handle invalidateCache with array of keys", () => {
      (paymentService as any).invalidateCache(["key1", "key2", "key3"]);

      expect(mockCache.del).toHaveBeenCalledTimes(3);
      expect(mockCache.del).toHaveBeenCalledWith("key1");
      expect(mockCache.del).toHaveBeenCalledWith("key2");
      expect(mockCache.del).toHaveBeenCalledWith("key3");
    });

    it("should handle cache miss scenario", async () => {
      mockCache.get.mockReturnValue(null);
      mockPaymentRepository.findById.mockResolvedValue(mockCreatedPayment);

      const result = await paymentService.getPaymentById("payment-id");

      expect(result).toEqual(mockCreatedPayment);
      expect(mockCache.get).toHaveBeenCalledWith("payment_payment-id");
      expect(mockCache.set).toHaveBeenCalledWith("payment_payment-id", mockCreatedPayment);
    });
  });
}); 