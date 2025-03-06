import { UserService } from "../../../services/UserService";
import { UserModel } from "../../../models/UserModel";
import type { IUser } from "../../../interfaces/IUser";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { isValidCPF } from "../../../utils/validators";

// Mock para a função de validação de CPF
jest.mock("../../../utils/validators", () => ({
  isValidCPF: jest.fn().mockImplementation(() => true),
}));

// Mock do UserModel
jest.mock("../../../models/UserModel", () => {
  return {
    UserModel: jest.fn().mockImplementation(() => ({
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByCpf: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      checkPassword: jest.fn(),
      search: jest.fn(),
      findByRole: jest.fn(),
    })),
  };
});

type UserServiceWithModel = {
  userModel: jest.Mocked<UserModel>;
};

describe("UserService", () => {
  let userService: UserService;
  let userModel: jest.Mocked<UserModel>;

  // CPFs válidos para testes
  const validCPFs = {
    user: "52998224725",
    updatedUser: "87748248800",
    anotherUser: "71428793860",
    invalid: "11111111111",
  };

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
    cpf: validCPFs.user,
    rg: "987654321",
    birthDate: new Date("1990-01-01"),
  };

  describe("createUser", () => {
    it("should create a user", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        _id: "123",
        ...mockUserData,
      } as IUser);

      const result = await userService.createUser(mockUserData);

      expect(result._id).toBe("123");
      expect(userModel.create).toHaveBeenCalledWith(mockUserData);
      expect(userModel.findByCpf).toHaveBeenCalledWith(mockUserData.cpf);
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

    it("should throw if CPF exists", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue({
        _id: "123",
        ...mockUserData,
      } as IUser);

      await expect(userService.createUser(mockUserData)).rejects.toThrow(
        "CPF já cadastrado"
      );
    });

    it("should throw if CPF is invalid", async () => {
      // Sobrescrever o mock para retornar false para CPF inválido
      (isValidCPF as jest.Mock).mockImplementationOnce(() => false);

      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue(null);

      await expect(
        userService.createUser({
          ...mockUserData,
          cpf: validCPFs.invalid, // CPF considerado inválido pelo mock
        })
      ).rejects.toThrow("CPF inválido");
    });

    it("should throw if birth date is in the future", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await expect(
        userService.createUser({
          ...mockUserData,
          birthDate: futureDate,
        })
      ).rejects.toThrow("Data de nascimento inválida");
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

  describe("getUserByCpf", () => {
    it("should return user by CPF", async () => {
      const mockUser = {
        _id: "123",
        ...mockUserData,
      } as IUser;

      userModel.findByCpf.mockResolvedValue(mockUser);

      const result = await userService.getUserByCpf(validCPFs.user);

      expect(result._id).toBe("123");
      expect(result.cpf).toBe(validCPFs.user);
      expect(userModel.findByCpf).toHaveBeenCalledWith(validCPFs.user);
    });

    it("should throw if user not found by CPF", async () => {
      userModel.findByCpf.mockResolvedValue(null);

      await expect(userService.getUserByCpf(validCPFs.user)).rejects.toThrow(
        "Usuário não encontrado"
      );
    });

    it("should validate CPF format", async () => {
      await expect(userService.getUserByCpf("invalid-cpf")).rejects.toThrow(
        "Formato de CPF inválido"
      );
      expect(userModel.findByCpf).not.toHaveBeenCalled();
    });
  });

  describe("updateUser", () => {
    it("should update user", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue(null);
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

    it("should update user CPF, RG and birthDate", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue(null);

      const updateData = {
        cpf: validCPFs.updatedUser,
        rg: "123456789",
        birthDate: new Date("1995-05-15"),
      };

      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        ...updateData,
      } as IUser);

      const result = await userService.updateUser("123", updateData);

      expect(result.cpf).toBe(updateData.cpf);
      expect(result.rg).toBe(updateData.rg);
      expect(result.birthDate).toEqual(updateData.birthDate);
      expect(userModel.update).toHaveBeenCalledWith("123", updateData);
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

    it("should throw if CPF exists", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue({
        _id: "456",
        ...mockUserData,
      } as IUser);

      await expect(
        userService.updateUser("123", { cpf: validCPFs.user })
      ).rejects.toThrow("CPF já cadastrado");
    });

    it("should not throw if updating with same CPF", async () => {
      userModel.findByEmail.mockResolvedValue(null);
      userModel.findByCpf.mockResolvedValue({
        _id: "123", // Mesmo ID do usuário que está sendo atualizado
        ...mockUserData,
      } as IUser);

      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        name: "Updated Name",
      } as IUser);

      const result = await userService.updateUser("123", {
        name: "Updated Name",
        cpf: validCPFs.user,
      });

      expect(result.name).toBe("Updated Name");
      expect(userModel.update).toHaveBeenCalled();
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
      userModel.findByCpf.mockResolvedValue(null);
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
      userModel.findByCpf.mockResolvedValue(null);
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
      userModel.findByCpf.mockResolvedValue(null);
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
      userModel.findByCpf.mockResolvedValue(null);
      userModel.update.mockResolvedValue({
        _id: "123",
        ...mockUserData,
        image: undefined,
      } as IUser);

      const result = await userService.updateUser("123", {
        image: undefined,
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
      userModel.findByCpf.mockResolvedValue(null);
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

  describe("searchUsers", () => {
    it("should search users by term", async () => {
      const mockUsers = [
        { _id: "1", ...mockUserData, name: "John Doe" },
        { _id: "2", ...mockUserData, name: "Jane Doe" },
      ] as IUser[];

      userModel.search.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers("Doe");

      expect(result).toHaveLength(2);
      expect(userModel.search).toHaveBeenCalledWith("doe");
    });

    it("should throw if no users found with search term", async () => {
      userModel.search.mockResolvedValue([]);

      await expect(userService.searchUsers("nonexistent")).rejects.toThrow(
        "Nenhum usuário encontrado com os critérios de busca"
      );
    });

    it("should return all users if search term is empty", async () => {
      const mockUsers = [
        { _id: "1", ...mockUserData },
        { _id: "2", ...mockUserData },
      ] as IUser[];

      userModel.findAll.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers("   ");

      expect(result).toHaveLength(2);
      expect(userModel.findAll).toHaveBeenCalled();
    });
  });

  describe("getUsersByRole", () => {
    it("should return users by role", async () => {
      const mockUsers = [
        { _id: "1", ...mockUserData, role: "admin" },
        { _id: "2", ...mockUserData, role: "admin" },
      ] as IUser[];

      userModel.findByRole.mockResolvedValue(mockUsers);

      const result = await userService.getUsersByRole("admin");

      expect(result).toHaveLength(2);
      expect(userModel.findByRole).toHaveBeenCalledWith("admin");
    });

    it("should throw if no users found with role", async () => {
      userModel.findByRole.mockResolvedValue([]);

      await expect(userService.getUsersByRole("admin")).rejects.toThrow(
        "Nenhum usuário com role 'admin' encontrado"
      );
    });

    it("should throw if invalid role", async () => {
      await expect(userService.getUsersByRole("invalid_role")).rejects.toThrow(
        "Role inválida"
      );
      expect(userModel.findByRole).not.toHaveBeenCalled();
    });
  });
});
