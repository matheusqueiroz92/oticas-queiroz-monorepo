import { describe, it, expect, beforeEach, jest } from "@jest/globals";
// @ts-nocheck
import { OrderExportService } from "../../../services/OrderExportService";
import type { ExportOptions } from "../../../utils/exportUtils";
import type { IOrder } from "../../../interfaces/IOrder";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: jest.fn(),
}));

// Mock do getOrdersByFilters
jest.mock("../../../utils/getOrdersByFilters", () => ({
  getOrdersByFilters: jest.fn(),
}));

// Mock simples do ExportUtils
const mockExportUtils = {
  exportOrders: jest.fn(),
  exportOrdersSummary: jest.fn(),
  exportOrderDetails: jest.fn(),
};

jest.mock("../../../utils/exportUtils", () => ({
  ExportUtils: jest.fn().mockImplementation(() => mockExportUtils),
}));

describe("OrderExportService", () => {
  let orderExportService: OrderExportService;
  let mockOrderRepository: any;

  const mockOrder: IOrder = {
    _id: "order123",
    clientId: "client123",
    employeeId: "employee123",
    products: [
      {
        _id: "product123",
        name: "Lente de Contato",
        productType: "lenses",
        sellPrice: 150,
        lensType: "contact",
      },
    ],
    paymentMethod: "cash",
    paymentStatus: "paid",
    status: "delivered",
    orderDate: new Date("2024-01-15T10:00:00Z"),
    totalPrice: 150,
    discount: 10,
    finalPrice: 140,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
  };

  const mockOrder2: IOrder = {
    _id: "order456",
    clientId: "client456",
    employeeId: "employee456",
    products: [
      {
        _id: "product456",
        name: "Armação de Grau",
        productType: "prescription_frame",
        sellPrice: 400,
        typeFrame: "metal",
        color: "black",
        shape: "rectangular",
        reference: "AR001",
        stock: 10,
      },
    ],
    paymentMethod: "credit_card",
    paymentStatus: "pending",
    status: "pending",
    orderDate: new Date("2024-01-15T14:00:00Z"),
    totalPrice: 400,
    discount: 0,
    finalPrice: 400,
    createdAt: new Date("2024-01-15T14:00:00Z"),
    updatedAt: new Date("2024-01-15T14:00:00Z"),
  };

  const mockExportOptions = {
    format: "excel" as const,
    filename: "test-export",
    title: "Test Export",
  };

  const mockExportResult = {
    buffer: Buffer.from("test data"),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: "test-export.xlsx",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOrderRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    (getRepositories as jest.Mock).mockReturnValue({
      orderRepository: mockOrderRepository,
    });

    // Reset mock implementations
    mockExportUtils.exportOrders.mockResolvedValue(mockExportResult);
    mockExportUtils.exportOrdersSummary.mockResolvedValue(mockExportResult);
    mockExportUtils.exportOrderDetails.mockResolvedValue(mockExportResult);

    orderExportService = new OrderExportService();
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(orderExportService).toBeInstanceOf(OrderExportService);
    });
  });

  describe("exportOrders", () => {
    it("deve exportar pedidos com sucesso", async () => {
      const mockResult = {
        items: [mockOrder, mockOrder2],
        total: 2,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      const result = await orderExportService.exportOrders(mockExportOptions, {});

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, {});
      expect(mockExportUtils.exportOrders).toHaveBeenCalledWith([mockOrder, mockOrder2], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve aplicar filtros na busca", async () => {
      const filters = { status: "delivered" };
      const mockResult = {
        items: [mockOrder],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      const result = await orderExportService.exportOrders(mockExportOptions, filters);

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, filters);
      expect(result).toEqual(mockExportResult);
    });

    it("deve exportar lista vazia quando não há pedidos", async () => {
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      const result = await orderExportService.exportOrders(mockExportOptions);

      expect(mockExportUtils.exportOrders).toHaveBeenCalledWith([], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com erros na busca de pedidos", async () => {
      mockOrderRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(
        orderExportService.exportOrders(mockExportOptions, {})
      ).rejects.toThrow("Database error");
    });

    it("deve lidar com erros na exportação", async () => {
      const mockResult = {
        items: [mockOrder],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportOrders.mockRejectedValue(new Error("Export error"));

      await expect(
        orderExportService.exportOrders(mockExportOptions, {})
      ).rejects.toThrow("Export error");
    });
  });

  describe("exportDailySummary", () => {
    it("deve exportar resumo diário com sucesso", async () => {
      const testDate = new Date("2024-01-15");
      const mockResult = {
        items: [mockOrder, mockOrder2],
        total: 2,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      const result = await orderExportService.exportDailySummary(testDate, mockExportOptions);

      expect(mockOrderRepository.findAll).toHaveBeenCalled();
      expect(mockExportUtils.exportOrdersSummary).toHaveBeenCalled();
      expect(result).toEqual(mockExportResult);
    });

    it("deve calcular estatísticas corretamente", async () => {
      const testDate = new Date("2024-01-15");
      const ordersWithVariousStatus = [
        { ...mockOrder, status: "delivered" as const, finalPrice: 95, discount: 5 },
        { ...mockOrder2, status: "pending" as const, finalPrice: 200, discount: 0 },
        { ...mockOrder, status: "cancelled" as const, finalPrice: 140, discount: 10 },
      ];

      const mockResult = {
        items: ordersWithVariousStatus,
        total: 3,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      await orderExportService.exportDailySummary(testDate, mockExportOptions);

      expect(mockExportUtils.exportOrdersSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          totalOrders: 3,
          totalValue: expect.any(Number),
          totalDiscount: 15, // 5 + 0 + 10
          deliveredOrders: 1,
          pendingOrders: 1,
          cancelledOrders: 1,
        }),
        mockExportOptions
      );
    });

    it("deve lidar com lista vazia", async () => {
      const testDate = new Date("2024-01-15");
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      const result = await orderExportService.exportDailySummary(testDate, mockExportOptions);

      expect(mockExportUtils.exportOrdersSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          totalOrders: 0,
          totalValue: 0,
          totalDiscount: 0,
          deliveredOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
        }),
        mockExportOptions
      );
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com erros na busca", async () => {
      const testDate = new Date("2024-01-15");
      mockOrderRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(
        orderExportService.exportDailySummary(testDate, mockExportOptions)
      ).rejects.toThrow("Database error");
    });

    it("deve lidar com erros na exportação", async () => {
      const testDate = new Date("2024-01-15");
      const mockResult = {
        items: [mockOrder],
        total: 1,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);
      mockExportUtils.exportOrdersSummary.mockRejectedValue(new Error("Export error"));

      await expect(
        orderExportService.exportDailySummary(testDate, mockExportOptions)
      ).rejects.toThrow("Export error");
    });
  });

  describe("exportOrdersByPeriod", () => {
    it("deve exportar pedidos por período com sucesso", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockResult = {
        items: [mockOrder, mockOrder2],
        total: 2,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      const result = await orderExportService.exportOrdersByPeriod(startDate, endDate, mockExportOptions);

      expect(mockOrderRepository.findAll).toHaveBeenCalled();
      expect(mockExportUtils.exportOrders).toHaveBeenCalledWith([mockOrder, mockOrder2], mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve aplicar filtros de data corretamente", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      await orderExportService.exportOrdersByPeriod(startDate, endDate, mockExportOptions);

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(
        1,
        10000,
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: startDate,
            $lte: endDate,
          }),
        })
      );
    });

    it("deve lidar com erros", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      mockOrderRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(
        orderExportService.exportOrdersByPeriod(startDate, endDate, mockExportOptions)
      ).rejects.toThrow("Database error");
    });
  });

  describe("exportOrderDetails", () => {
    it("deve exportar detalhes de um pedido específico", async () => {
      const orderId = "order123";
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const result = await orderExportService.exportOrderDetails(orderId, mockExportOptions);

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockExportUtils.exportOrderDetails).toHaveBeenCalledWith(mockOrder, mockExportOptions);
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com pedido não encontrado", async () => {
      const orderId = "nonexistent";
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        orderExportService.exportOrderDetails(orderId, mockExportOptions)
      ).rejects.toThrow("Pedido não encontrado");
    });

    it("deve lidar com erros na busca", async () => {
      const orderId = "order123";
      mockOrderRepository.findById.mockRejectedValue(new Error("Database error"));

      await expect(
        orderExportService.exportOrderDetails(orderId, mockExportOptions)
      ).rejects.toThrow("Database error");
    });

    it("deve lidar com erros na exportação", async () => {
      const orderId = "order123";
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockExportUtils.exportOrderDetails.mockRejectedValue(new Error("Export error"));

      await expect(
        orderExportService.exportOrderDetails(orderId, mockExportOptions)
      ).rejects.toThrow("Export error");
    });
  });

  describe("Métodos auxiliares", () => {
    it("deve calcular estatísticas de pedidos corretamente", async () => {
      // Este teste verifica o método privado calculateOrderStats indiretamente
      const testDate = new Date("2024-01-15");
      const orders = [
        { ...mockOrder, status: "delivered" as const, finalPrice: 100, discount: 10 },
        { ...mockOrder, status: "pending" as const, finalPrice: 200, discount: 5 },
        { ...mockOrder, status: "cancelled" as const, finalPrice: 300, discount: 0 },
        { ...mockOrder, status: "delivered" as const, finalPrice: 150, discount: 15 },
      ];

      const mockResult = {
        items: orders,
        total: 4,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      await orderExportService.exportDailySummary(testDate, mockExportOptions);

      expect(mockExportUtils.exportOrdersSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          totalOrders: 4,
          totalValue: 750, // 100 + 200 + 300 + 150
          totalDiscount: 30, // 10 + 5 + 0 + 15
          deliveredOrders: 2,
          pendingOrders: 1,
          cancelledOrders: 1,
        }),
        mockExportOptions
      );
    });

    it("deve criar filtros de data corretamente", async () => {
      // Este teste verifica o método privado createDateFilters indiretamente
      const year = 2024;
      const month = 12; // Dezembro

      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        limit: 10000,
      };

      mockOrderRepository.findAll.mockResolvedValue(mockResult);

      await orderExportService.exportMonthlyReport(year, month, mockExportOptions);

      const expectedStartDate = new Date(2024, 11, 1); // 1º de dezembro de 2024
      const expectedEndDate = new Date(2024, 12, 0, 23, 59, 59, 999); // último dia de dezembro

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(
        1,
        10000,
        expect.objectContaining({
          orderDate: expect.objectContaining({
            $gte: expectedStartDate,
            $lte: expectedEndDate,
          }),
        })
      );
    });
  });
}); 