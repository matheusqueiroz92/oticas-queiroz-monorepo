import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import { Readable } from "node:stream";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  jest,
} from "@jest/globals";
import path from "node:path";
import fs from "node:fs";
import type { Request, Response, NextFunction } from "express";

config();

// Mock para o multer
jest.mock("multer", () => {
  const multer = () => ({
    single: jest
      .fn()
      .mockImplementation(
        () => (req: Request, _res: Response, next: NextFunction) => {
          // Se o teste incluir um arquivo
          if (req.body?.simulateFile) {
            req.file = {
              filename: `test-${Date.now()}.jpg`,
              path: `/images/users/test-${Date.now()}.jpg`,
              mimetype: "image/jpeg",
              destination: "/path/to/destination",
              fieldname: "image",
              originalname: "original.jpg",
              encoding: "7bit",
              size: 1024,
              stream: new Readable({ read() {} }), // Stream vazio em vez de null
              buffer: Buffer.from("test"),
            };
            req.body.simulateFile = undefined;
          }
          next();
        }
      ),
  });

  // Adiciona a função diskStorage ao mock do multer
  multer.diskStorage = jest.fn().mockImplementation(() => {
    return {
      destination: jest.fn(),
      filename: jest.fn(),
    };
  });

  return multer;
});

describe("AuthController", () => {
  // CPFs para testes
  const validCPFs = {
    admin: "52998224725",
    employee: "87748248800",
    customer: "71428793860",
    newUser: "61184562847",
  };

  // Caminho para o diretório de uploads
  const uploadsPath = path.join(process.cwd(), "public/images/users");

  // Modificar o modelo User diretamente antes de todos os testes
  beforeAll(async () => {
    // 1. Modificar o modelo User para ignorar validação de CPF
    const userSchema = User.schema;

    if (userSchema.path("cpf")?.validators) {
      userSchema.path("cpf").validators = [];

      // Adicionar um novo validador que sempre retorna true
      userSchema.path("cpf").validate({
        validator: () => true,
        message: "",
      });
    }

    // 2. Criar diretório de uploads se não existir
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    cleanUploads();
  });

  const cleanUploads = () => {
    if (fs.existsSync(uploadsPath)) {
      const files = fs.readdirSync(uploadsPath);
      for (const file of files) {
        const filePath = path.join(uploadsPath, file);
        if (fs.statSync(filePath).isFile() && file.startsWith("test-")) {
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
        cpf: validCPFs.customer,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
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
        cpf: validCPFs.customer,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Senha inválida");
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
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
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
          cpf: validCPFs.newUser,
          rg: "123456789",
          birthDate: "1995-05-15",
          // Campo para simular o upload nos testes
          simulateFile: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("email", "new@test.com");
      expect(res.body).toHaveProperty("cpf", validCPFs.newUser);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should register new customer when employee", async () => {
      // Criar employee
      const employee = await User.create({
        name: "Employee",
        email: "employee@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "employee",
        cpf: validCPFs.employee,
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      });

      const employeeToken = generateToken(employee._id.toString(), "employee");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          name: "New Customer",
          email: "customer@test.com",
          password: "123456",
          role: "customer",
          cpf: validCPFs.newUser,
          rg: "123456789",
          birthDate: "1995-05-15",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("role", "customer");
      expect(res.body).toHaveProperty("cpf", validCPFs.newUser);
    });

    it("should not register without token", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "New User",
        email: "new@test.com",
        password: "123456",
        role: "employee",
        cpf: validCPFs.newUser,
        rg: "123456789",
        birthDate: "1995-05-15",
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
        cpf: validCPFs.employee,
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      });

      const employeeToken = generateToken(employee._id.toString(), "employee");

      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          name: "New Admin",
          email: "admin2@test.com",
          password: "123456",
          role: "admin",
          cpf: validCPFs.newUser,
          rg: "123456789",
          birthDate: "1995-05-15",
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
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      // Tentar criar usuário com mesmo email
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Another User",
          email: "admin@test.com", // Email já existente
          password: "123456",
          role: "employee",
          cpf: validCPFs.newUser,
          rg: "123456789",
          birthDate: "1995-05-15",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Email já cadastrado");
    });

    it("should not register with existing CPF", async () => {
      // Criar admin
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
      });

      const adminToken = generateToken(admin._id.toString(), "admin");

      // Tentar criar outro usuário com o mesmo CPF
      const res = await request(app)
        .post("/api/auth/register")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "CPF Test User",
          email: "cpf_test@example.com",
          password: "123456",
          role: "employee",
          cpf: validCPFs.admin, // Mesmo CPF do admin
          rg: "123456789",
          birthDate: "1995-05-15",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "CPF já cadastrado");
    });
  });

  describe("POST /api/auth/register with image", () => {
    it("should register new user with image when admin", async () => {
      const admin = await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "admin",
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
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
          cpf: validCPFs.newUser,
          rg: "123456789",
          birthDate: "1995-05-15",
          simulateFile: true, // Sinaliza para o mock do multer adicionar req.file
        });

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
        cpf: validCPFs.admin,
        rg: "987654321",
        birthDate: new Date("1990-01-01"),
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
          cpf: validCPFs.newUser,
          rg: "123456789",
          birthDate: "1995-05-15",
          // Sem simulateFile
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).not.toHaveProperty("image");
    });
  });
});
