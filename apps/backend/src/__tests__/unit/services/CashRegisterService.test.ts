import {
  CashRegisterService,
  CashRegisterError,
} from "../../../services/CashRegisterService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import { ExportUtils } from "../../../utils/exportUtils";
import type { ICashRegister } from "../../../interfaces/ICashRegister";
import type { IPayment } from "../../../interfaces/IPayment";
import type { ICashRegisterRepository } from "../../../repositories/interfaces/ICashRegisterRepository";
import type { IPaymentRepository } from "../../../repositories/interfaces/IPaymentRepository";
import { Types } from "mongoose";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory");
// Mock do ExportUtils
jest.mock("../../../utils/exportUtils");

describe("CashRegisterService", () => {
  let cashRegisterService: CashRegisterService;
  let mockCashRegisterRepository: jest.Mocked<ICashRegisterRepository>;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;
  let mockExportUtils: jest.Mocked<ExportUtils>;

  beforeEach(() => {
    // Setup dos mocks dos repositories
    mockCashRegisterRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findOpenRegister: jest.fn(),
      findByStatus: jest.fn(),
      findByOpeningDate: jest.fn(),
      findByOpenedBy: jest.fn(),
      findByClosedBy: jest.fn(),
      closeRegister: jest.fn(),
      updateBalance: jest.fn(),
      updateSales: jest.fn(),
      updatePayments: jest.fn(),
      findDailySummary: jest.fn(),
      findWithDifference: jest.fn(),
      getStatistics: jest.fn(),
    };

    mockPaymentRepository = {
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
    };

    mockExportUtils = {
      exportToPDF: jest.fn(),
      exportToExcel: jest.fn(),
      exportToCSV: jest.fn(),
    } as any;

    mockRepositoryFactory = {
      getCashRegisterRepository: jest.fn().mockReturnValue(mockCashRegisterRepository),
      getPaymentRepository: jest.fn().mockReturnValue(mockPaymentRepository),
    } as any;

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);
    (ExportUtils as jest.Mock).mockImplementation(() => mockExportUtils);

    cashRegisterService = new CashRegisterService();
  });

  const mockUserId = new Types.ObjectId().toString();
  const mockCashRegisterId = new Types.ObjectId().toString();

  const mockRegister: ICashRegister = {
    _id: mockCashRegisterId,
    openingDate: new Date("2024-01-15T08:00:00.000Z"),
    openingBalance: 1000,
    currentBalance: 1000,
    status: "open",
    sales: {
      total: 0,
      cash: 0,
      credit: 0,
      debit: 0,
      pix: 0,
      check: 0,
    },
    payments: {
      received: 0,
      made: 0,
    },
    openedBy: mockUserId,
  };

  const mockPayment: IPayment = {
    _id: new Types.ObjectId().toString(),
    type: "sale",
    amount: 100,
    paymentMethod: "cash",
    date: new Date("2024-01-15T10:00:00.000Z"),
    status: "completed",
    cashRegisterId: mockCashRegisterId,
    createdBy: mockUserId,
  };

  describe("openRegister", () => {
    it("should open a new register successfully", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);
      mockCashRegisterRepository.create.mockResolvedValue(mockRegister);

      const result = await cashRegisterService.openRegister({
        openingBalance: 1000,
        openedBy: mockUserId,
        observations: "Abertura de caixa teste"
      });

      expect(result).toEqual(mockRegister);
      expect(mockCashRegisterRepository.findOpenRegister).toHaveBeenCalled();
      expect(mockCashRegisterRepository.create).toHaveBeenCalledWith({
        openingDate: expect.any(Date),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
          check: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: mockUserId,
        observations: "Abertura de caixa teste"
      });
    });

    it("should throw error if register already open", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockRegister);

      await expect(
        cashRegisterService.openRegister({
          openingBalance: 1000,
          openedBy: mockUserId,
        })
      ).rejects.toThrow(new CashRegisterError("Já existe um caixa aberto"));

      expect(mockCashRegisterRepository.create).not.toHaveBeenCalled();
    });

    it("should throw error for negative opening balance", async () => {
      await expect(
        cashRegisterService.openRegister({
          openingBalance: -100,
          openedBy: mockUserId,
        })
      ).rejects.toThrow(new CashRegisterError("Valor não pode ser negativo"));

      // O service valida o valor antes de buscar o caixa, então findOpenRegister não é chamado
    });

    it("should open register without observations", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);
      mockCashRegisterRepository.create.mockResolvedValue(mockRegister);

      await cashRegisterService.openRegister({
        openingBalance: 1000,
        openedBy: mockUserId,
      });

      expect(mockCashRegisterRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          openingBalance: 1000,
          openedBy: mockUserId,
          observations: undefined
        })
      );
    });
  });

  describe("closeRegister", () => {
    it("should close register successfully", async () => {
      const closedRegister = {
        ...mockRegister,
        status: "closed" as const,
        closingBalance: 1500,
        closingDate: new Date(),
        closedBy: mockUserId,
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockRegister);
      mockCashRegisterRepository.closeRegister.mockResolvedValue(closedRegister);

      const result = await cashRegisterService.closeRegister({
        closingBalance: 1500,
        closedBy: mockUserId,
        observations: "Fechamento teste"
      });

      expect(result).toEqual(closedRegister);
      expect(mockCashRegisterRepository.closeRegister).toHaveBeenCalledWith(
        mockCashRegisterId,
        {
          closingBalance: 1500,
          closedBy: mockUserId,
          observations: expect.stringContaining("Fechamento teste")
        }
      );
    });

    it("should throw error if no open register", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);

      await expect(
        cashRegisterService.closeRegister({
          closingBalance: 1500,
          closedBy: mockUserId,
        })
      ).rejects.toThrow(new CashRegisterError("Não há caixa aberto"));

      expect(mockCashRegisterRepository.closeRegister).not.toHaveBeenCalled();
    });

    it("should throw error for negative closing balance", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockRegister);

      await expect(
        cashRegisterService.closeRegister({
          closingBalance: -100,
          closedBy: mockUserId,
        })
      ).rejects.toThrow(new CashRegisterError("Valor não pode ser negativo"));
    });

    it("should calculate difference in observations", async () => {
      const closedRegister = {
        ...mockRegister,
        status: "closed" as const,
        closingBalance: 1200,
        closingDate: new Date(),
        closedBy: mockUserId,
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockRegister);
      mockCashRegisterRepository.closeRegister.mockResolvedValue(closedRegister);

      await cashRegisterService.closeRegister({
        closingBalance: 1200,
        closedBy: mockUserId,
      });

      expect(mockCashRegisterRepository.closeRegister).toHaveBeenCalledWith(
        mockCashRegisterId,
        expect.objectContaining({
          observations: expect.stringContaining("Diferença de caixa: R$\u00A0200,00")
        })
      );
    });

    it("should throw error if close operation fails", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockRegister);
      mockCashRegisterRepository.closeRegister.mockResolvedValue(null);

      await expect(
        cashRegisterService.closeRegister({
          closingBalance: 1500,
          closedBy: mockUserId,
        })
      ).rejects.toThrow(new CashRegisterError("Erro ao fechar o caixa"));
    });
  });

  describe("getCurrentRegister", () => {
    it("should return current open register", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockRegister);

      const result = await cashRegisterService.getCurrentRegister();

      expect(result).toEqual(mockRegister);
      expect(mockCashRegisterRepository.findOpenRegister).toHaveBeenCalled();
    });

    it("should throw error if no open register", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);

      await expect(cashRegisterService.getCurrentRegister()).rejects.toThrow(
        new CashRegisterError("Não há caixa aberto")
      );
    });
  });

  describe("getRegisterById", () => {
    it("should return register by id", async () => {
      mockCashRegisterRepository.findById.mockResolvedValue(mockRegister);

      const result = await cashRegisterService.getRegisterById(mockCashRegisterId);

      expect(result).toEqual(mockRegister);
      expect(mockCashRegisterRepository.findById).toHaveBeenCalledWith(mockCashRegisterId);
    });

    it("should throw error if register not found", async () => {
      mockCashRegisterRepository.findById.mockResolvedValue(null);

      await expect(
        cashRegisterService.getRegisterById("non-existent")
      ).rejects.toThrow(new CashRegisterError("Caixa não encontrado"));
    });
  });

  describe("getAllRegisters", () => {
    it("should return paginated registers", async () => {
      const mockResponse = {
        items: [mockRegister],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockCashRegisterRepository.findAll.mockResolvedValue(mockResponse);

      const result = await cashRegisterService.getAllRegisters(1, 10);

      expect(result).toEqual({
        registers: [mockRegister],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockCashRegisterRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should use default pagination", async () => {
      const mockResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockCashRegisterRepository.findAll.mockResolvedValue(mockResponse);

      await cashRegisterService.getAllRegisters();

      expect(mockCashRegisterRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should apply filters", async () => {
      const filters = { status: "closed" };
      const mockResponse = {
        items: [mockRegister],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockCashRegisterRepository.findAll.mockResolvedValue(mockResponse);

      await cashRegisterService.getAllRegisters(1, 10, filters);

      expect(mockCashRegisterRepository.findAll).toHaveBeenCalledWith(1, 10, filters);
    });
  });

  describe("getRegisterSummary", () => {
    it("should return register summary with payments", async () => {
      const mockDebtPayment: IPayment = {
        ...mockPayment,
        _id: new Types.ObjectId().toString(),
        type: "debt_payment",
        amount: 50,
        paymentMethod: "credit",
      };

      const mockRegisterWithSales = {
        ...mockRegister,
        sales: {
          total: 150,
          cash: 100,
          credit: 50,
          debit: 0,
          pix: 0,
          check: 0,
        }
      };

      mockCashRegisterRepository.findById.mockResolvedValue(mockRegisterWithSales);
      mockPaymentRepository.findByDateRange.mockResolvedValue([mockPayment, mockDebtPayment]);

      const result = await cashRegisterService.getRegisterSummary(mockCashRegisterId);

      expect(result.register).toEqual(mockRegisterWithSales);
      expect(result.payments.sales.total).toBe(150);
      expect(result.payments.sales.byMethod.cash).toBe(100);
      expect(result.payments.sales.byMethod.credit).toBe(50);
      expect(result.payments.debts.received).toBe(0); // Should be calculated from payments
    });

    it("should throw error for non-existent register", async () => {
      mockCashRegisterRepository.findById.mockResolvedValue(null);

      await expect(
        cashRegisterService.getRegisterSummary("invalid-id")
      ).rejects.toThrow(new CashRegisterError("Caixa não encontrado"));
    });
  });

  describe("softDeleteRegister", () => {
    it("should soft delete register successfully", async () => {
      const closedRegister = { ...mockRegister, status: "closed" as const };
      const deletedRegister = { ...closedRegister, isDeleted: true };
      
      mockCashRegisterRepository.findById.mockResolvedValue(closedRegister);
      mockCashRegisterRepository.softDelete.mockResolvedValue(deletedRegister);

      const result = await cashRegisterService.softDeleteRegister(mockCashRegisterId, mockUserId);

      expect(result).toEqual(deletedRegister);
      expect(mockCashRegisterRepository.findById).toHaveBeenCalledWith(mockCashRegisterId);
      expect(mockCashRegisterRepository.softDelete).toHaveBeenCalledWith(mockCashRegisterId, mockUserId);
    });

    it("should throw error if register not found", async () => {
      mockCashRegisterRepository.findById.mockResolvedValue(null);

      await expect(
        cashRegisterService.softDeleteRegister(mockCashRegisterId, mockUserId)
      ).rejects.toThrow(new CashRegisterError("Caixa não encontrado"));

      expect(mockCashRegisterRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should throw error if soft delete fails", async () => {
      const closedRegister = { ...mockRegister, status: "closed" as const };
      mockCashRegisterRepository.findById.mockResolvedValue(closedRegister);
      mockCashRegisterRepository.softDelete.mockResolvedValue(null);

      await expect(
        cashRegisterService.softDeleteRegister(mockCashRegisterId, mockUserId)
      ).rejects.toThrow(new CashRegisterError("Erro ao excluir caixa"));
    });
  });

  describe("getDeletedRegisters", () => {
    it("should return deleted registers", async () => {
      const deletedRegister = { ...mockRegister, isDeleted: true };
      const mockResponse = {
        items: [deletedRegister],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockCashRegisterRepository.findAll.mockResolvedValue(mockResponse);

      const result = await cashRegisterService.getDeletedRegisters(1, 10);

      expect(result).toEqual({
        registers: [deletedRegister],
        total: 1,
      });
      expect(mockCashRegisterRepository.findAll).toHaveBeenCalledWith(1, 10, { 
        isDeleted: true, 
        includeDeleted: true 
      });
    });
  });
}); 