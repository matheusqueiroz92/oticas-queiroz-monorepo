import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { OrderRelationshipService } from "../../../services/OrderRelationshipService";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import { IOrder } from "../../../interfaces/IOrder";

// Mock do RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: jest.fn(),
}));

describe("OrderRelationshipService", () => {
  let orderRelationshipService: OrderRelationshipService;
  let mockUserRepository: any;
  let mockLegacyClientRepository: any;

  const mockEmployee = {
    _id: "employee123",
    name: "João Silva",
    role: "employee",
    sales: ["order1", "order2"],
    email: "joao@email.com",
  };

  const mockCustomer = {
    _id: "customer123",
    name: "Maria Santos",
    role: "customer",
    purchases: ["order1"],
    debts: 100,
    email: "maria@email.com",
  };

  const mockLegacyClient = {
    _id: "legacy123",
    name: "Cliente Legado",
    totalDebt: 200,
    phone: "11999999999",
  };

  const mockOrder: Omit<IOrder, "_id"> = {
    clientId: "customer123",
    employeeId: "employee123",
    products: [],
    paymentMethod: "cash",
    paymentStatus: "pending",
    status: "pending",
    orderDate: new Date(),
    totalPrice: 150,
    discount: 10,
    paymentEntry: 50,
    finalPrice: 140,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderWithId: IOrder = {
    ...mockOrder,
    _id: "order123",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    mockLegacyClientRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    (getRepositories as jest.Mock).mockReturnValue({
      userRepository: mockUserRepository,
      legacyClientRepository: mockLegacyClientRepository,
    });

    orderRelationshipService = new OrderRelationshipService();
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(orderRelationshipService).toBeInstanceOf(OrderRelationshipService);
    });
  });

  describe("updateEmployeeSales", () => {
    it("deve adicionar pedido às vendas do funcionário", async () => {
      mockUserRepository.findById.mockResolvedValue(mockEmployee);
      mockUserRepository.update.mockResolvedValue({ ...mockEmployee, sales: [...mockEmployee.sales, "order123"] });

      await orderRelationshipService.updateEmployeeSales("employee123", "order123");

      expect(mockUserRepository.findById).toHaveBeenCalledWith("employee123");
      expect(mockUserRepository.update).toHaveBeenCalledWith("employee123", {
        sales: ["order1", "order2", "order123"],
      });
    });

    it("não deve adicionar pedido duplicado", async () => {
      const employeeWithOrder = { ...mockEmployee, sales: ["order1", "order2", "order123"] };
      mockUserRepository.findById.mockResolvedValue(employeeWithOrder);

      await orderRelationshipService.updateEmployeeSales("employee123", "order123");

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve inicializar array de vendas se não existir", async () => {
      const employeeWithoutSales = { ...mockEmployee, sales: undefined };
      mockUserRepository.findById.mockResolvedValue(employeeWithoutSales);
      mockUserRepository.update.mockResolvedValue({ ...employeeWithoutSales, sales: ["order123"] });

      await orderRelationshipService.updateEmployeeSales("employee123", "order123");

      expect(mockUserRepository.update).toHaveBeenCalledWith("employee123", {
        sales: ["order123"],
      });
    });

    it("deve lançar erro se funcionário não for encontrado", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        orderRelationshipService.updateEmployeeSales("nonexistent", "order123")
      ).rejects.toThrow("Funcionário não encontrado");
    });
  });

  describe("updateCustomerPurchases", () => {
    it("deve adicionar pedido às compras do cliente", async () => {
      mockUserRepository.findById.mockResolvedValue(mockCustomer);
      mockUserRepository.update.mockResolvedValue({ ...mockCustomer, purchases: [...mockCustomer.purchases, "order123"] });

      await orderRelationshipService.updateCustomerPurchases("customer123", "order123");

      expect(mockUserRepository.findById).toHaveBeenCalledWith("customer123");
      expect(mockUserRepository.update).toHaveBeenCalledWith("customer123", {
        purchases: ["order1", "order123"],
      });
    });

    it("não deve adicionar pedido duplicado", async () => {
      const customerWithOrder = { ...mockCustomer, purchases: ["order1", "order123"] };
      mockUserRepository.findById.mockResolvedValue(customerWithOrder);

      await orderRelationshipService.updateCustomerPurchases("customer123", "order123");

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve inicializar array de compras se não existir", async () => {
      const customerWithoutPurchases = { ...mockCustomer, purchases: undefined };
      mockUserRepository.findById.mockResolvedValue(customerWithoutPurchases);
      mockUserRepository.update.mockResolvedValue({ ...customerWithoutPurchases, purchases: ["order123"] });

      await orderRelationshipService.updateCustomerPurchases("customer123", "order123");

      expect(mockUserRepository.update).toHaveBeenCalledWith("customer123", {
        purchases: ["order123"],
      });
    });

    it("deve lançar erro se cliente não for encontrado", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        orderRelationshipService.updateCustomerPurchases("nonexistent", "order123")
      ).rejects.toThrow("Cliente não encontrado");
    });
  });

  describe("updateCustomerDebts", () => {
    it("deve atualizar débito do cliente regular", async () => {
      const orderWithDebt = { ...mockOrder, totalPrice: 150, discount: 10, paymentEntry: 50 };
      const expectedDebt = 100 + (150 - 10 - 50); // débito atual + (total - desconto - entrada)
      
      mockUserRepository.findById.mockResolvedValue(mockCustomer);
      mockUserRepository.update.mockResolvedValue({ ...mockCustomer, debts: expectedDebt });

      await orderRelationshipService.updateCustomerDebts("customer123", orderWithDebt);

      expect(mockUserRepository.findById).toHaveBeenCalledWith("customer123");
      expect(mockUserRepository.update).toHaveBeenCalledWith("customer123", {
        debts: expectedDebt,
      });
    });

    it("deve atualizar débito do cliente legado", async () => {
      const orderWithDebt = { ...mockOrder, totalPrice: 150, discount: 10, paymentEntry: 50 };
      const expectedDebt = 200 + (150 - 10 - 50); // débito atual + (total - desconto - entrada)
      
      mockUserRepository.findById.mockResolvedValue(null);
      mockLegacyClientRepository.findById.mockResolvedValue(mockLegacyClient);
      mockLegacyClientRepository.update.mockResolvedValue({ ...mockLegacyClient, totalDebt: expectedDebt });

      await orderRelationshipService.updateCustomerDebts("legacy123", orderWithDebt);

      expect(mockLegacyClientRepository.findById).toHaveBeenCalledWith("legacy123");
      expect(mockLegacyClientRepository.update).toHaveBeenCalledWith("legacy123", {
        totalDebt: expectedDebt,
      });
    });

    it("deve usar responsibleClientId se especificado", async () => {
      const orderWithResponsible = { 
        ...mockOrder, 
        responsibleClientId: "responsible123",
        totalPrice: 150, 
        discount: 10, 
        paymentEntry: 50 
      };
      const responsibleClient = { ...mockCustomer, _id: "responsible123", debts: 50 };
      const expectedDebt = 50 + (150 - 10 - 50);
      
      mockUserRepository.findById.mockResolvedValue(responsibleClient);
      mockUserRepository.update.mockResolvedValue({ ...responsibleClient, debts: expectedDebt });

      await orderRelationshipService.updateCustomerDebts("customer123", orderWithResponsible);

      expect(mockUserRepository.findById).toHaveBeenCalledWith("responsible123");
      expect(mockUserRepository.update).toHaveBeenCalledWith("responsible123", {
        debts: expectedDebt,
      });
    });

    it("não deve atualizar débito se valor restante for zero", async () => {
      const orderPaidInFull = { ...mockOrder, totalPrice: 150, discount: 10, paymentEntry: 140 };
      
      await orderRelationshipService.updateCustomerDebts("customer123", orderPaidInFull);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockLegacyClientRepository.update).not.toHaveBeenCalled();
    });

    it("deve lidar com cliente não encontrado", async () => {
      const orderWithDebt = { ...mockOrder, totalPrice: 150, discount: 10, paymentEntry: 50 };
      
      mockUserRepository.findById.mockResolvedValue(null);
      mockLegacyClientRepository.findById.mockResolvedValue(null);

      await orderRelationshipService.updateCustomerDebts("nonexistent", orderWithDebt);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockLegacyClientRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("removeOrderFromEmployeeSales", () => {
    it("deve remover pedido das vendas do funcionário", async () => {
      mockUserRepository.findById.mockResolvedValue(mockEmployee);
      mockUserRepository.update.mockResolvedValue({ ...mockEmployee, sales: ["order2"] });

      await orderRelationshipService.removeOrderFromEmployeeSales("employee123", "order1");

      expect(mockUserRepository.update).toHaveBeenCalledWith("employee123", {
        sales: ["order2"],
      });
    });

    it("deve lidar com funcionário sem vendas", async () => {
      const employeeWithoutSales = { ...mockEmployee, sales: undefined };
      mockUserRepository.findById.mockResolvedValue(employeeWithoutSales);

      await orderRelationshipService.removeOrderFromEmployeeSales("employee123", "order1");

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve lidar com funcionário não encontrado", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await orderRelationshipService.removeOrderFromEmployeeSales("nonexistent", "order1");

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("removeOrderFromCustomerPurchases", () => {
    it("deve remover pedido das compras do cliente", async () => {
      mockUserRepository.findById.mockResolvedValue(mockCustomer);
      mockUserRepository.update.mockResolvedValue({ ...mockCustomer, purchases: [] });

      await orderRelationshipService.removeOrderFromCustomerPurchases("customer123", "order1");

      expect(mockUserRepository.update).toHaveBeenCalledWith("customer123", {
        purchases: [],
      });
    });

    it("deve lidar com cliente sem compras", async () => {
      const customerWithoutPurchases = { ...mockCustomer, purchases: undefined };
      mockUserRepository.findById.mockResolvedValue(customerWithoutPurchases);

      await orderRelationshipService.removeOrderFromCustomerPurchases("customer123", "order1");

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it("deve lidar com cliente não encontrado", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await orderRelationshipService.removeOrderFromCustomerPurchases("nonexistent", "order1");

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("revertCustomerDebts", () => {
    it("deve reverter débito do cliente regular", async () => {
      const orderToRevert = { ...mockOrderWithId, totalPrice: 150, discount: 10, paymentEntry: 50 };
      const expectedDebt = Math.max(0, 100 - (150 - 10 - 50)); // débito atual - (total - desconto - entrada)
      
      mockUserRepository.findById.mockResolvedValue(mockCustomer);
      mockUserRepository.update.mockResolvedValue({ ...mockCustomer, debts: expectedDebt });

      await orderRelationshipService.revertCustomerDebts("customer123", orderToRevert);

      expect(mockUserRepository.update).toHaveBeenCalledWith("customer123", {
        debts: expectedDebt,
      });
    });

    it("deve reverter débito do cliente legado", async () => {
      const orderToRevert = { ...mockOrderWithId, totalPrice: 150, discount: 10, paymentEntry: 50 };
      const expectedDebt = Math.max(0, 200 - (150 - 10 - 50));
      
      mockUserRepository.findById.mockResolvedValue(null);
      mockLegacyClientRepository.findById.mockResolvedValue(mockLegacyClient);
      mockLegacyClientRepository.update.mockResolvedValue({ ...mockLegacyClient, totalDebt: expectedDebt });

      await orderRelationshipService.revertCustomerDebts("legacy123", orderToRevert);

      expect(mockLegacyClientRepository.update).toHaveBeenCalledWith("legacy123", {
        totalDebt: expectedDebt,
      });
    });

    it("deve garantir que débito não fique negativo", async () => {
      const orderToRevert = { ...mockOrderWithId, totalPrice: 200, discount: 0, paymentEntry: 0 }; // Valor maior que o débito atual
      const customerWithSmallDebt = { ...mockCustomer, debts: 50 };
      
      mockUserRepository.findById.mockResolvedValue(customerWithSmallDebt);
      mockUserRepository.update.mockResolvedValue({ ...customerWithSmallDebt, debts: 0 });

      await orderRelationshipService.revertCustomerDebts("customer123", orderToRevert);

      expect(mockUserRepository.update).toHaveBeenCalledWith("customer123", {
        debts: 0, // Deve ser 0, não negativo
      });
    });
  });

  describe("updateOrderRelationships", () => {
    it("deve atualizar todos os relacionamentos", async () => {
      const spy1 = jest.spyOn(orderRelationshipService, 'updateEmployeeSales').mockResolvedValue();
      const spy2 = jest.spyOn(orderRelationshipService, 'updateCustomerPurchases').mockResolvedValue();
      const spy3 = jest.spyOn(orderRelationshipService, 'updateCustomerDebts').mockResolvedValue();

      await orderRelationshipService.updateOrderRelationships(mockOrder, "order123");

      expect(spy1).toHaveBeenCalledWith("employee123", "order123");
      expect(spy2).toHaveBeenCalledWith("customer123", "order123");
      expect(spy3).toHaveBeenCalledWith("customer123", mockOrder);

      spy1.mockRestore();
      spy2.mockRestore();
      spy3.mockRestore();
    });

    it("deve lidar com IDs como ObjectId", async () => {
      const orderWithObjectIds = {
        ...mockOrder,
        employeeId: { toString: () => "employee123" } as any,
        clientId: { toString: () => "customer123" } as any,
      };

      const spy1 = jest.spyOn(orderRelationshipService, 'updateEmployeeSales').mockResolvedValue();
      const spy2 = jest.spyOn(orderRelationshipService, 'updateCustomerPurchases').mockResolvedValue();
      const spy3 = jest.spyOn(orderRelationshipService, 'updateCustomerDebts').mockResolvedValue();

      await orderRelationshipService.updateOrderRelationships(orderWithObjectIds, "order123");

      expect(spy1).toHaveBeenCalledWith("employee123", "order123");
      expect(spy2).toHaveBeenCalledWith("customer123", "order123");
      expect(spy3).toHaveBeenCalledWith("customer123", orderWithObjectIds);

      spy1.mockRestore();
      spy2.mockRestore();
      spy3.mockRestore();
    });
  });

  describe("removeOrderRelationships", () => {
    it("deve remover todos os relacionamentos", async () => {
      const spy1 = jest.spyOn(orderRelationshipService, 'removeOrderFromEmployeeSales').mockResolvedValue();
      const spy2 = jest.spyOn(orderRelationshipService, 'removeOrderFromCustomerPurchases').mockResolvedValue();
      const spy3 = jest.spyOn(orderRelationshipService, 'revertCustomerDebts').mockResolvedValue();

      await orderRelationshipService.removeOrderRelationships(mockOrderWithId);

      expect(spy1).toHaveBeenCalledWith("employee123", "order123");
      expect(spy2).toHaveBeenCalledWith("customer123", "order123");
      expect(spy3).toHaveBeenCalledWith("customer123", mockOrderWithId);

      spy1.mockRestore();
      spy2.mockRestore();
      spy3.mockRestore();
    });
  });

  describe("recalculateClientDebt", () => {
    it("deve retornar débito do cliente regular", async () => {
      mockUserRepository.findById.mockResolvedValue(mockCustomer);

      const result = await orderRelationshipService.recalculateClientDebt("customer123");

      expect(result).toBe(100);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("customer123");
    });

    it("deve retornar débito do cliente legado", async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      mockLegacyClientRepository.findById.mockResolvedValue(mockLegacyClient);

      const result = await orderRelationshipService.recalculateClientDebt("legacy123");

      expect(result).toBe(200);
      expect(mockLegacyClientRepository.findById).toHaveBeenCalledWith("legacy123");
    });

    it("deve retornar 0 se cliente não for encontrado", async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      mockLegacyClientRepository.findById.mockResolvedValue(null);

      const result = await orderRelationshipService.recalculateClientDebt("nonexistent");

      expect(result).toBe(0);
    });

    it("deve retornar 0 se cliente regular não tem débitos", async () => {
      const customerWithoutDebts = { ...mockCustomer, debts: undefined };
      mockUserRepository.findById.mockResolvedValue(customerWithoutDebts);

      const result = await orderRelationshipService.recalculateClientDebt("customer123");

      expect(result).toBe(0);
    });

    it("deve retornar 0 se cliente legado não tem débitos", async () => {
      const legacyClientWithoutDebts = { ...mockLegacyClient, totalDebt: undefined };
      mockUserRepository.findById.mockResolvedValue(null);
      mockLegacyClientRepository.findById.mockResolvedValue(legacyClientWithoutDebts);

      const result = await orderRelationshipService.recalculateClientDebt("legacy123");

      expect(result).toBe(0);
    });
  });

  describe("transferDebt", () => {
    it("deve transferir débito entre clientes", async () => {
      const fromClient = { ...mockCustomer, _id: "client1", debts: 100 };
      const toClient = { ...mockCustomer, _id: "client2", debts: 50 };
      
      mockUserRepository.findById
        .mockResolvedValueOnce(fromClient)
        .mockResolvedValueOnce(toClient);
      mockUserRepository.update.mockResolvedValue({});

      await orderRelationshipService.transferDebt("client1", "client2", 30);

      expect(mockUserRepository.findById).toHaveBeenCalledWith("client1");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("client2");
      expect(mockUserRepository.update).toHaveBeenCalledWith("client1", { debts: 70 });
      expect(mockUserRepository.update).toHaveBeenCalledWith("client2", { debts: 80 });
    });

    it("deve lançar erro se valor for zero ou negativo", async () => {
      await expect(
        orderRelationshipService.transferDebt("client1", "client2", 0)
      ).rejects.toThrow("Valor de transferência deve ser positivo");

      await expect(
        orderRelationshipService.transferDebt("client1", "client2", -10)
      ).rejects.toThrow("Valor de transferência deve ser positivo");
    });

    it("deve lançar erro se cliente de origem não existir", async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCustomer);

      await expect(
        orderRelationshipService.transferDebt("nonexistent", "client2", 30)
      ).rejects.toThrow("Cliente de origem não encontrado");
    });

    it("deve lançar erro se cliente de destino não existir", async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce(null);

      await expect(
        orderRelationshipService.transferDebt("client1", "nonexistent", 30)
      ).rejects.toThrow("Cliente de destino não encontrado");
    });

    it("deve lançar erro se cliente de origem não tem débito suficiente", async () => {
      const fromClient = { ...mockCustomer, _id: "client1", debts: 20 };
      const toClient = { ...mockCustomer, _id: "client2", debts: 50 };
      
      mockUserRepository.findById
        .mockResolvedValueOnce(fromClient)
        .mockResolvedValueOnce(toClient);

      await expect(
        orderRelationshipService.transferDebt("client1", "client2", 30)
      ).rejects.toThrow("Cliente de origem não possui débito suficiente");
    });

    it("deve lidar com clientes sem débito inicial", async () => {
      const fromClient = { ...mockCustomer, _id: "client1", debts: 50 };
      const toClient = { ...mockCustomer, _id: "client2", debts: undefined };
      
      mockUserRepository.findById
        .mockResolvedValueOnce(fromClient)
        .mockResolvedValueOnce(toClient);
      mockUserRepository.update.mockResolvedValue({});

      await orderRelationshipService.transferDebt("client1", "client2", 20);

      expect(mockUserRepository.update).toHaveBeenCalledWith("client1", { debts: 30 });
      expect(mockUserRepository.update).toHaveBeenCalledWith("client2", { debts: 20 });
    });

    it("deve transferir valor exato do débito", async () => {
      const fromClient = { ...mockCustomer, _id: "client1", debts: 50 };
      const toClient = { ...mockCustomer, _id: "client2", debts: 25 };
      
      mockUserRepository.findById
        .mockResolvedValueOnce(fromClient)
        .mockResolvedValueOnce(toClient);
      mockUserRepository.update.mockResolvedValue({});

      await orderRelationshipService.transferDebt("client1", "client2", 50);

      expect(mockUserRepository.update).toHaveBeenCalledWith("client1", { debts: 0 });
      expect(mockUserRepository.update).toHaveBeenCalledWith("client2", { debts: 75 });
    });
  });
});
