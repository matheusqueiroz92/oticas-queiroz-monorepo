import { UserModel } from "../../../models/UserModel";
import { User } from "../../../schemas/UserSchema";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import { describe, it, expect, beforeEach } from "@jest/globals";

config();

describe("UserModel", () => {
  let userModel: UserModel;

  // CPFs válidos para testes
  const validCPFs = {
    user: "52998224725",
    updatedUser: "87748248800",
    anotherUser: "71428793860",
  };

  beforeEach(async () => {
    await User.deleteMany({});
    userModel = new UserModel();
  });

  const mockPassword = "123456";
  const mockUser = {
    name: "Test User",
    email: "test@example.com",
    password: mockPassword,
    role: "customer" as const,
    cpf: validCPFs.user,
    rg: "987654321",
    birthDate: new Date("1990-01-01"),
  };

  describe("checkPassword", () => {
    it("should return true for correct password", async () => {
      const hashedPassword = await bcrypt.hash(mockPassword, 10);
      const createdUser = await User.create({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await userModel.checkPassword(
        createdUser._id.toString(),
        mockPassword
      );

      expect(result).toBe(true);
    });
  });

  describe("create", () => {
    it("should create a user", async () => {
      const user = await userModel.create(mockUser);

      expect(user).toHaveProperty("_id");
      expect(user.name).toBe(mockUser.name);
      expect(user.email).toBe(mockUser.email);
      expect(user.cpf).toBe(mockUser.cpf);
      expect(user.rg).toBe(mockUser.rg);
      expect(new Date(user.birthDate as Date)).toEqual(mockUser.birthDate);
      expect(user).not.toHaveProperty("password");
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      const createdUser = await userModel.create(mockUser);
      const user = await userModel.findByEmail(mockUser.email);

      expect(user).toBeTruthy();
      expect(user?.email).toBe(mockUser.email);
    });

    it("should find a user by email case insensitive", async () => {
      await userModel.create(mockUser);
      const user = await userModel.findByEmail(mockUser.email.toUpperCase());

      expect(user).toBeTruthy();
      expect(user?.email).toBe(mockUser.email);
    });

    it("should return null if user not found", async () => {
      const user = await userModel.findByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("findByCpf", () => {
    it("should find a user by CPF", async () => {
      const createdUser = await userModel.create(mockUser);
      const user = await userModel.findByCpf(mockUser.cpf);

      expect(user).toBeTruthy();
      expect(user?.cpf).toBe(mockUser.cpf);
    });

    it("should return null if CPF not found", async () => {
      const user = await userModel.findByCpf("99999999999");
      expect(user).toBeNull();
    });

    it("should find CPF with formatting", async () => {
      await userModel.create(mockUser);
      // Format CPF with dots and dash
      const formattedCpf = validCPFs.user.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.$2.$3-$4"
      );
      const user = await userModel.findByCpf(formattedCpf);

      expect(user).toBeTruthy();
      expect(user?.cpf).toBe(mockUser.cpf);
    });
  });

  describe("findById", () => {
    it("should find a user by id", async () => {
      const createdUser = await User.create(mockUser);

      const user = await userModel.findById(createdUser._id.toString());

      expect(user).toBeTruthy();
      expect(user?._id).toBe(createdUser._id.toString());
    });

    it("should return null for invalid id", async () => {
      const user = await userModel.findById("invalid-id");
      expect(user).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }
      const updatedUser = await userModel.update(createdUser._id, {
        name: "Updated Name",
      });

      expect(updatedUser?.name).toBe("Updated Name");
    });

    it("should update CPF, RG and birthDate", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }

      const updatedData = {
        cpf: validCPFs.updatedUser,
        rg: "123456789",
        birthDate: new Date("1995-05-15"),
      };

      const updatedUser = await userModel.update(createdUser._id, updatedData);

      expect(updatedUser?.cpf).toBe(updatedData.cpf);
      expect(updatedUser?.rg).toBe(updatedData.rg);
      expect(new Date(updatedUser?.birthDate as Date)).toEqual(
        updatedData.birthDate
      );
    });

    it("should hash password when updating password", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }
      const updatedUser = await userModel.update(createdUser._id, {
        password: "newpassword",
      });

      const user = await User.findById(updatedUser?._id);
      expect(user?.password).not.toBe("newpassword");
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }
      const deletedUser = await userModel.delete(createdUser._id);

      expect(deletedUser?._id).toBe(createdUser._id);

      const user = await userModel.findById(createdUser._id);
      expect(user).toBeNull();
    });
  });

  describe("checkPassword", () => {
    it("should return true for correct password", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }
      const result = await userModel.checkPassword(
        createdUser._id,
        mockUser.password
      );
      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }
      const result = await userModel.checkPassword(
        createdUser._id,
        "wrongpassword"
      );
      expect(result).toBe(false);
    });
  });

  describe("User image operations", () => {
    it("should create user with image path", async () => {
      const userWithImage = {
        ...mockUser,
        image: "/images/users/test-image.jpg",
      };

      const user = await userModel.create(userWithImage);

      expect(user).toHaveProperty("image");
      expect(user.image).toBe("/images/users/test-image.jpg");
    });

    it("should update user image path", async () => {
      const createdUser = await userModel.create(mockUser);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }

      const updatedUser = await userModel.update(createdUser._id, {
        image: "/images/users/new-image.jpg",
      });

      expect(updatedUser?.image).toBe("/images/users/new-image.jpg");
    });

    it("should remove image field when setting to undefined", async () => {
      const userWithImage = {
        ...mockUser,
        image: "/images/users/test-image.jpg",
      };

      const createdUser = await userModel.create(userWithImage);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }

      const updatedUser = await userModel.update(createdUser._id, {
        image: undefined, // Usando undefined em vez de null
      });

      expect(updatedUser?.image).toBeUndefined();
    });

    it("should clear image by setting to undefined", async () => {
      const userWithImage = {
        ...mockUser,
        image: "/images/users/test-image.jpg",
      };

      const createdUser = await userModel.create(userWithImage);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }

      const updatedUser = await userModel.update(createdUser._id, {
        image: undefined,
      });

      expect(updatedUser?.image).toBeUndefined();
    });

    it("should keep image when updating other fields", async () => {
      const userWithImage = {
        ...mockUser,
        image: "/images/users/test-image.jpg",
      };

      const createdUser = await userModel.create(userWithImage);
      if (!createdUser._id) {
        throw new Error("Created user has no ID");
      }

      const updatedUser = await userModel.update(createdUser._id, {
        name: "New Name",
      });

      expect(updatedUser?.name).toBe("New Name");
      expect(updatedUser?.image).toBe("/images/users/test-image.jpg");
    });
  });
});
