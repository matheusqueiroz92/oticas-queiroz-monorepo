import request from "supertest";
import app from "../../../app";
import { CashRegister } from "../../../schemas/CashRegisterSchema";
import { User } from "../../../schemas/UserSchema";
import { Payment } from "../../../schemas/PaymentSchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("CashRegisterController", () => {
  let adminToken: string;
  let employeeToken: string;
  let adminId: string;
  let employeeId: string;

  beforeEach(async () => {
    await Promise.all([
      CashRegister.deleteMany({}),
      User.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    // Criar admin
    const admin = await User.create({
      name: "Admin Test",
      email: `admin.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");
    adminId = admin._id.toString();

    // Criar employee
    const employee = await User.create({
      name: "Employee Test",
      email: `employee.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");
    employeeId = employee._id.toString();
  });

  describe("POST /api/cash-registers/open", () => {
    it("should open a new register when admin", async () => {
      const openingDate = new Date();
      const res = await request(app)
        .post("/api/cash-registers/open")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          openingBalance: 1000,
          observations: "Test opening",
          openingDate,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.openingBalance).toBe(1000);
      expect(res.body.status).toBe("open");
      expect(res.body.openedBy).toBe(adminId);
      expect(new Date(res.body.openingDate).getTime()).toBeCloseTo(
        openingDate.getTime(),
        -3
      );
    });

    it("should not allow employee to open register", async () => {
      const res = await request(app)
        .post("/api/cash-registers/open")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          openingBalance: 1000,
          openingDate: new Date(),
        });

      expect(res.status).toBe(403);
    });

    it("should validate negative opening balance", async () => {
      const res = await request(app)
        .post("/api/cash-registers/open")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          openingBalance: -100,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/cash-registers/close", () => {
    it("should close current register when admin", async () => {
      // Primeiro abre um caixa
      const openRegister = await CashRegister.create({
        openingDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1500,
        status: "open",
        sales: {
          total: 400,
          cash: 200,
          credit: 200,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 100,
          made: 0,
        },
        openedBy: adminId,
      });

      const res = await request(app)
        .post("/api/cash-registers/close")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          closingBalance: 1500,
          observations: "Test closing",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("closed");
      expect(res.body.closingBalance).toBe(1500);
      expect(res.body.closedBy).toBe(adminId);
      expect(res.body.closingDate).toBeDefined();
    });

    it("should not allow employee to close register", async () => {
      const res = await request(app)
        .post("/api/cash-registers/close")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          closingBalance: 1000,
        });

      expect(res.status).toBe(403);
    });

    it("should return error if no open register exists", async () => {
      const res = await request(app)
        .post("/api/cash-registers/close")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          closingBalance: 1000,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Não há caixa aberto");
    });
  });

  describe("GET /api/cash-registers/current", () => {
    it("should get current open register", async () => {
      const register = await CashRegister.create({
        openingDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1000,
        status: "open",
        sales: {
          total: 0,
          cash: 0,
          credit: 0,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 0,
          made: 0,
        },
        openedBy: adminId,
      });

      const res = await request(app)
        .get("/api/cash-registers/current")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(register._id.toString());
      expect(res.body.status).toBe("open");
    });

    it("should return 404 if no open register", async () => {
      const res = await request(app)
        .get("/api/cash-registers/current")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Não há caixa aberto");
    });

    it("should return 404 if no open register", async () => {
      const res = await request(app)
        .get("/api/cash-registers/current")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Não há caixa aberto");
    });
  });

  describe("GET /api/cash-registers/:id/summary", () => {
    it("should get register summary", async () => {
      // Criar o caixa
      const register = await CashRegister.create({
        openingDate: new Date(),
        openingBalance: 1000,
        currentBalance: 1500,
        status: "closed",
        sales: {
          total: 400,
          cash: 200,
          credit: 200,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 100,
          made: 0,
        },
        openedBy: adminId,
        closedBy: adminId,
        closingBalance: 1500,
        closingDate: new Date(),
      });

      // Criar os pagamentos associados ao caixa
      await Payment.create([
        {
          type: "sale",
          amount: 200,
          paymentMethod: "cash",
          date: new Date(),
          status: "completed",
          cashRegisterId: register._id,
          createdBy: adminId,
        },
        {
          type: "debt_payment",
          amount: 100,
          paymentMethod: "cash",
          date: new Date(),
          status: "completed",
          cashRegisterId: register._id,
          createdBy: adminId,
        },
      ]);

      const res = await request(app)
        .get(`/api/cash-registers/${register._id}/summary`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.register._id).toBe(register._id.toString());
      expect(res.body.payments.sales.total).toBe(200);
      expect(res.body.payments.debts.received).toBe(100);
    });

    it("should return 404 for non-existent register", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011"; // ID MongoDB válido mas inexistente
      const res = await request(app)
        .get(`/api/cash-registers/${nonExistentId}/summary`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/cash-registers/daily-summary", () => {
    it("should get daily summary", async () => {
      // Garantir que a data está no início do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Criar um registro para o dia
      const register = await CashRegister.create({
        openingDate: today,
        openingBalance: 1000,
        currentBalance: 1500,
        status: "closed",
        sales: {
          total: 400,
          cash: 200,
          credit: 200,
          debit: 0,
          pix: 0,
        },
        payments: {
          received: 100,
          made: 0,
        },
        openedBy: adminId,
        closedBy: adminId,
        closingBalance: 1500,
        closingDate: today,
      });

      // Criar pagamentos para o registro
      await Payment.create([
        {
          type: "sale",
          amount: 200,
          paymentMethod: "cash",
          date: today,
          status: "completed",
          cashRegisterId: register._id,
          createdBy: adminId,
        },
        {
          type: "debt_payment",
          amount: 100,
          paymentMethod: "cash",
          date: today,
          status: "completed",
          cashRegisterId: register._id,
          createdBy: adminId,
        },
      ]);

      // Fazer a requisição com a rota correta
      const res = await request(app)
        .get("/api/cash-registers/summary/daily")
        .query({ date: today.toISOString() })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.openingBalance).toBe(1000);
      expect(res.body.currentBalance).toBe(1500);
      expect(res.body.totalSales).toBe(400);
    });

    it("should return 404 for date with no registers", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const res = await request(app)
        .get("/api/cash-registers/daily-summary")
        .query({ date: yesterday.toISOString() })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Caixa não encontrado");
    });
  });
});
