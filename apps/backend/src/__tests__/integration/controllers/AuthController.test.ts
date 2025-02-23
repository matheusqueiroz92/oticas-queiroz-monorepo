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
import path from "node:path";
import fs from "node:fs";

config();

describe("AuthController", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    cleanUploads();
  });

  const uploadsPath = path.join(
    __dirname,
    "../../../../../public/images/users"
  );

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

  describe("POST /api/auth/register with image", () => {
    it("should register new user with image when admin", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const buffer = Buffer.from("fake-image");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "New User")
        .field("email", "new@test.com")
        .field("password", "123456")
        .field("role", "employee")
        .attach("image", buffer, "profile.jpg");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("image");
      expect(res.body.image).toMatch(/^\/images\/users\//);
    });

    it("should register new user without image when admin", async () => {
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
      expect(res.body).not.toHaveProperty("image");
    });

    it("should reject invalid image format", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      const buffer = Buffer.from("fake-text-file");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "New User")
        .field("email", "new@test.com")
        .field("password", "123456")
        .field("role", "employee")
        .attach("image", buffer, "invalid.txt");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP."
      );
    });

    it("should reject image larger than 5MB", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      // Create a buffer larger than 5MB
      const buffer = Buffer.alloc(6 * 1024 * 1024);

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "New User")
        .field("email", "new@test.com")
        .field("password", "123456")
        .field("role", "employee")
        .attach("image", buffer, "large-image.jpg");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Arquivo muito grande. Tamanho máximo: 5MB"
      );
    });
  });
});
