import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PaymentExportService } from "../../../services/PaymentExportService";

// Mock dos repositórios e utilitários
const mockPaymentRepository = {
  findAll: jest.fn(),
  findByDateRange: jest.fn(),
  findChecksByStatus: jest.fn(),
} as any;

// Mock do ExportUtils
const mockExportUtils = {
  exportPayments: jest.fn(),
  exportFinancialReport: jest.fn(),
} as any;

// Mock da RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: () => ({
    paymentRepository: mockPaymentRepository,
  }),
}));

// Mock do ExportUtils
jest.mock("../../../utils/exportUtils", () => ({
  ExportUtils: jest.fn().mockImplementation(() => mockExportUtils),
}));

describe("PaymentExportService", () => {
  let paymentExportService: PaymentExportService;

  const mockPayment = {
    _id: "payment123",
    orderId: "order123",
    amount: 150,
    method: "cash" as const,
    type: "sale" as const,
    status: "completed" as const,
    date: new Date("2024-01-15T10:00:00Z"),
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    createdBy: "user123",
    cashRegisterId: "register123",
    paymentMethod: "cash" as const,
  };

  const mockExportOptions = {
    format: "excel" as const,
    filename: "payments-export",
    title: "Relatório de Pagamentos",
  };

  const mockFinancialReport = {
    date: "2024-01-15",
    totalSales: 1000,
    totalDebtPayments: 500,
    totalExpenses: 200,
    dailyBalance: 1300,
    totalByCreditCard: 300,
    totalByDebitCard: 400,
    totalByCash: 300,
    totalByPix: 500,
    payments: [mockPayment],
  };

  const mockExportResult = {
    buffer: Buffer.from("test data"),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "payments-export.xlsx",
  };

  beforeEach(() => {
    paymentExportService = new PaymentExportService();
    jest.clearAllMocks();
    // Injetar o mock do exportUtils
    (paymentExportService as any).exportUtils = mockExportUtils;
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(paymentExportService).toBeInstanceOf(PaymentExportService);
    });
  });

  describe("exportPayments", () => {
    it("deve exportar pagamentos sem filtros", async () => {
      const mockResult = {
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPayments(mockExportOptions);

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10000, {});
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([mockPayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve exportar pagamentos com filtros", async () => {
      const filters = { type: "sale" as const, method: "cash" };
      const mockResult = {
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPayments(mockExportOptions, filters);

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10000, filters);
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([mockPayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com lista vazia de pagamentos", async () => {
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPayments(mockExportOptions);

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10000, {});
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });
  });

  describe("exportFinancialReport", () => {
    it("deve exportar relatório financeiro", async () => {
      mockExportUtils.exportFinancialReport.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportFinancialReport(
        mockFinancialReport,
        mockExportOptions
      );

      expect(mockExportUtils.exportFinancialReport).toHaveBeenCalledWith(
        mockFinancialReport,
        mockExportOptions
      );
      expect(result).toEqual(mockExportResult);
    });

    it("deve exportar relatório financeiro com dados vazios", async () => {
      const emptyReport = {
        ...mockFinancialReport,
        payments: [],
        totalSales: 0,
        totalDebtPayments: 0,
        totalExpenses: 0,
        dailyBalance: 0,
      };

      mockExportUtils.exportFinancialReport.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportFinancialReport(
        emptyReport,
        mockExportOptions
      );

      expect(mockExportUtils.exportFinancialReport).toHaveBeenCalledWith(
        emptyReport,
        mockExportOptions
      );
      expect(result).toEqual(mockExportResult);
    });
  });

  describe("exportPaymentsByPeriod", () => {
    it("deve exportar pagamentos por período", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      mockPaymentRepository.findByDateRange.mockResolvedValue([mockPayment]);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPaymentsByPeriod(
        startDate,
        endDate,
        mockExportOptions
      );

      expect(mockPaymentRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([mockPayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com período sem pagamentos", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      mockPaymentRepository.findByDateRange.mockResolvedValue([]);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPaymentsByPeriod(
        startDate,
        endDate,
        mockExportOptions
      );

      expect(mockPaymentRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });
  });

  describe("exportChecksByStatus", () => {
    it("deve exportar cheques pendentes", async () => {
      const checkPayment = {
        ...mockPayment,
        method: "check",
        checkStatus: "pending",
      };

      mockPaymentRepository.findChecksByStatus.mockResolvedValue([checkPayment]);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportChecksByStatus("pending", mockExportOptions);

      expect(mockPaymentRepository.findChecksByStatus).toHaveBeenCalledWith("pending");
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([checkPayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve exportar cheques compensados", async () => {
      const checkPayment = {
        ...mockPayment,
        method: "check",
        checkStatus: "compensated",
      };

      mockPaymentRepository.findChecksByStatus.mockResolvedValue([checkPayment]);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportChecksByStatus("compensated", mockExportOptions);

      expect(mockPaymentRepository.findChecksByStatus).toHaveBeenCalledWith("compensated");
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([checkPayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve exportar cheques rejeitados", async () => {
      const checkPayment = {
        ...mockPayment,
        method: "check",
        checkStatus: "rejected",
      };

      mockPaymentRepository.findChecksByStatus.mockResolvedValue([checkPayment]);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportChecksByStatus("rejected", mockExportOptions);

      expect(mockPaymentRepository.findChecksByStatus).toHaveBeenCalledWith("rejected");
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([checkPayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com status sem cheques", async () => {
      mockPaymentRepository.findChecksByStatus.mockResolvedValue([]);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportChecksByStatus("pending", mockExportOptions);

      expect(mockPaymentRepository.findChecksByStatus).toHaveBeenCalledWith("pending");
      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve propagar erros do repositório de pagamentos", async () => {
      const error = new Error("Database connection failed");
      mockPaymentRepository.findAll.mockRejectedValue(error);

      await expect(
        paymentExportService.exportPayments(mockExportOptions)
      ).rejects.toThrow("Database connection failed");
    });

    it("deve propagar erros do ExportUtils", async () => {
      const error = new Error("Export utility failed");
      const mockResult = {
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockRejectedValue(error);

      await expect(
        paymentExportService.exportPayments(mockExportOptions)
      ).rejects.toThrow("Export utility failed");
    });

    it("deve propagar erros de findByDateRange", async () => {
      const error = new Error("Date range query failed");
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      mockPaymentRepository.findByDateRange.mockRejectedValue(error);

      await expect(
        paymentExportService.exportPaymentsByPeriod(startDate, endDate, mockExportOptions)
      ).rejects.toThrow("Date range query failed");
    });

    it("deve propagar erros de findChecksByStatus", async () => {
      const error = new Error("Check status query failed");
      mockPaymentRepository.findChecksByStatus.mockRejectedValue(error);

      await expect(
        paymentExportService.exportChecksByStatus("pending", mockExportOptions)
      ).rejects.toThrow("Check status query failed");
    });

    it("deve propagar erros de exportFinancialReport", async () => {
      const error = new Error("Financial report export failed");
      mockExportUtils.exportFinancialReport.mockRejectedValue(error);

      await expect(
        paymentExportService.exportFinancialReport(mockFinancialReport, mockExportOptions)
      ).rejects.toThrow("Financial report export failed");
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com pagamentos com dados incompletos", async () => {
      const incompletePayment = {
        _id: "payment456",
        amount: 100,
        method: "cash" as const,
        type: "sale" as const,
        date: new Date(),
        createdBy: "user123",
        cashRegisterId: "register123",
        paymentMethod: "cash" as const,
        status: "completed" as const,
      };

      const mockResult = {
        items: [incompletePayment],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPayments(mockExportOptions);

      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([incompletePayment], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com filtros básicos", async () => {
      const filters = {
        type: "sale" as const,
        status: "completed" as const,
      };

      const mockResult = {
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockResolvedValue(mockExportResult);

      const result = await paymentExportService.exportPayments(mockExportOptions, filters);

      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 10000, filters);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com exportações em formatos diferentes", async () => {
      const csvOptions = {
        format: "csv" as const,
        filename: "payments-export",
        title: "Relatório de Pagamentos",
      };

      const csvResult = {
        buffer: Buffer.from("csv data"),
        contentType: "text/csv",
        filename: "payments-export.csv",
      };

      const mockResult = {
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockPaymentRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportPayments.mockResolvedValue(csvResult);

      const result = await paymentExportService.exportPayments(csvOptions);

      expect(mockExportUtils.exportPayments).toHaveBeenCalledWith([mockPayment], csvOptions);
      expect(result).toEqual(csvResult);
    });
  });
});

