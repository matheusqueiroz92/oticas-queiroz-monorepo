import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { OrderExportService } from "../../../services/OrderExportService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import { ExportUtils } from "../../../utils/exportUtils";

// Mock das dependências
jest.mock("../../../repositories/RepositoryFactory");
jest.mock("../../../utils/exportUtils");

const mockExportUtils = ExportUtils as jest.MockedClass<typeof ExportUtils>;

describe("OrderExportService", () => {
  let orderExportService: OrderExportService;
  let mockOrderRepository: any;
  let mockExportUtilsInstance: any;

  const mockExportResult = {
    buffer: Buffer.from("test"),
    contentType: "application/pdf",
    filename: "test.pdf"
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do repositório de pedidos
    mockOrderRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Mock do ExportUtils
    mockExportUtilsInstance = {
      exportOrders: jest.fn(),
      exportOrdersSummary: jest.fn(),
      exportOrderDetails: jest.fn(),
    };

    // Configurar mocks
    mockExportUtils.mockImplementation(() => mockExportUtilsInstance);
    (RepositoryFactory as any).getInstance = jest.fn().mockReturnValue({
      getOrderRepository: jest.fn().mockReturnValue(mockOrderRepository),
    });

    // Reset mock implementations
    (mockExportUtilsInstance.exportOrders as any).mockResolvedValue(mockExportResult);
    (mockExportUtilsInstance.exportOrdersSummary as any).mockResolvedValue(mockExportResult);
    (mockExportUtilsInstance.exportOrderDetails as any).mockResolvedValue(mockExportResult);

    orderExportService = new OrderExportService();
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(orderExportService).toBeInstanceOf(OrderExportService);
      expect(RepositoryFactory.getInstance).toHaveBeenCalled();
    });
  });

  describe("exportOrders", () => {
    it("deve exportar pedidos com sucesso", async () => {
      const mockOrders = [
        { id: "1", totalPrice: 100, status: "pending" },
        { id: "2", totalPrice: 200, status: "ready" }
      ];

      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });

      const result = await orderExportService.exportOrders({ format: "pdf" });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, {});
      expect(mockExportUtilsInstance.exportOrders).toHaveBeenCalledWith(mockOrders, { format: "pdf" });
      expect(result).toEqual(mockExportResult);
    });

    it("deve aplicar filtros na busca", async () => {
      const filters = { status: "pending" };
      const mockOrders = [{ id: "1", totalPrice: 100, status: "pending" }];

      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });

      await orderExportService.exportOrders({ format: "pdf" }, filters);

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, filters);
    });

    it("deve exportar lista vazia quando não há pedidos", async () => {
      mockOrderRepository.findAll.mockResolvedValue({ items: [] });

      const result = await orderExportService.exportOrders({ format: "pdf" });

      expect(mockOrderRepository.findAll).toHaveBeenCalled();
      expect(mockExportUtilsInstance.exportOrders).toHaveBeenCalledWith([], { format: "pdf" });
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com erros na busca de pedidos", async () => {
      mockOrderRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(orderExportService.exportOrders({ format: "pdf" }))
        .rejects.toThrow("Database error");
    });

    it("deve lidar com erros na exportação", async () => {
      const mockOrders = [{ id: "1", totalPrice: 100 }];
      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });
      mockExportUtilsInstance.exportOrders.mockRejectedValue(new Error("Export error"));

      await expect(orderExportService.exportOrders({ format: "pdf" }))
        .rejects.toThrow("Export error");
    });
  });

  describe("exportDailySummary", () => {
    it("deve exportar resumo diário com sucesso", async () => {
      const date = new Date("2024-01-15");
      const mockOrders = [
        { 
          id: "1", 
          totalPrice: 100, 
          discount: 10, 
          status: "pending", 
          paymentStatus: "pending",
          products: []
        },
        { 
          id: "2", 
          totalPrice: 200, 
          discount: 20, 
          status: "ready", 
          paymentStatus: "paid",
          products: []
        }
      ];

      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });

      const result = await orderExportService.exportDailySummary(date, { format: "pdf" });

      expect(mockOrderRepository.findAll).toHaveBeenCalled();
      expect(mockExportUtilsInstance.exportOrdersSummary).toHaveBeenCalled();
      expect(result).toEqual(mockExportResult);
    });

    it("deve calcular estatísticas corretamente", async () => {
      const date = new Date("2024-01-15");
      const mockOrders = [
        { 
          id: "1", 
          totalPrice: 100, 
          discount: 10, 
          status: "pending", 
          paymentStatus: "pending",
          products: []
        },
        { 
          id: "2", 
          totalPrice: 200, 
          discount: 20, 
          status: "ready", 
          paymentStatus: "paid",
          products: []
        }
      ];

      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });

      await orderExportService.exportDailySummary(date, { format: "pdf" });

      expect(mockExportUtilsInstance.exportOrdersSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          totalOrders: 2,
          totalValue: 300,
          totalDiscount: 30,
          finalValue: 270
        }),
        { format: "pdf" }
      );
    });

    it("deve lidar com lista vazia", async () => {
      const date = new Date("2024-01-15");
      mockOrderRepository.findAll.mockResolvedValue({ items: [] });

      const result = await orderExportService.exportDailySummary(date, { format: "pdf" });

      expect(mockExportUtilsInstance.exportOrdersSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          totalOrders: 0,
          totalValue: 0,
          totalDiscount: 0,
          finalValue: 0
        }),
        { format: "pdf" }
      );
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com erros na busca", async () => {
      const date = new Date("2024-01-15");
      mockOrderRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(orderExportService.exportDailySummary(date, { format: "pdf" }))
        .rejects.toThrow("Database error");
    });

    it("deve lidar com erros na exportação", async () => {
      const date = new Date("2024-01-15");
      const mockOrders = [{ 
        id: "1", 
        totalPrice: 100,
        products: []
      }];
      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });
      mockExportUtilsInstance.exportOrdersSummary.mockRejectedValue(new Error("Export error"));

      await expect(orderExportService.exportDailySummary(date, { format: "pdf" }))
        .rejects.toThrow("Export error");
    });
  });

  describe("exportOrdersByPeriod", () => {
    it("deve exportar pedidos por período com sucesso", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      const mockOrders = [
        { id: "1", totalPrice: 100, status: "pending" },
        { id: "2", totalPrice: 200, status: "ready" }
      ];

      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });

      const result = await orderExportService.exportOrdersByPeriod(startDate, endDate, { format: "pdf" });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, {
        createdAt: { $gte: startDate, $lte: endDate }
      });
      expect(mockExportUtilsInstance.exportOrders).toHaveBeenCalledWith(mockOrders, { format: "pdf" });
      expect(result).toEqual(mockExportResult);
    });

    it("deve aplicar filtros de data corretamente", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");

      mockOrderRepository.findAll.mockResolvedValue({ items: [] });

      await orderExportService.exportOrdersByPeriod(startDate, endDate, { format: "pdf" });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, {
        createdAt: { $gte: startDate, $lte: endDate }
      });
    });

    it("deve lidar com erros", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-31");
      mockOrderRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(orderExportService.exportOrdersByPeriod(startDate, endDate, { format: "pdf" }))
        .rejects.toThrow("Database error");
    });
  });

  describe("exportOrderDetails", () => {
    it("deve exportar detalhes de um pedido específico", async () => {
      const orderId = "order123";
      const mockOrder = { id: orderId, totalPrice: 100, status: "pending" };

      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const result = await orderExportService.exportOrderDetails(orderId, { format: "pdf" });

      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
      expect(mockExportUtilsInstance.exportOrderDetails).toHaveBeenCalledWith(mockOrder, { format: "pdf" });
      expect(result).toEqual(mockExportResult);
    });

    it("deve lidar com pedido não encontrado", async () => {
      const orderId = "nonexistent";
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(orderExportService.exportOrderDetails(orderId, { format: "pdf" }))
        .rejects.toThrow("Pedido não encontrado");
    });

    it("deve lidar com erros na busca", async () => {
      const orderId = "order123";
      mockOrderRepository.findById.mockRejectedValue(new Error("Database error"));

      await expect(orderExportService.exportOrderDetails(orderId, { format: "pdf" }))
        .rejects.toThrow("Database error");
    });

    it("deve lidar com erros na exportação", async () => {
      const orderId = "order123";
      const mockOrder = { id: orderId, totalPrice: 100 };
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockExportUtilsInstance.exportOrderDetails.mockRejectedValue(new Error("Export error"));

      await expect(orderExportService.exportOrderDetails(orderId, { format: "pdf" }))
        .rejects.toThrow("Export error");
    });
  });

  describe("Métodos auxiliares", () => {
    it("deve calcular estatísticas de pedidos corretamente", async () => {
      const date = new Date("2024-01-15");
      const mockOrders = [
        { 
          id: "1", 
          totalPrice: 100, 
          discount: 10, 
          status: "pending", 
          paymentStatus: "pending",
          products: [{ productType: "lenses" }]
        },
        { 
          id: "2", 
          totalPrice: 200, 
          discount: 20, 
          status: "ready", 
          paymentStatus: "paid",
          products: [{ productType: "prescription_frame" }]
        }
      ];

      mockOrderRepository.findAll.mockResolvedValue({ items: mockOrders });

      await orderExportService.exportDailySummary(date, { format: "pdf" });

      expect(mockExportUtilsInstance.exportOrdersSummary).toHaveBeenCalledWith(
        expect.objectContaining({
          ordersByType: expect.objectContaining({
            lenses: 1,
            prescription_frame: 1
          })
        }),
        { format: "pdf" }
      );
    });

    it("deve criar filtros de data corretamente", async () => {
      const date = new Date("2024-01-15T10:30:00");
      mockOrderRepository.findAll.mockResolvedValue({ items: [] });

      await orderExportService.exportDailySummary(date, { format: "pdf" });

      expect(mockOrderRepository.findAll).toHaveBeenCalledWith(1, 10000, {
        createdAt: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        }
      });
    });
  });
}); 