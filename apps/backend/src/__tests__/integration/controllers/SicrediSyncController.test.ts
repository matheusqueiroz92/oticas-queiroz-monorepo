import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
  jest,
} from "@jest/globals";

// Mock do SicrediSyncService para evitar chamadas reais à API
jest.mock("../../../services/SicrediSyncService");

describe("SicrediSyncController", () => {
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;

  afterAll(async () => {
    jest.clearAllTimers();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpar collections
    await User.deleteMany({});

    // Criar usuários de teste
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      cpf: "11111111111",
      rg: "111111111",
      birthDate: new Date("1990-01-01"),
    });

    const employeeUser = await User.create({
      name: "Employee User",
      email: "employee@test.com",
      password: await bcrypt.hash("employee123", 10),
      role: "employee",
      cpf: "22222222222",
      rg: "222222222",
      birthDate: new Date("1990-01-01"),
    });

    const customerUser = await User.create({
      name: "Customer User",
      email: "customer@test.com",
      password: await bcrypt.hash("customer123", 10),
      role: "customer",
      cpf: "33333333333",
      rg: "333333333",
      birthDate: new Date("1990-01-01"),
    });

    // Gerar tokens
    adminToken = generateToken(adminUser._id.toString(), adminUser.role);
    employeeToken = generateToken(employeeUser._id.toString(), employeeUser.role);
    customerToken = generateToken(customerUser._id.toString(), customerUser.role);
  });

  // ==================== POST /api/sicredi-sync/start ====================

  describe("POST /api/sicredi-sync/start", () => {
    it("should start auto sync with admin token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 30 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("intervalMinutes", 30);
      expect(res.body.message).toContain("30 minutos");
    });

    it("should use default interval when not provided", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("intervalMinutes", 30); // Valor padrão
    });

    it("should accept minimum interval (5 minutes)", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 5 });

      expect(res.status).toBe(200);
      expect(res.body.intervalMinutes).toBe(5);
    });

    it("should accept maximum interval (1440 minutes / 24 hours)", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 1440 });

      expect(res.status).toBe(200);
      expect(res.body.intervalMinutes).toBe(1440);
    });

    it("should reject interval below minimum (< 5 minutes)", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 4 });

      expect(res.status).toBe(400);
    });

    it("should reject interval above maximum (> 1440 minutes)", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 1441 });

      expect(res.status).toBe(400);
    });

    it("should reject employee token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ intervalMinutes: 30 });

      expect(res.status).toBe(403);
    });

    it("should reject customer token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ intervalMinutes: 30 });

      expect(res.status).toBe(403);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .send({ intervalMinutes: 30 });

      expect(res.status).toBe(401);
    });

    it("should reject invalid interval type (string)", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: "thirty" });

      expect(res.status).toBe(400);
    });

    it("should reject negative interval", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: -10 });

      expect(res.status).toBe(400);
    });

    it("should reject zero interval", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 0 });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /api/sicredi-sync/stop ====================

  describe("POST /api/sicredi-sync/stop", () => {
    it("should stop auto sync with admin token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("parada");
    });

    it("should reject employee token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject customer token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).post("/api/sicredi-sync/stop");

      expect(res.status).toBe(401);
    });

    it("should allow stopping even if not started", async () => {
      // Não inicia, mas tenta parar
      const res = await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ==================== GET /api/sicredi-sync/status ====================

  describe("GET /api/sicredi-sync/status", () => {
    it("should get sync status with admin token", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("isRunning");
      expect(res.body.data).toHaveProperty("stats");
    });

    it("should get sync status with employee token", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/status")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("data");
    });

    it("should reject customer token", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/status")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).get("/api/sicredi-sync/status");

      expect(res.status).toBe(401);
    });

    it("should return proper status structure", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.isRunning).toBe("boolean");
      expect(res.body.data.stats).toBeInstanceOf(Object);
    });
  });

  // ==================== POST /api/sicredi-sync/perform ====================

  describe("POST /api/sicredi-sync/perform", () => {
    it("should perform manual sync with admin token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/perform")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("data");
    });

    it("should perform manual sync with employee token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/perform")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should reject customer token", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/perform")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).post("/api/sicredi-sync/perform");

      expect(res.status).toBe(401);
    });

    it("should return sync result with expected fields", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/perform")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Object);
      // Campos esperados podem variar, mas devemos ter um objeto de dados
    });
  });

  // ==================== POST /api/sicredi-sync/client/:clientId ====================

  describe("POST /api/sicredi-sync/client/:clientId", () => {
    const testClientId = "client123";

    it("should sync client payments with admin token", async () => {
      const res = await request(app)
        .post(`/api/sicredi-sync/client/${testClientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("data");
    });

    it("should sync client payments with employee token", async () => {
      const res = await request(app)
        .post(`/api/sicredi-sync/client/${testClientId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
    });

    it("should reject customer token", async () => {
      const res = await request(app)
        .post(`/api/sicredi-sync/client/${testClientId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).post(
        `/api/sicredi-sync/client/${testClientId}`
      );

      expect(res.status).toBe(401);
    });

    it("should reject empty clientId", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/client/")
        .set("Authorization", `Bearer ${adminToken}`);

      // Pode retornar 404 (rota não encontrada) ou 400
      expect([400, 404]).toContain(res.status);
    });

    it("should handle very long clientId", async () => {
      const longClientId = "a".repeat(1000);

      const res = await request(app)
        .post(`/api/sicredi-sync/client/${longClientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Deve aceitar ou retornar erro específico
      expect([200, 400, 404]).toContain(res.status);
    });

    it("should handle special characters in clientId", async () => {
      const specialClientId = "client@#$%^&*()";

      const res = await request(app)
        .post(`/api/sicredi-sync/client/${specialClientId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      // Deve aceitar (validação acontece no service)
      expect([200, 400, 404]).toContain(res.status);
    });

    it("should handle MongoDB ObjectId format", async () => {
      const objectId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/sicredi-sync/client/${objectId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ==================== GET /api/sicredi-sync/logs ====================

  describe("GET /api/sicredi-sync/logs", () => {
    it("should get sync logs with admin token", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("data");
      expect(res.body.data).toHaveProperty("logs");
      expect(res.body.data).toHaveProperty("totalLines");
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it("should reject employee token", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/logs")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject customer token", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/logs")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).get("/api/sicredi-sync/logs");

      expect(res.status).toBe(401);
    });

    it("should return logs as array", async () => {
      const res = await request(app)
        .get("/api/sicredi-sync/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(typeof res.body.data.totalLines).toBe("number");
    });
  });

  // ==================== WORKFLOW & INTEGRATION TESTS ====================

  describe("Workflow & Integration", () => {
    it("should start, check status, and stop sync", async () => {
      // 1. Iniciar sync
      const startRes = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 15 });

      expect(startRes.status).toBe(200);

      // 2. Verificar status
      const statusRes = await request(app)
        .get("/api/sicredi-sync/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data).toHaveProperty("isRunning");

      // 3. Parar sync
      const stopRes = await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(stopRes.status).toBe(200);
    });

    it("should perform manual sync while auto sync is stopped", async () => {
      // Parar auto sync (caso esteja rodando)
      await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      // Executar sync manual
      const res = await request(app)
        .post("/api/sicredi-sync/perform")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it("should sync specific client after performing general sync", async () => {
      // 1. Sync geral
      const generalSyncRes = await request(app)
        .post("/api/sicredi-sync/perform")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(generalSyncRes.status).toBe(200);

      // 2. Sync específico de cliente
      const clientSyncRes = await request(app)
        .post("/api/sicredi-sync/client/client123")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(clientSyncRes.status).toBe(200);
    });

    it("should handle multiple start requests gracefully", async () => {
      // Primeira solicitação
      const res1 = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 30 });

      expect(res1.status).toBe(200);

      // Segunda solicitação (deve sobrescrever)
      const res2 = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 60 });

      expect(res2.status).toBe(200);
      expect(res2.body.intervalMinutes).toBe(60);
    });

    it("should handle multiple concurrent sync requests", async () => {
      const promises = Array(3)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/sicredi-sync/perform")
            .set("Authorization", `Bearer ${adminToken}`)
        );

      const results = await Promise.all(promises);

      // Todos devem retornar sucesso
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });

    it("should maintain proper state across stop and start", async () => {
      // Iniciar
      await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 20 });

      // Parar
      await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      // Iniciar novamente com intervalo diferente
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 40 });

      expect(res.status).toBe(200);
      expect(res.body.intervalMinutes).toBe(40);
    });
  });

  // ==================== EDGE CASES & ERROR HANDLING ====================

  describe("Edge Cases & Error Handling", () => {
    it("should handle decimal interval values", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 30.5 });

      // Pode aceitar ou rejeitar dependendo da validação
      expect([200, 400]).toContain(res.status);
    });

    it("should handle null interval", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: null });

      expect([200, 400]).toContain(res.status);
    });

    it("should handle missing body in start request", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`);

      // Deve usar o valor padrão (30)
      expect(res.status).toBe(200);
      expect(res.body.intervalMinutes).toBe(30);
    });

    it("should handle very large interval number", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 999999 });

      expect(res.status).toBe(400); // Acima do máximo (1440)
    });

    it("should handle invalid JSON in request body", async () => {
      const res = await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .set("Content-Type", "application/json")
        .send("{ invalid json }");

      expect(res.status).toBe(400);
    });

    it("should handle status request during active sync", async () => {
      // Iniciar sync
      await request(app)
        .post("/api/sicredi-sync/start")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ intervalMinutes: 30 });

      // Verificar status imediatamente
      const res = await request(app)
        .get("/api/sicredi-sync/status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("isRunning");
    });

    it("should handle stop request when sync is not running", async () => {
      // Garantir que está parado
      await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      // Tentar parar novamente
      const res = await request(app)
        .post("/api/sicredi-sync/stop")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200); // Deve aceitar graciosamente
    });
  });
});

