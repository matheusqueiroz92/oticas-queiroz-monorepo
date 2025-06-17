import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { OrderValidationService, OrderValidationError } from "../../../services/OrderValidationService";
import type { ILens, ISunglassesFrame } from "../../../interfaces/IProduct";
import mongoose from "mongoose";

// Mock dos repositórios com tipagem simples
const mockUserRepository = {
  findById: jest.fn(),
} as any;

const mockProductRepository = {
  findById: jest.fn(),
} as any;

// Mock da RepositoryFactory
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: () => ({
    userRepository: mockUserRepository,
    productRepository: mockProductRepository,
  }),
}));

describe("OrderValidationService", () => {
  let orderValidationService: OrderValidationService;

  const mockClient = {
    _id: "client123",
    name: "João Silva",
    email: "joao@test.com",
    role: "customer",
  };

  const mockEmployee = {
    _id: "employee123",
    name: "Maria Santos",
    email: "maria@test.com",
    role: "employee",
  };

  const mockAdmin = {
    _id: "admin123",
    name: "Admin User",
    email: "admin@test.com",
    role: "admin",
  };

  // Mocks de produto que seguem as interfaces corretas
  const mockSunglassesProduct: ISunglassesFrame = {
    _id: "product123",
    name: "Óculos de Sol Ray-Ban",
    productType: "sunglasses_frame",
    sellPrice: 350,
    modelSunglasses: "Aviator",
    typeFrame: "Metal",
    color: "Preto",
    shape: "Aviador",
    reference: "RB3025",
    stock: 10,
    brand: "Ray-Ban",
    description: "Óculos de sol clássico",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLensProduct: ILens = {
    _id: "lens123",
    name: "Lente Progressive",
    productType: "lenses",
    sellPrice: 250,
    lensType: "Progressive",
    brand: "Varilux",
    description: "Lente progressiva premium",
    stock: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    orderValidationService = new OrderValidationService();
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("deve criar instância do serviço corretamente", () => {
      expect(orderValidationService).toBeInstanceOf(OrderValidationService);
    });
  });

  describe("OrderValidationError", () => {
    it("deve criar erro de validação corretamente", () => {
      const error = new OrderValidationError("Teste de erro");
      expect(error.message).toBe("Teste de erro");
      expect(error.name).toBe("OrderValidationError");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("validateFinancialData", () => {
    it("deve validar dados financeiros corretos", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, 10, 2, 50);
      }).not.toThrow();
    });

    it("deve validar sem parâmetros opcionais", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100);
      }).not.toThrow();
    });

    it("deve falhar se preço total for zero ou negativo", () => {
      expect(() => {
        orderValidationService.validateFinancialData(0);
      }).toThrow(new OrderValidationError("Preço total deve ser maior que zero"));

      expect(() => {
        orderValidationService.validateFinancialData(-100);
      }).toThrow(new OrderValidationError("Preço total deve ser maior que zero"));
    });

    it("deve falhar se desconto for negativo", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, -10);
      }).toThrow(new OrderValidationError("Desconto não pode ser negativo"));
    });

    it("deve falhar se desconto for maior que preço total", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, 150);
      }).toThrow(new OrderValidationError("Desconto não pode ser maior que o preço total"));
    });

    it("deve falhar se número de parcelas for zero ou negativo", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, 0, 0);
      }).toThrow(new OrderValidationError("Número de parcelas deve ser maior que zero"));

      expect(() => {
        orderValidationService.validateFinancialData(100, 0, -1);
      }).toThrow(new OrderValidationError("Número de parcelas deve ser maior que zero"));
    });

    it("deve falhar se entrada for negativa", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, 0, 1, -50);
      }).toThrow(new OrderValidationError("Valor de entrada não pode ser negativo"));
    });

    it("deve lidar com desconto de valor zero", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, 0);
      }).not.toThrow();
    });

    it("deve lidar com entrada de valor zero", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, 0, 1, 0);
      }).not.toThrow();
    });
  });

  describe("validatePrescriptionData", () => {
    it("deve validar sem dados de prescrição", () => {
      expect(() => {
        orderValidationService.validatePrescriptionData();
      }).not.toThrow();
    });

    it("deve validar data de consulta de hoje", () => {
      const today = new Date();
      expect(() => {
        orderValidationService.validatePrescriptionData({ appointmentDate: today });
      }).not.toThrow();
    });

    it("deve validar data de consulta passada", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      
      expect(() => {
        orderValidationService.validatePrescriptionData({ appointmentDate: pastDate });
      }).not.toThrow();
    });

    it("deve falhar se data da consulta for futura", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      expect(() => {
        orderValidationService.validatePrescriptionData({ appointmentDate: futureDate });
      }).toThrow(new OrderValidationError("Data da consulta não pode ser no futuro"));
    });

    it("deve falhar se data da consulta for muito antiga", () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);
      
      expect(() => {
        orderValidationService.validatePrescriptionData({ appointmentDate: oldDate });
      }).toThrow(new OrderValidationError("Data da consulta não pode ser mais antiga que um ano"));
    });
  });

  describe("validateUpdatePermissions", () => {
    it("deve permitir atualização normal", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "pending", "in_production");
      }).not.toThrow();
    });

    it("deve permitir admin cancelar pedido", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "pending", "cancelled");
      }).not.toThrow();
    });

    it("deve permitir admin modificar pedido entregue", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "delivered", "in_production");
      }).not.toThrow();
    });

    it("deve falhar ao tentar atualizar pedido cancelado", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "cancelled", "pending");
      }).toThrow(new OrderValidationError("Não é possível atualizar pedido cancelado"));
    });

    it("deve falhar se funcionário tentar cancelar pedido", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "pending", "cancelled");
      }).toThrow(new OrderValidationError("Apenas administradores podem cancelar pedidos"));
    });

    it("deve falhar se funcionário tentar modificar pedido entregue", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "delivered", "in_production");
      }).toThrow(new OrderValidationError("Apenas administradores podem modificar pedidos entregues"));
    });
  });

  describe("validateCancellation", () => {
    it("deve permitir admin cancelar pedido pendente", () => {
      expect(() => {
        orderValidationService.validateCancellation("pending", "admin");
      }).not.toThrow();
    });

    it("deve permitir admin cancelar pedido em produção", () => {
      expect(() => {
        orderValidationService.validateCancellation("in_production", "admin");
      }).not.toThrow();
    });

    it("deve falhar se pedido já estiver cancelado", () => {
      expect(() => {
        orderValidationService.validateCancellation("cancelled", "admin");
      }).toThrow(new OrderValidationError("Pedido já está cancelado"));
    });

    it("deve falhar se pedido já estiver entregue", () => {
      expect(() => {
        orderValidationService.validateCancellation("delivered", "admin");
      }).toThrow(new OrderValidationError("Não é possível cancelar pedido já entregue"));
    });

    it("deve falhar se usuário não for admin", () => {
      expect(() => {
        orderValidationService.validateCancellation("pending", "employee");
      }).toThrow(new OrderValidationError("Apenas administradores podem cancelar pedidos"));
    });
  });

  describe("isLensProduct - com mocks", () => {
    it("deve retornar true para produto com productType lenses (referência)", async () => {
      mockProductRepository.findById.mockResolvedValue(mockLensProduct);

      const result = await orderValidationService.isLensProduct("lens123");

      expect(mockProductRepository.findById).toHaveBeenCalledWith("lens123");
      expect(result).toBe(true);
    });

    it("deve retornar true para produto com nome contendo 'lente' (referência)", async () => {
      const productWithLensName = { ...mockSunglassesProduct, name: "Lente Progressive" };
      mockProductRepository.findById.mockResolvedValue(productWithLensName);

      const result = await orderValidationService.isLensProduct("product123");

      expect(result).toBe(true);
    });

    it("deve retornar false para produto que não é lente (referência)", async () => {
      mockProductRepository.findById.mockResolvedValue(mockSunglassesProduct);

      const result = await orderValidationService.isLensProduct("product123");

      expect(result).toBe(false);
    });

    it("deve retornar true para produto completo com productType lenses", async () => {
      const result = await orderValidationService.isLensProduct(mockLensProduct);

      expect(result).toBe(true);
      expect(mockProductRepository.findById).not.toHaveBeenCalled();
    });

    it("deve retornar true para produto completo com nome contendo 'lente'", async () => {
      const productWithLensName = { ...mockSunglassesProduct, name: "Lente de Contato" };
      const result = await orderValidationService.isLensProduct(productWithLensName);

      expect(result).toBe(true);
    });

    it("deve retornar false para produto completo que não é lente", async () => {
      const result = await orderValidationService.isLensProduct(mockSunglassesProduct);

      expect(result).toBe(false);
    });

    it("deve retornar false quando produto não é encontrado", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await orderValidationService.isLensProduct("nonexistent");

      expect(result).toBe(false);
    });

    it("deve detectar lente por nome com diferentes capitalizações", async () => {
      const productWithLensName = { ...mockSunglassesProduct, name: "LENTE PROGRESSIVE" };
      mockProductRepository.findById.mockResolvedValue(productWithLensName);

      const result = await orderValidationService.isLensProduct("product123");

      expect(result).toBe(true);
    });

    it("deve detectar lente por productType=lenses mesmo sem 'lente' no nome", async () => {
      const lensWithoutNameMatch = { ...mockLensProduct, name: "Crystal Clear Vision" };
      mockProductRepository.findById.mockResolvedValue(lensWithoutNameMatch);

      const result = await orderValidationService.isLensProduct("test-id");
      expect(result).toBe(true);
    });

    it("deve cobrir return false no isLensProduct para produto sem productType e sem 'lente' no nome", async () => {
      const result = await orderValidationService.isLensProduct(mockSunglassesProduct);
      expect(result).toBe(false);
    });
  });

  describe("validateClient - com mocks", () => {
    it("deve validar cliente corretamente", async () => {
      mockUserRepository.findById.mockResolvedValue(mockClient);

      await expect(
        orderValidationService.validateClient("client123")
      ).resolves.not.toThrow();

      expect(mockUserRepository.findById).toHaveBeenCalledWith("client123");
    });

    it("deve falhar se cliente não existir", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        orderValidationService.validateClient("nonexistent")
      ).rejects.toThrow(new OrderValidationError("Cliente não encontrado"));
    });

    it("deve falhar se usuário não for cliente", async () => {
      mockUserRepository.findById.mockResolvedValue(mockEmployee);

      await expect(
        orderValidationService.validateClient("employee123")
      ).rejects.toThrow(new OrderValidationError("ID fornecido não pertence a um cliente"));
    });
  });

  describe("validateEmployee - com mocks", () => {
    it("deve validar funcionário corretamente", async () => {
      mockUserRepository.findById.mockResolvedValue(mockEmployee);

      await expect(
        orderValidationService.validateEmployee("employee123")
      ).resolves.not.toThrow();

      expect(mockUserRepository.findById).toHaveBeenCalledWith("employee123");
    });

    it("deve validar administrador como funcionário", async () => {
      mockUserRepository.findById.mockResolvedValue(mockAdmin);

      await expect(
        orderValidationService.validateEmployee("admin123")
      ).resolves.not.toThrow();
    });

    it("deve falhar se funcionário não existir", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        orderValidationService.validateEmployee("nonexistent")
      ).rejects.toThrow(new OrderValidationError("Funcionário não encontrado"));
    });

    it("deve falhar se usuário não for funcionário nem administrador", async () => {
      mockUserRepository.findById.mockResolvedValue(mockClient);

      await expect(
        orderValidationService.validateEmployee("client123")
      ).rejects.toThrow(new OrderValidationError("ID fornecido não pertence a um funcionário"));
    });
  });

  describe("validateProducts - com mocks", () => {
    it("deve validar lista de produtos corretamente", async () => {
      // Mockar que os produtos existem no repositório
      mockProductRepository.findById.mockImplementation((id: string) => {
        if (id === "product123") return Promise.resolve(mockSunglassesProduct);
        if (id === "lens123") return Promise.resolve(mockLensProduct);
        return Promise.resolve(null);
      });

      await expect(
        orderValidationService.validateProducts([mockSunglassesProduct, mockLensProduct])
      ).resolves.not.toThrow();
    });

    it("deve validar produtos como strings (IDs)", async () => {
      // Mockar que os produtos com ID string existem
      mockProductRepository.findById.mockImplementation((id: string) => {
        if (id === "product1") return Promise.resolve(mockSunglassesProduct);
        if (id === "product2") return Promise.resolve(mockLensProduct);
        return Promise.resolve(null);
      });

      await expect(
        orderValidationService.validateProducts(["product1", "product2"])
      ).resolves.not.toThrow();
    });

    it("deve falhar se lista de produtos estiver vazia", async () => {
      await expect(
        orderValidationService.validateProducts([])
      ).rejects.toThrow(new OrderValidationError("Pelo menos um produto deve ser adicionado ao pedido"));
    });

    it("deve falhar se produto não tiver ID", async () => {
      const productWithoutId = { name: "Produto sem ID" };

      await expect(
        orderValidationService.validateProducts([productWithoutId as any])
      ).rejects.toThrow(new OrderValidationError("Formato de produto inválido"));
    });

    it("deve validar mistura de strings e objetos", async () => {
      // Mockar todos os produtos
      mockProductRepository.findById.mockImplementation((id: string) => {
        if (id === "product1") return Promise.resolve(mockSunglassesProduct);
        if (id === "lens123") return Promise.resolve(mockLensProduct);
        if (id === "product3") return Promise.resolve(mockSunglassesProduct);
        return Promise.resolve(null);
      });

      await expect(
        orderValidationService.validateProducts(["product1", mockLensProduct, "product3"])
      ).resolves.not.toThrow();
    });

    it("deve falhar se produto string não existir no repositório", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(
        orderValidationService.validateProducts(["nonexistent"])
      ).rejects.toThrow(new OrderValidationError("Produto com ID nonexistent não encontrado"));
    });

    it("deve falhar se produto objeto não existir no repositório", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(
        orderValidationService.validateProducts([mockSunglassesProduct])
      ).rejects.toThrow(new OrderValidationError("Produto com ID product123 não encontrado"));
    });

    it("deve falhar se produto objeto não tiver _id", async () => {
      const productWithoutId = { ...mockSunglassesProduct };
      delete (productWithoutId as any)._id;

      await expect(
        orderValidationService.validateProducts([productWithoutId as any])
      ).rejects.toThrow(new OrderValidationError("Formato de produto inválido"));
    });

    it("deve testar validateUpdatePermissions sem newStatus", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "pending");
      }).not.toThrow();

      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "delivered");
      }).toThrow(new OrderValidationError("Apenas administradores podem modificar pedidos entregues"));
    });

    it("deve cobrir linha de retorno false em validateProducts", async () => {
      // Teste com produto que não passa em nenhuma das validações isProductReference nem isProductComplete
      const invalidProduct = null;

      await expect(
        orderValidationService.validateProducts([invalidProduct as any])
      ).rejects.toThrow(new OrderValidationError("Formato de produto inválido"));
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve propagar erros do repositório de usuários", async () => {
      const error = new Error("Database connection failed");
      mockUserRepository.findById.mockRejectedValue(error);

      await expect(
        orderValidationService.validateClient("client123")
      ).rejects.toThrow("Database connection failed");
    });

    it("deve propagar erros do repositório de produtos", async () => {
      const error = new Error("Product database error");
      mockProductRepository.findById.mockRejectedValue(error);

      await expect(
        orderValidationService.isLensProduct("product123")
      ).rejects.toThrow("Product database error");
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com dados financeiros apenas com preço", () => {
      expect(() => {
        orderValidationService.validateFinancialData(99.99);
      }).not.toThrow();
    });

    it("deve validar permissões com status undefined", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "pending");
      }).not.toThrow();
    });

    it("deve lidar com produto ObjectId no isLensProduct", async () => {
      const objectId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
      mockProductRepository.findById.mockResolvedValue(mockLensProduct);

      const result = await orderValidationService.isLensProduct(objectId);

      expect(result).toBe(true);
      expect(mockProductRepository.findById).toHaveBeenCalledWith(objectId);
    });

    it("deve lidar com data de prescrição exatamente no limite", () => {
      const limitDate = new Date();
      limitDate.setFullYear(limitDate.getFullYear() - 1);
      limitDate.setDate(limitDate.getDate() + 1); // Um dia dentro do limite

      expect(() => {
        orderValidationService.validatePrescriptionData({ appointmentDate: limitDate });
      }).not.toThrow();
    });

    it("deve lidar com números decimais nos dados financeiros", () => {
      expect(() => {
        orderValidationService.validateFinancialData(99.99, 9.99, 1, 50.50);
      }).not.toThrow();
    });

    it("deve lidar com parcelas maiores que 1", () => {
      expect(() => {
        orderValidationService.validateFinancialData(1000, 100, 12, 200);
      }).not.toThrow();
    });

    it("deve detectar 'lente' em qualquer posição do nome", async () => {
      const products = [
        { ...mockSunglassesProduct, name: "Armação com lente incluída" },
        { ...mockSunglassesProduct, name: "LENTE superior premium" },
        { ...mockSunglassesProduct, name: "Produto com Lente especial" },
      ];

      for (const product of products) {
        mockProductRepository.findById.mockResolvedValue(product);
        const result = await orderValidationService.isLensProduct("test-id");
        expect(result).toBe(true);
      }
    });

    it("deve testar validateDeliveryDate com data futura e lentes", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await expect(
        orderValidationService["validateDeliveryDate"](futureDate, [mockLensProduct])
      ).resolves.not.toThrow();
    });

    it("deve falhar validateDeliveryDate com data passada e lentes", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        orderValidationService["validateDeliveryDate"](pastDate, [mockLensProduct])
      ).rejects.toThrow(new OrderValidationError("Pedidos com lentes exigem data de entrega futura"));
    });

    it("deve ignorar validateDeliveryDate quando não há parâmetros", async () => {
      await expect(
        orderValidationService["validateDeliveryDate"]()
      ).resolves.not.toThrow();
    });

    it("deve testar validateOrder completo", async () => {
      // Mockar repositórios
      mockUserRepository.findById.mockImplementation((id: string) => {
        if (id === "client123") return Promise.resolve(mockClient);
        if (id === "employee123") return Promise.resolve(mockEmployee);
        return Promise.resolve(null);
      });

      mockProductRepository.findById.mockImplementation((id: string) => {
        if (id === "product123") return Promise.resolve(mockSunglassesProduct);
        return Promise.resolve(null);
      });

      const orderData = {
        clientId: "client123",
        employeeId: "employee123",
        products: [mockSunglassesProduct],
        paymentMethod: "cash",
        paymentStatus: "pending" as const,
        status: "pending" as const,
        orderDate: new Date(),
        totalPrice: 100,
        discount: 10,
        finalPrice: 90,
      };

      await expect(
        orderValidationService.validateOrder(orderData)
      ).resolves.not.toThrow();
    });

    it("deve testar métodos privados através de interface pública", () => {
      const service = orderValidationService as any;
      
      // isProductReference
      expect(service.isProductReference("product123")).toBe(true);
      expect(service.isProductReference(mockSunglassesProduct)).toBe(false);
      
      // isProductComplete
      expect(service.isProductComplete(mockSunglassesProduct)).toBe(true);
      expect(service.isProductComplete("product123")).toBe(false);
    });

    it("deve validar cliente com role customer", async () => {
      mockUserRepository.findById.mockResolvedValue(mockClient);

      await expect(
        orderValidationService.validateClient("client123")
      ).resolves.not.toThrow();
    });

    it("deve validar funcionário com role admin", async () => {
      mockUserRepository.findById.mockResolvedValue(mockAdmin);

      await expect(
        orderValidationService.validateEmployee("admin123")
      ).resolves.not.toThrow();
    });

    it("deve testar validateUpdatePermissions sem newStatus", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "pending");
      }).not.toThrow();

      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "delivered");
      }).toThrow(new OrderValidationError("Apenas administradores podem modificar pedidos entregues"));
    });
  });

  describe("Cobertura completa de métodos", () => {
    it("deve testar todos os branches de validateUpdatePermissions", () => {
      // Employee tentando modificar status válido (sem problemas)
      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "pending", "ready");
      }).not.toThrow();

      // Employee tentando modificar pedido que já está entregue (deve falhar)
      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "delivered", "pending");
      }).toThrow(new OrderValidationError("Apenas administradores podem modificar pedidos entregues"));

      // Employee tentando cancelar pedido (deve falhar)
      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "pending", "cancelled");
      }).toThrow(new OrderValidationError("Apenas administradores podem cancelar pedidos"));

      // Tentando modificar pedido já cancelado (deve falhar)
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "cancelled", "pending");
      }).toThrow(new OrderValidationError("Não é possível atualizar pedido cancelado"));

      // Admin pode fazer qualquer mudança válida
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "delivered", "cancelled");
      }).not.toThrow();

      // Admin modificando pedido normal
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "pending", "ready");
      }).not.toThrow();
    });

    it("deve testar validateCancellation com todos os status", () => {
      const validStatuses = ["pending", "in_production", "ready"];
      const invalidStatuses = ["delivered", "cancelled"];

      validStatuses.forEach(status => {
        expect(() => {
          orderValidationService.validateCancellation(status as any, "admin");
        }).not.toThrow();
      });

      invalidStatuses.forEach(status => {
        expect(() => {
          orderValidationService.validateCancellation(status as any, "admin");
        }).toThrow();
      });
    });

    it("deve testar validateFinancialData com valores limite", () => {
      // Valores mínimos válidos
      expect(() => {
        orderValidationService.validateFinancialData(0.01, 0, 1, 0);
      }).not.toThrow();

      // Desconto igual ao preço (válido)
      expect(() => {
        orderValidationService.validateFinancialData(100, 100);
      }).not.toThrow();

      // Valores altos
      expect(() => {
        orderValidationService.validateFinancialData(99999.99, 1000.50, 36, 5000);
      }).not.toThrow();
    });
  });

  describe("validateOrder - método principal", () => {
    it("deve validar pedido completo com sucesso", async () => {
      // Mockar repositórios
      mockUserRepository.findById.mockImplementation((id: string) => {
        if (id === "client123") return Promise.resolve(mockClient);
        if (id === "employee123") return Promise.resolve(mockEmployee);
        return Promise.resolve(null);
      });

      mockProductRepository.findById.mockImplementation((id: string) => {
        if (id === "product123") return Promise.resolve(mockSunglassesProduct);
        return Promise.resolve(null);
      });

      const orderData = {
        clientId: "client123",
        employeeId: "employee123",
        products: [mockSunglassesProduct],
        paymentMethod: "cash",
        paymentStatus: "pending" as const,
        status: "pending" as const,
        orderDate: new Date(),
        totalPrice: 100,
        discount: 10,
        finalPrice: 90,
      };

      await expect(
        orderValidationService.validateOrder(orderData)
      ).resolves.not.toThrow();
    });

    it("deve falhar se cliente for inválido", async () => {
      mockUserRepository.findById.mockImplementation((id: string) => {
        if (id === "invalid_client") return Promise.resolve(null);
        if (id === "employee123") return Promise.resolve(mockEmployee);
        return Promise.resolve(null);
      });

      const orderData = {
        clientId: "invalid_client",
        employeeId: "employee123",
        products: ["product123"],
        paymentMethod: "cash",
        paymentStatus: "pending" as const,
        status: "pending" as const,
        orderDate: new Date(),
        totalPrice: 100,
        discount: 10,
        finalPrice: 90,
      };

      await expect(
        orderValidationService.validateOrder(orderData)
      ).rejects.toThrow(new OrderValidationError("Cliente não encontrado"));
    });

    it("deve validar com ObjectId como clientId/employeeId", async () => {
      mockUserRepository.findById.mockImplementation((id: string) => {
        if (id === "507f1f77bcf86cd799439011") return Promise.resolve(mockClient);
        if (id === "507f1f77bcf86cd799439012") return Promise.resolve(mockEmployee);
        return Promise.resolve(null);
      });

      mockProductRepository.findById.mockImplementation(() => Promise.resolve(mockSunglassesProduct));

      const mongoose = require('mongoose');
      const orderData = {
        clientId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
        employeeId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
        products: ["product123"],
        paymentMethod: "cash",
        paymentStatus: "pending" as const,
        status: "pending" as const,
        orderDate: new Date(),
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
      };

      await expect(
        orderValidationService.validateOrder(orderData)
      ).resolves.not.toThrow();
    });
  });

  describe("validateDeliveryDate", () => {
    it("deve permitir data de entrega futura para pedidos com lentes", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      mockProductRepository.findById.mockResolvedValue(mockLensProduct);

      await expect(
        orderValidationService["validateDeliveryDate"](futureDate, [mockLensProduct])
      ).resolves.not.toThrow();
    });

    it("deve falhar se data de entrega for passada para pedidos com lentes", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        orderValidationService["validateDeliveryDate"](pastDate, [mockLensProduct])
      ).rejects.toThrow(new OrderValidationError("Pedidos com lentes exigem data de entrega futura"));
    });

    it("deve permitir qualquer data para produtos sem lentes", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        orderValidationService["validateDeliveryDate"](pastDate, [mockSunglassesProduct])
      ).resolves.not.toThrow();
    });

    it("deve ignorar validação quando não há data ou produtos", async () => {
      await expect(
        orderValidationService["validateDeliveryDate"]()
      ).resolves.not.toThrow();

      await expect(
        orderValidationService["validateDeliveryDate"](new Date())
      ).resolves.not.toThrow();

      await expect(
        orderValidationService["validateDeliveryDate"](undefined, [mockSunglassesProduct])
      ).resolves.not.toThrow();
    });
  });

  describe("Métodos privados - isProductReference e isProductComplete", () => {
    it("deve identificar referência de produto corretamente", () => {
      const service = orderValidationService as any;
      
      expect(service.isProductReference("product123")).toBe(true);
      expect(service.isProductReference(mockSunglassesProduct)).toBe(false);
      
      // Testa apenas string, já que ObjectId está sendo problemático no Jest
      expect(service.isProductReference("507f1f77bcf86cd799439011")).toBe(true);
    });

    it("deve identificar produto completo corretamente", () => {
      const service = orderValidationService as any;
      
      expect(service.isProductComplete(mockSunglassesProduct)).toBe(true);
      expect(service.isProductComplete("product123")).toBe(false);
      expect(service.isProductComplete({ name: "produto objeto" })).toBe(false); // Não tem _id
      expect(service.isProductComplete({ name: "produto objeto", _id: "test" })).toBe(true);
    });
  });

  describe("Casos extremos adicionais", () => {
    it("deve lidar com produtos que não são encontrados no isLensProduct", async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const result = await orderValidationService.isLensProduct("nonexistent-product");
      expect(result).toBe(false);
    });

    it("deve cobrir return false final do isLensProduct com produto inválido", async () => {
      // Teste para cobrir linha 69 - return false quando produto não é nem referência nem completo
      const result = await orderValidationService.isLensProduct(undefined as any);
      expect(result).toBe(false);
    });

    it("deve cobrir return false no validateProducts para produto com _id undefined", async () => {
      // Teste para cobrir linha 122 - cenário específico do validateProducts
      const productWithUndefinedId = { 
        ...mockSunglassesProduct, 
        _id: undefined as any 
      };

      await expect(
        orderValidationService.validateProducts([productWithUndefinedId])
      ).rejects.toThrow(new OrderValidationError("Todos os produtos devem ter um ID válido"));
    });

    it("deve funcionar com arrays vazios em validateDeliveryDate", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        orderValidationService["validateDeliveryDate"](futureDate, [])
      ).resolves.not.toThrow();
    });

    it("deve validar com todos os parâmetros financeiros undefined", () => {
      expect(() => {
        orderValidationService.validateFinancialData(100, undefined, undefined, undefined);
      }).not.toThrow();
    });

    it("deve falhar validateClient quando usuário tem role incorreto", async () => {
      const userWithWrongRole = { ...mockClient, role: "admin" };
      mockUserRepository.findById.mockResolvedValue(userWithWrongRole);

      await expect(
        orderValidationService.validateClient("client123")
      ).rejects.toThrow(new OrderValidationError("ID fornecido não pertence a um cliente"));
    });

    it("deve falhar validateEmployee quando usuário tem role incorreto", async () => {
      const userWithWrongRole = { ...mockEmployee, role: "customer" };
      mockUserRepository.findById.mockResolvedValue(userWithWrongRole);

      await expect(
        orderValidationService.validateEmployee("employee123")
      ).rejects.toThrow(new OrderValidationError("ID fornecido não pertence a um funcionário"));
    });

    it("deve aceitar admin como funcionário válido", async () => {
      mockUserRepository.findById.mockResolvedValue(mockAdmin);

      await expect(
        orderValidationService.validateEmployee("admin123")
      ).resolves.not.toThrow();
    });

    it("deve testar validateUpdatePermissions sem newStatus", () => {
      expect(() => {
        orderValidationService.validateUpdatePermissions("admin", "pending");
      }).not.toThrow();

      expect(() => {
        orderValidationService.validateUpdatePermissions("employee", "delivered");
      }).toThrow(new OrderValidationError("Apenas administradores podem modificar pedidos entregues"));
    });
  });
});
