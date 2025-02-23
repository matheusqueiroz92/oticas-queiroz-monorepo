import request from "supertest";
import app from "../../../app";
import { Payment } from "../../../schemas/PaymentSchema";
import { CashRegister } from "../../../schemas/CashRegisterSchema";
import { LegacyClient } from "../../../schemas/LegacyClientSchema";
import { User } from "../../../schemas/UserSchema";
import { Types } from "mongoose";
import {
  createTestUser,
  createTestCashRegister,
} from "../../helpers/testHelpers";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("PaymentController", () => {
  beforeEach(async () => {
    await Promise.all([
      Payment.deleteMany({}),
      CashRegister.deleteMany({}),
      LegacyClient.deleteMany({}),
      User.deleteMany({}),
    ]);
  });

  // função auxiliar para criar cliente legado
  const createLegacyClient = async () => {
    return await LegacyClient.create({
      name: "Legacy Client Test",
      documentId: "123.456.789-00",
      totalDebt: 1000,
      status: "active",
      paymentHistory: [],
    });
  };

  describe("POST /api/payments", () => {
    it("should create a payment when employee", async () => {
      const { user: admin } = await createTestUser("admin");
      const { user: employee, token: employeeToken } =
        await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      const paymentData = {
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        description: "Test payment",
        createdBy: employee._id.toString(),
      };

      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(paymentData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.amount).toBe(100);
      expect(res.body.status).toBe("completed");
    });

    it("should create a debt payment for legacy client", async () => {
      const { user: admin } = await createTestUser("admin");
      const { user: employee, token: employeeToken } =
        await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());
      const legacyClient = await createLegacyClient();

      const paymentData = {
        amount: 500,
        date: new Date(),
        type: "debt_payment",
        paymentMethod: "cash",
        legacyClientId: legacyClient._id.toString(),
        description: "Debt payment",
        createdBy: employee._id.toString(),
      };

      const res = await request(app)
        .post("/api/payments")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(paymentData);

      expect(res.status).toBe(201);
      expect(res.body.legacyClientId).toBe(legacyClient._id.toString());
      expect(res.body.type).toBe("debt_payment");

      const updatedClient = await LegacyClient.findById(legacyClient._id);
      expect(updatedClient?.totalDebt).toBe(500); // 1000 - 500
    });

    it("should not create payment without authorization", async () => {
      const res = await request(app).post("/api/payments").send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });
  });

  describe("GET /api/payments", () => {
    it("should get all payments with pagination", async () => {
      const { user: admin, token: adminToken } = await createTestUser("admin");
      const { user: employee } = await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const res = await request(app)
        .get("/api/payments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("payments");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.payments)).toBe(true);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.pagination).toHaveProperty("total", 1);
      expect(res.body.pagination).toHaveProperty("page", 1);
      expect(res.body.pagination).toHaveProperty("limit", 10);
    });

    it("should filter payments by type", async () => {
      const { user: admin, token: adminToken } = await createTestUser("admin");
      const { user: employee } = await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      await Payment.create({
        amount: 200,
        date: new Date(),
        type: "debt_payment",
        paymentMethod: "cash",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const res = await request(app)
        .get("/api/payments?type=sale")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.payments).toHaveLength(1);
      expect(res.body.payments[0].type).toBe("sale");
    });
  });

  describe("GET /api/payments/:id", () => {
    it("should get payment by id", async () => {
      const { user: admin, token: adminToken } = await createTestUser("admin");
      const { user: employee } = await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      const payment = await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const res = await request(app)
        .get(`/api/payments/${payment._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(payment._id.toString());
    });

    it("should return 404 for non-existent payment", async () => {
      const { token: adminToken } = await createTestUser("admin");

      const res = await request(app)
        .get(`/api/payments/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/payments/:id/cancel", () => {
    it("should cancel a payment when admin", async () => {
      const { user: admin, token: adminToken } = await createTestUser("admin");
      const { user: employee } = await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      const payment = await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const initialBalance = register.currentBalance;

      const res = await request(app)
        .post(`/api/payments/${payment._id}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("cancelled");

      const updatedRegister = await CashRegister.findById(register._id);
      expect(updatedRegister?.currentBalance).toBe(
        initialBalance - payment.amount
      );
    });

    it("should not cancel payment when employee", async () => {
      const { user: admin } = await createTestUser("admin");
      const { user: employee, token: employeeToken } =
        await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      const payment = await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/cancel`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Acesso não autorizado");
    });

    it("should not cancel already cancelled payment", async () => {
      const { user: admin, token: adminToken } = await createTestUser("admin");
      const { user: employee } = await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      const payment = await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "cancelled",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const res = await request(app)
        .post(`/api/payments/${payment._id}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Pagamento já está cancelado");
    });

    it("should not cancel payment without token", async () => {
      const { user: admin } = await createTestUser("admin");
      const { user: employee } = await createTestUser("employee");
      const register = await createTestCashRegister(admin._id.toString());

      const payment = await Payment.create({
        amount: 100,
        date: new Date(),
        type: "sale",
        paymentMethod: "credit",
        status: "completed",
        cashRegisterId: register._id,
        createdBy: employee._id,
      });

      const res = await request(app).post(
        `/api/payments/${payment._id}/cancel`
      );

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Token não fornecido");
    });
  });
});
