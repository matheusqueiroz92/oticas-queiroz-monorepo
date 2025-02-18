// import { UserModel } from "../models/UserModel";
// import { createTestAdmin, setupTestAdmin } from "./helpers/setup-admin";
// import { describe, it, expect, beforeEach, jest } from "@jest/globals";
// import type { IUser } from "../interfaces/IUser";

// jest.mock("../../models/UserModel");

// const MockUserModel = UserModel as jest.MockedClass<typeof UserModel>;

// describe("Admin Setup Tests", () => {
//   const mockAdmin: Omit<IUser, "comparePassword"> = {
//     _id: "mock-id",
//     name: "Test Admin",
//     email: "admin@test.com",
//     password: "admin123",
//     role: "admin" as const,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe("createTestAdmin", () => {
//     it("should create a test admin user", async () => {
//       const create = jest.fn().mockResolvedValue({
//         ...mockAdmin,
//         comparePassword: jest.fn().mockResolvedValue(true),
//       });

//       MockUserModel.prototype.create = create;

//       const result = await createTestAdmin();

//       expect(create).toHaveBeenCalledWith({
//         name: "Test Admin",
//         email: "admin@test.com",
//         password: "admin123",
//         role: "admin",
//       });
//       expect(result).toMatchObject(mockAdmin);
//     });
//   });

//   describe("setupTestAdmin", () => {
//     it("should return existing admin if found", async () => {
//       const findByEmail = jest.fn().mockResolvedValue({
//         ...mockAdmin,
//         comparePassword: jest.fn().mockResolvedValue(true),
//       });

//       MockUserModel.prototype.findByEmail = findByEmail;

//       const result = await setupTestAdmin();

//       expect(findByEmail).toHaveBeenCalledWith("admin@test.com");
//       expect(result).toMatchObject(mockAdmin);
//     });

//     it("should create new admin if none exists", async () => {
//       const findByEmail = jest.fn().mockResolvedValue(null);
//       const create = jest.fn().mockResolvedValue({
//         ...mockAdmin,
//         comparePassword: jest.fn().mockResolvedValue(true),
//       });

//       MockUserModel.prototype.findByEmail = findByEmail;
//       MockUserModel.prototype.create = create;

//       const result = await setupTestAdmin();

//       expect(findByEmail).toHaveBeenCalledWith("admin@test.com");
//       expect(create).toHaveBeenCalledWith({
//         name: "Test Admin",
//         email: "admin@test.com",
//         password: "admin123",
//         role: "admin",
//       });
//       expect(result).toMatchObject(mockAdmin);
//     });
//   });
// });
