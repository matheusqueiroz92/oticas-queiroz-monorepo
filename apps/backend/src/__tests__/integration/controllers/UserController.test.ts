import request from "supertest";
import app from "../../../app";
import { User } from "../../../schemas/UserSchema";
import { generateToken } from "../../../utils/jwt";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import path from "node:path";
import fs from "node:fs";
import { isValidCPF } from "../../../utils/validators";
import type { IUser } from "../../../interfaces/IUser";

// Mock para a função de validação de CPF
jest.mock("../../../utils/validators", () => ({
  isValidCPF: jest.fn().mockImplementation(() => true),
}));

describe("UserController", () => {
  // CPFs válidos para testes
  const validCPFs = {
    admin: "52998224725",
    employee: "87748248800",
    customer: "71428793860",
    newUser: "61184562847",
    anotherUser: "77893659061",
  };

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

  beforeEach(async () => {
    await User.deleteMany({});
    cleanUploads();

    // Criar admin
    const admin = await User.create({
      name: "Admin Test",
      email: `admin.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "admin",
      cpf: validCPFs.admin,
      rg: "102030405",
      birthDate: new Date("1980-01-01"),
    });
    adminToken = generateToken(admin._id.toString(), "admin");

    // Criar funcionário
    const employee = await User.create({
      name: "Employee Test",
      email: `employee.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "employee",
      cpf: validCPFs.employee,
      rg: "506070809",
      birthDate: new Date("1985-01-01"),
    });
    employeeToken = generateToken(employee._id.toString(), "employee");
    employeeId = employee._id.toString();

    // Criar cliente
    const customer = await User.create({
      name: "Customer Test",
      email: `customer.${Date.now()}@test.com`,
      password: await bcrypt.hash("123456", 10),
      role: "customer",
      cpf: validCPFs.customer,
      rg: "001122334",
      birthDate: new Date("1990-01-01"),
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
      expect(res.body).toHaveProperty("cpf");
      expect(res.body).toHaveProperty("rg");
      expect(res.body).toHaveProperty("birthDate");
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
      expect(res.body).toHaveProperty("cpf");
      expect(res.body).toHaveProperty("rg");
      expect(res.body).toHaveProperty("birthDate");
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
        birthDate: "1992-05-15", // Atualiza data de nascimento
      };

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.address).toBe(updateData.address);
      expect(res.body.phone).toBe(updateData.phone);
      expect(new Date(res.body.birthDate)).toEqual(
        new Date(updateData.birthDate)
      );
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

    it("should validate CPF format", async () => {
      // Sobrescrever o mock para retornar false para CPF inválido
      (isValidCPF as jest.Mock).mockImplementationOnce(() => false);

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ cpf: "11111111" }); // CPF inválido (poucos dígitos)

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("CPF inválido");
    });

    it("should not allow birth date in the future", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ birthDate: futureDate.toISOString().split("T")[0] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Data de nascimento inválida");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user when admin", async () => {
      const updateData = {
        name: "Updated by Admin",
        role: "employee",
        cpf: validCPFs.newUser, // Usar um CPF válido diferente
        rg: "444444444",
        birthDate: "1995-10-20",
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.role).toBe(updateData.role);
      expect(res.body.cpf).toBe(updateData.cpf);
      expect(res.body.rg).toBe(updateData.rg);
      expect(new Date(res.body.birthDate)).toEqual(
        new Date(updateData.birthDate)
      );
    });

    it("should allow employee to update customer data", async () => {
      const updateData = {
        prescription: {
          leftEye: -3.0,
          rightEye: -2.5,
        },
        address: "Updated Customer Address",
        phone: "11977777777",
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.prescription).toEqual(updateData.prescription);
      expect(res.body.address).toBe(updateData.address);
      expect(res.body.phone).toBe(updateData.phone);
    });

    it("should not allow employee to update roles", async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ role: "admin" });

      expect(res.status).toBe(403);
    });

    it("should not allow update with existing CPF", async () => {
      // Criar outro usuário com CPF conhecido
      await User.create({
        name: "Another User",
        email: "another@test.com",
        password: await bcrypt.hash("123456", 10),
        role: "customer",
        cpf: validCPFs.anotherUser,
        rg: "555555555",
        birthDate: new Date("1990-01-01"),
      });

      // Tentar atualizar o CPF do cliente existente para um CPF já utilizado
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ cpf: validCPFs.anotherUser });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("CPF já cadastrado");
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

  describe("User image handling", () => {
    it("should upload user image when updating profile", async () => {
      const buffer = Buffer.from("fake-profile-image");

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .attach("userImage", buffer, "profile.jpg")
        .field("name", "Updated With Image");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("image");
      expect(res.body.image).toMatch(/^\/images\/users\//);
      expect(res.body.name).toBe("Updated With Image");
    });

    it("should upload user image when admin updates user", async () => {
      const buffer = Buffer.from("fake-admin-upload-image");

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("userImage", buffer, "admin-upload.jpg")
        .field("name", "Updated By Admin With Image");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("image");
      expect(res.body.image).toMatch(/^\/images\/users\//);
      expect(res.body.name).toBe("Updated By Admin With Image");
    });

    it("should replace existing user image when uploading a new one", async () => {
      // Primeiro upload
      const firstUpload = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .attach("userImage", Buffer.from("first-image"), "first.jpg");

      const firstImagePath = firstUpload.body.image;
      expect(firstImagePath).toMatch(/^\/images\/users\//);

      // Segundo upload (substituição)
      const secondUpload = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .attach("userImage", Buffer.from("second-image"), "second.jpg");

      const secondImagePath = secondUpload.body.image;
      expect(secondImagePath).toMatch(/^\/images\/users\//);
      expect(secondImagePath).not.toBe(firstImagePath);
    });

    it("should reject invalid image format when updating profile", async () => {
      const buffer = Buffer.from("fake-text-file");

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .attach("userImage", buffer, "invalid.txt")
        .field("name", "Should Not Update");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP."
      );
    });

    it("should reject oversized image when updating profile", async () => {
      // Create a buffer larger than 5MB
      const buffer = Buffer.alloc(6 * 1024 * 1024);

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .attach("userImage", buffer, "large-image.jpg")
        .field("name", "Should Not Update");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Arquivo muito grande. Tamanho máximo: 5MB"
      );
    });

    it("should allow removing user image by setting to undefined", async () => {
      // Primeiro adicionar uma imagem
      await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .attach("userImage", Buffer.from("image-to-remove"), "profile.jpg");

      // Depois remover a imagem
      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          name: "User Without Image",
          image: undefined,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("User Without Image");
      expect(res.body.image).toBeUndefined();
    });
  });

  describe("Search users by CPF", () => {
    it("should find user by CPF when admin", async () => {
      const res = await request(app)
        .get(`/api/users/search?cpf=${validCPFs.customer}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("cpf", validCPFs.customer);
      expect(res.body._id).toBe(customerId);
    });

    it("should return 404 for non-existent CPF", async () => {
      const res = await request(app)
        .get("/api/users/search?cpf=99999999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it("should not allow employee to search by CPF", async () => {
      const res = await request(app)
        .get(`/api/users/search?cpf=${validCPFs.customer}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/users with search parameters", () => {
    it("should filter users by search term when admin", async () => {
      // Criar um usuário com nome específico para testar a busca
      await User.create({
        name: "Unique Name For Search",
        email: "search_test@example.com",
        password: await bcrypt.hash("123456", 10),
        role: "customer",
        cpf: validCPFs.anotherUser,
        rg: "888888888",
        birthDate: new Date("1990-01-01"),
      });

      const res = await request(app)
        .get("/api/users?search=unique")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(
        res.body.some((user: IUser) => user.name === "Unique Name For Search")
      ).toBe(true);
    });

    it("should filter users by role when admin", async () => {
      const res = await request(app)
        .get("/api/users?role=employee")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((user: IUser) => user.role === "employee")).toBe(
        true
      );
      expect(res.body.every((user: IUser) => user.role === "employee")).toBe(
        true
      );
    });

    it("should find user by CPF when admin", async () => {
      const res = await request(app)
        .get(`/api/users?cpf=${validCPFs.customer}`) // CPF do cliente criado no beforeEach
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].cpf).toBe(validCPFs.customer);
    });

    it("should return empty array for non-existent CPF", async () => {
      const res = await request(app)
        .get("/api/users?cpf=99999999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        "message",
        "Nenhum usuário encontrado com os critérios de busca"
      );
    });

    it("should return empty array for non-existent search term", async () => {
      const res = await request(app)
        .get("/api/users?search=nonexistentterm123456")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        "message",
        "Nenhum usuário encontrado com os critérios de busca"
      );
    });

    it("should not allow employee to search users", async () => {
      const res = await request(app)
        .get("/api/users?search=test")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/users/search/cpf/:cpf", () => {
    it("should find user by CPF when admin", async () => {
      const res = await request(app)
        .get(`/api/users/search/cpf/${encodeURIComponent(validCPFs.customer)}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("cpf", validCPFs.customer);
    });

    it("should return 404 for non-existent CPF", async () => {
      const res = await request(app)
        .get("/api/users/search/cpf/99999999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Usuário não encontrado");
    });

    it("should not allow employee to search users by CPF", async () => {
      const res = await request(app)
        .get(`/api/users/search/cpf/${validCPFs.customer}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });
});
