import request from "supertest";
import app from "../../../app";
import { LegacyClient } from "../../../schemas/LegacyClientSchema";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { describe, it, expect, beforeEach } from "@jest/globals";

describe("LegacyClientController", () => {
  let adminToken: string;
  let employeeToken: string;
  let adminId: string;
  let employeeId: string;
  let clientId: string;

  beforeEach(async () => {
    await Promise.all([LegacyClient.deleteMany({}), User.deleteMany({})]);

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

    // Criar cliente legado
    const client = await LegacyClient.create({
      name: "Legacy Client Test",
      documentId: "12345678900",
      email: "client@test.com",
      phone: "11999999999",
      totalDebt: 1000,
      status: "active",
      paymentHistory: [],
    });
    clientId = client._id.toString();
  });

  describe("POST /api/legacy-clients", () => {
    it("should create a legacy client when employee", async () => {
      const clientData = {
        name: "New Legacy Client",
        documentId: "98765432100",
        email: "new@test.com",
        phone: "11988888888",
        totalDebt: 500,
      };

      const res = await request(app)
        .post("/api/legacy-clients")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(clientData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.documentId).toBe("98765432100");
      expect(res.body.status).toBe("active");
    });

    it("should not create client with existing document", async () => {
      const clientData = {
        name: "Another Client",
        documentId: "12345678900",
        totalDebt: 500,
      };

      const res = await request(app)
        .post("/api/legacy-clients")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(clientData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Cliente já cadastrado com este documento");
    });

    it("should validate document format", async () => {
      const clientData = {
        name: "Invalid Doc Client",
        documentId: "123456",
        totalDebt: 500,
      };

      const res = await request(app)
        .post("/api/legacy-clients")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(clientData);

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toBe(
        "Documento deve ter no mínimo 11 dígitos"
      );
    });
  });

  describe("GET /api/legacy-clients", () => {
    it("should get all legacy clients with pagination", async () => {
      const res = await request(app)
        .get("/api/legacy-clients")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.clients).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
      expect(res.body.pagination.page).toBe(1);
    });

    it("should filter clients by status", async () => {
      await LegacyClient.create({
        name: "Inactive Client",
        documentId: "98765432100",
        totalDebt: 0,
        status: "inactive",
      });

      const res = await request(app)
        .get("/api/legacy-clients?status=active")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.clients).toHaveLength(1);
      expect(res.body.clients[0].status).toBe("active");
    });
  });

  describe("GET /api/legacy-clients/:id", () => {
    it("should get client by id", async () => {
      const res = await request(app)
        .get(`/api/legacy-clients/${clientId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(clientId);
      expect(res.body.name).toBe("Legacy Client Test");
    });
  });

  describe("GET /api/legacy-clients/debtors", () => {
    it("should get list of debtors", async () => {
      const res = await request(app)
        .get("/api/legacy-clients/debtors")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].totalDebt).toBe(1000);
    });

    it("should filter debtors by debt range", async () => {
      await LegacyClient.create({
        name: "Big Debtor",
        documentId: "98765432100",
        totalDebt: 2000,
        status: "active",
      });

      const res = await request(app)
        .get("/api/legacy-clients/debtors?minDebt=1500")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].totalDebt).toBe(2000);
    });
  });

  describe("GET /api/legacy-clients/:id/payment-history", () => {
    it("should get payment history", async () => {
      // Criar o histórico de pagamento diretamente no cliente
      const paymentId = new mongoose.Types.ObjectId();
      const paymentDate = new Date();

      await LegacyClient.findByIdAndUpdate(
        clientId,
        {
          $push: {
            paymentHistory: {
              date: paymentDate,
              amount: 100,
              paymentId,
            },
          },
        },
        { new: true }
      );

      const res = await request(app)
        .get(`/api/legacy-clients/${clientId}/payment-history`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(100);
      expect(res.body[0].paymentId).toBe(paymentId.toString());
      expect(new Date(res.body[0].date)).toEqual(paymentDate);
    });

    it("should filter by date range", async () => {
      const paymentId = new mongoose.Types.ObjectId();
      const paymentDate = new Date();

      await LegacyClient.findByIdAndUpdate(clientId, {
        $push: {
          paymentHistory: {
            date: paymentDate,
            amount: 100,
            paymentId,
          },
        },
      });

      const startDate = new Date(paymentDate);
      startDate.setDate(startDate.getDate() - 1);

      const res = await request(app)
        .get(`/api/legacy-clients/${clientId}/payment-history`)
        .query({
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        })
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(100);
    });
  });
});
