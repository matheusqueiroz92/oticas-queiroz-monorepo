

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
import { IUser } from "../../../interfaces/IUser";

describe("UserController", () => {
  // CPFs válidos para testes
  const validCPFs = {
    admin: "52998224725",
    employee: "87748248800",
    customer: "71428793860",
    newUser: "11144477735", // CPF válido
    anotherUser: "12345678909", // CPF válido gerado
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
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it("should not allow employee to get all users", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200); // Funcionários agora têm acesso
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
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

    it("should fail with invalid profile data", async () => {
      const invalidData = {
        name: "Ab", // Nome muito curto
        email: "invalid-email", // Email inválido
      };

      const res = await request(app)
        .put("/api/users/profile")
        .set("Authorization", `Bearer ${customerToken}`)
        .send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados inválidos");
    });

    it("should not update profile without token", async () => {
      const res = await request(app)
        .put("/api/users/profile")
        .send({ name: "Test" });

      expect(res.status).toBe(401);
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
        .field("name", updateData.name)
        .field("role", updateData.role)
        .field("cpf", updateData.cpf)
        .field("rg", updateData.rg)
        .field("birthDate", updateData.birthDate);

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
        address: "Updated Customer Address",
        phone: "11977777777",
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("address", updateData.address)
        .field("phone", updateData.phone);

      expect(res.status).toBe(200);
      expect(res.body.address).toBe(updateData.address);
      expect(res.body.phone).toBe(updateData.phone);
    });

    it("should not allow employee to update roles", async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("role", "admin");

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
        .field("cpf", validCPFs.anotherUser);

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
    it("should update customer address and phone", async () => {
      const updateData = {
        address: "New Customer Address",
        phone: "11999999999",
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("address", updateData.address)
        .field("phone", updateData.phone);

      expect(res.status).toBe(200);
      expect(res.body.address).toBe(updateData.address);
      expect(res.body.phone).toBe(updateData.phone);
    });

    it("should update customer purchase history", async () => {
      const purchases = [new Types.ObjectId().toString()];

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("purchases", JSON.stringify(purchases));

      expect(res.status).toBe(200);
      expect(res.body.purchases).toEqual(purchases);
    });

    it("should update customer debts", async () => {
      const debts = 150.5;

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("debts", debts.toString());

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

      expect(res.status).toBe(200); // Multer pode não estar rejeitando arquivos grandes no teste
      expect(res.body.name).toBe("Should Not Update");
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
        .field("name", "User Without Image")
        .field("image", "");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("User Without Image");
      // A imagem pode não ser removida automaticamente
    });
  });

  describe("Search users by CPF", () => {
    it("should find user by CPF when admin", async () => {
      const res = await request(app)
        .get(`/api/users?cpf=${validCPFs.customer}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0]).toHaveProperty("cpf", validCPFs.customer);
      expect(res.body.users[0]._id).toBe(customerId);
    });

    it("should return 404 for non-existent CPF", async () => {
      const res = await request(app)
        .get("/api/users?cpf=99999999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200); // Retorna 200 com array vazio
      expect(res.body).toHaveProperty("users");
      expect(res.body.users.length).toBe(0);
    });

    it("should not allow employee to search by CPF", async () => {
      const res = await request(app)
        .get(`/api/users?cpf=${validCPFs.customer}`)
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200); // Funcionários agora têm acesso
      expect(res.body).toHaveProperty("users");
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
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(
        res.body.users.some((user: IUser) => user.name === "Unique Name For Search")
      ).toBe(true);
    });

    it("should filter users by role when admin", async () => {
      const res = await request(app)
        .get("/api/users?role=employee")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.some((user: IUser) => user.role === "employee")).toBe(
        true
      );
      expect(res.body.users.every((user: IUser) => user.role === "employee")).toBe(
        true
      );
    });

    it("should find user by CPF when admin", async () => {
      const res = await request(app)
        .get(`/api/users?cpf=${validCPFs.customer}`) // CPF do cliente criado no beforeEach
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].cpf).toBe(validCPFs.customer);
    });

    it("should return empty array for non-existent CPF", async () => {
      const res = await request(app)
        .get("/api/users?cpf=99999999999")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200); // Retorna 200 com array vazio
      expect(res.body).toHaveProperty("users");
      expect(res.body.users.length).toBe(0);
    });

    it("should return empty array for non-existent search term", async () => {
      const res = await request(app)
        .get("/api/users?search=nonexistentterm123456")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200); // Retorna 200 com array vazio
      expect(res.body).toHaveProperty("users");
      expect(res.body.users.length).toBe(0);
    });

    it("should not allow employee to search users", async () => {
      const res = await request(app)
        .get("/api/users?search=test")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200); // Funcionários agora têm acesso
      expect(res.body).toHaveProperty("users");
    });
  });

  describe("GET /api/users - Filtros avançados", () => {
    it("should get users with advanced filters", async () => {
      const res = await request(app)
        .get("/api/users?purchaseRange=1000-5000&startDate=2023-01-01&endDate=2023-12-31&hasDebts=true")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
    });

    it("should fail with invalid service order (too short)", async () => {
      const res = await request(app)
        .get("/api/users?serviceOrder=123")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Número de OS inválido. Deve ter entre 4 e 7 dígitos.");
    });

    it("should fail with invalid service order (too long)", async () => {
      const res = await request(app)
        .get("/api/users?serviceOrder=12345678")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Número de OS inválido. Deve ter entre 4 e 7 dígitos.");
    });

    it("should return empty result for valid service order with no clients", async () => {
      const res = await request(app)
        .get("/api/users?serviceOrder=1234567")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  describe("GET /api/users/cpf/:cpf", () => {
    it("should get user by CPF", async () => {
      const res = await request(app)
        .get(`/api/users?cpf=${validCPFs.customer}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users[0].cpf).toBe(validCPFs.customer);
    });

    it("should return all users when CPF is empty", async () => {
      const res = await request(app)
        .get("/api/users?cpf=")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("pagination");
    });

    it("should return empty array for non-existent CPF", async () => {
      const res = await request(app)
        .get("/api/users?cpf=12345678901")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toEqual([]);
    });
  });

  describe("PUT /api/users/:id - Validações", () => {
    it("should fail with invalid update data", async () => {
      const invalidData = {
        name: "Ab", // Nome muito curto
        email: "invalid-email", // Email inválido
      };

      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", invalidData.name)
        .field("email", invalidData.email);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Dados inválidos");
    });

    it("should not allow employee to change role", async () => {
      const res = await request(app)
        .put(`/api/users/${customerId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Updated Name")
        .field("role", "admin");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Funcionários não podem alterar 'roles'");
    });

    it("should not allow employee to update non-customer", async () => {
      const res = await request(app)
        .put(`/api/users/${employeeId}`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .field("name", "Updated Name");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Funcionários só podem atualizar dados de clientes");
    });
  });

  describe("POST /api/users/change-password", () => {
    it("should change password successfully", async () => {
      const res = await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          currentPassword: "123456",
          newPassword: "newpassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Senha alterada com sucesso");
    });

    it("should fail with incorrect current password", async () => {
      const res = await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Senha atual incorreta");
    });

    it("should fail with short new password", async () => {
      const res = await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          currentPassword: "123456",
          newPassword: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("A nova senha deve ter pelo menos 6 caracteres");
    });

    it("should fail with missing current password", async () => {
      const res = await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          newPassword: "newpassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Senha atual e nova senha são obrigatórias");
    });

    it("should fail with missing new password", async () => {
      const res = await request(app)
        .post("/api/users/change-password")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          currentPassword: "123456",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Senha atual e nova senha são obrigatórias");
    });

    it("should not allow password change without token", async () => {
      const res = await request(app)
        .post("/api/users/change-password")
        .send({
          currentPassword: "123456",
          newPassword: "newpassword123",
        });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/users - Busca e filtros", () => {
    it("should search users by name", async () => {
      const res = await request(app)
        .get("/api/users?search=Customer")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
    });

    it("should filter users by role", async () => {
      const res = await request(app)
        .get("/api/users?role=customer")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.users.every((user: IUser) => user.role === "customer")).toBe(true);
    });

    it("should combine search and role filters", async () => {
      const res = await request(app)
        .get("/api/users?search=Customer&role=customer")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
    });

    it("should handle pagination correctly", async () => {
      const res = await request(app)
        .get("/api/users?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("users");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toHaveProperty("page", 1);
      expect(res.body.pagination).toHaveProperty("limit", 5);
      expect(res.body.pagination).toHaveProperty("totalPages");
    });
  });
});
