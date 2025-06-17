import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthService } from "../../../services/AuthService";
import { getRepositories } from "../../../repositories/RepositoryFactory";
import { AuthError } from "../../../utils/AppError";
import { ErrorCode } from "../../../utils/errorCodes";
import { 
  mockAdminUser, 
  mockEmployeeUser, 
  mockCustomerUser,
  mockInstitutionUser,
  createUserWithComparePassword,
  validCPFs 
} from "../../helpers/testUtils";

// Mock do getRepositories
jest.mock("../../../repositories/RepositoryFactory", () => ({
  getRepositories: jest.fn()
}));

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock do UserRepository
    mockUserRepository = {
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      findByServiceOrder: jest.fn(),
      findById: jest.fn(),
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

    authService = new AuthService();
  });

  describe("login", () => {
    it("should login successfully with valid email and password", async () => {
      const userWithComparePassword = createUserWithComparePassword(mockAdminUser, "123456");
      mockUserRepository.findByEmail.mockResolvedValue(userWithComparePassword);

      const result = await authService.login("admin@test.com", "123456");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
      expect(result.user.name).toBe(mockAdminUser.name);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("admin@test.com");
    });

    it("should login successfully with valid CPF and password", async () => {
      const userWithComparePassword = createUserWithComparePassword(mockCustomerUser, "123456");
      mockUserRepository.findByCpf.mockResolvedValue(userWithComparePassword);

      const result = await authService.login(validCPFs.customer, "123456");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user.cpf).toBe(validCPFs.customer);
      expect(mockUserRepository.findByCpf).toHaveBeenCalledWith(validCPFs.customer);
    });

    it("should login successfully with valid CNPJ and password", async () => {
      const userWithComparePassword = createUserWithComparePassword(mockInstitutionUser, "123456");
      mockUserRepository.findByCnpj.mockResolvedValue(userWithComparePassword);

      const result = await authService.login("12345678000195", "123456");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user.cnpj).toBe("12345678000195");
      expect(mockUserRepository.findByCnpj).toHaveBeenCalledWith("12345678000195");
    });

    it("should login successfully with service order", async () => {
      // Para service order, não precisamos do comparePassword
      const userMock = { ...mockCustomerUser };
      
      // Configurar mocks para garantir que findByServiceOrder seja chamado
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByCpf.mockResolvedValue(null);
      mockUserRepository.findByCnpj.mockResolvedValue(null);
      mockUserRepository.findByServiceOrder.mockResolvedValue(userMock);

      const result = await authService.login("123", "123");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(mockUserRepository.findByServiceOrder).toHaveBeenCalledWith("123");
    });

    it("should login successfully when user is found by service order and passwords match", async () => {
      // Este teste cobre especificamente o caminho onde user é encontrado por service order
      const userMock = { ...mockCustomerUser };
      mockUserRepository.findByServiceOrder.mockResolvedValue(userMock);

      const result = await authService.login("456", "456");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
      expect(mockUserRepository.findByServiceOrder).toHaveBeenCalledWith("456");
    });

    it("should throw error for invalid credentials", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login("invalid@test.com", "wrongpassword")
      ).rejects.toThrow(new AuthError("Credenciais inválidas", ErrorCode.INVALID_CREDENTIALS));

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("invalid@test.com");
    });

    it("should throw error for wrong password", async () => {
      const userWithComparePassword = createUserWithComparePassword(mockAdminUser, "correctpassword");
      mockUserRepository.findByEmail.mockResolvedValue(userWithComparePassword);

      await expect(
        authService.login("admin@test.com", "wrongpassword")
      ).rejects.toThrow(new AuthError("Credenciais inválidas", ErrorCode.INVALID_CREDENTIALS));
    });

    it("should throw error for service order with wrong password", async () => {
      const userMock = { ...mockCustomerUser };
      mockUserRepository.findByServiceOrder.mockResolvedValue(userMock);

      await expect(
        authService.login("123", "wrongpassword")
      ).rejects.toThrow(new AuthError("Credenciais inválidas", ErrorCode.INVALID_CREDENTIALS));
    });

    it("should handle user without comparePassword method", async () => {
      // Teste para o caso onde user.comparePassword é undefined
      const userWithoutComparePassword = { ...mockAdminUser };
      delete userWithoutComparePassword.comparePassword;
      mockUserRepository.findByEmail.mockResolvedValue(userWithoutComparePassword);

      await expect(
        authService.login("admin@test.com", "123456")
      ).rejects.toThrow(new AuthError("Credenciais inválidas", ErrorCode.INVALID_CREDENTIALS));
    });

    it("should validate required login field", async () => {
      await expect(
        authService.login("", "123456")
      ).rejects.toThrow(new AuthError("Login e senha são obrigatórios", ErrorCode.VALIDATION_ERROR));
    });

    it("should validate required password field", async () => {
      await expect(
        authService.login("admin@test.com", "")
      ).rejects.toThrow(new AuthError("Login e senha são obrigatórios", ErrorCode.VALIDATION_ERROR));
    });
  });

  describe("validateToken", () => {
    it("should validate token successfully", async () => {
      const userWithoutSensitiveData = { ...mockAdminUser };
      delete userWithoutSensitiveData.password;
      mockUserRepository.findById.mockResolvedValue(userWithoutSensitiveData);

      const result = await authService.validateToken(mockAdminUser._id!);

      expect(result).toEqual(userWithoutSensitiveData);
      expect(result).not.toHaveProperty("password");
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockAdminUser._id);
    });

    it("should throw error for invalid user ID", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(
        authService.validateToken("invalid-id")
      ).rejects.toThrow(new AuthError("Token inválido", ErrorCode.INVALID_TOKEN));

      expect(mockUserRepository.findById).toHaveBeenCalledWith("invalid-id");
    });
  });

  describe("additional methods", () => {
    it("should get user by email", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockAdminUser);

      const result = await authService.getUserByEmail("admin@test.com");

      expect(result).toEqual(mockAdminUser);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("admin@test.com");
    });

    it("should get user by CPF", async () => {
      mockUserRepository.findByCpf.mockResolvedValue(mockCustomerUser);

      const result = await authService.getUserByCpf(validCPFs.customer);

      expect(result).toEqual(mockCustomerUser);
      expect(mockUserRepository.findByCpf).toHaveBeenCalledWith(validCPFs.customer);
    });

    it("should get user by CNPJ", async () => {
      mockUserRepository.findByCnpj.mockResolvedValue(mockEmployeeUser);

      const result = await authService.getUserByCnpj("12345678000195");

      expect(result).toEqual(mockEmployeeUser);
      expect(mockUserRepository.findByCnpj).toHaveBeenCalledWith("12345678000195");
    });

    it("should verify user password correctly", async () => {
      const userWithComparePassword = createUserWithComparePassword(mockAdminUser, "123456");
      mockUserRepository.findById.mockResolvedValue(userWithComparePassword);

      const result = await authService.verifyUserPassword(mockAdminUser._id!, "123456");

      expect(result).toBe(true);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockAdminUser._id);
    });

    it("should return false for wrong password verification", async () => {
      const userWithComparePassword = createUserWithComparePassword(mockAdminUser, "correctpassword");
      mockUserRepository.findById.mockResolvedValue(userWithComparePassword);

      const result = await authService.verifyUserPassword(mockAdminUser._id!, "wrongpassword");

      expect(result).toBe(false);
    });

    it("should return false for non-existent user password verification", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await authService.verifyUserPassword("invalid-id", "123456");

      expect(result).toBe(false);
    });
  });
});
