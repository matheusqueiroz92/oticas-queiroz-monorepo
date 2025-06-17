import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UserService } from "../../../services/UserService";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import { ValidationError, NotFoundError, PermissionError } from "../../../utils/AppError";
import { ErrorCode } from "../../../utils/errorCodes";
import {
  mockAdminUser,
  mockEmployeeUser,
  mockCustomerUser,
  mockInstitutionUser,
  validCPFs,
  validCNPJs,
  createUserWithComparePassword,
} from "../../helpers/testUtils";

// Mock do getRepositories
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: jest.fn()
}));

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock do UserRepository
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findByRole: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      emailExists: jest.fn(),
      count: jest.fn(),
    };

    // Mock do getRepositories
    (getRepositories as jest.Mock).mockReturnValue({
      userRepository: mockUserRepository,
      orderRepository: jest.fn(),
      paymentRepository: jest.fn(),
      productRepository: jest.fn(),
      laboratoryRepository: jest.fn(),
      cashRegisterRepository: jest.fn(),
      counterRepository: jest.fn(),
      legacyClientRepository: jest.fn(),
      passwordResetRepository: jest.fn(),
    });

    userService = new UserService();
  });

  describe("createUser", () => {
    const validUserData = {
      name: "Test User",
      email: "test@example.com",
      password: "123456",
      role: "customer" as const,
      cpf: validCPFs.customer,
      rg: "123456789",
      birthDate: new Date("1990-01-01"),
    };

    it("should create a user successfully", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "123",
        ...validUserData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(validUserData);

      expect(result._id).toBe("123");
      expect(result.name).toBe(validUserData.name);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
      expect(mockUserRepository.findByCpf).toHaveBeenCalledWith(validCPFs.customer);
    });

    it("should create institution user with CNPJ", async () => {
      const institutionData = {
        name: "Test Institution",
        email: "institution@test.com",
        password: "123456",
        role: "institution" as const,
        cnpj: validCNPJs.institution,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "456",
        ...institutionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(institutionData);

      expect(result._id).toBe("456");
      expect(result.cnpj).toBe(validCNPJs.institution);
      expect(mockUserRepository.findByCnpj).toHaveBeenCalledWith(validCNPJs.institution);
    });

    it("should throw error if CNPJ already exists for institution", async () => {
      const institutionData = {
        name: "Test Institution",
        email: "institution@test.com",
        password: "123456",
        role: "institution" as const,
        cnpj: validCNPJs.institution,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue({ _id: "existing", ...institutionData });

      await expect(userService.createUser(institutionData)).rejects.toThrow(
        new ValidationError("CNPJ já cadastrado", ErrorCode.DUPLICATE_CNPJ)
      );
    });

    it("should throw error if email already exists", async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ _id: "existing", ...validUserData });

      await expect(userService.createUser(validUserData)).rejects.toThrow(
        new ValidationError("Email já cadastrado", ErrorCode.DUPLICATE_EMAIL)
      );
    });

    it("should throw error if CPF already exists", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue({ _id: "existing", ...validUserData });

      await expect(userService.createUser(validUserData)).rejects.toThrow(
        new ValidationError("CPF já cadastrado", ErrorCode.DUPLICATE_CPF)
      );
    });

    it("should throw error for invalid email format", async () => {
      const invalidEmailData = { ...validUserData, email: "invalid-email" };

      await expect(userService.createUser(invalidEmailData)).rejects.toThrow(
        new ValidationError("Email inválido", ErrorCode.INVALID_EMAIL)
      );
    });

    it("should throw error for invalid password", async () => {
      const invalidPasswordData = { ...validUserData, password: "123" };

      await expect(userService.createUser(invalidPasswordData)).rejects.toThrow(
        new ValidationError("Senha deve ter pelo menos 6 caracteres", ErrorCode.INVALID_PASSWORD)
      );
    });

    it("should throw error for invalid role", async () => {
      const invalidRoleData = { ...validUserData, role: "invalid" as any };

      await expect(userService.createUser(invalidRoleData)).rejects.toThrow(
        new ValidationError("Role inválida", ErrorCode.INVALID_ROLE)
      );
    });

    it("should throw error for invalid CPF format", async () => {
      const invalidCpfData = { ...validUserData, cpf: "123" };

      await expect(userService.createUser(invalidCpfData)).rejects.toThrow(
        new ValidationError("CPF inválido. Deve conter 11 dígitos numéricos", ErrorCode.INVALID_CPF)
      );
    });

    it("should throw error if employee tries to create admin", async () => {
      const adminData = { ...validUserData, role: "admin" as const };

      await expect(userService.createUser(adminData, "employee")).rejects.toThrow(
        new PermissionError("Funcionários só podem cadastrar clientes e instituições", ErrorCode.INSUFFICIENT_PERMISSIONS)
      );
    });

    it("should create user without CPF", async () => {
      const userDataNoCpf = { 
        name: "Test User",
        email: "test@example.com",
        password: "123456",
        role: "customer" as const,
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "123",
        ...userDataNoCpf,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(userDataNoCpf);

      expect(result._id).toBe("123");
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.findByCpf).not.toHaveBeenCalled();
    });

    it("should throw error for invalid CNPJ format", async () => {
      const invalidCnpjData = {
        name: "Test Institution",
        email: "institution@test.com",
        password: "123456",
        role: "institution" as const,
        cnpj: "123", // Invalid CNPJ
      };

      await expect(userService.createUser(invalidCnpjData)).rejects.toThrow(
        new ValidationError("CNPJ inválido. Deve conter 14 dígitos numéricos", ErrorCode.INVALID_CNPJ)
      );
    });

    it("should throw error for invalid RG format", async () => {
      const invalidRgData = { ...validUserData, rg: "123" }; // Invalid RG

      await expect(userService.createUser(invalidRgData)).rejects.toThrow(
        new ValidationError("RG inválido. Deve conter entre 6 e 14 dígitos numéricos", ErrorCode.INVALID_RG)
      );
    });

    it("should throw error if institution has no CNPJ", async () => {
      const institutionDataNoCnpj = {
        name: "Test Institution",
        email: "institution@test.com",
        password: "123456",
        role: "institution" as const,
        // Missing CNPJ
      };

      await expect(userService.createUser(institutionDataNoCnpj)).rejects.toThrow(
        new ValidationError("CNPJ é obrigatório para instituições", ErrorCode.VALIDATION_ERROR)
      );
    });

    it("should create user with empty string CPF", async () => {
      const userDataEmptyCpf = {
        ...validUserData,
        cpf: "", // Empty string CPF
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "123",
        ...userDataEmptyCpf,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(userDataEmptyCpf);

      expect(result._id).toBe("123");
      expect(mockUserRepository.findByCpf).not.toHaveBeenCalled();
    });

    it("should create user without email", async () => {
      const userDataNoEmail = {
        name: "Test User",
        password: "123456",
        role: "customer" as const,
        cpf: validCPFs.customer,
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
      };

      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "123",
        ...userDataNoEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(userDataNoEmail);

      expect(result._id).toBe("123");
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it("should handle null CPF without error", async () => {
      const userDataNullCpf = {
        ...validUserData,
        cpf: null as any,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "123",
        ...userDataNullCpf,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(userDataNullCpf);

      expect(result._id).toBe("123");
      expect(mockUserRepository.findByCpf).not.toHaveBeenCalled();
    });

    it("should handle undefined CPF without error", async () => {
      const userDataUndefinedCpf = {
        ...validUserData,
        cpf: undefined as any,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        _id: "123",
        ...userDataUndefinedCpf,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await userService.createUser(userDataUndefinedCpf);

      expect(result._id).toBe("123");
      expect(mockUserRepository.findByCpf).not.toHaveBeenCalled();
    });

    it("should handle database error for duplicate email", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      
      const dbError = new Error("Duplicate key") as any;
      dbError.code = 11000;
      dbError.keyPattern = { email: 1 };
      
      mockUserRepository.create.mockRejectedValue(dbError);

      await expect(userService.createUser(validUserData)).rejects.toThrow(
        new ValidationError("Email já cadastrado", ErrorCode.DUPLICATE_EMAIL)
      );
    });

    it("should handle generic database error", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      
      const genericError = new Error("Generic database error");
      mockUserRepository.create.mockRejectedValue(genericError);

      await expect(userService.createUser(validUserData)).rejects.toThrow(genericError);
    });

    it("should generate password from birthDate for customer if not provided", async () => {
      const userData = {
        name: "Cliente Teste",
        email: "cliente@teste.com",
        password: "", // não enviada
        role: "customer" as const,
        cpf: validCPFs.customer,
        rg: "123456789",
        birthDate: new Date("1997-04-30"),
      };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data: any) => ({
        _id: "123",
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      const result = await userService.createUser(userData);
      expect(result.password).toBe("30041997");
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: "30041997" })
      );
    });

    it("should throw error if customer has no password and no birthDate", async () => {
      const userData = {
        name: "Cliente Teste",
        email: "cliente@teste.com",
        password: "", // não enviada
        role: "customer" as const,
        cpf: validCPFs.customer,
        rg: "123456789",
        // birthDate ausente
      };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      await expect(userService.createUser(userData)).rejects.toThrow(
        new ValidationError(
          "Data de nascimento é obrigatória para gerar a senha do cliente.",
          ErrorCode.VALIDATION_ERROR
        )
      );
    });
  });

  describe("getAllUsers", () => {
    it("should return all users with pagination", async () => {
      const mockUsers = [
        { _id: "1", name: "User 1", email: "user1@test.com" },
        { _id: "2", name: "User 2", email: "user2@test.com" }
      ];
      
      mockUserRepository.findAll.mockResolvedValue({
        items: mockUsers,
        total: 2,
        page: 1,
        limit: 10
      });

      const result = await userService.getAllUsers(1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should return empty array if no users found", async () => {
      mockUserRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10
      });

      const result = await userService.getAllUsers();
      
      expect(result).toEqual({
        users: [],
        total: 0
      });
    });
  });

  describe("searchUsers", () => {
    it("should search users by term", async () => {
      const mockUsers = [{ _id: "1", name: "Test User" }];
      
      mockUserRepository.findAll.mockResolvedValue({
        items: mockUsers,
        total: 1,
        page: 1,
        limit: 10
      });

      const result = await userService.searchUsers("test", 1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(1);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(1, 10, { searchTerm: "test" });
    });

    it("should return all users if search term is empty", async () => {
      const mockUsers = [{ _id: "1", name: "User 1" }];
      
      mockUserRepository.findAll.mockResolvedValue({
        items: mockUsers,
        total: 1,
        page: 1,
        limit: 10
      });

      const result = await userService.searchUsers("   ", 1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(1, 10, {});
    });

    it("should return empty array if no users found in search", async () => {
      mockUserRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10
      });

      const result = await userService.searchUsers("nonexistent", 1, 10);
      
      expect(result).toEqual({
        users: [],
        total: 0
      });
    });
  });

  describe("getUsersByRole", () => {
    it("should return users by role", async () => {
      const mockUsers = [{ _id: "1", name: "Customer User", role: "customer" }];
      
      mockUserRepository.findByRole.mockResolvedValue({
        items: mockUsers,
        total: 1,
        page: 1,
        limit: 10
      });

      const result = await userService.getUsersByRole("customer", 1, 10);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(1);
      expect(mockUserRepository.findByRole).toHaveBeenCalledWith("customer", 1, 10);
    });

    it("should throw error for invalid role", async () => {
      await expect(userService.getUsersByRole("invalid", 1, 10)).rejects.toThrow(
        new ValidationError("Role inválida", ErrorCode.INVALID_ROLE)
      );
    });

    it("should return empty array if no users found with role", async () => {
      mockUserRepository.findByRole.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10
      });

      const result = await userService.getUsersByRole("admin", 1, 10);
      
      expect(result).toEqual({
        users: [],
        total: 0
      });
    });
  });

  describe("getUserById", () => {
    it("should return user by id", async () => {
      const mockUser = { _id: "123", name: "Test User" };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById("123");

      expect(result._id).toBe("123");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("123");
    });

    it("should throw error if user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById("nonexistent")).rejects.toThrow(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );
    });

    it("should throw error if id is empty", async () => {
      await expect(userService.getUserById("")).rejects.toThrow(
        new ValidationError("ID é obrigatório", ErrorCode.VALIDATION_ERROR)
      );
    });
  });

  describe("getUserByCpf", () => {
    it("should return user by CPF", async () => {
      const mockUser = { _id: "123", cpf: validCPFs.customer };
      mockUserRepository.findByCpf.mockResolvedValue(mockUser);

      const result = await userService.getUserByCpf(validCPFs.customer);

      expect(result._id).toBe("123");
      expect(mockUserRepository.findByCpf).toHaveBeenCalledWith(validCPFs.customer);
    });

    it("should throw error if user not found", async () => {
      mockUserRepository.findByCpf.mockResolvedValue(null);

      await expect(userService.getUserByCpf(validCPFs.customer)).rejects.toThrow(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );
    });

    it("should throw error if CPF is empty", async () => {
      await expect(userService.getUserByCpf("")).rejects.toThrow(
        new ValidationError("CPF é obrigatório", ErrorCode.VALIDATION_ERROR)
      );
    });

    it("should throw error for invalid CPF format", async () => {
      await expect(userService.getUserByCpf("123")).rejects.toThrow(
        new ValidationError("CPF inválido. Deve conter 11 dígitos numéricos", ErrorCode.INVALID_CPF)
      );
    });
  });

  describe("getUserByEmail", () => {
    it("should return user by email", async () => {
      const mockUser = { _id: "123", email: "test@example.com" };
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail("test@example.com");

      expect(result._id).toBe("123");
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
    });

    it("should throw error if user not found", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(userService.getUserByEmail("nonexistent@test.com")).rejects.toThrow(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );
    });

    it("should throw error if email is empty", async () => {
      await expect(userService.getUserByEmail("")).rejects.toThrow(
        new ValidationError("Email é obrigatório", ErrorCode.VALIDATION_ERROR)
      );
    });
  });

  describe("updateUser", () => {
    const existingUser = {
      _id: "123",
      name: "Test User",
      email: "test@example.com",
      cpf: validCPFs.customer,
      cnpj: null,
      role: "customer"
    };

    it("should update user successfully", async () => {
      const updateData = { name: "Updated Name" };
      
      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue({
        ...existingUser,
        ...updateData,
      });

      const result = await userService.updateUser("123", updateData);

      expect(result.name).toBe("Updated Name");
      expect(mockUserRepository.update).toHaveBeenCalledWith("123", updateData);
    });

    it("should throw error if user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.updateUser("nonexistent", { name: "New Name" })).rejects.toThrow(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );
    });

    it("should throw error if email already exists", async () => {
      const updateData = { email: "newemail@test.com" };
      
      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.emailExists.mockResolvedValue(true);

      await expect(userService.updateUser("123", updateData)).rejects.toThrow(
        new ValidationError("Email já cadastrado", ErrorCode.DUPLICATE_EMAIL)
      );
    });

    it("should throw error if CPF already exists during update", async () => {
      const updateData = { cpf: "98765432100" };
      const existingUserWithDifferentCpf = { ...existingUser, cpf: "12345678900" };
      
      mockUserRepository.findById.mockResolvedValue(existingUserWithDifferentCpf);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.findByCpf.mockResolvedValue({ _id: "other", cpf: "98765432100" });

      await expect(userService.updateUser("123", updateData)).rejects.toThrow(
        new ValidationError("CPF já cadastrado", ErrorCode.DUPLICATE_CPF)
      );
    });

    it("should throw error if CNPJ already exists during update", async () => {
      const updateData = { cnpj: "98765432000195" };
      const existingUserWithDifferentCnpj = { ...existingUser, cnpj: "12345678000195" };
      
      mockUserRepository.findById.mockResolvedValue(existingUserWithDifferentCnpj);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue({ _id: "other", cnpj: "98765432000195" });

      await expect(userService.updateUser("123", updateData)).rejects.toThrow(
        new ValidationError("CNPJ já cadastrado", ErrorCode.DUPLICATE_CNPJ)
      );
    });

    it("should throw error if update operation fails", async () => {
      const updateData = { name: "Updated Name" };
      
      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(null); // Simulando falha na operação

      await expect(userService.updateUser("123", updateData)).rejects.toThrow(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );
    });

    it("should throw error if ID is empty", async () => {
      await expect(userService.updateUser("", { name: "New Name" })).rejects.toThrow(
        new ValidationError("ID é obrigatório", ErrorCode.VALIDATION_ERROR)
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const deletedUser = { _id: "123", name: "Deleted User" };
      mockUserRepository.delete.mockResolvedValue(deletedUser);

      const result = await userService.deleteUser("123");

      expect(result._id).toBe("123");
      expect(mockUserRepository.delete).toHaveBeenCalledWith("123");
    });

    it("should throw error if user not found", async () => {
      mockUserRepository.delete.mockResolvedValue(null);

      await expect(userService.deleteUser("nonexistent")).rejects.toThrow(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );
    });

    it("should throw error if ID is empty", async () => {
      await expect(userService.deleteUser("")).rejects.toThrow(
        new ValidationError("ID é obrigatório", ErrorCode.VALIDATION_ERROR)
      );
    });
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      const mockUser = { _id: "123", name: "Test User" };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getProfile("123");

      expect(result._id).toBe("123");
      expect(mockUserRepository.findById).toHaveBeenCalledWith("123");
    });
  });

  describe("updateProfile", () => {
    it("should update profile without role", async () => {
      const profileData = { name: "Updated Profile Name" };
      const existingUser = { _id: "123", name: "Old Name", role: "customer" };
      
      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue({
        ...existingUser,
        ...profileData,
      });

      const result = await userService.updateProfile("123", {
        ...profileData,
        role: "admin" // Role should be ignored
      });

      expect(result.name).toBe(profileData.name);
      expect(mockUserRepository.update).toHaveBeenCalledWith("123", profileData);
    });
  });

  describe("verifyPassword", () => {
    it("should verify password correctly", async () => {
      const userWithPassword = createUserWithComparePassword({ _id: "123" }, "123456");
      mockUserRepository.findById.mockResolvedValue(userWithPassword);

      const result = await userService.verifyPassword("123", "123456");

      expect(result).toBe(true);
    });

    it("should return false for wrong password", async () => {
      const userWithPassword = createUserWithComparePassword({ _id: "123" }, "correct");
      mockUserRepository.findById.mockResolvedValue(userWithPassword);

      const result = await userService.verifyPassword("123", "wrong");

      expect(result).toBe(false);
    });

    it("should return false if user has no comparePassword method", async () => {
      const user = { _id: "123", name: "Test" };
      mockUserRepository.findById.mockResolvedValue(user);

      const result = await userService.verifyPassword("123", "123456");

      expect(result).toBe(false);
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      const existingUser = { _id: "123", name: "Test User" };
      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.emailExists.mockResolvedValue(false);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(existingUser);

      await userService.updatePassword("123", "newpassword");

      expect(mockUserRepository.update).toHaveBeenCalledWith("123", {
        password: "newpassword"
      });
    });

    it("should throw error for invalid password", async () => {
      await expect(userService.updatePassword("123", "123")).rejects.toThrow(
        new ValidationError("Nova senha deve ter pelo menos 6 caracteres", ErrorCode.INVALID_PASSWORD)
      );
    });

    it("should throw error for empty password", async () => {
      await expect(userService.updatePassword("123", "")).rejects.toThrow(
        new ValidationError("Nova senha deve ter pelo menos 6 caracteres", ErrorCode.INVALID_PASSWORD)
      );
    });
  });

  describe("additional repository methods", () => {
    it("should get users with pagination", async () => {
      const mockResult = { items: [{ _id: "1", name: "User 1" }], total: 1 };
      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const result = await userService.getUsersWithPagination(1, 10, { role: "customer" });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(1, 10, { role: "customer" });
    });

    it("should check if email exists", async () => {
      mockUserRepository.emailExists.mockResolvedValue(true);

      const result = await userService.checkEmailExists("test@example.com");

      expect(result).toBe(true);
      expect(mockUserRepository.emailExists).toHaveBeenCalledWith("test@example.com");
    });

    it("should check if CPF exists", async () => {
      mockUserRepository.findByCpf.mockResolvedValue({ _id: "123", cpf: validCPFs.customer });

      const result = await userService.checkCpfExists(validCPFs.customer);

      expect(result).toBe(true);
      expect(mockUserRepository.findByCpf).toHaveBeenCalledWith(validCPFs.customer);
    });

    it("should check if CPF does not exist", async () => {
      mockUserRepository.findByCpf.mockResolvedValue(null);

      const result = await userService.checkCpfExists("00000000000");

      expect(result).toBe(false);
    });

    it("should check if CNPJ exists", async () => {
      mockUserRepository.findByCnpj.mockResolvedValue({ _id: "123", cnpj: validCNPJs.institution });

      const result = await userService.checkCnpjExists(validCNPJs.institution);

      expect(result).toBe(true);
      expect(mockUserRepository.findByCnpj).toHaveBeenCalledWith(validCNPJs.institution);
    });

    it("should check if CNPJ does not exist", async () => {
      mockUserRepository.findByCnpj.mockResolvedValue(null);

      const result = await userService.checkCnpjExists("00000000000000");

      expect(result).toBe(false);
    });

    it("should get active users count", async () => {
      mockUserRepository.count.mockResolvedValue(10);

      const result = await userService.getActiveUsersCount();

      expect(result).toBe(10);
      expect(mockUserRepository.count).toHaveBeenCalledWith({ isDeleted: { $ne: true } });
    });

    it("should get customers count", async () => {
      mockUserRepository.count.mockResolvedValue(5);

      const result = await userService.getCustomersCount();

      expect(result).toBe(5);
      expect(mockUserRepository.count).toHaveBeenCalledWith({
        role: "customer",
        isDeleted: { $ne: true }
      });
    });

    it("should get employees count", async () => {
      mockUserRepository.count.mockResolvedValue(3);

      const result = await userService.getEmployeesCount();

      expect(result).toBe(3);
      expect(mockUserRepository.count).toHaveBeenCalledWith({
        role: "employee",
        isDeleted: { $ne: true }
      });
    });
  });
});
