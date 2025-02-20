import request from "supertest";
import app from "../../../app";
import { LegacyClient } from "../../../schemas/LegacyClientSchema";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";

describe("LegacyClientController", () => {
  let mongoServer: MongoMemoryServer;
  let adminToken: string;
  let employeeToken: string;
  let adminId: string;
  let employeeId: string;
  let clientId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await LegacyClient.deleteMany({});
    await User.deleteMany({});

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
      documentId: "123.456.789-00",
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
        documentId: "987.654.321-00",
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
        documentId: "123.456.789-00",
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
      expect(res.body.message).toBe("Documento inválido. Deve ser CPF ou CNPJ");
    });

    it("should not create without token", async () => {
      const clientData = {
        name: "New Client",
        documentId: "987.654.321-00",
        totalDebt: 500,
      };

      const res = await request(app)
        .post("/api/legacy-clients")
        .send(clientData);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/legacy-clients", () => {
    it("should get all legacy clients with pagination", async () => {
      const res = await request(app)
        .get("/api/legacy-clients")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.clients).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it("should filter clients by status", async () => {
      await LegacyClient.create({
        name: "Inactive Client",
        documentId: "987.654.321-00",
        totalDebt: 0,
        status: "inactive",
        paymentHistory: [],
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

    it("should return 404 for non-existent client", async () => {
      const res = await request(app)
        .get(`/api/legacy-clients/${new mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/legacy-clients/document/:documentId", () => {
    it("should get client by document", async () => {
      const res = await request(app)
        .get("/api/legacy-clients/document/123.456.789-00")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.documentId).toBe("12345678900");
    });

    it("should return 404 for non-existent document", async () => {
      const res = await request(app)
        .get("/api/legacy-clients/document/999.999.999-99")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/legacy-clients/:id", () => {
    it("should update client data", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@test.com",
      };

      const res = await request(app)
        .put(`/api/legacy-clients/${clientId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.email).toBe("updated@test.com");
    });

    it("should not update to existing document", async () => {
      await LegacyClient.create({
        name: "Another Client",
        documentId: "987.654.321-00",
        totalDebt: 0,
        status: "active",
        paymentHistory: [],
      });

      const res = await request(app)
        .put(`/api/legacy-clients/${clientId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ documentId: "987.654.321-00" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/legacy-clients/:id/payment-history", () => {
    it("should get payment history", async () => {
      const paymentData = {
        date: new Date(),
        amount: 100,
        paymentId: new mongoose.Types.ObjectId().toString(),
      };

      await LegacyClient.findByIdAndUpdate(clientId, {
        $push: { paymentHistory: paymentData },
      });

      const res = await request(app)
        .get(`/api/legacy-clients/${clientId}/payment-history`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(100);
    });

    it("should filter payment history by date range", async () => {
      const oldPayment = {
        date: new Date("2023-01-01"),
        amount: 100,
        paymentId: new mongoose.Types.ObjectId().toString(),
      };

      const recentPayment = {
        date: new Date(),
        amount: 200,
        paymentId: new mongoose.Types.ObjectId().toString(),
      };

      await LegacyClient.findByIdAndUpdate(clientId, {
        $push: {
          paymentHistory: {
            $each: [oldPayment, recentPayment],
          },
        },
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // yesterday

      const res = await request(app)
        .get(`/api/legacy-clients/${clientId}/payment-history`)
        .query({
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        })
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].amount).toBe(200);
    });
  });

  describe("PATCH /api/legacy-clients/:id/toggle-status", () => {
    it("should toggle client status", async () => {
      // Primeiro paga a dívida para poder inativar
      await LegacyClient.findByIdAndUpdate(clientId, { totalDebt: 0 });

      const res = await request(app)
        .patch(`/api/legacy-clients/${clientId}/toggle-status`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("inactive");
    });

    it("should not deactivate client with debt", async () => {
      const res = await request(app)
        .patch(`/api/legacy-clients/${clientId}/toggle-status`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        "Não é possível inativar cliente com dívidas pendentes"
      );
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
        documentId: "987.654.321-00",
        totalDebt: 2000,
        status: "active",
        paymentHistory: [],
      });

      const res = await request(app)
        .get("/api/legacy-clients/debtors")
        .query({ minDebt: 1500 })
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].totalDebt).toBe(2000);
    });

    it("should only include active clients", async () => {
      await LegacyClient.findByIdAndUpdate(clientId, {
        status: "inactive",
        totalDebt: 0,
      });

      const res = await request(app)
        .get("/api/legacy-clients/debtors")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });
});
