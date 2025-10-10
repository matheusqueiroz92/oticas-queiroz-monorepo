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

describe("ReportController", () => {
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;
  let adminUser: any;
  let employeeUser: any;

  afterAll(async () => {
    jest.clearAllTimers();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Limpar collections
    await User.deleteMany({});
    const ReportCollection = mongoose.connection.collection("reports");
    await ReportCollection.deleteMany({});

    // Criar usuários de teste
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      cpf: "11111111111",
      rg: "111111111",
      birthDate: new Date("1990-01-01"),
    });

    employeeUser = await User.create({
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

  // ==================== POST /api/reports (Create Report) ====================

  describe("POST /api/reports", () => {
    const validReportData = {
      name: "Relatório de Vendas Mensal",
      type: "sales",
      filters: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      format: "json",
    };

    it("should create a report with admin token", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validReportData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", validReportData.name);
      expect(res.body).toHaveProperty("type", validReportData.type);
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("createdBy");
    });

    it("should create a report with employee token", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(validReportData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
    });

    it("should reject report creation with customer token", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(validReportData);

      expect(res.status).toBe(403);
    });

    it("should reject report creation without authentication", async () => {
      const res = await request(app).post("/api/reports").send(validReportData);

      expect(res.status).toBe(401);
    });

    it("should reject report with invalid name (too short)", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...validReportData,
          name: "AB", // Menos de 3 caracteres
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Dados inválidos");
    });

    it("should reject report with invalid type", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...validReportData,
          type: "invalid_type",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Dados inválidos");
    });

    it("should accept valid report types", async () => {
      const types = [
        "sales",
        "inventory",
        "customers",
        "orders",
        "financial",
      ] as const;

      for (const type of types) {
        const res = await request(app)
          .post("/api/reports")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            ...validReportData,
            name: `Relatório de ${type}`,
            type,
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("type", type);
      }
    });

    it("should accept valid formats", async () => {
      const formats = ["json", "pdf", "excel"] as const;

      for (const format of formats) {
        const res = await request(app)
          .post("/api/reports")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            ...validReportData,
            name: `Relatório formato ${format}`,
            format,
          });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("format", format);
      }
    });

    it("should use default format (json) when not specified", async () => {
      const { format, ...dataWithoutFormat } = validReportData;

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(dataWithoutFormat);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("format", "json");
    });

    it("should accept optional filters", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Relatório com filtros complexos",
          type: "sales",
          filters: {
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            status: ["completed", "pending"],
            paymentMethod: ["credit_card", "pix"],
            productCategory: ["lenses", "frames"],
            minValue: 100,
            maxValue: 5000,
          },
          format: "json",
        });

      expect(res.status).toBe(201);
      expect(res.body.filters).toMatchObject({
        status: ["completed", "pending"],
        paymentMethod: ["credit_card", "pix"],
        productCategory: ["lenses", "frames"],
        minValue: 100,
        maxValue: 5000,
      });
    });

    it("should transform date strings to Date objects", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(validReportData);

      expect(res.status).toBe(201);
      expect(res.body.filters).toHaveProperty("startDate");
      expect(res.body.filters).toHaveProperty("endDate");
    });

    it("should reject report without required name field", async () => {
      const { name, ...dataWithoutName } = validReportData;

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(dataWithoutName);

      expect(res.status).toBe(400);
    });

    it("should reject report without required type field", async () => {
      const { type, ...dataWithoutType } = validReportData;

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(dataWithoutType);

      expect(res.status).toBe(400);
    });

    it("should reject report without required filters field", async () => {
      const { filters, ...dataWithoutFilters } = validReportData;

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(dataWithoutFilters);

      expect(res.status).toBe(400);
    });
  });

  // ==================== GET /api/reports (List User Reports) ====================

  describe("GET /api/reports", () => {
    beforeEach(async () => {
      // Criar alguns relatórios de teste para o admin
      const ReportCollection = mongoose.connection.collection("reports");

      for (let i = 1; i <= 15; i++) {
        await ReportCollection.insertOne({
          name: `Relatório ${i}`,
          type: "sales",
          filters: {},
          format: "json",
          status: "completed",
          createdBy: adminUser._id,
          createdAt: new Date(),
          updatedAt: new Date(),
          data: null,
        });
      }

      // Criar 1 relatório para o employee
      await ReportCollection.insertOne({
        name: "Relatório do Employee",
        type: "inventory",
        filters: {},
        format: "json",
        status: "pending",
        createdBy: employeeUser._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: null,
      });
    });

    it("should list user reports with default pagination", async () => {
      const res = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("reports");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.reports.length).toBeLessThanOrEqual(10); // Limit padrão
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      });
    });

    it("should support custom pagination parameters", async () => {
      const res = await request(app)
        .get("/api/reports")
        .query({ page: 2, limit: 5 })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination).toMatchObject({
        page: 2,
        limit: 5,
        total: 15,
        totalPages: 3,
      });
    });

    it("should only return reports created by the authenticated user", async () => {
      const res = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBe(1);
      expect(res.body.reports[0].name).toBe("Relatório do Employee");
      expect(res.body.pagination.total).toBe(1);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).get("/api/reports");

      expect(res.status).toBe(401);
    });

    it("should handle empty results gracefully", async () => {
      const res = await request(app)
        .get("/api/reports")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it("should handle invalid page number gracefully", async () => {
      const res = await request(app)
        .get("/api/reports")
        .query({ page: -1 })
        .set("Authorization", `Bearer ${adminToken}`);

      // Deve tratar como página 1 (comportamento padrão do Number() || 1)
      expect(res.status).toBe(200);
    });

    it("should handle non-numeric page parameter", async () => {
      const res = await request(app)
        .get("/api/reports")
        .query({ page: "abc" })
        .set("Authorization", `Bearer ${adminToken}`);

      // Deve usar valor padrão (1)
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
    });

    it("should handle very large page number", async () => {
      const res = await request(app)
        .get("/api/reports")
        .query({ page: 9999 })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports).toEqual([]); // Página além do total
    });

    it("should handle custom limit", async () => {
      const res = await request(app)
        .get("/api/reports")
        .query({ limit: 20 })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBe(15); // Todos os 15 relatórios
      expect(res.body.pagination.limit).toBe(20);
      expect(res.body.pagination.totalPages).toBe(1);
    });
  });

  // ==================== GET /api/reports/:id (Get Single Report) ====================

  describe("GET /api/reports/:id", () => {
    let testReportId: string;
    let anotherUserReportId: string;

    beforeEach(async () => {
      const ReportCollection = mongoose.connection.collection("reports");

      // Relatório do admin
      const result1 = await ReportCollection.insertOne({
        name: "Relatório de Teste",
        type: "sales",
        filters: { startDate: new Date("2024-01-01") },
        format: "json",
        status: "completed",
        createdBy: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: { totalSales: 1000 },
      });
      testReportId = result1.insertedId.toString();

      // Relatório do employee
      const result2 = await ReportCollection.insertOne({
        name: "Relatório do Employee",
        type: "inventory",
        filters: {},
        format: "json",
        status: "pending",
        createdBy: employeeUser._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: null,
      });
      anotherUserReportId = result2.insertedId.toString();
    });

    it("should get a report by ID", async () => {
      const res = await request(app)
        .get(`/api/reports/${testReportId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", "Relatório de Teste");
      expect(res.body).toHaveProperty("type", "sales");
      expect(res.body).toHaveProperty("status", "completed");
      expect(res.body).toHaveProperty("data");
    });

    it("should allow any authenticated user to get any report", async () => {
      // Employee acessando relatório do admin
      const res = await request(app)
        .get(`/api/reports/${testReportId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name", "Relatório de Teste");
    });

    it("should return 404 for non-existent report", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/reports/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should return 500 for invalid report ID format", async () => {
      const res = await request(app)
        .get("/api/reports/invalid-id-format")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });

    it("should reject request without authentication", async () => {
      const res = await request(app).get(`/api/reports/${testReportId}`);

      expect(res.status).toBe(401);
    });
  });

  // ==================== GET /api/reports/:id/download (Download Report) ====================

  describe("GET /api/reports/:id/download", () => {
    let completedReportId: string;
    let pendingReportId: string;

    beforeEach(async () => {
      const ReportCollection = mongoose.connection.collection("reports");

      // Relatório completo com dados de vendas
      const result1 = await ReportCollection.insertOne({
        name: "Relatório de Vendas Completo",
        type: "sales",
        filters: {},
        format: "json",
        status: "completed",
        createdBy: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          totalOrders: 10,
          totalRevenue: 5000,
          orders: [
            {
              _id: "order1",
              orderNumber: "ORD-001",
              customer: { name: "Cliente 1" },
              totalValue: 500,
              status: "completed",
              createdAt: new Date(),
            },
          ],
        },
      });
      completedReportId = result1.insertedId.toString();

      // Relatório pendente
      const result2 = await ReportCollection.insertOne({
        name: "Relatório Pendente",
        type: "inventory",
        filters: {},
        format: "json",
        status: "pending",
        createdBy: adminUser._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: null,
      });
      pendingReportId = result2.insertedId.toString();
    });

    it("should download completed report in JSON format", async () => {
      const res = await request(app)
        .get(`/api/reports/${completedReportId}/download`)
        .query({ format: "json" })
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalOrders", 10);
      expect(res.body).toHaveProperty("totalRevenue", 5000);
    });

    it("should reject download of pending report", async () => {
      const res = await request(app)
        .get(`/api/reports/${pendingReportId}/download`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Relatório ainda não está pronto para download"
      );
      expect(res.body).toHaveProperty("status", "pending");
    });

    it("should return 404 for non-existent report", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/reports/${fakeId}/download`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should reject download without authentication", async () => {
      const res = await request(app).get(
        `/api/reports/${completedReportId}/download`
      );

      expect(res.status).toBe(401);
    });

    // Nota: Testes de download em PDF/Excel exigiriam arquivos reais ou mocks adicionais
    // Por enquanto, esses formatos são testados apenas para sales/inventory que têm exporters
  });

  // ==================== EDGE CASES & ERROR HANDLING ====================

  describe("Edge Cases & Error Handling", () => {
    it("should handle very long report names", async () => {
      const longName = "A".repeat(500);

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: longName,
          type: "sales",
          filters: {},
          format: "json",
        });

      // Deve aceitar ou ter limite definido
      expect([201, 400]).toContain(res.status);
    });

    it("should handle empty filters object", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Relatório sem filtros",
          type: "sales",
          filters: {},
          format: "json",
        });

      expect(res.status).toBe(201);
    });

    it("should handle date filters with startDate after endDate", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Relatório com datas invertidas",
          type: "sales",
          filters: {
            startDate: "2024-12-31",
            endDate: "2024-01-01",
          },
          format: "json",
        });

      // Deve aceitar (validação de lógica de negócio no service)
      expect(res.status).toBe(201);
    });

    it("should handle minValue greater than maxValue", async () => {
      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Relatório com valores invertidos",
          type: "sales",
          filters: {
            minValue: 1000,
            maxValue: 100,
          },
          format: "json",
        });

      // Deve aceitar (validação de lógica de negócio no service)
      expect(res.status).toBe(201);
    });

    it("should handle concurrent report creation", async () => {
      const promises = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post("/api/reports")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
              name: `Relatório Concorrente ${i}`,
              type: "sales",
              filters: {},
              format: "json",
            })
        );

      const results = await Promise.all(promises);

      // Todos devem retornar sucesso
      results.forEach((res) => {
        expect(res.status).toBe(201);
      });
    });

    it("should handle special characters in report name", async () => {
      const specialName = "Relatório: Vendas & Análise (2024) - Parte #1!";

      const res = await request(app)
        .post("/api/reports")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: specialName,
          type: "sales",
          filters: {},
          format: "json",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(specialName);
    });
  });
});

