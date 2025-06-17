import { PasswordResetService } from "../../../services/PasswordResetService";
import { UserService } from "../../../services/UserService";
import { EmailService } from "../../../services/EmailService";
import { RepositoryFactory } from "../../../repositories/RepositoryFactory";
import type { IPasswordResetRepository, IPasswordReset } from "../../../repositories/interfaces/IPasswordResetRepository";
import type { IUserRepository } from "../../../repositories/interfaces/IUserRepository";
import type { IUser } from "../../../interfaces/IUser";
import { ValidationError, NotFoundError } from "../../../utils/AppError";
import { ErrorCode } from "../../../utils/errorCodes";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { describe, it, expect, beforeEach, jest, afterEach } from "@jest/globals";

// Mock dos services e repositories
jest.mock("../../../services/UserService");
jest.mock("../../../services/EmailService");
jest.mock("../../../repositories/RepositoryFactory");
jest.mock("node:crypto");
jest.mock("bcrypt");

describe("PasswordResetService", () => {
  let passwordResetService: PasswordResetService;
  let mockUserService: jest.Mocked<UserService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockPasswordResetRepository: jest.Mocked<IPasswordResetRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockRepositoryFactory: jest.Mocked<RepositoryFactory>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Salvar variáveis de ambiente originais
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      FRONTEND_URL: "https://app.oticasqueiroz.com.br",
    };

    // Setup dos mocks
    mockUserService = {
      getUserByEmail: jest.fn(),
    } as any;

    mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
    } as any;

    mockPasswordResetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByToken: jest.fn(),
      findByUserId: jest.fn(),
      isTokenValid: jest.fn(),
      removeAllUserTokens: jest.fn(),
      removeExpiredTokens: jest.fn(),
      removeExpiredUserTokens: jest.fn(),
      countActiveTokensByUser: jest.fn(),
      findExpiringTokens: jest.fn(),
    };

    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findByCnpj: jest.fn(),
      findByServiceOrder: jest.fn(),
      emailExists: jest.fn(),
      cpfExists: jest.fn(),
      cnpjExists: jest.fn(),
      findByRole: jest.fn(),
      search: jest.fn(),
      updatePassword: jest.fn(),
      findDeleted: jest.fn(),
    };

    mockRepositoryFactory = {
      getPasswordResetRepository: jest.fn().mockReturnValue(mockPasswordResetRepository),
      getUserRepository: jest.fn().mockReturnValue(mockUserRepository),
    } as any;

    (UserService as jest.Mock).mockImplementation(() => mockUserService);
    (EmailService as jest.Mock).mockImplementation(() => mockEmailService);
    (RepositoryFactory.getInstance as jest.Mock).mockReturnValue(mockRepositoryFactory);

    // Mock das funções do crypto e bcrypt
    (randomBytes as jest.Mock).mockReturnValue({
      toString: jest.fn().mockReturnValue("mockedtoken123"),
    });
    (bcrypt.genSalt as any).mockResolvedValue("mockedsalt");
    (bcrypt.hash as any).mockResolvedValue("mockedhashedpassword");

    passwordResetService = new PasswordResetService();
  });

  afterEach(() => {
    // Restaurar variáveis de ambiente
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  const mockUser: IUser = {
    _id: "user123",
    name: "João Silva",
    email: "joao@example.com",
    password: "hashedPassword",
    role: "customer",
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: async () => true,
  };

  const mockPasswordReset: IPasswordReset = {
    _id: "reset123",
    userId: "user123",
    token: "mockedtoken123",
    expiresAt: new Date(Date.now() + 3600000), // 1 hora no futuro
    createdAt: new Date(),
  };

  describe("createResetToken", () => {
    it("should create reset token and send email successfully", async () => {
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      mockPasswordResetRepository.removeAllUserTokens.mockResolvedValue(1);
      mockPasswordResetRepository.create.mockResolvedValue(mockPasswordReset);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue();

      const result = await passwordResetService.createResetToken("joao@example.com");

      expect(result).toBe("mockedtoken123");
      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith("joao@example.com");
      expect(mockPasswordResetRepository.removeAllUserTokens).toHaveBeenCalledWith("user123");
      expect(mockPasswordResetRepository.create).toHaveBeenCalledWith({
        userId: "user123",
        token: "mockedtoken123",
        expiresAt: expect.any(Date),
      });
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        "joao@example.com",
        "https://app.oticasqueiroz.com.br/auth/reset-password/mockedtoken123"
      );
    });

    it("should use default frontend URL when not set", async () => {
      delete process.env.FRONTEND_URL;
      
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      mockPasswordResetRepository.removeAllUserTokens.mockResolvedValue(0);
      mockPasswordResetRepository.create.mockResolvedValue(mockPasswordReset);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue();

      await passwordResetService.createResetToken("joao@example.com");

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        "joao@example.com",
        "http://localhost:3000/auth/reset-password/mockedtoken123"
      );
    });

    it("should return fake token when user not found", async () => {
      mockUserService.getUserByEmail.mockRejectedValue(
        new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND)
      );

      const result = await passwordResetService.createResetToken("unknown@example.com");

      expect(result).toBe("mockedtoken123");
      expect(mockPasswordResetRepository.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("should propagate other errors", async () => {
      const error = new Error("Database error");
      mockUserService.getUserByEmail.mockRejectedValue(error);

      await expect(
        passwordResetService.createResetToken("joao@example.com")
      ).rejects.toThrow("Database error");
    });
  });

  describe("validateResetToken", () => {
    it("should return true for valid token", async () => {
      mockPasswordResetRepository.isTokenValid.mockResolvedValue(true);

      const result = await passwordResetService.validateResetToken("validtoken");

      expect(result).toBe(true);
      expect(mockPasswordResetRepository.isTokenValid).toHaveBeenCalledWith("validtoken");
    });

    it("should return false for invalid token and cleanup expired tokens", async () => {
      mockPasswordResetRepository.isTokenValid.mockResolvedValue(false);
      mockPasswordResetRepository.removeExpiredTokens.mockResolvedValue(2);

      const result = await passwordResetService.validateResetToken("invalidtoken");

      expect(result).toBe(false);
      expect(mockPasswordResetRepository.removeExpiredTokens).toHaveBeenCalled();
    });

    it("should return false on error", async () => {
      mockPasswordResetRepository.isTokenValid.mockRejectedValue(new Error("Database error"));

      const result = await passwordResetService.validateResetToken("token");

      expect(result).toBe(false);
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      const validPasswordReset = {
        ...mockPasswordReset,
        expiresAt: new Date(Date.now() + 3600000), // 1 hora no futuro
      };

      mockPasswordResetRepository.findByToken.mockResolvedValue(validPasswordReset);
      mockUserRepository.update.mockResolvedValue({ ...mockUser, password: "mockedhashedpassword" });
      mockPasswordResetRepository.delete.mockResolvedValue(mockPasswordReset);
      mockPasswordResetRepository.removeExpiredUserTokens.mockResolvedValue(0);

      await passwordResetService.resetPassword("validtoken", "newpassword");

      expect(mockPasswordResetRepository.findByToken).toHaveBeenCalledWith("validtoken");
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith("newpassword", "mockedsalt");
      expect(mockUserRepository.update).toHaveBeenCalledWith("user123", {
        password: "mockedhashedpassword",
      });
      expect(mockPasswordResetRepository.delete).toHaveBeenCalledWith("reset123");
      expect(mockPasswordResetRepository.removeExpiredUserTokens).toHaveBeenCalledWith("user123");
    });

    it("should throw error for invalid token", async () => {
      mockPasswordResetRepository.findByToken.mockResolvedValue(null);

      await expect(
        passwordResetService.resetPassword("invalidtoken", "newpassword")
      ).rejects.toThrow(new ValidationError("Token inválido ou expirado", ErrorCode.INVALID_TOKEN));
    });

    it("should throw error for expired token", async () => {
      const expiredPasswordReset = {
        ...mockPasswordReset,
        expiresAt: new Date(Date.now() - 3600000), // 1 hora no passado
      };

      mockPasswordResetRepository.findByToken.mockResolvedValue(expiredPasswordReset);
      mockPasswordResetRepository.delete.mockResolvedValue(mockPasswordReset);

      await expect(
        passwordResetService.resetPassword("expiredtoken", "newpassword")
      ).rejects.toThrow(new ValidationError("Token expirado", ErrorCode.INVALID_TOKEN));

      expect(mockPasswordResetRepository.delete).toHaveBeenCalledWith("reset123");
    });

    it("should throw error for invalid password", async () => {
      mockPasswordResetRepository.findByToken.mockResolvedValue(mockPasswordReset);

      await expect(
        passwordResetService.resetPassword("validtoken", "123") // senha muito curta
      ).rejects.toThrow(
        new ValidationError("A senha deve ter pelo menos 6 caracteres", ErrorCode.INVALID_PASSWORD)
      );
    });

    it("should throw error if user not found during update", async () => {
      mockPasswordResetRepository.findByToken.mockResolvedValue(mockPasswordReset);
      mockUserRepository.update.mockResolvedValue(null);

      await expect(
        passwordResetService.resetPassword("validtoken", "newpassword")
      ).rejects.toThrow(new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND));
    });
  });

  describe("getUserActiveTokens", () => {
    it("should return active tokens for user", async () => {
      const tokens = [
        { ...mockPasswordReset, expiresAt: new Date(Date.now() + 3600000) }, // ativo
        { ...mockPasswordReset, _id: "reset456", expiresAt: new Date(Date.now() - 3600000) }, // expirado
      ];

      mockPasswordResetRepository.findByUserId.mockResolvedValue(tokens);

      const result = await passwordResetService.getUserActiveTokens("user123");

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe("reset123");
      expect(mockPasswordResetRepository.findByUserId).toHaveBeenCalledWith("user123");
    });
  });

  describe("countUserActiveTokens", () => {
    it("should return count of active tokens", async () => {
      mockPasswordResetRepository.countActiveTokensByUser.mockResolvedValue(2);

      const result = await passwordResetService.countUserActiveTokens("user123");

      expect(result).toBe(2);
      expect(mockPasswordResetRepository.countActiveTokensByUser).toHaveBeenCalledWith("user123");
    });
  });

  describe("removeAllUserTokens", () => {
    it("should remove all tokens for user", async () => {
      mockPasswordResetRepository.removeAllUserTokens.mockResolvedValue(3);

      const result = await passwordResetService.removeAllUserTokens("user123");

      expect(result).toBe(3);
      expect(mockPasswordResetRepository.removeAllUserTokens).toHaveBeenCalledWith("user123");
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should remove expired tokens", async () => {
      mockPasswordResetRepository.removeExpiredTokens.mockResolvedValue(5);

      const result = await passwordResetService.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockPasswordResetRepository.removeExpiredTokens).toHaveBeenCalled();
    });
  });

  describe("getExpiringTokens", () => {
    it("should return expiring tokens", async () => {
      const expiringTokens = [mockPasswordReset];
      mockPasswordResetRepository.findExpiringTokens.mockResolvedValue(expiringTokens);

      const result = await passwordResetService.getExpiringTokens();

      expect(result).toEqual(expiringTokens);
      expect(mockPasswordResetRepository.findExpiringTokens).toHaveBeenCalledWith(undefined);
    });

    it("should return expiring tokens before specific date", async () => {
      const beforeDate = new Date();
      const expiringTokens = [mockPasswordReset];
      mockPasswordResetRepository.findExpiringTokens.mockResolvedValue(expiringTokens);

      const result = await passwordResetService.getExpiringTokens(beforeDate);

      expect(result).toEqual(expiringTokens);
      expect(mockPasswordResetRepository.findExpiringTokens).toHaveBeenCalledWith(beforeDate);
    });
  });

  describe("hasValidTokenForUser", () => {
    it("should return true if user has valid tokens", async () => {
      mockPasswordResetRepository.countActiveTokensByUser.mockResolvedValue(1);

      const result = await passwordResetService.hasValidTokenForUser("user123");

      expect(result).toBe(true);
      expect(mockPasswordResetRepository.countActiveTokensByUser).toHaveBeenCalledWith("user123");
    });

    it("should return false if user has no valid tokens", async () => {
      mockPasswordResetRepository.countActiveTokensByUser.mockResolvedValue(0);

      const result = await passwordResetService.hasValidTokenForUser("user123");

      expect(result).toBe(false);
    });
  });
}); 