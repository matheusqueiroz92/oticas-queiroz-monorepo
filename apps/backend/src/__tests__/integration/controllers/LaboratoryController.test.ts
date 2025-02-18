import request from "supertest";
import app from "../../../app";
import { Laboratory } from "../../../schemas/LaboratorySchema";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import type { ILaboratory } from "../../../interfaces/ILaboratory";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  afterAll,
  // jest,
} from "@jest/globals";

describe("LaboratoryController", () => {
  let adminToken: string;
  let employeeToken: string;

  const mockLaboratory: Omit<ILaboratory, "_id"> = {
    name: "Test Laboratory",
    address: {
      street: "Test Street",
      number: "123",
      neighborhood: "Test Neighborhood",
      city: "Test City",
      state: "ST",
      zipCode: "12345678",
      complement: "Test Complement",
    },
    phone: "11999999999",
    email: "test@laboratory.com",
    contactName: "Test Contact",
    isActive: true,
  };

  beforeEach(async () => {
    await Laboratory.deleteMany({});
    await User.deleteMany({});

    // Criar admin e gerar token
    const admin = await User.create({
      name: "Admin Test",
      email: `admin.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    // Criar funcionário e gerar token
    const employee = await User.create({
      name: "Employee Test",
      email: `employee.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");
  });

  describe("POST /api/laboratories", () => {
    it("should create a laboratory when admin", async () => {
      const res = await request(app)
        .post("/api/laboratories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(mockLaboratory);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe(mockLaboratory.name);
    });

    it("should not create laboratory without authorization", async () => {
      const res = await request(app)
        .post("/api/laboratories")
        .send(mockLaboratory);

      expect(res.status).toBe(401);
    });

    it("should not create laboratory when employee", async () => {
      const res = await request(app)
        .post("/api/laboratories")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(mockLaboratory);

      expect(res.status).toBe(401);
    });

    it("should not create laboratory with invalid data", async () => {
      const invalidLaboratory = {
        ...mockLaboratory,
        email: "invalid-email",
        phone: "123",
      };

      const res = await request(app)
        .post("/api/laboratories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidLaboratory);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });
  });

  describe("GET /api/laboratories", () => {
    it("should get all laboratories with pagination", async () => {
      await Laboratory.create(mockLaboratory);

      const res = await request(app)
        .get("/api/laboratories")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("laboratories");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.laboratories).toHaveLength(1);
    });

    it("should filter active laboratories", async () => {
      await Laboratory.create(mockLaboratory);
      await Laboratory.create({
        ...mockLaboratory,
        email: "inactive@lab.com",
        isActive: false,
      });

      const res = await request(app)
        .get("/api/laboratories?isActive=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.laboratories).toHaveLength(1);
      expect(res.body.laboratories[0].isActive).toBe(true);
    });
  });

  describe("GET /api/laboratories/:id", () => {
    it("should get a laboratory by id", async () => {
      const laboratory = await Laboratory.create(mockLaboratory);

      const res = await request(app)
        .get(`/api/laboratories/${laboratory._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(mockLaboratory.name);
    });

    it("should return 404 for non-existent laboratory", async () => {
      const res = await request(app)
        .get("/api/laboratories/nonexistentid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/laboratories/:id", () => {
    it("should update a laboratory", async () => {
      const laboratory = await Laboratory.create(mockLaboratory);
      const updateData = { name: "Updated Laboratory" };

      const res = await request(app)
        .put(`/api/laboratories/${laboratory._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updateData.name);
    });

    it("should not update with invalid data", async () => {
      const laboratory = await Laboratory.create(mockLaboratory);
      const invalidData = { email: "invalid-email" };

      const res = await request(app)
        .put(`/api/laboratories/${laboratory._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidData);

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/laboratories/:id", () => {
    it("should delete a laboratory", async () => {
      const laboratory = await Laboratory.create(mockLaboratory);

      const res = await request(app)
        .delete(`/api/laboratories/${laboratory._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const deletedLaboratory = await Laboratory.findById(laboratory._id);
      expect(deletedLaboratory).toBeNull();
    });

    it("should return 404 for non-existent laboratory", async () => {
      const res = await request(app)
        .delete("/api/laboratories/nonexistentid")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/laboratories/:id/toggle-status", () => {
    it("should toggle laboratory status", async () => {
      const laboratory = await Laboratory.create(mockLaboratory);

      const res = await request(app)
        .patch(`/api/laboratories/${laboratory._id}/toggle-status`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);

      const toggledAgain = await request(app)
        .patch(`/api/laboratories/${laboratory._id}/toggle-status`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(toggledAgain.status).toBe(200);
      expect(toggledAgain.body.isActive).toBe(true);
    });

    it("should return 404 for non-existent laboratory", async () => {
      const res = await request(app)
        .patch("/api/laboratories/nonexistentid/toggle-status")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
