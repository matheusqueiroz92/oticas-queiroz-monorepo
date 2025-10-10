// @ts-nocheck
import { MongoOrderRepository } from "../../../repositories/implementations/MongoOrderRepository";
import { Order } from "../../../schemas/OrderSchema";
import { User } from "../../../schemas/UserSchema";
import { Laboratory } from "../../../schemas/LaboratorySchema";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

/**
 * Testes unitários para MongoOrderRepository
 * 
 * Cobertura:
 * - CRUD básico
 * - Métodos de busca específicos
 * - Agregações (countByStatus, getRevenueSummary)
 * - Filtros e populações
 * - Edge cases
 */
describe("MongoOrderRepository", () => {
  let mongoServer: MongoMemoryServer;
  let repository: MongoOrderRepository;
  let testClientId: string;
  let testEmployeeId: string;
  let testLaboratoryId: string;

  beforeAll(async () => {
    // Iniciar MongoDB em memória
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Desconectar se já estiver conectado
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpar coleções
    await Order.deleteMany({});
    await User.deleteMany({});
    await Laboratory.deleteMany({});

    // Criar dados de teste
    const client = await User.create({
      name: "Cliente Teste",
      email: "cliente@test.com",
      password: "senha123",
      cpf: "12345678909", // CPF válido
      role: "customer",
    });

    const employee = await User.create({
      name: "Funcionário Teste",
      email: "funcionario@test.com",
      password: "senha123",
      cpf: "98765432100", // CPF válido
      role: "employee",
    });

    const laboratory = await Laboratory.create({
      name: "Laboratório Teste",
      cnpj: "12345678000190",
      email: "lab@test.com",
      phone: "11999999999",
      contactName: "Contato Teste",
      address: {
        street: "Rua Teste",
        number: "100",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234567",
      },
    });

    testClientId = client._id.toString();
    testEmployeeId = employee._id.toString();
    testLaboratoryId = laboratory._id.toString();

    repository = new MongoOrderRepository();
  });

  // Helper function para criar produto padrão
  const createDefaultProduct = () => ({
    _id: new mongoose.Types.ObjectId().toString(),
    productType: "lenses",
    name: "Produto Teste",
    quantity: 1,
    price: 100,
    totalPrice: 100,
  });

  // =============================================
  // CRUD BÁSICO
  // =============================================

  describe("create()", () => {
    it("should create an order successfully", async () => {
      const orderData = {
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [
          {
            _id: "product1",
            productType: "lenses",
            name: "Lente Teste",
            quantity: 2,
            price: 100,
            totalPrice: 200,
          },
        ],
        paymentMethod: "credit",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 200,
        discount: 0,
        finalPrice: 200,
        orderDate: new Date(),
      };

      const created = await repository.create(orderData as any);

      expect(created).toBeDefined();
      expect(created._id).toBeDefined();
      expect(created.clientId).toBe(testClientId);
      expect(created.products).toHaveLength(1);
      expect(created.totalPrice).toBe(200);
    });

    it("should create order with prescription data", async () => {
      const orderData = {
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [
          {
            _id: "product1",
            productType: "lenses",
            name: "Lente com Receita",
            quantity: 1,
            price: 150,
            totalPrice: 150,
          },
        ],
        prescriptionData: {
          doctorName: "Dr. João",
          clinicName: "Clínica Visão",
          appointmentDate: new Date(),
          rightEye: { sph: "-2.00", cyl: "-1.00", axis: 90, pd: 32 },
          leftEye: { sph: "-1.50", cyl: "-0.50", axis: 85, pd: 31 },
        },
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 150,
        discount: 0,
        finalPrice: 150,
        orderDate: new Date(),
      };

      const created = await repository.create(orderData as any);

      expect(created).toBeDefined();
      expect(created.prescriptionData).toBeDefined();
      expect(created.prescriptionData?.doctorName).toBe("Dr. João");
    });

    it("should create order with laboratoryId", async () => {
      const orderData = {
        clientId: testClientId,
        employeeId: testEmployeeId,
        laboratoryId: testLaboratoryId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      };

      const created = await repository.create(orderData as any);

      expect(created).toBeDefined();
      expect(created.laboratoryId).toBe(testLaboratoryId);
    });
  });

  describe("findById()", () => {
    it("should find order by id", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const found = await repository.findById(created._id);

      expect(found).toBeDefined();
      expect(found?._id).toBe(created._id);
      expect(found?.clientId).toBe(testClientId);
    });

    it("should return null for non-existent id", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const found = await repository.findById(fakeId);

      expect(found).toBeNull();
    });
  });

  describe("update()", () => {
    it("should update order successfully", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const updated = await repository.update(created._id, {
        status: "in_production",
        discount: 10,
        finalPrice: 90,
      } as any);

      expect(updated).toBeDefined();
      expect(updated?.status).toBe("in_production");
      expect(updated?.discount).toBe(10);
      expect(updated?.finalPrice).toBe(90);
    });
  });

  describe("delete()", () => {
    it("should soft delete order", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.delete(created._id);

      const found = await repository.findById(created._id);
      expect(found).toBeNull(); // Soft deleted, não aparece em findById

      // Verificar se ainda existe no banco mas está marcado como deletado
      const doc = await Order.findById(created._id);
      expect(doc?.isDeleted).toBe(true);
    });
  });

  // =============================================
  // MÉTODOS DE BUSCA ESPECÍFICOS
  // =============================================

  describe("findAll()", () => {
    it("should return all orders with pagination", async () => {
      // Criar 5 pedidos
      for (let i = 0; i < 5; i++) {
        await repository.create({
          clientId: testClientId,
          employeeId: testEmployeeId,
          products: [createDefaultProduct()],
          paymentMethod: "cash",
          paymentStatus: "pending",
          status: "pending",
          totalPrice: 100 * (i + 1),
          discount: 0,
          finalPrice: 100 * (i + 1),
          orderDate: new Date(),
        } as any);
      }

      const result = await repository.findAll(1, 3);

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
    });

    it("should filter orders by status", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "delivered",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findAll(1, 10, { status: "pending" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("pending");
    });

    it("should search orders by client name", async () => {
      // Criar outro cliente
      const client2 = await User.create({
        name: "João Silva",
        email: "joao@test.com",
        password: "senha123",
        cpf: "11122233396", // CPF válido
        role: "customer",
      });

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: client2._id.toString(),
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findAll(1, 10, { search: "João" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].clientId).toBe(client2._id.toString());
    });

    it("should return empty if search term doesn't match any client", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findAll(1, 10, { search: "Inexistente" });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("findByClientId()", () => {
    it("should find orders by client id", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "delivered",
        totalPrice: 200,
        discount: 0,
        finalPrice: 200,
        orderDate: new Date(),
      } as any);

      const orders = await repository.findByClientId(testClientId);

      expect(orders).toHaveLength(2);
      expect(orders.every((o) => o.clientId === testClientId)).toBe(true);
    });

    it("should return empty array for invalid client id", async () => {
      const orders = await repository.findByClientId("invalid-id");

      expect(orders).toHaveLength(0);
    });
  });

  describe("findByEmployeeId()", () => {
    it("should find orders by employee id", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findByEmployeeId(testEmployeeId, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].employeeId).toBe(testEmployeeId);
    });

    it("should return empty for invalid employee id", async () => {
      const result = await repository.findByEmployeeId("invalid-id", 1, 10);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("findByServiceOrder()", () => {
    it("should find orders by service order number", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        serviceOrder: "OS-12345",
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const orders = await repository.findByServiceOrder("OS-12345");

      expect(orders).toHaveLength(1);
      expect(orders[0].serviceOrder).toBe("OS-12345");
    });

    it("should return empty array if service order not found", async () => {
      const orders = await repository.findByServiceOrder("OS-99999");

      expect(orders).toHaveLength(0);
    });
  });

  describe("findByStatus()", () => {
    it("should find orders by status", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "in_production",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "delivered",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findByStatus("in_production", 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("in_production");
    });
  });

  describe("findByLaboratory()", () => {
    it("should find orders by laboratory id", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        laboratoryId: testLaboratoryId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findByLaboratory(testLaboratoryId, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].laboratoryId).toBe(testLaboratoryId);
    });
  });

  describe("findByDateRange()", () => {
    it("should find orders within date range", async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: today,
      } as any);

      const result = await repository.findByDateRange(yesterday, tomorrow, 1, 10);

      expect(result.items).toHaveLength(1);
    });

    it("should return empty if no orders in date range", async () => {
      const past = new Date("2020-01-01");
      const pastEnd = new Date("2020-01-31");

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findByDateRange(past, pastEnd, 1, 10);

      expect(result.items).toHaveLength(0);
    });
  });

  describe("findDailyOrders()", () => {
    it("should find orders for today", async () => {
      const today = new Date();

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: today,
      } as any);

      const orders = await repository.findDailyOrders(today);

      expect(orders).toHaveLength(1);
    });

    it("should return empty for day with no orders", async () => {
      const pastDate = new Date("2020-01-01");

      const orders = await repository.findDailyOrders(pastDate);

      expect(orders).toHaveLength(0);
    });
  });

  describe("findByProductId()", () => {
    it("should find orders containing specific product", async () => {
      const productId = new mongoose.Types.ObjectId().toString();

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [
          {
            _id: productId,
            productType: "lenses",
            name: "Lente Específica",
            quantity: 1,
            price: 100,
            totalPrice: 100,
          },
        ],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findByProductId(productId, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].products.some((p: any) => p._id === productId)).toBe(true);
    });
  });

  describe("findByPaymentStatus()", () => {
    it("should find orders by payment status", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const result = await repository.findByPaymentStatus("paid", 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].paymentStatus).toBe("paid");
    });
  });

  describe("findDeleted()", () => {
    it("should find soft deleted orders", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.delete(created._id);

      const result = await repository.findDeleted(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]._id).toBe(created._id);
    });
  });

  describe("findWithFilters()", () => {
    it("should find orders with multiple filters", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "delivered",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "credit",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 200,
        discount: 0,
        finalPrice: 200,
        orderDate: new Date(),
      } as any);

      const result = await repository.findWithFilters(
        {
          status: "delivered",
          paymentStatus: "paid",
        },
        1,
        10
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("delivered");
      expect(result.items[0].paymentStatus).toBe("paid");
    });
  });

  // =============================================
  // MÉTODOS DE ATUALIZAÇÃO ESPECÍFICOS
  // =============================================

  describe("updateStatus()", () => {
    it("should update order status", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const updated = await repository.updateStatus(created._id, "delivered");

      expect(updated).toBeDefined();
      expect(updated?.status).toBe("delivered");
    });
  });

  describe("updateLaboratory()", () => {
    it("should update order laboratory", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const updated = await repository.updateLaboratory(created._id, testLaboratoryId);

      expect(updated).toBeDefined();
      expect(updated?.laboratoryId?.toString()).toBe(testLaboratoryId);
    });
  });

  // =============================================
  // AGREGAÇÕES E ESTATÍSTICAS
  // =============================================

  describe("countByStatus()", () => {
    it("should count orders by status", async () => {
      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "delivered",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      const counts = await repository.countByStatus();

      expect(counts.pending).toBe(2);
      expect(counts.delivered).toBe(1);
      expect(counts.in_production).toBe(0);
    });

    it("should count orders within date range", async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: today,
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: yesterday,
      } as any);

      const counts = await repository.countByStatus(today, today);

      expect(counts.pending).toBe(1); // Apenas o pedido de hoje
    });
  });

  describe("getRevenueSummary()", () => {
    it("should calculate revenue summary for date range", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "delivered",
        totalPrice: 1000,
        discount: 100,
        finalPrice: 900,
        orderDate: today,
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "delivered",
        totalPrice: 500,
        discount: 50,
        finalPrice: 450,
        orderDate: today,
      } as any);

      const summary = await repository.getRevenueSummary(today, tomorrow);

      expect(summary.totalRevenue).toBe(1500);
      expect(summary.totalDiscount).toBe(150);
      expect(summary.finalRevenue).toBe(1350);
      expect(summary.orderCount).toBe(2);
    });

    it("should exclude cancelled orders from revenue", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "delivered",
        totalPrice: 1000,
        discount: 0,
        finalPrice: 1000,
        orderDate: today,
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "paid",
        status: "cancelled",
        totalPrice: 500,
        discount: 0,
        finalPrice: 500,
        orderDate: today,
      } as any);

      const summary = await repository.getRevenueSummary(today, tomorrow);

      expect(summary.totalRevenue).toBe(1000); // Cancelado não entra
      expect(summary.orderCount).toBe(1);
    });

    it("should return zeros if no orders in date range", async () => {
      const past = new Date("2020-01-01");
      const pastEnd = new Date("2020-01-31");

      const summary = await repository.getRevenueSummary(past, pastEnd);

      expect(summary.totalRevenue).toBe(0);
      expect(summary.totalDiscount).toBe(0);
      expect(summary.finalRevenue).toBe(0);
      expect(summary.orderCount).toBe(0);
    });
  });

  // =============================================
  // EDGE CASES
  // =============================================

  describe("Edge Cases", () => {
    it("should handle orders with default products", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      expect(created).toBeDefined();
      expect(created.products).toHaveLength(1);
    });

    it("should handle orders with multiple products", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [
          {
            _id: "prod1",
            productType: "lenses",
            name: "Lente 1",
            quantity: 1,
            price: 100,
            totalPrice: 100,
          },
          {
            _id: "prod2",
            productType: "prescription_frame",
            name: "Armação 1",
            quantity: 1,
            price: 200,
            totalPrice: 200,
          },
        ],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 300,
        discount: 0,
        finalPrice: 300,
        orderDate: new Date(),
      } as any);

      expect(created).toBeDefined();
      expect(created.products).toHaveLength(2);
    });

    it("should handle orders with discount", async () => {
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 1000,
        discount: 100,
        finalPrice: 900,
        orderDate: new Date(),
      } as any);

      expect(created).toBeDefined();
      expect(created.discount).toBe(100);
      expect(created.finalPrice).toBe(900);
    });

    it("should handle orders with payment history", async () => {
      const paymentId = new mongoose.Types.ObjectId();
      
      const created = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "partially_paid",
        paymentHistory: [
          {
            paymentId: paymentId,
            amount: 500,
            date: new Date(),
            method: "cash",
          },
        ],
        status: "pending",
        totalPrice: 1000,
        discount: 0,
        finalPrice: 1000,
        orderDate: new Date(),
      } as any);

      expect(created).toBeDefined();
      expect(created.paymentHistory).toHaveLength(1);
      expect(created.paymentHistory[0].amount).toBe(500);
    });

    it("should not include deleted orders in normal queries", async () => {
      const order1 = await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.create({
        clientId: testClientId,
        employeeId: testEmployeeId,
        products: [createDefaultProduct()],
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "pending",
        totalPrice: 100,
        discount: 0,
        finalPrice: 100,
        orderDate: new Date(),
      } as any);

      await repository.delete(order1._id);

      const result = await repository.findAll(1, 10);

      expect(result.items).toHaveLength(1); // Apenas o não deletado
    });
  });
});

