import { AuthService } from "../../../services/AuthService";
import { AuthModel } from "../../../models/AuthModel";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { Document } from "mongoose";
import type { IUser } from "../../../interfaces/IUser";
import type { JwtPayload } from "jsonwebtoken";

// Interface que representa o documento de usuário no Mongoose
interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  cpf: string;
  rg: string;
  birthDate: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mock do AuthModel
jest.mock("../../../models/AuthModel");

// Definir segredo JWT para testes
process.env.JWT_SECRET = "test-secret";

// Tipo que permite acessar o modelo mockado dentro do serviço
type AuthServiceWithModel = {
  authModel: jest.Mocked<AuthModel>;
};

describe("AuthService", () => {
  let authService: AuthService;
  let authModel: jest.Mocked<AuthModel>;

  beforeEach(() => {
    jest.clearAllMocks();

    authModel = new AuthModel() as jest.Mocked<AuthModel>;
    authService = new AuthService();
    (authService as unknown as AuthServiceWithModel).authModel = authModel;
  });

  // Mock do documento de usuário que simula um documento do Mongoose
  const mockUserDocument: UserDocument = {
    _id: new Types.ObjectId(),
    name: "Test User",
    email: "test@example.com",
    password: "hashedPassword123",
    role: "customer",
    cpf: "85804688502",
    rg: "1299106781",
    birthDate: new Date("1990-01-01"),
    comparePassword: jest.fn().mockImplementation(async () => true),
  } as unknown as UserDocument;

  // Mock do objeto de interface IUser que é retornado pelo serviço
  const mockUserResponse: IUser = {
    _id: mockUserDocument._id.toString(),
    name: mockUserDocument.name,
    email: mockUserDocument.email,
    password: mockUserDocument.password,
    role: mockUserDocument.role,
    cpf: mockUserDocument.cpf,
    rg: mockUserDocument.rg,
    birthDate: mockUserDocument.birthDate,
    comparePassword: mockUserDocument.comparePassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("login", () => {
    it("should login successfully with correct credentials", async () => {
      authModel.findUserByEmail.mockResolvedValue(mockUserDocument);
      authModel.verifyPassword.mockResolvedValue(true);
      authModel.convertToIUser.mockReturnValue(mockUserResponse);

      const result = await authService.login("test@example.com", "123456");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
      expect(authModel.findUserByEmail).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(authModel.verifyPassword).toHaveBeenCalledWith(
        mockUserDocument,
        "123456"
      );
    });

    it("should validate empty email and password", async () => {
      await expect(authService.login("", "123456")).rejects.toThrow(
        "Login e senha são obrigatórios"
      );

      await expect(authService.login("test@example.com", "")).rejects.toThrow(
        "Login e senha são obrigatórios"
      );

      expect(authModel.findUserByEmail).not.toHaveBeenCalled();
    });

    it("should validate login credentials", async () => {
      authModel.findUserByEmail.mockResolvedValue(null);
      
      await expect(
        authService.login("invalid-email", "123456")
      ).rejects.toThrow("Credenciais inválidas");

      expect(authModel.findUserByEmail).toHaveBeenCalled();
    });

    it("should validate password presence", async () => {
      // Act & Assert
      await expect(authService.login("test@example.com", "")).rejects.toThrow(
        "Login e senha são obrigatórios"
      );
      expect(authModel.findUserByEmail).not.toHaveBeenCalled();
    });

    it("should throw when user not found", async () => {
      // Arrange
      authModel.findUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login("nonexistent@example.com", "123456")
      ).rejects.toThrow("Credenciais inválidas");
      expect(authModel.verifyPassword).not.toHaveBeenCalled();
    });

    it("should throw when password is incorrect", async () => {
      // Arrange
      authModel.findUserByEmail.mockResolvedValue(mockUserDocument);
      authModel.verifyPassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login("test@example.com", "wrongpass")
      ).rejects.toThrow("Credenciais inválidas");
    });

    it("should return a valid JWT token with correct payload", async () => {
      authModel.findUserByEmail.mockResolvedValue(mockUserDocument);
      authModel.verifyPassword.mockResolvedValue(true);
      authModel.convertToIUser.mockReturnValue(mockUserResponse);

      const result = await authService.login("test@example.com", "123456");

      const decoded = jwt.verify(
        result.token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
      expect(decoded).toHaveProperty("id", mockUserDocument._id.toString());
      expect(decoded).toHaveProperty("role", mockUserDocument.role);
      expect(decoded).toHaveProperty("iat");
      expect(decoded).toHaveProperty("exp");
      expect(decoded.exp).toBeGreaterThan(decoded.iat as number);
    });

    it("should not include sensitive data in the response", async () => {
      // Arrange
      authModel.findUserByEmail.mockResolvedValue(mockUserDocument);
      authModel.verifyPassword.mockResolvedValue(true);
      authModel.convertToIUser.mockReturnValue(mockUserResponse);

      // Act
      const result = await authService.login("test@example.com", "123456");

      // Assert
      expect(result.user).not.toHaveProperty("password");
      expect(result.user).not.toHaveProperty("comparePassword");
    });

    it("should login successfully with service order", async () => {
      // Arrange
      const serviceOrder = "12345";
      authModel.findUserByServiceOrder.mockResolvedValue(mockUserDocument);
      authModel.convertToIUser.mockReturnValue(mockUserResponse);

      // Act
      const result = await authService.login(serviceOrder, serviceOrder);

      // Assert
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
      expect(authModel.findUserByServiceOrder).toHaveBeenCalledWith(serviceOrder);
    });

    it("should fail login with service order and wrong password", async () => {
      // Arrange
      const serviceOrder = "12345";
      authModel.findUserByServiceOrder.mockResolvedValue(mockUserDocument);

      // Act & Assert
      await expect(
        authService.login(serviceOrder, "wrongpassword")
      ).rejects.toThrow("Credenciais inválidas");
    });

    it("should fail login with non-existent service order", async () => {
      // Arrange
      const serviceOrder = "99999";
      authModel.findUserByServiceOrder.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login(serviceOrder, serviceOrder)
      ).rejects.toThrow("Credenciais inválidas");
    });
  });

  describe("validateToken", () => {
    it("should validate token successfully", async () => {
      // Arrange
      authModel.findUserById.mockResolvedValue(mockUserDocument);
      authModel.convertToIUser.mockReturnValue(mockUserResponse);

      // Act
      const result = await authService.validateToken(
        mockUserDocument._id.toString()
      );

      // Assert
      expect(result).toHaveProperty("_id", mockUserDocument._id.toString());
      expect(result.email).toBe(mockUserDocument.email);
      expect(authModel.findUserById).toHaveBeenCalledWith(
        mockUserDocument._id.toString()
      );
    });

    it("should handle malformed user ID", async () => {
      // Act & Assert
      await expect(authService.validateToken("invalid-id")).rejects.toThrow(
        "Token inválido"
      );
      expect(authModel.findUserById).toHaveBeenCalledWith("invalid-id");
    });

    it("should throw when user not found", async () => {
      // Arrange
      authModel.findUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.validateToken(mockUserDocument._id.toString())
      ).rejects.toThrow("Token inválido");
    });

    it("should validate user role matches token role", async () => {
      const adminUserDocument: UserDocument = {
        ...mockUserDocument,
        role: "admin",
      } as UserDocument;

      const adminUserResponse: IUser = {
        ...mockUserResponse,
        role: "admin",
      };

      authModel.findUserById.mockResolvedValue(adminUserDocument);
      authModel.convertToIUser.mockReturnValue(adminUserResponse);

      const result = await authService.validateToken(
        adminUserDocument._id.toString()
      );

      expect(result.role).toBe("admin");
    });
    it("should not expose sensitive data in validated user", async () => {
      // Arrange
      authModel.findUserById.mockResolvedValue(mockUserDocument);
      authModel.convertToIUser.mockReturnValue(mockUserResponse);

      // Act
      const result = await authService.validateToken(
        mockUserDocument._id.toString()
      );

      // Assert
      expect(result).not.toHaveProperty("password");
    });
  });

  // Testes de edge cases e validações
  describe("edge cases", () => {
    it("should handle undefined email and password", async () => {
      // Act & Assert
      await expect(
        authService.login(
          undefined as unknown as string,
          undefined as unknown as string
        )
      ).rejects.toThrow("Login e senha são obrigatórios");
    });

    it("should handle null email and password", async () => {
      // Act & Assert
      await expect(
        authService.login(null as unknown as string, null as unknown as string)
      ).rejects.toThrow("Login e senha são obrigatórios");
    });

    it("should handle empty string email and password", async () => {
      // Act & Assert
      await expect(authService.login("", "")).rejects.toThrow(
        "Login e senha são obrigatórios"
      );
    });

    it("should handle whitespace only email and password", async () => {
      // Act & Assert
      await expect(authService.login("   ", "   ")).rejects.toThrow(
        "Login e senha são obrigatórios"
      );
    });
  });
});
