import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
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
import path from "node:path";
import fs from "node:fs";

describe("UserController", () => {
  let adminToken: string;
  let employeeToken: string;
  let customerToken: string;
  let customerId: string;
  let employeeId: string;

  const uploadsPath = path.join(__dirname, "../../../../uploads/users");

  const cleanUploads = () => {
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }
  };

  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    password: "123456",
    role: "customer" as const,
    address: "Test Address",
    phone: "11999999999",
    prescription: {
      leftEye: -2.5,
      rightEye: -2.0,
      addition: 1.0,
    },
  };

  beforeEach(async () => {
    await User.deleteMany({});

    // Criar admin
    const admin = await User.create({
      name: "Admin Test",
      email: `admin.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "admin",
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    // Criar funcionário
    const employee = await User.create({
      name: "Employee Test",
      email: `employee.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "employee",
    });
    employeeToken = generateToken(employee._id.toString(), "employee");
    employeeId = employee._id.toString();

    // Criar cliente
    const customer = await User.create({
      name: "Customer Test",
      email: `customer.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "customer",
    });
    customerToken = generateToken(customer._id.toString(), "customer");
    customerId = customer._id.toString();
  });

  describe("GET /api/users", () => {
    it("should get all users when admin", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should not allow employee to get all users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it("should not allow customer to get all users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/users/profile", () => {
    it("should get own profile", async () => {
      const res = await request(app)
        .get("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Customer Test");
      expect(res.body).not.toHaveProperty("password");
    });

    it("should not get profile without token", async () => {
      const res = await request(app).get("/api/users/profile");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should get user by id when admin", async () => {
      const res = await request(app)
        .get(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(customerId);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should get user by id when employee", async () => {
      const res = await request(app)
        .get(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(customerId);
    });

    it("should not allow customer to get other user's data", async () => {
      const res = await request(app)
        .get(`/api/users/${employeeId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .get(`/api/users/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/users/profile", () => {
    it("should update own profile", async () => {
      const updateData = {
        name: "Updated Name",
        address: "Updated Address",
        phone: "11988888888",
      };

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.address).toBe(updateData.address);
      expect(res.body.phone).toBe(updateData.phone);
    });

    it("should not allow role update in profile", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ role: "admin" });

      expect(res.status).toBe(400);
    });

    it("should validate email format", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ email: "invalid-email" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user when admin", async () => {
      const updateData = {
        name: "Updated by Admin",
        role: "employee",
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.role).toBe(updateData.role);
    });

    it("should allow employee to update customer data", async () => {
      const updateData = {
        prescription: {
          leftEye: -3.0,
          rightEye: -2.5,
        },
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.prescription).toEqual(updateData.prescription);
    });

    it("should not allow employee to update roles", async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ role: "admin" });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete user when admin", async () => {
      const res = await request(app)
        .delete(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      const deletedUser = await User.findById(customerId);
      expect(deletedUser).toBeNull();
    });

    it("should not allow employee to delete users", async () => {
      const res = await request(app)
        .delete(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it("should not allow customer to delete users", async () => {
      const res = await request(app)
        .delete(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .delete(`/api/users/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("Customer specific features", () => {
    it("should update customer prescription", async () => {
      const prescription = {
        leftEye: -1.5,
        rightEye: -1.0,
        addition: 2.0,
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ prescription });

      expect(res.status).toBe(200);
      expect(res.body.prescription).toEqual(prescription);
    });

    it("should update customer purchase history", async () => {
      const purchases = [new Types.ObjectId().toString()];

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ purchases });

      expect(res.status).toBe(200);
      expect(res.body.purchases).toEqual(purchases);
    });

    it("should update customer debts", async () => {
      const debts = 150.5;

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ debts });

      expect(res.status).toBe(200);
      expect(res.body.debts).toBe(debts);
    });
  });
});
