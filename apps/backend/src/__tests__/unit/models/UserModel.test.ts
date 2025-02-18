import { UserModel } from "../../../models/UserModel";
import { User } from "../../../schemas/UserSchema";
import mongoose from "mongoose";
import { config } from "dotenv";
import type { IUser } from "../../../interfaces/IUser";
import bcrypt from "bcrypt";
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  // afterEach,
  afterAll,
} from "@jest/globals";

config();

describe("UserModel", () => {
  let userModel: UserModel;

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
});
