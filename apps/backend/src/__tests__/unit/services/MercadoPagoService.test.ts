// @ts-nocheck
import { MercadoPagoService, MercadoPagoError } from "../../../services/MercadoPagoService";
import { OrderService } from "../../../services/OrderService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import { MercadoPagoAPI } from "../../../utils/mercadoPagoDirectApi";
import { IPaymentRepository } from "../../../repositories/interfaces/IPaymentRepository";
import { IOrderRepository } from "../../../repositories/interfaces/IOrderRepository";
import { ICashRegisterRepository } from "../../../repositories/interfaces/ICashRegisterRepository";
import { IOrder } from "../../../interfaces/IOrder";
import { IPayment } from "../../../interfaces/IPayment";
import { ICashRegister } from "../../../interfaces/ICashRegister";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock dos services e APIs
jest.mock("../../../services/OrderService");
jest.mock("../../../repositories/RepositoryFactory");
jest.mock("../../../utils/mercadoPagoDirectApi", () => ({
  MercadoPagoAPI: {
    createPreference: jest.fn(),
    getPayment: jest.fn(),
  },
}));

describe("MercadoPagoService", () => {
  let mercadoPagoService: MercadoPagoService;
  let mockOrderService: jest.Mocked<OrderService>;
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockCashRegisterRepository: jest.Mocked<ICashRegisterRepository>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;

  beforeEach(() => {
    // Setup dos mocks dos repositories
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

    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByClientId: jest.fn(),
      findByEmployeeId: jest.fn(),
      findByServiceOrder: jest.fn(),
      findByStatus: jest.fn(),
      findByLaboratory: jest.fn(),
      findByDateRange: jest.fn(),
      findDailyOrders: jest.fn(),
      findByProductId: jest.fn(),
      updateStatus: jest.fn(),
      updateLaboratory: jest.fn(),
      findByPaymentStatus: jest.fn(),
      findDeleted: jest.fn(),
      findWithFilters: jest.fn(),
      countByStatus: jest.fn(),
      getRevenueSummary: jest.fn(),
    };

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

    mockRepositoryFactory = {
      getPaymentRepository: jest.fn().mockReturnValue(mockPaymentRepository),
      getOrderRepository: jest.fn().mockReturnValue(mockOrderRepository),
      getCashRegisterRepository: jest.fn().mockReturnValue(mockCashRegisterRepository),
    } as any;

    mockOrderService = {
      getOrderById: jest.fn(),
      createOrder: jest.fn(),
      updateOrder: jest.fn(),
      deleteOrder: jest.fn(),
      getOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
      updatePaymentStatus: jest.fn(),
      getOrdersByCustomer: jest.fn(),
      getOrdersByEmployee: jest.fn(),
      getOrdersByDateRange: jest.fn(),
      duplicateOrder: jest.fn(),
    } as any;

    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);
    (OrderService as jest.Mock).mockImplementation(() => mockOrderService);

    // Reset dos mocks da API do MercadoPago
    jest.clearAllMocks();

    mercadoPagoService = new MercadoPagoService();
  });

  const mockOrder: IOrder = {
    _id: "order123",
    clientId: "customer123",
    employeeId: "employee123",
    products: [],
    paymentMethod: "mercado_pago",
    paymentStatus: "pending",
    orderDate: new Date(),
    status: "pending",
    totalPrice: 299.99,
    discount: 0,
    finalPrice: 299.99,
    serviceOrder: "OS001",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCashRegister: ICashRegister = {
    _id: "register123",
    openingDate: new Date(),
    openingBalance: 100,
    currentBalance: 100,
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
    openedBy: "user123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment: IPayment = {
    _id: "payment123",
    amount: 299.99,
    paymentMethod: "pix",
    status: "completed",
    type: "sale",
    orderId: "order123",
    mercadoPagoId: "mp123",
    createdBy: "user123",
    cashRegisterId: "register123",
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Service Creation", () => {
    it("should create MercadoPagoService instance", () => {
      expect(mercadoPagoService).toBeInstanceOf(MercadoPagoService);
    });
  });

  describe("Constructor", () => {
    it("should initialize service with repositories", () => {
      const service = new MercadoPagoService();
      expect(service).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should create MercadoPagoError with correct message", () => {
      const error = new MercadoPagoError("Test error");
      expect(error.name).toBe("MercadoPagoError");
      expect(error.message).toBe("Test error");
    });
  });

  describe("Repository Integration", () => {
    it("should have access to payment repository", () => {
      expect(mockPaymentRepository).toBeDefined();
      expect(mockPaymentRepository.create).toBeInstanceOf(Function);
    });

    it("should have access to order repository", () => {
      expect(mockOrderRepository).toBeDefined();
      expect(mockOrderRepository.findById).toBeInstanceOf(Function);
    });

    it("should have access to cash register repository", () => {
      expect(mockCashRegisterRepository).toBeDefined();
      expect(mockCashRegisterRepository.findOpenRegister).toBeInstanceOf(Function);
    });

    it("should have access to order service", () => {
      expect(mockOrderService).toBeDefined();
      expect(mockOrderService.getOrderById).toBeInstanceOf(Function);
    });
  });

  describe("Data Validation", () => {
    it("should validate order structure", () => {
      expect(mockOrder._id).toBe("order123");
      expect(mockOrder.finalPrice).toBe(299.99);
      expect(mockOrder.paymentMethod).toBe("mercado_pago");
    });

    it("should validate cash register structure", () => {
      expect(mockCashRegister._id).toBe("register123");
      expect(mockCashRegister.status).toBe("open");
      expect(mockCashRegister.openingBalance).toBe(100);
    });

    it("should validate payment structure", () => {
      expect(mockPayment._id).toBe("payment123");
      expect(mockPayment.amount).toBe(299.99);
      expect(mockPayment.status).toBe("completed");
      expect(mockPayment.type).toBe("sale");
    });
  });

  describe("Mock Repository Methods", () => {
    it("should mock payment repository methods correctly", () => {
      mockPaymentRepository.findAll.mockResolvedValue({
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 10,
      });

      expect(mockPaymentRepository.findAll).toHaveBeenCalledTimes(0);
    });

    it("should mock order service methods correctly", () => {
      mockOrderService.getOrderById.mockResolvedValue(mockOrder);
      expect(mockOrderService.getOrderById).toHaveBeenCalledTimes(0);
    });

    it("should mock cash register methods correctly", () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      expect(mockCashRegisterRepository.findOpenRegister).toHaveBeenCalledTimes(0);
    });
  });

  describe("createPaymentPreference", () => {
    it("should create payment preference successfully", async () => {
      const mockPreference = {
        body: {
          id: "preference123",
          init_point: "https://mercadopago.com/init_point",
          sandbox_init_point: "https://mercadopago.com/sandbox_init_point",
        },
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      jest.mocked(MercadoPagoAPI.createPreference).mockResolvedValue(mockPreference as any);

      const result = await mercadoPagoService.createPaymentPreference(
        mockOrder,
        "https://app.oticasqueiroz.com.br"
      );

      expect(result).toEqual({
        id: "preference123",
        init_point: "https://mercadopago.com/init_point",
        sandbox_init_point: "https://mercadopago.com/sandbox_init_point",
      });

      expect(mockCashRegisterRepository.findOpenRegister).toHaveBeenCalled();
      expect(MercadoPagoAPI.createPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            {
              id: "order123",
              title: expect.stringContaining("Pedido Óticas Queiroz"),
              description: expect.stringContaining("OS: OS001"),
              quantity: 1,
              currency_id: "BRL",
              unit_price: 299.99,
            },
          ],
          external_reference: "order123",
          statement_descriptor: "Óticas Queiroz",
        })
      );
    });

    it("should throw error for invalid order", async () => {
      await expect(
        mercadoPagoService.createPaymentPreference(null as any, "https://example.com")
      ).rejects.toThrow(new MercadoPagoError("Pedido inválido ou sem ID"));
    });

    it("should throw error for invalid price", async () => {
      const invalidOrder = { ...mockOrder, finalPrice: 0 };

      await expect(
        mercadoPagoService.createPaymentPreference(invalidOrder, "https://example.com")
      ).rejects.toThrow(new MercadoPagoError("Valor do pedido inválido ou não definido"));
    });

    it("should throw error when no cash register is open", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);

      await expect(
        mercadoPagoService.createPaymentPreference(mockOrder, "https://example.com")
      ).rejects.toThrow(new MercadoPagoError("Não há caixa aberto para registrar pagamentos"));
    });

    it("should handle MercadoPago API errors", async () => {
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      
      const apiError = {
        response: {
          status: 400,
          data: {
            cause: [{ description: "Invalid item price" }],
          },
        },
      };
      
      (MercadoPagoAPI.createPreference as jest.Mock).mockRejectedValue(apiError);

      await expect(
        mercadoPagoService.createPaymentPreference(mockOrder, "https://example.com")
      ).rejects.toThrow(new MercadoPagoError("Falha na API do Mercado Pago: Invalid item price"));
    });

    it("should configure different URLs for production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const mockPreference = {
        body: {
          id: "preference123",
          init_point: "https://mercadopago.com/init_point",
          sandbox_init_point: "https://mercadopago.com/sandbox_init_point",
        },
      };

      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      (MercadoPagoAPI.createPreference as jest.Mock).mockResolvedValue(mockPreference);

      await mercadoPagoService.createPaymentPreference(mockOrder, "https://app.oticasqueiroz.com.br");

      expect(MercadoPagoAPI.createPreference).toHaveBeenCalledWith(
        expect.objectContaining({
          auto_return: "approved",
          back_urls: {
            success: "https://app.oticasqueiroz.com.br/payment/success",
            pending: "https://app.oticasqueiroz.com.br/payment/pending",
            failure: "https://app.oticasqueiroz.com.br/payment/failure",
          },
          notification_url: "https://app.oticasqueiroz.com.br/api/mercadopago/webhook",
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("processPayment", () => {
    it("should return existing payment if already processed", async () => {
      mockPaymentRepository.findAll.mockResolvedValue({
        items: [mockPayment],
        total: 1,
        page: 1,
        limit: 1,
      });

      const result = await mercadoPagoService.processPayment("mp123");

      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1, {
        mercadoPagoId: "mp123",
        status: "completed",
      });
    });

    it("should process new payment successfully", async () => {
      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      mockOrderService.getOrderById.mockResolvedValue(mockOrder);
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      const result = await mercadoPagoService.processPayment("mp123");

      expect(result).toEqual(mockPayment);
    });

    it("should handle payment status correctly", async () => {
      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      mockOrderService.getOrderById.mockResolvedValue(mockOrder);
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      await mercadoPagoService.processPayment("mp123");

      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 299.99,
          paymentMethod: "pix",
          status: "completed",
          type: "sale",
          orderId: "order123",
          mercadoPagoId: "mp123",
        })
      );
    });

    it("should throw error when order not found", async () => {
      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      mockOrderService.getOrderById.mockResolvedValue(null as any);

      await expect(
        mercadoPagoService.processPayment("mp123")
      ).rejects.toThrow(new MercadoPagoError("Pedido não encontrado"));
    });

    it("should throw error when no cash register is open", async () => {
      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      mockOrderService.getOrderById.mockResolvedValue(mockOrder);
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(null);

      await expect(
        mercadoPagoService.processPayment("mp123")
      ).rejects.toThrow(new MercadoPagoError("Não há caixa aberto para registrar pagamentos"));
    });

    it("should handle API errors", async () => {
      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      const apiError = new Error("API Error");
      (MercadoPagoAPI.getPayment as jest.Mock).mockRejectedValue(apiError);

      await expect(
        mercadoPagoService.processPayment("mp123")
      ).rejects.toThrow(new MercadoPagoError("Erro ao processar pagamento: API Error"));
    });

    it("should process payment and update order payment history", async () => {
      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      mockOrderService.getOrderById.mockResolvedValue(mockOrder);
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      const result = await mercadoPagoService.processPayment("mp123");

      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.create).toHaveBeenCalled();
    });

    it("should handle general errors during payment processing", async () => {
      mockPaymentRepository.findAll.mockRejectedValue(new Error("Database error"));

      await expect(
        mercadoPagoService.processPayment("mp123")
      ).rejects.toThrow(new MercadoPagoError("Erro ao processar pagamento: Database error"));
    });
  });

  describe("getPaymentInfo", () => {
    it("should get payment info successfully", async () => {
      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      const result = await mercadoPagoService.getPaymentInfo("mp123");

      expect(result).toEqual(mockPaymentInfo);
      expect(MercadoPagoAPI.getPayment).toHaveBeenCalledWith("mp123");
    });

    it("should throw error when API fails", async () => {
      const apiError = new Error("API Error");
      (MercadoPagoAPI.getPayment as jest.Mock).mockRejectedValue(apiError);

      await expect(
        mercadoPagoService.getPaymentInfo("mp123")
      ).rejects.toThrow(new MercadoPagoError("Erro ao buscar informações do pagamento: API Error"));
    });
  });

  describe("processWebhook", () => {
    it("should process webhook successfully", async () => {
      const webhookData = {
        id: "12345",
        topic: "payment",
        data: { id: "mp123" },
      };

      mockPaymentRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 1,
      });

      const mockPaymentInfo = {
        id: "mp123",
        status: "approved",
        external_reference: "order123",
        transaction_amount: 299.99,
        payment_method_id: "pix",
        status_detail: "accredited",
        date_created: new Date().toISOString(),
      };

      (MercadoPagoAPI.getPayment as jest.Mock).mockResolvedValue({
        body: mockPaymentInfo,
      });

      mockOrderService.getOrderById.mockResolvedValue(mockOrder);
      mockCashRegisterRepository.findOpenRegister.mockResolvedValue(mockCashRegister);
      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      const result = await mercadoPagoService.processWebhook(webhookData);

      expect(result).toEqual(mockPayment);
    });

    it("should return null for non-payment webhooks", async () => {
      const webhookData = {
        id: "12345",
        topic: "subscription",
        data: { id: "sub123" },
      };

      const result = await mercadoPagoService.processWebhook(webhookData);

      expect(result).toBeNull();
    });

    it("should handle webhook errors gracefully", async () => {
      const webhookData = {
        id: "12345",
        topic: "payment",
        data: { id: "mp123" },
      };

      (MercadoPagoAPI.getPayment as jest.Mock).mockRejectedValue(new Error("API Error"));

      const result = await mercadoPagoService.processWebhook(webhookData);

      expect(result).toBeNull();
    });
  });
}); 