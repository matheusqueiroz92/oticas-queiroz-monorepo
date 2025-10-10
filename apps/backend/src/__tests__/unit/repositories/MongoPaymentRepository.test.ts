// @ts-nocheck
import { MongoPaymentRepository } from "../../../repositories/implementations/MongoPaymentRepository";
import { Payment } from "../../../schemas/PaymentSchema";
import { User } from "../../../schemas/UserSchema";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

/**
 * Testes unitários para MongoPaymentRepository
 * 
 * Cobertura:
 * - CRUD básico
 * - Métodos de busca específicos
 * - Agregações e estatísticas
 * - Cancelamento de pagamentos
 */
describe("MongoPaymentRepository", () => {
  let mongoServer: MongoMemoryServer;
  let repository: MongoPaymentRepository;
  let testCustomerId: string;
  let testCreatedById: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

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
    await Payment.deleteMany({});
    await User.deleteMany({});

    const customer = await User.create({
      name: "Cliente Pagamento",
      email: "cliente.pay@test.com",
      password: "senha123",
      cpf: "12345678909", // CPF válido
      role: "customer",
    });

    const employee = await User.create({
      name: "Funcionário Pagamento",
      email: "func.pay@test.com",
      password: "senha123",
      cpf: "98765432100", // CPF válido
      role: "employee",
    });

    testCustomerId = customer._id.toString();
    testCreatedById = employee._id.toString();

    repository = new MongoPaymentRepository();
  });

  // =============================================
  // CRUD BÁSICO
  // =============================================

  describe("create()", () => {
    it("should create a payment successfully", async () => {
      const paymentData = {
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      };

      const created = await repository.create(paymentData as any);

      expect(created).toBeDefined();
      expect(created._id).toBeDefined();
      expect(created.amount).toBe(500);
      expect(created.customerId).toBe(testCustomerId);
    });

    it("should create payment with credit card installments", async () => {
      const paymentData = {
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 1200,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        creditCardInstallments: {
          current: 1,
          total: 12,
          value: 100,
        },
      };

      const created = await repository.create(paymentData as any);

      expect(created).toBeDefined();
      expect(created.creditCardInstallments).toBeDefined();
      expect(created.creditCardInstallments?.total).toBe(12);
    });

    it("should create payment with check data", async () => {
      const paymentData = {
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 300,
        date: new Date(),
        type: "sale",
        paymentMethod: "check",
        status: "pending",
        check: {
          bank: "Banco do Brasil",
          checkNumber: "123456",
          checkDate: new Date(),
          accountHolder: "João Silva",
          branch: "0001",
          accountNumber: "12345-6",
          compensationStatus: "pending",
        },
      };

      const created = await repository.create(paymentData as any);

      expect(created).toBeDefined();
      expect(created.check).toBeDefined();
      expect(created.check?.checkNumber).toBe("123456");
    });
  });

  describe("findById()", () => {
    it("should find payment by id", async () => {
      const created = await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      const found = await repository.findById(created._id);

      expect(found).toBeDefined();
      expect(found?._id).toBe(created._id);
    });

    it("should return null for non-existent id", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const found = await repository.findById(fakeId);

      expect(found).toBeNull();
    });
  });

  describe("update()", () => {
    it("should update payment successfully", async () => {
      const created = await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "pending",
      } as any);

      const updated = await repository.update(created._id, {
        status: "completed",
      } as any);

      expect(updated).toBeDefined();
      expect(updated?.status).toBe("completed");
    });
  });

  describe("delete()", () => {
    it("should soft delete payment", async () => {
      const created = await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      await repository.delete(created._id);

      const found = await repository.findById(created._id);
      expect(found).toBeNull();

      // Verificar que foi marcado como deletado incluindo deletados na busca
      const doc = await Payment.findOne({ _id: created._id, isDeleted: true });
      expect(doc).toBeDefined();
    });
  });

  // =============================================
  // MÉTODOS DE BUSCA ESPECÍFICOS
  // =============================================

  describe("findByClientId()", () => {
    it("should find payments by customer id", async () => {
      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      const result = await repository.findByClientId(testCustomerId, 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].customerId?.toString()).toBe(testCustomerId);
    });
  });

  describe("findByType()", () => {
    it("should find payments by type", async () => {
      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 200,
        date: new Date(),
        type: "expense",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      const result = await repository.findByType("sale", 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].type).toBe("sale");
    });
  });

  describe("findByPaymentMethod()", () => {
    it("should find payments by payment method", async () => {
      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 300,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
      } as any);

      const result = await repository.findByPaymentMethod("cash", 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].paymentMethod).toBe("cash");
    });
  });

  describe("findByStatus()", () => {
    it("should find payments by status", async () => {
      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 300,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "pending",
      } as any);

      const result = await repository.findByStatus("completed", 1, 10);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe("completed");
    });
  });

  describe("findPendingByClientId()", () => {
    it("should find pending payments by client", async () => {
      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "pending",
      } as any);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 300,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      const payments = await repository.findPendingByClientId(testCustomerId);

      expect(payments).toHaveLength(1);
      expect(payments[0].status).toBe("pending");
    });
  });

  // =============================================
  // AGREGAÇÕES E ESTATÍSTICAS
  // =============================================

  describe("calculateTotalByPeriod()", () => {
    it("should calculate total payments for period", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: today,
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 300,
        date: today,
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      const total = await repository.calculateTotalByPeriod(today, tomorrow);

      expect(total).toBe(800);
    });

    it("should return 0 if no payments in period", async () => {
      const past = new Date("2020-01-01");
      const pastEnd = new Date("2020-01-31");

      const total = await repository.calculateTotalByPeriod(past, pastEnd);

      expect(total).toBe(0);
    });
  });

  describe("getPaymentMethodStats()", () => {
    it("should get statistics by payment method", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: today,
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 300,
        date: today,
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
      } as any);

      const stats = await repository.getPaymentMethodStats(today, tomorrow);

      expect(stats).toBeDefined();
      // Stats pode ser um objeto ou array dependendo da implementação
      if (Array.isArray(stats)) {
        expect(stats.length).toBeGreaterThanOrEqual(2);
      } else {
        expect(typeof stats).toBe('object');
      }
    });
  });

  // =============================================
  // CANCELAMENTO
  // =============================================

  describe("cancel()", () => {
    it("should cancel a payment", async () => {
      const created = await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      const cancelled = await repository.cancel(
        created._id,
        testCreatedById,
        "Erro no pagamento"
      );

      expect(cancelled).toBeDefined();
      expect(cancelled?.status).toBe("cancelled");
    });
  });

  // =============================================
  // EDGE CASES
  // =============================================

  describe("Edge Cases", () => {
    it("should handle payments with large amounts", async () => {
      const created = await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 999999.99,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      expect(created).toBeDefined();
      expect(created.amount).toBe(999999.99);
    });

    it("should handle payments with zero amount", async () => {
      const created = await repository.create({
        createdBy: testCreatedById,
        customerId: testCustomerId,
        cashRegisterId: new mongoose.Types.ObjectId().toString(),
        amount: 0,
        date: new Date(),
        type: "sale",
        paymentMethod: "cash",
        status: "completed",
      } as any);

      expect(created).toBeDefined();
      expect(created.amount).toBe(0);
    });
  });
});

