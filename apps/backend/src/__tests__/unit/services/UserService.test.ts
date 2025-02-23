import { UserService } from "../../../services/UserService";
import { UserModel } from "../../../models/UserModel";
import type { IUser } from "../../../interfaces/IUser";
import {
  describe,
  it,
  expect,
  beforeEach,
  // beforeAll,
  // afterEach,
  // afterAll,
  jest,
} from "@jest/globals";

// Mock do UserModel
jest.mock("../../../models/UserModel", () => {
  return {
    UserModel: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      checkPassword: jest.fn(),
    })),
  };
});

type UserServiceWithModel = {
  userModel: jest.Mocked<UserModel>;
};

describe("UserService", () => {
  let userService: UserService;
  let userModel: jest.Mocked<UserModel>;

  beforeEach(() => {
    userModel = new UserModel() as jest.Mocked<UserModel>;
    userService = new UserService();
    (userService as unknown as UserServiceWithModel).userModel = userModel;
  });

  const mockUserData = {
    name: "Test User",
    email: "test@example.com",
    password: "123456",
    role: "customer" as const,
  };

  describe("createUser", () => {
    it("should create a user", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        _id: "123",
        ...mockUserData,
      } as IUser);

      const result = await userService.createUser(mockUserData);

      expect(result._id).toBe("123");
      expect(userModel.create).toHaveBeenCalledWith(mockUserData);
    });

    it("should throw if email exists", async () => {
      userModel.findByEmail.mockResolvedValue({
        _id: "123",
        ...mockUserData,
      } as IUser);

      await expect(userService.createUser(mockUserData)).rejects.toThrow(
        "Email já cadastrado"
      );
    });

    it("should throw if employee tries to create admin", async () => {
      await expect(
        userService.createUser(
          {
            ...mockUserData,
            role: "admin",
          },
          "employee"
        )
      ).rejects.toThrow("Funcionários só podem cadastrar clientes");
    });
  });

  describe("getAllUsers", () => {
    it("should return all users", async () => {
      const mockUsers = [
        { _id: "1", ...mockUserData },
        { _id: "2", ...mockUserData },
      ] as IUser[];

      userModel.findAll.mockResolvedValue(mockUsers);

      const result = await userService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(userModel.findAll).toHaveBeenCalled();
    });

    it("should throw if no users found", async () => {
      userModel.findAll.mockResolvedValue([]);

      await expect(userService.getAllUsers()).rejects.toThrow(
        "Nenhum usuário encontrado"
      );
    });
  });

  describe("getUserById", () => {
    it("should return user by id", async () => {
      const mockUser = {
        _id: "123",
        ...mockUserData,
      } as IUser;

      userModel.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById("123");

      expect(result._id).toBe("123");
      expect(userModel.findById).toHaveBeenCalledWith("123");
    });

    it("should throw if user not found", async () => {
      userModel.findById.mockResolvedValue(null);

      await expect(userService.getUserById("123")).rejects.toThrow(
        "Usuário não encontrado"
      );
    });
  });

  describe("updateUser", () => {
    it("should update user", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        name: "Updated Name",
      } as IUser);

      const result = await userService.updateUser("123", {
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
      expect(userModel.update).toHaveBeenCalledWith("123", {
        name: "Updated Name",
      });
    });

    it("should throw if email exists", async () => {
      userModel.findByEmail.mockResolvedValue({
        _id: "456",
        ...mockUserData,
      } as IUser);

      await expect(
        userService.updateUser("123", { email: "test@example.com" })
      ).rejects.toThrow("Email já cadastrado");
    });
  });

  describe("deleteUser", () => {
    it("should delete user", async () => {
      const mockUser = {
        _id: "123",
        ...mockUserData,
      } as IUser;

      userModel.delete.mockResolvedValue(mockUser);

      const result = await userService.deleteUser("123");

      expect(result._id).toBe("123");
      expect(userModel.delete).toHaveBeenCalledWith("123");
    });

    it("should throw if user not found", async () => {
      userModel.delete.mockResolvedValue(null);

      await expect(userService.deleteUser("123")).rejects.toThrow(
        "Usuário não encontrado"
      );
    });
  });

  describe("updateProfile", () => {
    it("should update profile", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        name: "Updated Name",
      } as IUser);

      const result = await userService.updateProfile("123", {
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
    });

    it("should throw if trying to update role", async () => {
      await expect(
        userService.updateProfile("123", { role: "admin" })
      ).rejects.toThrow("Não é permitido alterar a role do usuário");
    });
  });

  describe("User image handling", () => {
    it("should create user with image", async () => {
      const mockUserWithImage = {
        ...mockUserData,
        image: "/images/users/test-image.jpg",
      };

      userModel.findByEmail.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        _id: "123",
        ...mockUserWithImage,
      } as IUser);

      const result = await userService.createUser(mockUserWithImage);

      expect(result._id).toBe("123");
      expect(result.image).toBe("/images/users/test-image.jpg");
      expect(userModel.create).toHaveBeenCalledWith(mockUserWithImage);
    });

    it("should update user image", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        image: "/images/users/new-image.jpg",
      } as IUser);

      const result = await userService.updateUser("123", {
        image: "/images/users/new-image.jpg",
      });

      expect(result.image).toBe("/images/users/new-image.jpg");
      expect(userModel.update).toHaveBeenCalledWith("123", {
        image: "/images/users/new-image.jpg",
      });
    });

    it("should remove user image", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        image: undefined,
      } as IUser);

      const result = await userService.updateUser("123", {
        image: undefined, // Usando undefined em vez de null
      });

      expect(result.image).toBeUndefined();
    });

    it("should update other fields while keeping image", async () => {
      const userWithImage = {
        _id: "123",
        ...mockUserData,
        image: "/images/users/existing-image.jpg",
      } as IUser;

      userModel.findById.mockResolvedValue(userWithImage);
      userModel.findByEmail.mockResolvedValue(null);
      userModel.update.mockResolvedValue({
        ...userWithImage,
        name: "Updated Name",
      } as IUser);

      const result = await userService.updateUser("123", {
        name: "Updated Name",
      });

      expect(result.name).toBe("Updated Name");
      expect(result.image).toBe("/images/users/existing-image.jpg");
    });
  });
});
