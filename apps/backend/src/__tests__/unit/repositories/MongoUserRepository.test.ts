// @ts-nocheck
import { MongoUserRepository } from "../../../repositories/implementations/MongoUserRepository";
import { User } from "../../../schemas/UserSchema";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";

describe("MongoUserRepository", () => {
  let mongoServer: MongoMemoryServer;
  let repository: MongoUserRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    repository = new MongoUserRepository();
  });

  // ==================== CRUD Básico ====================

  describe("create()", () => {
    it("should create a new user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@test.com",
        password: await bcrypt.hash("password123", 10),
        cpf: "12345678901",
        rg: "123456789",
        role: "customer" as const,
        birthDate: new Date("1990-01-01"),
      };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.name).toBe("John Doe");
      expect(user.email).toBe("john@test.com");
      expect(user.role).toBe("customer");
    });

    it("should create user with all optional fields", async () => {
      const userData = {
        name: "Jane Doe",
        email: "jane@test.com",
        password: await bcrypt.hash("password123", 10),
        cpf: "98765432100",
        rg: "987654321",
        role: "employee" as const,
        birthDate: new Date("1995-05-15"),
        phone: "11999999999",
        address: {
          street: "Main St",
          number: "123",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
        },
        debts: 500.0,
      };

      const user = await repository.create(userData);

      expect(user.phone).toBe("11999999999");
      expect(user.address).toEqual(userData.address);
      expect(user.debts).toBe(500.0);
    });

    it("should create user with CNPJ (institutional)", async () => {
      const userData = {
        name: "Company XYZ",
        email: "company@test.com",
        password: await bcrypt.hash("password123", 10),
        cnpj: "12345678000190",
        rg: "INST-123",
        role: "institution" as const,
        birthDate: new Date("2010-01-01"),
      };

      const user = await repository.create(userData);

      expect(user.cnpj).toBe("12345678000190");
      expect(user.role).toBe("institution");
    });
  });

  describe("findById()", () => {
    it("should find user by ID", async () => {
      const created = await repository.create({
        name: "Test User",
        email: "test@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11111111111",
        rg: "111111111",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findById(created._id!);

      expect(found).toBeDefined();
      expect(found?._id).toBe(created._id);
      expect(found?.name).toBe("Test User");
    });

    it("should return null for non-existent ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const found = await repository.findById(fakeId);

      expect(found).toBeNull();
    });

    it("should return null for invalid ID format", async () => {
      const found = await repository.findById("invalid-id");

      expect(found).toBeNull();
    });
  });

  describe("findAll()", () => {
    beforeEach(async () => {
      // Criar múltiplos usuários para teste
      for (let i = 1; i <= 15; i++) {
        await repository.create({
          name: `User ${i}`,
          email: `user${i}@test.com`,
          password: await bcrypt.hash("pass", 10),
          cpf: `${i.toString().padStart(11, "0")}`,
          rg: `${i}`,
          role: i % 2 === 0 ? "employee" : "customer",
          birthDate: new Date(),
        });
      }
    });

    it("should return paginated users", async () => {
      const result = await repository.findAll(1, 10);

      expect(result.items.length).toBe(10);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should return second page", async () => {
      const result = await repository.findAll(2, 10);

      expect(result.items.length).toBe(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
    });

    it("should filter by role", async () => {
      const result = await repository.findAll(1, 20, { role: "employee" });

      expect(result.items.length).toBe(7); // Usuários pares (2,4,6,8,10,12,14)
      result.items.forEach((user) => {
        expect(user.role).toBe("employee");
      });
    });

    it("should filter by multiple roles", async () => {
      await repository.create({
        name: "Admin User",
        email: "admin@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "99999999999",
        rg: "999",
        role: "admin",
        birthDate: new Date(),
      });

      const result = await repository.findAll(1, 20, {
        role: "admin,employee",
      });

      expect(result.items.length).toBeGreaterThan(7); // 7 employees + 1 admin
    });

    it("should search by name", async () => {
      const result = await repository.findAll(1, 20, { searchTerm: "User 1" });

      expect(result.items.length).toBeGreaterThan(0);
      expect(
        result.items.some((u) => u.name.includes("User 1"))
      ).toBe(true);
    });

    it("should search by email", async () => {
      const result = await repository.findAll(1, 20, {
        searchTerm: "user5@test.com",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].email).toBe("user5@test.com");
    });

    it("should search by CPF (numeric search)", async () => {
      const result = await repository.findAll(1, 20, {
        searchTerm: "00000000005",
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].cpf).toBe("00000000005");
    });

    it("should exclude deleted users by default", async () => {
      const user = await repository.create({
        name: "To Delete",
        email: "delete@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "88888888888",
        rg: "888",
        role: "customer",
        birthDate: new Date(),
      });

      await repository.delete(user._id!);

      const result = await repository.findAll(1, 20);

      expect(result.items.find((u) => u._id === user._id)).toBeUndefined();
    });

    it("should include deleted users when requested", async () => {
      const user = await repository.create({
        name: "To Delete",
        email: "delete@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "88888888888",
        rg: "888",
        role: "customer",
        birthDate: new Date(),
      });

      await repository.delete(user._id!);

      const result = await repository.findAll(1, 20, {}, true);

      expect(result.items.find((u) => u._id === user._id)).toBeDefined();
    });

    it("should sort by name (default)", async () => {
      const result = await repository.findAll(1, 20);

      // Deve estar ordenado por nome
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i].name >= result.items[i - 1].name).toBe(true);
      }
    });

    it("should sort by createdAt when specified", async () => {
      const result = await repository.findAll(1, 20, { sort: "createdAt" });

      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe("update()", () => {
    it("should update user data", async () => {
      const user = await repository.create({
        name: "Original Name",
        email: "original@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "12312312312",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      });

      const updated = await repository.update(user._id!, {
        name: "Updated Name",
        phone: "11987654321",
      });

      expect(updated?.name).toBe("Updated Name");
      expect(updated?.phone).toBe("11987654321");
      expect(updated?.email).toBe("original@test.com"); // Não mudou
    });

    it("should return null for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updated = await repository.update(fakeId, { name: "New Name" });

      expect(updated).toBeNull();
    });
  });

  describe("delete()", () => {
    it("should soft delete a user", async () => {
      const user = await repository.create({
        name: "To Delete",
        email: "delete@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11122233344",
        rg: "111",
        role: "customer",
        birthDate: new Date(),
      });

      await repository.delete(user._id!);

      const found = await repository.findById(user._id!);
      expect(found).toBeNull();

      // Mas deve existir se incluir deletados
      const allResult = await repository.findAll(1, 10, {}, true);
      const deletedUser = allResult.items.find((u) => u._id === user._id);
      expect(deletedUser).toBeDefined();
    });
  });

  // ==================== Métodos Específicos ====================

  describe("findByEmail()", () => {
    it("should find user by email", async () => {
      await repository.create({
        name: "Email User",
        email: "email@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "22222222222",
        rg: "222",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findByEmail("email@test.com");

      expect(found).toBeDefined();
      expect(found?.email).toBe("email@test.com");
    });

    it("should be case insensitive", async () => {
      await repository.create({
        name: "Case Test",
        email: "CaseTest@Test.COM",
        password: await bcrypt.hash("pass", 10),
        cpf: "33333333333",
        rg: "333",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findByEmail("casetest@test.com");

      expect(found).toBeDefined();
      expect(found?.name).toBe("Case Test");
    });

    it("should trim spaces", async () => {
      await repository.create({
        name: "Trim Test",
        email: "trim@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "44444444444",
        rg: "444",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findByEmail("  trim@test.com  ");

      expect(found).toBeDefined();
    });

    it("should return null for non-existent email", async () => {
      const found = await repository.findByEmail("nonexistent@test.com");

      expect(found).toBeNull();
    });

    it("should not find deleted users", async () => {
      const user = await repository.create({
        name: "Deleted",
        email: "deleted@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "55555555555",
        rg: "555",
        role: "customer",
        birthDate: new Date(),
      });

      await repository.delete(user._id!);

      const found = await repository.findByEmail("deleted@test.com");
      expect(found).toBeNull();
    });
  });

  describe("findByCpf()", () => {
    it("should find user by CPF", async () => {
      await repository.create({
        name: "CPF User",
        email: "cpf@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "12345678901",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findByCpf("12345678901");

      expect(found).toBeDefined();
      expect(found?.cpf).toBe("12345678901");
    });

    it("should sanitize CPF (remove non-numeric chars)", async () => {
      await repository.create({
        name: "Sanitize CPF",
        email: "sanitize@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "98765432100",
        rg: "987",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findByCpf("987.654.321-00");

      expect(found).toBeDefined();
      expect(found?.cpf).toBe("98765432100");
    });

    it("should return null for non-existent CPF", async () => {
      const found = await repository.findByCpf("00000000000");

      expect(found).toBeNull();
    });
  });

  describe("findByCnpj()", () => {
    it("should find user by CNPJ", async () => {
      await repository.create({
        name: "CNPJ Company",
        email: "cnpj@test.com",
        password: await bcrypt.hash("pass", 10),
        cnpj: "12345678000190",
        rg: "CNPJ-123",
        role: "institution",
        birthDate: new Date(),
      });

      const found = await repository.findByCnpj("12345678000190");

      expect(found).toBeDefined();
      expect(found?.cnpj).toBe("12345678000190");
    });

    it("should sanitize CNPJ", async () => {
      await repository.create({
        name: "Sanitize CNPJ",
        email: "sanitizecnpj@test.com",
        password: await bcrypt.hash("pass", 10),
        cnpj: "98765432000199",
        rg: "CNPJ-987",
        role: "institution",
        birthDate: new Date(),
      });

      const found = await repository.findByCnpj("98.765.432/0001-99");

      expect(found).toBeDefined();
      expect(found?.cnpj).toBe("98765432000199");
    });

    it("should return null for non-existent CNPJ", async () => {
      const found = await repository.findByCnpj("00000000000000");

      expect(found).toBeNull();
    });
  });

  describe("findByRole()", () => {
    it("should find users by role", async () => {
      await repository.create({
        name: "Admin 1",
        email: "admin1@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11111111111",
        rg: "111",
        role: "admin",
        birthDate: new Date(),
      });

      await repository.create({
        name: "Admin 2",
        email: "admin2@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "22222222222",
        rg: "222",
        role: "admin",
        birthDate: new Date(),
      });

      await repository.create({
        name: "Customer",
        email: "customer@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "33333333333",
        rg: "333",
        role: "customer",
        birthDate: new Date(),
      });

      const result = await repository.findByRole("admin", 1, 10);

      expect(result.items.length).toBe(2);
      result.items.forEach((user) => {
        expect(user.role).toBe("admin");
      });
    });
  });

  describe("emailExists()", () => {
    it("should return true if email exists", async () => {
      await repository.create({
        name: "Existing Email",
        email: "exists@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "12312312312",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      });

      const exists = await repository.emailExists("exists@test.com");

      expect(exists).toBe(true);
    });

    it("should return false if email does not exist", async () => {
      const exists = await repository.emailExists("notexists@test.com");

      expect(exists).toBe(false);
    });

    it("should exclude specific user ID", async () => {
      const user = await repository.create({
        name: "Exclude Test",
        email: "exclude@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "98798798798",
        rg: "987",
        role: "customer",
        birthDate: new Date(),
      });

      const exists = await repository.emailExists(
        "exclude@test.com",
        user._id!
      );

      expect(exists).toBe(false); // Deve excluir o próprio usuário
    });

    it("should be case insensitive", async () => {
      await repository.create({
        name: "Case Test",
        email: "CaseTest@Test.COM",
        password: await bcrypt.hash("pass", 10),
        cpf: "45645645645",
        rg: "456",
        role: "customer",
        birthDate: new Date(),
      });

      const exists = await repository.emailExists("casetest@test.com");

      expect(exists).toBe(true);
    });
  });

  describe("cpfExists()", () => {
    it("should return true if CPF exists", async () => {
      await repository.create({
        name: "CPF Exists",
        email: "cpfexists@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11122233344",
        rg: "111",
        role: "customer",
        birthDate: new Date(),
      });

      const exists = await repository.cpfExists("11122233344");

      expect(exists).toBe(true);
    });

    it("should return false if CPF does not exist", async () => {
      const exists = await repository.cpfExists("99999999999");

      expect(exists).toBe(false);
    });

    it("should exclude specific user ID", async () => {
      const user = await repository.create({
        name: "Exclude CPF",
        email: "excludecpf@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "12312312312",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      });

      const exists = await repository.cpfExists("12312312312", user._id!);

      expect(exists).toBe(false);
    });

    it("should sanitize CPF", async () => {
      await repository.create({
        name: "Sanitize CPF Check",
        email: "sanitizecheck@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "55566677788",
        rg: "555",
        role: "customer",
        birthDate: new Date(),
      });

      const exists = await repository.cpfExists("555.666.777-88");

      expect(exists).toBe(true);
    });
  });

  describe("cnpjExists()", () => {
    it("should return true if CNPJ exists", async () => {
      await repository.create({
        name: "CNPJ Exists",
        email: "cnpjexists@test.com",
        password: await bcrypt.hash("pass", 10),
        cnpj: "12345678000190",
        rg: "CNPJ-123",
        role: "institution",
        birthDate: new Date(),
      });

      const exists = await repository.cnpjExists("12345678000190");

      expect(exists).toBe(true);
    });

    it("should return false if CNPJ does not exist", async () => {
      const exists = await repository.cnpjExists("99999999999999");

      expect(exists).toBe(false);
    });

    it("should exclude specific user ID", async () => {
      const user = await repository.create({
        name: "Exclude CNPJ",
        email: "excludecnpj@test.com",
        password: await bcrypt.hash("pass", 10),
        cnpj: "98765432000199",
        rg: "CNPJ-987",
        role: "institution",
        birthDate: new Date(),
      });

      const exists = await repository.cnpjExists("98765432000199", user._id!);

      expect(exists).toBe(false);
    });
  });

  describe("search()", () => {
    beforeEach(async () => {
      await repository.create({
        name: "Alice Smith",
        email: "alice@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11111111111",
        rg: "111",
        role: "customer",
        birthDate: new Date(),
      });

      await repository.create({
        name: "Bob Jones",
        email: "bob@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "22222222222",
        rg: "222",
        role: "employee",
        birthDate: new Date(),
      });
    });

    it("should search by name", async () => {
      const result = await repository.search("Alice", 1, 10);

      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe("Alice Smith");
    });

    it("should search by email", async () => {
      const result = await repository.search("bob@test", 1, 10);

      expect(result.items.length).toBe(1);
      expect(result.items[0].email).toBe("bob@test.com");
    });

    it("should search by CPF", async () => {
      const result = await repository.search("11111111111", 1, 10);

      expect(result.items.length).toBe(1);
      expect(result.items[0].cpf).toBe("11111111111");
    });

    it("should return empty for no matches", async () => {
      const result = await repository.search("NonExistent", 1, 10);

      expect(result.items.length).toBe(0);
    });
  });

  describe("updatePassword()", () => {
    it("should update user password", async () => {
      const user = await repository.create({
        name: "Password User",
        email: "password@test.com",
        password: await bcrypt.hash("oldpassword", 10),
        cpf: "12312312312",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      });

      const newHashedPassword = await bcrypt.hash("newpassword", 10);
      const updated = await repository.updatePassword(
        user._id!,
        newHashedPassword
      );

      expect(updated).toBeDefined();
      expect(updated?.password).toBe(newHashedPassword);
    });

    it("should return null for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updated = await repository.updatePassword(fakeId, "newhash");

      expect(updated).toBeNull();
    });

    it("should return null for invalid ID", async () => {
      const updated = await repository.updatePassword("invalid-id", "newhash");

      expect(updated).toBeNull();
    });
  });

  describe("findDeleted()", () => {
    it("should find only deleted users", async () => {
      const user1 = await repository.create({
        name: "Active",
        email: "active@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11111111111",
        rg: "111",
        role: "customer",
        birthDate: new Date(),
      });

      const user2 = await repository.create({
        name: "Deleted",
        email: "deleted@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "22222222222",
        rg: "222",
        role: "customer",
        birthDate: new Date(),
      });

      await repository.delete(user2._id!);

      const result = await repository.findDeleted(1, 10);

      expect(result.items.length).toBe(1);
      expect(result.items[0]._id).toBe(user2._id);
    });
  });

  // ==================== Customer Category ====================

  describe("Customer Category", () => {
    it("should classify as 'novo' with 0 purchases", async () => {
      const user = await repository.create({
        name: "New Customer",
        email: "new@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11111111111",
        rg: "111",
        role: "customer",
        birthDate: new Date(),
      });

      const found = await repository.findById(user._id!);

      expect((found as any).customerCategory).toBe("novo");
    });

    it("should classify as 'regular' with 1-4 purchases", async () => {
      const user = await User.create({
        name: "Regular Customer",
        email: "regular@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "22222222222",
        rg: "222",
        role: "customer",
        birthDate: new Date(),
        purchases: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ],
      });

      const found = await repository.findById(user._id.toString());

      expect((found as any).customerCategory).toBe("regular");
    });

    it("should classify as 'vip' with 5+ purchases", async () => {
      const user = await User.create({
        name: "VIP Customer",
        email: "vip@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "33333333333",
        rg: "333",
        role: "customer",
        birthDate: new Date(),
        purchases: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ],
      });

      const found = await repository.findById(user._id.toString());

      expect((found as any).customerCategory).toBe("vip");
    });
  });

  // ==================== Advanced Filters ====================

  describe("Advanced Filters", () => {
    beforeEach(async () => {
      // Criar usuários com diferentes perfis
      await repository.create({
        name: "User With Debts",
        email: "debts@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "11111111111",
        rg: "111",
        role: "customer",
        birthDate: new Date(),
        debts: 500.0,
      } as any);

      await repository.create({
        name: "User Without Debts",
        email: "nodebts@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "22222222222",
        rg: "222",
        role: "customer",
        birthDate: new Date(),
        debts: 0,
      } as any);
    });

    it("should filter by hasDebts", async () => {
      const result = await repository.findAll(1, 10, { hasDebts: "true" });

      expect(result.items.length).toBe(1);
      expect(result.items[0].email).toBe("debts@test.com");
    });

    it("should filter by date range", async () => {
      const today = new Date().toISOString().split("T")[0];

      const result = await repository.findAll(1, 10, {
        startDate: today,
        endDate: today,
      });

      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  // ==================== Edge Cases ====================

  describe("Edge Cases", () => {
    it("should handle empty database", async () => {
      const result = await repository.findAll(1, 10);

      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should handle very long names", async () => {
      const longName = "A".repeat(500);

      const user = await repository.create({
        name: longName,
        email: "longname@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "12312312312",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      } as any);

      expect(user.name).toBe(longName);
    });

    it("should handle special characters in name", async () => {
      const specialName = "José da Silva Neto & Cia. Ltda.";

      const user = await repository.create({
        name: specialName,
        email: "special@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "45645645645",
        rg: "456",
        role: "customer",
        birthDate: new Date(),
      } as any);

      expect(user.name).toBe(specialName);
    });

    it("should handle findAll with zero limit", async () => {
      const result = await repository.findAll(1, 0);

      expect(result.items.length).toBe(0);
    });

    it("should handle findAll with very large limit", async () => {
      await repository.create({
        name: "Test",
        email: "test@test.com",
        password: await bcrypt.hash("pass", 10),
        cpf: "12312312312",
        rg: "123",
        role: "customer",
        birthDate: new Date(),
      } as any);

      const result = await repository.findAll(1, 10000);

      expect(result.items.length).toBeLessThanOrEqual(10000);
    });
  });
});

