import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
// import mongoose from "mongoose";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
  // jest,
} from "@jest/globals";

config();

describe("AuthController", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully", async () => {
      const password = "123456";
      const hashedPassword = await bcrypt.hash(password, 10);
      const email = `test${Date.now()}@example.com`;

      await User.create({
        name: "Test User",
        email,
        password: hashedPassword,
        role: "customer",
      });

      const res = await request(app).post("/api/auth/login").send({
        email,
        password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should fail with wrong password", async () => {
      const password = await bcrypt.hash("123456", 10);
      await User.create({
        name: "Test User",
        email: "test@example.com",
        password,
        role: "customer",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Credenciais inválidas");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should register new user when admin", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New User",
          email: "new@test.com",
          password: "123456",
          role: "employee",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("email", "new@test.com");
      expect(res.body).not.toHaveProperty("password");
    });

    it("should not register without token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "New User",
        email: "new@test.com",
        password: "123456",
        role: "employee",
      });

      expect(res.status).toBe(401);
    });

    it("should not register admin when employee", async () => {
      // Criar employee
      const employee = await User.create({
        name: "Employee",
        email: "employee@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "employee",
      });

      const employeeToken = generateToken(employee._id.toString(), "employee");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          name: "New Admin",
          email: "admin@test.com",
          password: "123456",
          role: "admin",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Funcionários só podem cadastrar clientes"
      );
    });

    it("should not register with existing email", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      // Tentar criar usuário com mesmo email
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Another User",
          email: "admin@test.com",
          password: "123456",
          role: "employee",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Email já cadastrado");
    });
  });
});
