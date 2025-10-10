import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
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

// Mock do EmailService para não enviar emails reais
jest.mock("../../../services/EmailService", () => {
  return {
    EmailService: jest.fn().mockImplementation(() => {
      return {
        sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
      };
    }),
  };
});

describe("PasswordResetController", () => {
  let testUser: any;

  afterAll(async () => {
    jest.clearAllTimers();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpar collections
    await User.deleteMany({});

    // Criar usuário de teste
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: await bcrypt.hash("oldPassword123", 10),
      role: "customer",
      cpf: "12345678901",
      rg: "123456789",
      birthDate: new Date("1990-01-01"),
    });
  });

  // ==================== POST /api/auth/forgot-password ====================

  describe("POST /api/auth/forgot-password", () => {
    it("should send reset instructions for valid email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("instruções");
    });

    it("should return generic message for non-existent email (security)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });

      // Por segurança, deve retornar 200 mesmo se o email não existir
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("instruções");
    });

    it("should reject request with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject request without email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({});

      expect(res.status).toBe(400);
    });

    it("should reject request with empty email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "" });

      expect(res.status).toBe(400);
    });
  });

  // ==================== POST /api/auth/reset-password ====================

  describe("POST /api/auth/reset-password", () => {
    let validToken: string;

    beforeEach(async () => {
      // Solicitar reset para obter um token válido
      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      // Buscar o token no banco de dados
      const PasswordReset = mongoose.connection.collection("passwordresets");
      const resetDoc = await PasswordReset.findOne({ userId: testUser._id });
      validToken = resetDoc?.token || "";
    });

    it("should reset password with valid token", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
          password: "newPassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("sucesso");

      // Verificar se a senha foi realmente alterada
      const updatedUser = await User.findById(testUser._id);
      const passwordMatch = await bcrypt.compare(
        "newPassword123",
        updatedUser!.password
      );
      expect(passwordMatch).toBe(true);
    });

    it("should reject reset with invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: "invalid-token-123",
          password: "newPassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject reset with expired token", async () => {
      // Criar token expirado diretamente no banco
      const PasswordReset = mongoose.connection.collection("passwordresets");
      const expiredToken = "expired-token-123";
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2); // 2 horas no passado

      await PasswordReset.insertOne({
        userId: testUser._id,
        token: expiredToken,
        expiresAt: expiredDate,
        used: false,
      });

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: expiredToken,
          password: "newPassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("expirado");
    });

    it("should reject reset with already used token", async () => {
      // Usar o token uma vez
      await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
          password: "newPassword123",
        });

      // Tentar usar novamente
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
          password: "anotherPassword456",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("inválido");
    });

    it("should reject password shorter than 6 characters", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
          password: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject request without token", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          password: "newPassword123",
        });

      expect(res.status).toBe(400);
    });

    it("should reject request without password", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
        });

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /api/auth/reset-password/:token ====================

  describe("GET /api/auth/reset-password/:token", () => {
    let validToken: string;

    beforeEach(async () => {
      // Solicitar reset para obter um token válido
      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      // Buscar o token no banco de dados
      const PasswordReset = mongoose.connection.collection("passwordresets");
      const resetDoc = await PasswordReset.findOne({ userId: testUser._id });
      validToken = resetDoc?.token || "";
    });

    it("should validate a valid token", async () => {
      const res = await request(app).get(
        `/api/auth/reset-password/${validToken}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
      expect(res.body.valid).toBe(true);
    });

    it("should invalidate an invalid token", async () => {
      const res = await request(app).get(
        "/api/auth/reset-password/invalid-token-123"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
      expect(res.body.valid).toBe(false);
    });

    it("should invalidate an expired token", async () => {
      // Criar token expirado
      const PasswordReset = mongoose.connection.collection("passwordresets");
      const expiredToken = "expired-token-validate-123";
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 2);

      await PasswordReset.insertOne({
        userId: testUser._id,
        token: expiredToken,
        expiresAt: expiredDate,
        used: false,
      });

      const res = await request(app).get(
        `/api/auth/reset-password/${expiredToken}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
      expect(res.body.valid).toBe(false);
    });

    it("should invalidate a used token", async () => {
      // Usar o token
      await request(app).post("/api/auth/reset-password").send({
        token: validToken,
        password: "newPassword123",
      });

      // Validar o token usado
      const res = await request(app).get(
        `/api/auth/reset-password/${validToken}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
      expect(res.body.valid).toBe(false);
    });

    it("should handle empty token parameter", async () => {
      const res = await request(app).get("/api/auth/reset-password/");

      // Pode retornar 404 (rota não encontrada) ou 400
      expect([400, 404]).toContain(res.status);
    });
  });

  // ==================== SECURITY & EDGE CASES ====================

  describe("Security & Edge Cases", () => {
    it("should not reveal if email exists when requesting reset", async () => {
      // Solicitar reset para email existente
      const res1 = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      // Solicitar reset para email não existente
      const res2 = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });

      // Ambas as respostas devem ser idênticas
      expect(res1.status).toBe(res2.status);
      expect(res1.body.message).toBe(res2.body.message);
    });

    it("should handle multiple reset requests for same email", async () => {
      // Primeira solicitação
      const res1 = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      expect(res1.status).toBe(200);

      // Segunda solicitação
      const res2 = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      expect(res2.status).toBe(200);

      // Deve ter apenas um token ativo (o mais recente)
      const PasswordReset = mongoose.connection.collection("passwordresets");
      const tokens = await PasswordReset.find({ userId: testUser._id }).toArray();
      expect(tokens.length).toBe(1);
    });

    it("should invalidate old tokens when creating new one", async () => {
      // Primeira solicitação
      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      const PasswordReset = mongoose.connection.collection("passwordresets");
      const firstToken = await PasswordReset.findOne({ userId: testUser._id });

      // Segunda solicitação (deve invalidar o primeiro token)
      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      // Tentar usar o primeiro token
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: firstToken?.token,
          password: "newPassword123",
        });

      expect(res.status).toBe(400);
    });

    it("should handle very long password", async () => {
      // Solicitar token
      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      const PasswordReset = mongoose.connection.collection("passwordresets");
      const resetDoc = await PasswordReset.findOne({ userId: testUser._id });
      const validToken = resetDoc?.token || "";

      const longPassword = "a".repeat(1000);
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
          password: longPassword,
        });

      // Deve aceitar (ou ter limite definido)
      expect([200, 400]).toContain(res.status);
    });

    it("should handle special characters in password", async () => {
      // Solicitar token
      await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      const PasswordReset = mongoose.connection.collection("passwordresets");
      const resetDoc = await PasswordReset.findOne({ userId: testUser._id });
      const validToken = resetDoc?.token || "";

      const specialPassword = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: validToken,
          password: specialPassword,
        });

      expect(res.status).toBe(200);

      // Verificar se senha foi salva corretamente
      const updatedUser = await User.findById(testUser._id);
      const passwordMatch = await bcrypt.compare(
        specialPassword,
        updatedUser!.password
      );
      expect(passwordMatch).toBe(true);
    });

    it("should handle concurrent reset requests gracefully", async () => {
      // Enviar múltiplas solicitações simultâneas
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "test@example.com" })
        );

      const results = await Promise.all(promises);

      // Todas devem retornar sucesso
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // Deve ter apenas um token ativo
      const PasswordReset = mongoose.connection.collection("passwordresets");
      const tokens = await PasswordReset.find({ userId: testUser._id }).toArray();
      expect(tokens.length).toBe(1);
    });
  });

  // ==================== TOKEN EXPIRATION ====================

  describe("Token Expiration", () => {
    it("should reject token that will expire in future but is expired", async () => {
      // Este teste verifica a lógica de expiração
      const PasswordReset = mongoose.connection.collection("passwordresets");
      
      // Token que expira em 1 segundo
      const shortLivedToken = "short-lived-token";
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 1);

      await PasswordReset.insertOne({
        userId: testUser._id,
        token: shortLivedToken,
        expiresAt: expiresAt,
        used: false,
      });

      // Aguardar expiração
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          token: shortLivedToken,
          password: "newPassword123",
        });

      expect(res.status).toBe(400);
    });
  });
});

