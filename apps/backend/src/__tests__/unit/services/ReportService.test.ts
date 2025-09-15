// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ReportService } from "../../../services/ReportService";
import { ReportError } from "../../../interfaces/IReport";
import type { IReport, ReportFilters } from "../../../interfaces/IReport";

// Mock dos schemas do MongoDB
jest.mock("../../../schemas/OrderSchema", () => ({
  Order: {
    aggregate: jest.fn(),
  },
}));

jest.mock("../../../schemas/UserSchema", () => ({
  User: {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock("../../../schemas/PaymentSchema", () => ({
  Payment: {
    aggregate: jest.fn(),
  },
}));

jest.mock("../../../schemas/ProductSchema", () => ({
  Product: {
    aggregate: jest.fn(),
  },
}));

// Mock dos repositórios
const mockUserRepository = {
  findById: jest.fn(),
  countDocuments: jest.fn(),
  findByRole: jest.fn(),
} as any;

const mockOrderRepository = {
  findById: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
} as any;

const mockPaymentRepository = {
  findById: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn(),
} as any;

const mockProductRepository = {
  findById: jest.fn(),
  findLowStock: jest.fn(),
} as any;

// Mock do ReportModel
const mockReportModel = {
  create: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  updateStatus: jest.fn(),
  findByUser: jest.fn(),
} as any;

// Mock da RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  RepositoryFactory: {
    getInstance: () => ({
      getUserRepository: () => mockUserRepository,
      getOrderRepository: () => mockOrderRepository,
      getPaymentRepository: () => mockPaymentRepository,
      getProductRepository: () => mockProductRepository,
    }),
  },
}));

// Mock do ReportModel
jest.mock("../../../models/ReportModel", () => ({
  ReportModel: jest.fn().mockImplementation(() => mockReportModel),
}));

