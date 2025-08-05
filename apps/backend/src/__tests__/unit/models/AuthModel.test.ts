import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { AuthModel } from "../../../models/AuthModel";
import { User } from "../../../schemas/UserSchema";
import { Order } from "../../../schemas/OrderSchema";
import bcrypt from "bcrypt";
import { Types } from "mongoose";

// Mock do Order schema
jest.mock("../../../schemas/OrderSchema", () => ({
  Order: {
    findOne: jest.fn(),
  },
}));

describe("AuthModel", () => {
  let authModel: AuthModel;
  let mockUser: any;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authModel = new AuthModel();

    // Mock do usuário
    mockUser = {
      _id: new Types.ObjectId(),
      name: "Test User",
      email: "test@example.com",
      password: "hashedPassword",
      role: "customer",
      cpf: "12345678901",
      rg: "123456789",
      birthDate: new Date("1990-01-01"),
      image: "/images/users/test.jpg",
      address: "Test Address",
      phone: "123456789",
      comparePassword: jest.fn(),
      toObject: jest.fn().mockReturnValue({
        _id: new Types.ObjectId(),
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword",
        role: "customer",
        cpf: "12345678901",
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
        image: "/images/users/test.jpg",
        address: "Test Address",
        phone: "123456789",
      }),
    };

    // Mock do pedido
    mockOrder = {
      _id: new Types.ObjectId(),
      serviceOrder: "12345",
      clientId: new Types.ObjectId(),
    };
  });

  describe("findUserByEmail", () => {
    it("should find user by email successfully", async () => {
      const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      const result = await authModel.findUserByEmail("test@example.com");

      expect(result).toEqual(mockUser);
      expect(findOneSpy).toHaveBeenCalledWith({
        email: { $regex: new RegExp("^test@example.com$", "i") },
      });
    });

    it("should return null when user not found by email", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const result = await authModel.findUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    it("should handle case insensitive email search", async () => {
      const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      await authModel.findUserByEmail("TEST@EXAMPLE.COM");

      expect(findOneSpy).toHaveBeenCalledWith({
        email: { $regex: new RegExp("^TEST@EXAMPLE.COM$", "i") },
      });
    });
  });

  describe("findUserByCpf", () => {
    it("should find user by CPF successfully", async () => {
      const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      const result = await authModel.findUserByCpf("123.456.789-01");

      expect(result).toEqual(mockUser);
      expect(findOneSpy).toHaveBeenCalledWith({
        cpf: "12345678901",
      });
    });

    it("should return null when user not found by CPF", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const result = await authModel.findUserByCpf("98765432100");

      expect(result).toBeNull();
    });

    it("should sanitize CPF by removing non-digits", async () => {
      const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      await authModel.findUserByCpf("123.456.789-01");

      expect(findOneSpy).toHaveBeenCalledWith({
        cpf: "12345678901",
      });
    });
  });

  describe("findUserByCnpj", () => {
    it("should find user by CNPJ successfully", async () => {
      const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      const result = await authModel.findUserByCnpj("12.345.678/0001-95");

      expect(result).toEqual(mockUser);
      expect(findOneSpy).toHaveBeenCalledWith({
        cnpj: "12345678000195",
      });
    });

    it("should return null when user not found by CNPJ", async () => {
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      const result = await authModel.findUserByCnpj("98.765.432/0001-10");

      expect(result).toBeNull();
    });

    it("should sanitize CNPJ by removing non-digits", async () => {
      const findOneSpy = jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any);

      await authModel.findUserByCnpj("12.345.678/0001-95");

      expect(findOneSpy).toHaveBeenCalledWith({
        cnpj: "12345678000195",
      });
    });
  });

  describe("findUserById", () => {
    it("should find user by ID successfully", async () => {
      const findByIdSpy = jest.spyOn(User, "findById").mockResolvedValue(mockUser as any);
      const validId = new Types.ObjectId().toString();

      const result = await authModel.findUserById(validId);

      expect(result).toEqual(mockUser);
      expect(findByIdSpy).toHaveBeenCalledWith(validId);
    });

    it("should return null when user not found by ID", async () => {
      jest.spyOn(User, "findById").mockResolvedValue(null);
      const validId = new Types.ObjectId().toString();

      const result = await authModel.findUserById(validId);

      expect(result).toBeNull();
    });

    it("should return null for invalid ObjectId", async () => {
      const result = await authModel.findUserById("invalid-id");

      expect(result).toBeNull();
    });

    it("should return null for empty string ID", async () => {
      const result = await authModel.findUserById("");

      expect(result).toBeNull();
    });
  });

  describe("findUserByServiceOrder", () => {
    it("should find user by service order successfully", async () => {
      const mockOrderWithClient = {
        ...mockOrder,
        clientId: mockUser._id,
      };

      const Order = require("../../../schemas/OrderSchema").Order;
      const findOneOrderSpy = jest.spyOn(Order, "findOne").mockResolvedValue(mockOrderWithClient);
      const findByIdUserSpy = jest.spyOn(User, "findById").mockResolvedValue(mockUser as any);

      const result = await authModel.findUserByServiceOrder("12345");

      expect(result).toEqual(mockUser);
      expect(findOneOrderSpy).toHaveBeenCalledWith({ serviceOrder: "12345" });
      expect(findByIdUserSpy).toHaveBeenCalledWith(mockUser._id);
    });

    it("should return null when order not found", async () => {
      const Order = require("../../../schemas/OrderSchema").Order;
      jest.spyOn(Order, "findOne").mockResolvedValue(null);

      const result = await authModel.findUserByServiceOrder("99999");

      expect(result).toBeNull();
    });

    it("should return null when user not found for service order", async () => {
      const mockOrderWithClient = {
        ...mockOrder,
        clientId: new Types.ObjectId(),
      };

      const Order = require("../../../schemas/OrderSchema").Order;
      jest.spyOn(Order, "findOne").mockResolvedValue(mockOrderWithClient);
      jest.spyOn(User, "findById").mockResolvedValue(null);

      const result = await authModel.findUserByServiceOrder("12345");

      expect(result).toBeNull();
    });

    it("should convert service order to string", async () => {
      const mockOrderWithClient = {
        ...mockOrder,
        clientId: mockUser._id,
      };

      const Order = require("../../../schemas/OrderSchema").Order;
      const findOneOrderSpy = jest.spyOn(Order, "findOne").mockResolvedValue(mockOrderWithClient);
      jest.spyOn(User, "findById").mockResolvedValue(mockUser as any);

      await authModel.findUserByServiceOrder("12345");

      expect(findOneOrderSpy).toHaveBeenCalledWith({ serviceOrder: "12345" });
    });
  });

  describe("verifyPassword", () => {
    it("should verify password successfully", async () => {
      // Criar um mock que simula o comportamento do comparePassword
      const mockComparePassword = jest.fn().mockImplementation(() => Promise.resolve(true));
      
      const userWithComparePassword = {
        ...mockUser,
        comparePassword: mockComparePassword,
      };

      const result = await authModel.verifyPassword(userWithComparePassword, "correctPassword");

      expect(result).toBe(true);
      expect(mockComparePassword).toHaveBeenCalledWith("correctPassword");
    });

    it("should return false for wrong password", async () => {
      const mockComparePassword = jest.fn().mockImplementation(() => Promise.resolve(false));
      
      const userWithComparePassword = {
        ...mockUser,
        comparePassword: mockComparePassword,
      };

      const result = await authModel.verifyPassword(userWithComparePassword, "wrongPassword");

      expect(result).toBe(false);
      expect(mockComparePassword).toHaveBeenCalledWith("wrongPassword");
    });

    it("should handle password verification error", async () => {
      const mockComparePassword = jest.fn().mockImplementation(() => Promise.reject(new Error("Hash error")));
      
      const userWithComparePassword = {
        ...mockUser,
        comparePassword: mockComparePassword,
      };

      await expect(
        authModel.verifyPassword(userWithComparePassword, "password")
      ).rejects.toThrow("Hash error");
      expect(mockComparePassword).toHaveBeenCalledWith("password");
    });

    it("should handle password verification with empty password", async () => {
      const mockComparePassword = jest.fn().mockImplementation(() => Promise.resolve(false));
      
      const userWithComparePassword = {
        ...mockUser,
        comparePassword: mockComparePassword,
      };

      const result = await authModel.verifyPassword(userWithComparePassword, "");

      expect(result).toBe(false);
      expect(mockComparePassword).toHaveBeenCalledWith("");
    });
  });

  describe("convertToIUser", () => {
    it("should convert user document to IUser interface", () => {
      const mockComparePassword = jest.fn();
      const userWithComparePassword = {
        ...mockUser,
        comparePassword: mockComparePassword,
      };

      const result = authModel.convertToIUser(userWithComparePassword);

      expect(result).toEqual({
        _id: mockUser._id.toString(),
        name: "Test User",
        email: "test@example.com",
        role: "customer",
        cpf: "12345678901",
        rg: "123456789",
        birthDate: new Date("1990-01-01"),
        image: "/images/users/test.jpg",
        address: "Test Address",
        phone: "123456789",
        comparePassword: expect.any(Function),
      });
      expect(result).not.toHaveProperty("password");
    });

    it("should handle user without optional fields", () => {
      const userWithoutOptionals = {
        ...mockUser,
        image: undefined,
        address: undefined,
        phone: undefined,
        birthDate: undefined,
        comparePassword: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          _id: new Types.ObjectId(),
          name: "Test User",
          email: "test@example.com",
          password: "hashedPassword",
          role: "customer",
          cpf: "12345678901",
          rg: "123456789",
        }),
      };

      const result = authModel.convertToIUser(userWithoutOptionals);

      expect(result).toEqual({
        _id: userWithoutOptionals._id.toString(),
        name: "Test User",
        email: "test@example.com",
        role: "customer",
        cpf: "12345678901",
        rg: "123456789",
        comparePassword: expect.any(Function),
      });
      expect(result).not.toHaveProperty("password");
      // Campos undefined são incluídos no resultado, então verificamos que não têm valores
      expect(result.image).toBeUndefined();
      expect(result.address).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.birthDate).toBeUndefined();
    });

    it("should preserve image field when present", () => {
      const userWithImage = {
        ...mockUser,
        comparePassword: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          _id: new Types.ObjectId(),
          name: "Test User",
          email: "test@example.com",
          password: "hashedPassword",
          role: "customer",
          cpf: "12345678901",
          rg: "123456789",
          image: "/images/users/custom.jpg",
        }),
      };

      const result = authModel.convertToIUser(userWithImage);

      expect(result.image).toBe("/images/users/custom.jpg");
    });

    it("should preserve birthDate field when present", () => {
      const customBirthDate = new Date("1985-05-15");
      const userWithBirthDate = {
        ...mockUser,
        comparePassword: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          _id: new Types.ObjectId(),
          name: "Test User",
          email: "test@example.com",
          password: "hashedPassword",
          role: "customer",
          cpf: "12345678901",
          rg: "123456789",
          birthDate: customBirthDate,
        }),
      };

      const result = authModel.convertToIUser(userWithBirthDate);

      expect(result.birthDate).toEqual(customBirthDate);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle database errors in findUserByEmail", async () => {
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database connection failed"));

      await expect(authModel.findUserByEmail("test@example.com")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in findUserByCpf", async () => {
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database connection failed"));

      await expect(authModel.findUserByCpf("12345678901")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in findUserByCnpj", async () => {
      jest.spyOn(User, "findOne").mockRejectedValue(new Error("Database connection failed"));

      await expect(authModel.findUserByCnpj("12345678000195")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in findUserById", async () => {
      jest.spyOn(User, "findById").mockRejectedValue(new Error("Database connection failed"));
      const validId = new Types.ObjectId().toString();

      await expect(authModel.findUserById(validId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle database errors in findUserByServiceOrder", async () => {
      const Order = require("../../../schemas/OrderSchema").Order;
      jest.spyOn(Order, "findOne").mockRejectedValue(new Error("Database connection failed"));

      await expect(authModel.findUserByServiceOrder("12345")).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle null user in convertToIUser", () => {
      const nullUser = null;

      expect(() => authModel.convertToIUser(nullUser as any)).toThrow();
    });

    it("should handle user without toObject method", () => {
      const userWithoutToObject = {
        ...mockUser,
        toObject: undefined,
        comparePassword: jest.fn(),
      };

      expect(() => authModel.convertToIUser(userWithoutToObject)).toThrow();
    });
  });
}); 