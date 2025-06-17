import { PaymentCalculationService } from "../../../services/PaymentCalculationService";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock completo do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: jest.fn()
}));

describe("PaymentCalculationService", () => {
  let service: PaymentCalculationService;
  let mockUserRepository: any;
  let mockLegacyClientRepository: any;
  let mockPaymentRepository: any;
  let mockOrderRepository: any;

  beforeEach(() => {
    // Resetar todos os mocks
    jest.resetAllMocks();
    
    // Criar mocks frescos para cada teste
    mockUserRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      findByOrderServiceNumber: jest.fn(),
      findByRole: jest.fn(),
      updatePassword: jest.fn(),
      findByEmailOrCpf: jest.fn()
    };

    mockLegacyClientRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findByName: jest.fn(),
      findByPhone: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn()
    };

    mockPaymentRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByOrderId: jest.fn(),
      findByClientId: jest.fn(),
      findByCashRegisterId: jest.fn(),
      findByDateRange: jest.fn(),
      findByPaymentMethod: jest.fn(),
      updateStatus: jest.fn(),
      findByType: jest.fn()
    };

    mockOrderRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByClientId: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      findByEmployeeId: jest.fn(),
      updateStatus: jest.fn(),
      addPayment: jest.fn(),
      findByOrderNumber: jest.fn(),
      findByType: jest.fn()
    };

    // Mock do getRepositories
    (getRepositories as jest.MockedFunction<typeof getRepositories>).mockReturnValue({
      userRepository: mockUserRepository,
      legacyClientRepository: mockLegacyClientRepository,
      paymentRepository: mockPaymentRepository,
      orderRepository: mockOrderRepository,
      productRepository: {} as any,
      cashRegisterRepository: {} as any,
      laboratoryRepository: {} as any,
      counterRepository: {} as any,
      passwordResetRepository: {} as any
    });

    service = new PaymentCalculationService();
  });

  describe("constructor", () => {
    it("deve inicializar os repositórios corretamente", () => {
      expect(service).toBeInstanceOf(PaymentCalculationService);
      expect(getRepositories).toHaveBeenCalled();
    });
  });

  describe("calculateClientTotalDebt", () => {
    it("deve calcular débito total de um cliente corretamente", async () => {
      const clientId = "client123";
      const mockClient = {
        _id: clientId,
        name: "João Silva",
        email: "joao@email.com",
        role: "customer",
        debts: 0
      };

      const mockOrders = [
        {
          _id: "order1",
          clientId,
          finalPrice: 1000,
          status: "pending",
          paymentHistory: [
            { paymentId: "pay1", amount: 200, date: new Date(), method: "cash" }
          ]
        },
        {
          _id: "order2",
          clientId,
          finalPrice: 500,
          status: "pending",
          paymentHistory: [
            { paymentId: "pay2", amount: 100, date: new Date(), method: "pix" }
          ]
        }
      ];

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockClient));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve(mockOrders));

      const result = await service.calculateClientTotalDebt(clientId);

      expect(result).toBe(1200); // (1000 - 200) + (500 - 100)
      expect(mockUserRepository.findById).toHaveBeenCalledWith(clientId);
      expect(mockOrderRepository.findByClientId).toHaveBeenCalledWith(clientId);
    });

    it("deve retornar 0 se cliente não existir", async () => {
      const clientId = "nonexistent";
      mockUserRepository.findById.mockImplementation(() => Promise.resolve(null));

      const result = await service.calculateClientTotalDebt(clientId);

      expect(result).toBe(0);
    });

    it("deve ignorar pedidos cancelados", async () => {
      const clientId = "client123";
      const mockClient = { _id: clientId, name: "João Silva", role: "customer" };
      const mockOrders = [
        {
          _id: "order1",
          clientId,
          finalPrice: 1000,
          status: "pending",
          paymentHistory: [{ paymentId: "pay1", amount: 200, date: new Date(), method: "cash" }]
        },
        {
          _id: "order2",
          clientId,
          finalPrice: 500,
          status: "cancelled",
          paymentHistory: []
        }
      ];

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockClient));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve(mockOrders));

      const result = await service.calculateClientTotalDebt(clientId);

      expect(result).toBe(800); // Apenas 1000 - 200 do pedido ativo
    });

    it("deve lidar com pedidos sem paymentHistory", async () => {
      const clientId = "client123";
      const mockClient = { _id: clientId, name: "João Silva", role: "customer" };
      const mockOrders = [
        {
          _id: "order1",
          clientId,
          finalPrice: 1000,
          status: "pending",
          paymentHistory: null
        }
      ];

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockClient));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve(mockOrders));

      const result = await service.calculateClientTotalDebt(clientId);

      expect(result).toBe(1000); // Valor total sem pagamentos
    });

    it("deve não contar pedidos totalmente pagos", async () => {
      const clientId = "client123";
      const mockClient = { _id: clientId, name: "João Silva", role: "customer" };
      const mockOrders = [
        {
          _id: "order1",
          clientId,
          finalPrice: 1000,
          status: "pending",
          paymentHistory: [{ paymentId: "pay1", amount: 1000, date: new Date(), method: "cash" }]
        }
      ];

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockClient));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve(mockOrders));

      const result = await service.calculateClientTotalDebt(clientId);

      expect(result).toBe(0); // Pedido totalmente pago
    });

    it("deve retornar 0 em caso de erro", async () => {
      const clientId = "client123";
      mockUserRepository.findById.mockImplementation(() => Promise.reject(new Error("Erro no BD")));

      const result = await service.calculateClientTotalDebt(clientId);

      expect(result).toBe(0);
    });
  });

  describe("recalculateClientDebts", () => {
    it("deve recalcular débito de um cliente específico", async () => {
      const clientId = "client123";
      const mockClient = {
        _id: clientId,
        name: "João Silva",
        role: "customer",
        debts: 500
      };

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockClient));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve([]));
      mockUserRepository.update.mockImplementation(() => Promise.resolve(mockClient));

      const result = await service.recalculateClientDebts(clientId);

      expect(result.updated).toBe(1);
      expect(result.clients).toHaveLength(1);
      expect(result.clients[0]).toEqual({
        id: clientId,
        oldDebt: 500,
        newDebt: 0,
        diff: -500
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(clientId, { debts: 0 });
    });

    it("deve recalcular débitos de todos os clientes", async () => {
      const mockClients = [
        { _id: "client1", name: "João", role: "customer", debts: 500 },
        { _id: "client2", name: "Maria", role: "customer", debts: 300 }
      ];

      mockUserRepository.findAll.mockImplementation(() => Promise.resolve({
        items: mockClients,
        total: 2,
        page: 1,
        limit: 1000
      }));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve([]));
      mockUserRepository.update.mockImplementation(() => Promise.resolve({}));

      const result = await service.recalculateClientDebts();

      expect(result.updated).toBe(2);
      expect(result.clients).toHaveLength(2);
      expect(mockUserRepository.update).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(1, 1000, { role: 'customer' });
    });

    it("deve não atualizar se não houver diferença", async () => {
      const clientId = "client123";
      const mockClient = {
        _id: clientId,
        name: "João Silva",
        role: "customer",
        debts: 0
      };

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockClient));
      mockOrderRepository.findByClientId.mockImplementation(() => Promise.resolve([]));

      const result = await service.recalculateClientDebts(clientId);

      expect(result.updated).toBe(0);
      expect(result.clients).toHaveLength(0);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve lançar erro se cliente específico não existir", async () => {
      const clientId = "nonexistent";
      mockUserRepository.findById.mockImplementation(() => Promise.resolve(null));

      await expect(service.recalculateClientDebts(clientId))
        .rejects.toThrow("Cliente não encontrado");
    });

    it("deve lançar erro em caso de falha geral", async () => {
      mockUserRepository.findAll.mockImplementation(() => Promise.reject(new Error("Erro no BD")));

      await expect(service.recalculateClientDebts())
        .rejects.toThrow("Erro no BD");
    });
  });

  describe("updateClientDebt", () => {
    it("deve atualizar débito de cliente normal", async () => {
      const customerId = "customer123";
      const mockUser = {
        _id: customerId,
        name: "João Silva",
        role: "customer",
        debts: 100
      };

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockUser));
      mockUserRepository.update.mockImplementation(() => Promise.resolve(mockUser));

      await service.updateClientDebt(customerId, undefined, 50);

      expect(mockUserRepository.update).toHaveBeenCalledWith(customerId, {
        debts: 150
      });
    });

    it("deve atualizar débito de cliente legado", async () => {
      const legacyClientId = "legacy123";
      const mockLegacyClient = {
        _id: legacyClientId,
        name: "Cliente Legado",
        totalDebt: 200
      };

      mockLegacyClientRepository.findById.mockImplementation(() => Promise.resolve(mockLegacyClient));
      mockLegacyClientRepository.update.mockImplementation(() => Promise.resolve(mockLegacyClient));

      await service.updateClientDebt(undefined, legacyClientId, 75);

      expect(mockLegacyClientRepository.update).toHaveBeenCalledWith(legacyClientId, {
        totalDebt: 275
      });
    });

    it("deve lidar com cliente normal sem débito anterior", async () => {
      const customerId = "customer123";
      const mockUser = {
        _id: customerId,
        name: "João Silva",
        role: "customer"
        // sem debts definido
      };

      mockUserRepository.findById.mockImplementation(() => Promise.resolve(mockUser));
      mockUserRepository.update.mockImplementation(() => Promise.resolve(mockUser));

      await service.updateClientDebt(customerId, undefined, 50);

      expect(mockUserRepository.update).toHaveBeenCalledWith(customerId, {
        debts: 50
      });
    });

    it("deve lidar com cliente legado sem débito anterior", async () => {
      const legacyClientId = "legacy123";
      const mockLegacyClient = {
        _id: legacyClientId,
        name: "Cliente Legado"
        // sem totalDebt definido
      };

      mockLegacyClientRepository.findById.mockImplementation(() => Promise.resolve(mockLegacyClient));
      mockLegacyClientRepository.update.mockImplementation(() => Promise.resolve(mockLegacyClient));

      await service.updateClientDebt(undefined, legacyClientId, 75);

      expect(mockLegacyClientRepository.update).toHaveBeenCalledWith(legacyClientId, {
        totalDebt: 75
      });
    });

    it("deve não fazer nada se valor for 0", async () => {
      await service.updateClientDebt("customer123", undefined, 0);

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve não fazer nada se valor for negativo", async () => {
      await service.updateClientDebt("customer123", undefined, -10);

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve não fazer nada se valor não for fornecido", async () => {
      await service.updateClientDebt("customer123", undefined, undefined);

      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve não fazer nada se cliente normal não existir", async () => {
      const customerId = "nonexistent";
      mockUserRepository.findById.mockImplementation(() => Promise.resolve(null));

      await service.updateClientDebt(customerId, undefined, 50);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(customerId);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve não fazer nada se cliente legado não existir", async () => {
      const legacyClientId = "nonexistent";
      mockLegacyClientRepository.findById.mockImplementation(() => Promise.resolve(null));

      await service.updateClientDebt(undefined, legacyClientId, 50);

      expect(mockLegacyClientRepository.findById).toHaveBeenCalledWith(legacyClientId);
      expect(mockLegacyClientRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("calculatePaymentStatusSummary", () => {
    it("deve calcular resumo de status de pagamento corretamente", async () => {
      const orderId = "order123";
      const mockPayments = [
        {
          _id: "payment1",
          amount: 500,
          status: "completed",
          type: "sale",
          paymentMethod: "cash"
        },
        {
          _id: "payment2",
          amount: 300,
          status: "pending",
          type: "sale",
          paymentMethod: "pix"
        }
      ];

      mockPaymentRepository.findAll.mockImplementation(() => Promise.resolve({
        items: mockPayments,
        total: 2,
        page: 1,
        limit: 1000
      }));

      const result = await service.calculatePaymentStatusSummary(orderId);

      expect(result).toEqual({
        totalAmount: 800,
        paidAmount: 500,
        pendingAmount: 300,
        status: "partial",
        payments: mockPayments
      });
      expect(mockPaymentRepository.findAll).toHaveBeenCalledWith(1, 1000, { orderId });
    });

    it("deve retornar status 'paid' quando totalmente pago", async () => {
      const orderId = "order123";
      const mockPayments = [
        {
          _id: "payment1",
          amount: 500,
          status: "completed",
          type: "sale",
          paymentMethod: "cash"
        }
      ];

      mockPaymentRepository.findAll.mockImplementation(() => Promise.resolve({
        items: mockPayments,
        total: 1,
        page: 1,
        limit: 1000
      }));

      const result = await service.calculatePaymentStatusSummary(orderId);

      expect(result.status).toBe("paid");
      expect(result.totalAmount).toBe(500);
      expect(result.paidAmount).toBe(500);
      expect(result.pendingAmount).toBe(0);
    });

    it("deve retornar status 'pending' quando nada foi pago", async () => {
      const orderId = "order123";
      const mockPayments = [
        {
          _id: "payment1",
          amount: 500,
          status: "pending",
          type: "sale",
          paymentMethod: "cash"
        }
      ];

      mockPaymentRepository.findAll.mockImplementation(() => Promise.resolve({
        items: mockPayments,
        total: 1,
        page: 1,
        limit: 1000
      }));

      const result = await service.calculatePaymentStatusSummary(orderId);

      expect(result.status).toBe("pending");
      expect(result.totalAmount).toBe(500);
      expect(result.paidAmount).toBe(0);
      expect(result.pendingAmount).toBe(500);
    });

    it("deve lidar com lista vazia de pagamentos", async () => {
      const orderId = "order123";
      mockPaymentRepository.findAll.mockImplementation(() => Promise.resolve({
        items: [],
        total: 0,
        page: 1,
        limit: 1000
      }));

      const result = await service.calculatePaymentStatusSummary(orderId);

      expect(result).toEqual({
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: "pending",
        payments: []
      });
    });
  });

  describe("calculatePaymentMethodTotals", () => {
    it("deve calcular totais para todos os métodos de pagamento", () => {
      const payments = [
        { paymentMethod: "cash", amount: 500 },
        { paymentMethod: "credit", amount: 300 },
        { paymentMethod: "debit", amount: 200 },
        { paymentMethod: "pix", amount: 150 },
        { paymentMethod: "check", amount: 100 },
        { paymentMethod: "bank_slip", amount: 75 },
        { paymentMethod: "promissory_note", amount: 50 }
      ] as any;

      const result = service.calculatePaymentMethodTotals(payments);

      expect(result).toEqual({
        totalByCash: 500,
        totalByCreditCard: 300,
        totalByDebitCard: 200,
        totalByPix: 150,
        totalByCheck: 100,
        totalByBankSlip: 75,
        totalByPromissoryNote: 50
      });
    });

    it("deve retornar zeros para array vazio", () => {
      const result = service.calculatePaymentMethodTotals([]);

      expect(result).toEqual({
        totalByCash: 0,
        totalByCreditCard: 0,
        totalByDebitCard: 0,
        totalByPix: 0,
        totalByCheck: 0,
        totalByBankSlip: 0,
        totalByPromissoryNote: 0
      });
    });

    it("deve lidar com métodos desconhecidos", () => {
      const payments = [
        { paymentMethod: "unknown", amount: 100 },
        { paymentMethod: "cash", amount: 50 }
      ] as any;

      const result = service.calculatePaymentMethodTotals(payments);

      expect(result.totalByCash).toBe(50);
      expect(result.totalByCreditCard).toBe(0);
      expect(result.totalByDebitCard).toBe(0);
      expect(result.totalByPix).toBe(0);
      expect(result.totalByCheck).toBe(0);
      expect(result.totalByBankSlip).toBe(0);
      expect(result.totalByPromissoryNote).toBe(0);
    });

    it("deve somar múltiplos pagamentos do mesmo método", () => {
      const payments = [
        { paymentMethod: "cash", amount: 100 },
        { paymentMethod: "cash", amount: 200 },
        { paymentMethod: "pix", amount: 50 },
        { paymentMethod: "pix", amount: 25 }
      ] as any;

      const result = service.calculatePaymentMethodTotals(payments);

      expect(result.totalByCash).toBe(300);
      expect(result.totalByPix).toBe(75);
    });
  });

  describe("calculatePaymentTypeTotals", () => {
    it("deve calcular totais para todos os tipos de pagamento", () => {
      const payments = [
        { type: "sale", amount: 500 },
        { type: "debt_payment", amount: 300 },
        { type: "expense", amount: 200 }
      ] as any;

      const result = service.calculatePaymentTypeTotals(payments);

      expect(result).toEqual({
        totalSales: 500,
        totalDebtPayments: 300,
        totalExpenses: 200
      });
    });

    it("deve retornar zeros para array vazio", () => {
      const result = service.calculatePaymentTypeTotals([]);

      expect(result).toEqual({
        totalSales: 0,
        totalDebtPayments: 0,
        totalExpenses: 0
      });
    });

    it("deve lidar com tipos desconhecidos", () => {
      const payments = [
        { type: "unknown", amount: 100 },
        { type: "sale", amount: 50 }
      ] as any;

      const result = service.calculatePaymentTypeTotals(payments);

      expect(result.totalSales).toBe(50);
      expect(result.totalDebtPayments).toBe(0);
      expect(result.totalExpenses).toBe(0);
    });

    it("deve somar múltiplos pagamentos do mesmo tipo", () => {
      const payments = [
        { type: "sale", amount: 100 },
        { type: "sale", amount: 200 },
        { type: "debt_payment", amount: 50 },
        { type: "debt_payment", amount: 25 }
      ] as any;

      const result = service.calculatePaymentTypeTotals(payments);

      expect(result.totalSales).toBe(300);
      expect(result.totalDebtPayments).toBe(75);
      expect(result.totalExpenses).toBe(0);
    });
  });
});