describe("ReportService", () => {
  let reportService: ReportService;
  const { Order } = require("../../../schemas/OrderSchema");
  const { User } = require("../../../schemas/UserSchema");
  const { Payment } = require("../../../schemas/PaymentSchema");
  const { Product } = require("../../../schemas/ProductSchema");

  const mockReport: IReport = {
    _id: "report123",
    name: "Relatório de Vendas",
    type: "sales",
    format: "json",
    status: "completed",
    filters: {
      startDate: new Date("2023-01-01"),
      endDate: new Date("2023-12-31"),
    },
    data: {
      totalSales: 10000,
      averageSale: 500,
      count: 20,
      byPeriod: [],
      byPaymentMethod: {},
    },
    createdBy: "user123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFilters: ReportFilters = {
    startDate: new Date("2023-01-01"),
    endDate: new Date("2023-12-31"),
    paymentMethod: ["cash", "credit"],
    productCategory: ["sunglasses_frame"],
    status: ["completed"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do construtor do ReportModel
    const { ReportModel } = require("../../../models/ReportModel");
    ReportModel.mockImplementation(() => mockReportModel);
    
    reportService = new ReportService();
    
    // Injetar os mocks necessários após a criação
    (reportService as any).reportModel = mockReportModel;
    (reportService as any).userRepository = mockUserRepository;
    (reportService as any).orderRepository = mockOrderRepository;
    (reportService as any).paymentRepository = mockPaymentRepository;
    (reportService as any).productRepository = mockProductRepository;
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(reportService).toBeInstanceOf(ReportService);
    });
  });

  describe("createReport", () => {
    it("deve criar relatório de vendas", async () => {
      mockReportModel.create.mockResolvedValue(mockReport);

      const result = await reportService.createReport(
        "Relatório de Vendas",
        "sales",
        mockFilters,
        "user123",
        "json"
      );

      expect(result).toEqual(mockReport);
      expect(mockReportModel.create).toHaveBeenCalledWith({
        name: "Relatório de Vendas",
        type: "sales",
        format: "json",
        status: "pending",
        filters: mockFilters,
        data: null,
        createdBy: "user123",
      });
    });

    it("deve criar relatório com formato padrão json", async () => {
      mockReportModel.create.mockResolvedValue(mockReport);

      await reportService.createReport(
        "Relatório Test",
        "inventory",
        {},
        "user123"
      );

      expect(mockReportModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "json",
        })
      );
    });

    it("deve propagar erros do modelo", async () => {
      const error = new Error("Database error");
      mockReportModel.create.mockRejectedValue(error);

      await expect(
        reportService.createReport("Test", "sales", {}, "user123")
      ).rejects.toThrow("Database error");
    });
  });

  describe("getReport", () => {
    it("deve retornar relatório existente", async () => {
      mockReportModel.findById.mockResolvedValue(mockReport);

      const result = await reportService.getReport("report123");

      expect(result).toEqual(mockReport);
      expect(mockReportModel.findById).toHaveBeenCalledWith("report123");
    });

    it("deve lançar erro se relatório não existir", async () => {
      mockReportModel.findById.mockResolvedValue(null);

      await expect(
        reportService.getReport("nonexistent")
      ).rejects.toThrow(new ReportError("Relatório não encontrado"));
    });

    it("deve propagar erros do modelo", async () => {
      const error = new Error("Database error");
      mockReportModel.findById.mockRejectedValue(error);

      await expect(
        reportService.getReport("report123")
      ).rejects.toThrow("Database error");
    });
  });

  describe("getUserReports", () => {
    it("deve retornar relatórios do usuário", async () => {
      const mockReports = [mockReport];
      mockReportModel.findByUser.mockResolvedValue({
        reports: mockReports,
        total: 1,
      });

      const result = await reportService.getUserReports("user123", 1, 10);

      expect(result).toEqual({
        reports: mockReports,
        total: 1,
      });
      expect(mockReportModel.findByUser).toHaveBeenCalledWith("user123", 1, 10);
    });

    it("deve usar valores padrão para paginação", async () => {
      mockReportModel.findByUser.mockResolvedValue({
        reports: [],
        total: 0,
      });

      await reportService.getUserReports("user123");

      expect(mockReportModel.findByUser).toHaveBeenCalledWith("user123", 1, 10);
    });

    it("deve calcular offset corretamente", async () => {
      mockReportModel.findByUser.mockResolvedValue({
        reports: [],
        total: 0,
      });

      await reportService.getUserReports("user123", 3, 5);

      expect(mockReportModel.findByUser).toHaveBeenCalledWith("user123", 3, 5);
    });
  });

  describe("getSalesStats", () => {
    beforeEach(() => {
      Order.aggregate
        .mockResolvedValueOnce([
          {
            _id: { month: 1, year: 2023 },
            totalSales: 1000,
            count: 10,
          },
          {
            _id: { month: 2, year: 2023 },
            totalSales: 1500,
            count: 15,
          },
        ])
        .mockResolvedValueOnce([
          { _id: "cash", total: 1500 },
          { _id: "credit", total: 1000 },
        ]);
    });

    it("deve retornar estatísticas de vendas sem filtros", async () => {
      const result = await reportService.getSalesStats();

      expect(result).toEqual({
        totalSales: 2500,
        count: 25,
        averageSale: 100,
        byPeriod: [
          { period: "2023-01", value: 1000, count: 10 },
          { period: "2023-02", value: 1500, count: 15 },
        ],
        byPaymentMethod: {
          cash: 1500,
          credit: 1000,
        },
      });
    });

    it("deve retornar estatísticas de vendas com filtros de data", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");

      const result = await reportService.getSalesStats(startDate, endDate);

      expect(result).toEqual({
        totalSales: 2500,
        count: 25,
        averageSale: 100,
        byPeriod: [
          { period: "2023-01", value: 1000, count: 10 },
          { period: "2023-02", value: 1500, count: 15 },
        ],
        byPaymentMethod: {
          cash: 1500,
          credit: 1000,
        },
      });
    });

    it("deve retornar valores zero quando não há dados", async () => {
      // Mock para retornar arrays vazios para ambos os aggregates
      Order.aggregate = jest.fn()
        .mockResolvedValueOnce([]) // Primeiro aggregate (byPeriod)
        .mockResolvedValueOnce([]); // Segundo aggregate (byPaymentMethod)

      const result = await reportService.getSalesStats();

      expect(result).toEqual({
        totalSales: 0,
        count: 0,
        averageSale: 0,
        byPeriod: [],
        byPaymentMethod: {},
      });
    });
  });

  describe("getInventoryStats", () => {
    beforeEach(() => {
      Product.aggregate.mockResolvedValue([
        {
          _id: "sunglasses_frame",
          count: 10,
          value: 5000,
        },
        {
          _id: "lenses",
          count: 20,
          value: 3000,
        },
      ]);

      mockProductRepository.findLowStock.mockResolvedValue({
        items: [
          { _id: "prod1", name: "Produto 1", stock: 2 },
          { _id: "prod2", name: "Produto 2", stock: 1 },
        ],
      });
    });

    it("deve retornar estatísticas de inventário", async () => {
      const result = await reportService.getInventoryStats();

      expect(result).toEqual({
        totalItems: 30,
        totalValue: 8000,
        byCategory: [
          { category: "sunglasses_frame", count: 10, value: 5000 },
          { category: "lenses", count: 20, value: 3000 },
        ],
        lowStock: [
          { productId: "prod1", name: "Produto 1", stock: 2 },
          { productId: "prod2", name: "Produto 2", stock: 1 },
        ],
      });
    });

    it("deve retornar valores zero quando não há dados", async () => {
      Product.aggregate.mockResolvedValue([]);
      mockProductRepository.findLowStock.mockResolvedValue({ items: [] });

      const result = await reportService.getInventoryStats();

      expect(result).toEqual({
        totalItems: 0,
        totalValue: 0,
        byCategory: [],
        lowStock: [],
      });
    });
  });

  describe("getCustomerStats", () => {
    beforeEach(() => {
      mockUserRepository.findByRole.mockResolvedValue({
        items: [
          { _id: "user1", name: "Cliente 1", createdAt: new Date("2023-01-15") },
          { _id: "user2", name: "Cliente 2", createdAt: new Date("2023-02-20") },
        ],
      });

      User.aggregate
        .mockResolvedValueOnce([
          {
            _id: { month: 1, year: 2023 },
            count: 5,
          },
          {
            _id: { month: 2, year: 2023 },
            count: 3,
          },
        ])
        .mockResolvedValueOnce([
          { _id: "user1", count: 2 },
          { _id: "user2", count: 1 },
        ])
        .mockResolvedValueOnce([
          { _id: null, averagePurchase: 150 },
        ]);
    });

    it("deve retornar estatísticas de clientes sem filtros", async () => {
      // Mock para recurringCustomersData (Order.aggregate)
      Order.aggregate
        .mockResolvedValueOnce([
          { _id: "user1", orderCount: 2, totalSpent: 300 },
          { _id: "user2", orderCount: 3, totalSpent: 450 },
        ])
        // Mock para averagePurchaseData (Order.aggregate)
        .mockResolvedValueOnce([
          { _id: null, averagePurchase: 150 },
        ]);

      const result = await reportService.getCustomerStats();

      expect(result).toEqual({
        totalCustomers: 2,
        newCustomers: 8,
        recurring: 2, // Agora será 2 porque o mock retorna 2 clientes recorrentes
        averagePurchase: 150,
        byLocation: {
          user1: 2,
          user2: 1,
        },
      });
    });

    it("deve retornar estatísticas de clientes com filtros de data", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");

      // Reset mocks
      jest.clearAllMocks();
      
      // Mock para recurringCustomersData
      Order.aggregate
        .mockResolvedValueOnce([
          { _id: "user1", orderCount: 2, totalSpent: 300 },
        ])
        // Mock para averagePurchaseData
        .mockResolvedValueOnce([
          { _id: null, averagePurchase: 150 },
        ]);

      const result = await reportService.getCustomerStats(startDate, endDate);

      expect(result).toEqual({
        totalCustomers: 2,
        newCustomers: 8,
        recurring: 1,
        averagePurchase: 150,
        byLocation: {
          user1: 2,
        },
      });
    });

    it("deve retornar zero clientes ativos quando não há dados", async () => {
      // Reset mocks
      jest.clearAllMocks();
      
      mockUserRepository.findByRole.mockResolvedValue({ items: [] });
      User.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      Order.aggregate
        .mockResolvedValueOnce([]) // recurringCustomersData
        .mockResolvedValueOnce([]); // averagePurchaseData

      const result = await reportService.getCustomerStats();

      expect(result).toEqual({
        totalCustomers: 0,
        newCustomers: 0,
        recurring: 0,
        averagePurchase: 0,
        byLocation: {},
      });
    });
  });

  describe("getOrderStats", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("deve retornar estatísticas de pedidos sem filtros", async () => {
      // Primeiro aggregate (statusData)
      Order.aggregate
        .mockResolvedValueOnce([
          { _id: "completed", count: 20, value: 2000 },
          { _id: "pending", count: 5, value: 500 },
        ])
        // Segundo aggregate (periodData)
        .mockResolvedValueOnce([
          {
            _id: { month: 1, year: 2023 },
            count: 10,
            value: 1000,
          },
          {
            _id: { month: 2, year: 2023 },
            count: 15,
            value: 1500,
          },
        ]);

      const result = await reportService.getOrderStats();

      expect(result).toEqual({
        totalOrders: 25,
        totalValue: 2500,
        averageValue: 100,
        byStatus: {
          completed: 20,
          pending: 5,
        },
        byPeriod: [
          { period: "2023-01", count: 10, value: 1000 },
          { period: "2023-02", count: 15, value: 1500 },
        ],
      });
    });

    it("deve retornar estatísticas de pedidos com filtros", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const status = "completed";

      // Primeiro aggregate (statusData)
      Order.aggregate
        .mockResolvedValueOnce([
          { _id: "completed", count: 20, value: 2000 },
          { _id: "pending", count: 5, value: 500 },
        ])
        // Segundo aggregate (periodData)
        .mockResolvedValueOnce([
          {
            _id: { month: 1, year: 2023 },
            count: 10,
            value: 1000,
          },
          {
            _id: { month: 2, year: 2023 },
            count: 15,
            value: 1500,
          },
        ]);

      const result = await reportService.getOrderStats(startDate, endDate, status);

      expect(result).toEqual({
        totalOrders: 25,
        totalValue: 2500,
        averageValue: 100,
        byStatus: {
          completed: 20,
          pending: 5,
        },
        byPeriod: [
          { period: "2023-01", count: 10, value: 1000 },
          { period: "2023-02", count: 15, value: 1500 },
        ],
      });
    });

    it("deve retornar valores zero quando não há dados", async () => {
      Order.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await reportService.getOrderStats();

      expect(result).toEqual({
        totalOrders: 0,
        totalValue: 0,
        averageValue: 0,
        byStatus: {},
        byPeriod: [],
      });
    });
  });

  describe("getFinancialStats", () => {
    beforeEach(() => {
      // Mock para generateFinancialReport
      Payment.aggregate
        .mockResolvedValueOnce([
          {
            _id: { month: 1, year: 2023 },
            revenue: 8000,
            count: 15,
          },
          {
            _id: { month: 2, year: 2023 },
            revenue: 7000,
            count: 15,
          },
        ])
        .mockResolvedValueOnce([
          {
            _id: { month: 1, year: 2023 },
            expenses: 2000,
          },
          {
            _id: { month: 2, year: 2023 },
            expenses: 1500,
          },
        ])
        .mockResolvedValueOnce([
          { _id: "office", total: 2000 },
          { _id: "marketing", total: 1500 },
        ]);
    });

    it("deve retornar estatísticas financeiras sem filtros", async () => {
      const result = await reportService.getFinancialStats();

      expect(result).toEqual({
        revenue: 15000,
        expenses: 3500,
        profit: 11500,
        byCategory: {
          office: 2000,
          marketing: 1500,
        },
        byPeriod: [
          { period: "2023-01", revenue: 8000, expenses: 2000, profit: 6000 },
          { period: "2023-02", revenue: 7000, expenses: 1500, profit: 5500 },
        ],
      });
    });

    it("deve retornar estatísticas financeiras com filtros de data", async () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");

      const result = await reportService.getFinancialStats(startDate, endDate);

      expect(result).toEqual({
        revenue: 15000,
        expenses: 3500,
        profit: 11500,
        byCategory: {
          office: 2000,
          marketing: 1500,
        },
        byPeriod: [
          { period: "2023-01", revenue: 8000, expenses: 2000, profit: 6000 },
          { period: "2023-02", revenue: 7000, expenses: 1500, profit: 5500 },
        ],
      });
    });

    it("deve retornar valores zero quando não há dados", async () => {
      // Mock para retornar arrays vazios para os 3 aggregates
      Payment.aggregate = jest.fn()
        .mockResolvedValueOnce([]) // Primeiro aggregate (revenueData)
        .mockResolvedValueOnce([]) // Segundo aggregate (expenseData)
        .mockResolvedValueOnce([]); // Terceiro aggregate (categoryData)

      const result = await reportService.getFinancialStats();

      expect(result).toEqual({
        revenue: 0,
        expenses: 0,
        profit: 0,
        byPeriod: [],
        byCategory: {},
      });
    });
  });

  describe("Geração de Relatórios - Sales", () => {
    it("deve gerar relatório de vendas com filtros", async () => {
      const mockSalesData = [
        {
          _id: { month: 1, year: 2023 },
          totalSales: 1000,
          count: 5,
          averageSale: 200,
        },
        {
          _id: { month: 2, year: 2023 },
          totalSales: 1500,
          count: 7,
          averageSale: 214.29,
        },
      ];

      const mockPaymentMethodData = [
        { _id: "cash", total: 1500 },
        { _id: "credit", total: 1000 },
      ];

      Order.aggregate
        .mockResolvedValueOnce(mockSalesData)
        .mockResolvedValueOnce(mockPaymentMethodData);

      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "sales",
        status: "pending",
      });
      mockReportModel.updateStatus.mockResolvedValue(true);

      // Simular chamada do método privado
      await (reportService as any).generateReportData("report123");

      expect(Order.aggregate).toHaveBeenCalledTimes(2);
      expect(mockReportModel.updateStatus).toHaveBeenCalledWith("report123", "processing");
      expect(mockReportModel.updateStatus).toHaveBeenCalledWith(
        "report123",
        "completed",
        expect.objectContaining({
          totalSales: 2500,
          count: 12,
          byPeriod: [
            { period: "2023-01", value: 1000, count: 5 },
            { period: "2023-02", value: 1500, count: 7 },
          ],
          byPaymentMethod: {
            cash: 1500,
            credit: 1000,
          },
        })
      );
    });
  });

  describe("Geração de Relatórios - Inventory", () => {
    it("deve gerar relatório de inventário", async () => {
      const mockCategoryData = [
        {
          _id: "sunglasses_frame",
          count: 10,
          value: 5000,
        },
        {
          _id: "lenses",
          count: 20,
          value: 3000,
        },
      ];

      const mockLowStockData = {
        items: [
          { _id: "prod1", name: "Produto 1", stock: 2 },
          { _id: "prod2", name: "Produto 2", stock: 1 },
        ],
      };

      Product.aggregate.mockResolvedValue(mockCategoryData);
      mockProductRepository.findLowStock.mockResolvedValue(mockLowStockData);

      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "inventory",
        status: "pending",
      });
      mockReportModel.updateStatus.mockResolvedValue(true);

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("report123");

      expect(Product.aggregate).toHaveBeenCalled();
      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(5, 1, 10);
      expect(mockReportModel.updateStatus).toHaveBeenCalledWith(
        "report123",
        "completed",
        expect.objectContaining({
          totalItems: 30,
          totalValue: 8000,
          byCategory: [
            { category: "sunglasses_frame", count: 10, value: 5000 },
            { category: "lenses", count: 20, value: 3000 },
          ],
          lowStock: [
            { productId: "prod1", name: "Produto 1", stock: 2 },
            { productId: "prod2", name: "Produto 2", stock: 1 },
          ],
        })
      );
    });
  });

  describe("Tratamento de Erros na Geração", () => {
    it("deve atualizar status para erro quando há falha", async () => {
      const error = new Error("Database connection failed");
      Order.aggregate.mockRejectedValue(error);

      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "sales",
        status: "pending",
      });
      mockReportModel.updateStatus.mockResolvedValue(true);

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("report123");

      expect(mockReportModel.updateStatus).toHaveBeenCalledWith(
        "report123",
        "error",
        null,
        "Database connection failed"
      );
    });

    it("deve lidar com erros desconhecidos", async () => {
      Order.aggregate.mockRejectedValue("String error");

      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "sales",
        status: "pending",
      });
      mockReportModel.updateStatus.mockResolvedValue(true);

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("report123");

      expect(mockReportModel.updateStatus).toHaveBeenCalledWith(
        "report123",
        "error",
        null,
        "Erro desconhecido"
      );
    });

    it("deve ignorar se relatório não existir", async () => {
      mockReportModel.findById.mockResolvedValue(null);

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("nonexistent");

      expect(mockReportModel.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("Cache de Relatórios", () => {
    it("deve usar dados do cache quando disponível", async () => {
      const cachedData = { cached: true };
      
      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "sales",
        status: "pending",
      });

      // Popula o cache
      const cache = (reportService as any).reportCache;
      const cacheKey = `sales_${JSON.stringify(mockReport.filters)}`;
      cache.set(cacheKey, cachedData);

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("report123");

      expect(mockReportModel.updateStatus).toHaveBeenCalledWith(
        "report123",
        "completed",
        cachedData
      );
      expect(Order.aggregate).not.toHaveBeenCalled();
    });

    it("deve limpar cache quando exceder limite", async () => {
      const cache = (reportService as any).reportCache;
      
      // Popula o cache com mais de 100 itens
      for (let i = 0; i <= 100; i++) {
        cache.set(`key${i}`, { data: i });
      }

      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "sales",
        status: "pending",
      });

      Order.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("report123");

      expect(cache.size).toBeLessThanOrEqual(100);
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com filtros vazios", async () => {
      await reportService.createReport("Test", "sales", {}, "user123");

      expect(mockReportModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: {},
        })
      );
    });

    it("deve lidar com tipos de relatório inválidos", async () => {
      mockReportModel.findById.mockResolvedValue({
        ...mockReport,
        type: "invalid_type" as any,
        status: "pending",
      });

      const generateReportData = (reportService as any).generateReportData;
      await generateReportData("report123");

      expect(mockReportModel.updateStatus).toHaveBeenCalledWith(
        "report123",
        "completed",
        null
      );
    });
  });
});
