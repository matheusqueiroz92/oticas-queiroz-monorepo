// import { UserModel } from "../models/UserModel";
// import { createAdminUser } from "../scripts/createAdmin";
// import { config } from "dotenv";
// import connectDB from "../config/db";
// import { describe, it, expect, beforeEach, jest } from "@jest/globals";
// import type { IUser } from "../interfaces/IUser";

// jest.mock("../models/UserModel");
// jest.mock("dotenv");
// jest.mock("../config/db");

// const MockUserModel = UserModel as jest.MockedClass<typeof UserModel>;

// describe("Create Admin Script", () => {
//   const mockAdmin: Omit<IUser, "comparePassword"> = {
//     _id: "mock-id",
//     name: "Admin",
//     email: "admin@oticasqueiroz.com",
//     password: "admin123",
//     role: "admin" as const,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   const processExit = jest
//     .spyOn(process, "exit")
//     .mockImplementation((() => {}) as never);
//   const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
//   const consoleError = jest
//     .spyOn(console, "error")
//     .mockImplementation(() => {});

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it("should create admin user when no admin exists", async () => {
//     const findByEmail = jest.fn().mockResolvedValue(null);
//     const create = jest.fn().mockResolvedValue({
//       ...mockAdmin,
//       comparePassword: jest.fn().mockResolvedValue(true),
//     });

//     MockUserModel.prototype.findByEmail = findByEmail;
//     MockUserModel.prototype.create = create;

//     jest.mocked(connectDB).mockResolvedValue(undefined);

//     await createAdminUser();

//     expect(config).toHaveBeenCalled();
//     expect(connectDB).toHaveBeenCalled();
//     expect(findByEmail).toHaveBeenCalledWith("admin@oticasqueiroz.com");
//     expect(create).toHaveBeenCalledWith({
//       name: "Admin",
//       email: "admin@oticasqueiroz.com",
//       password: "admin123",
//       role: "admin",
//     });
//     expect(consoleLog).toHaveBeenCalledWith(
//       "Admin criado com sucesso:",
//       expect.objectContaining({ email: "admin@oticasqueiroz.com" })
//     );
//     expect(processExit).toHaveBeenCalledWith(0);
//   });

//   it("should exit when admin already exists", async () => {
//     const findByEmail = jest.fn().mockResolvedValue({
//       ...mockAdmin,
//       comparePassword: jest.fn().mockResolvedValue(true),
//     });

//     MockUserModel.prototype.findByEmail = findByEmail;
//     jest.mocked(connectDB).mockResolvedValue(undefined);

//     await createAdminUser();

//     expect(findByEmail).toHaveBeenCalledWith("admin@oticasqueiroz.com");
//     expect(consoleLog).toHaveBeenCalledWith("Admin já existe!");
//     expect(processExit).toHaveBeenCalledWith(0);
//   });

//   it("should handle errors and exit with code 1", async () => {
//     const error = new Error("Connection error");
//     jest.mocked(connectDB).mockRejectedValue(error);

//     await createAdminUser();

//     expect(consoleError).toHaveBeenCalledWith("Erro ao criar admin:", error);
//     expect(processExit).toHaveBeenCalledWith(1);
//   });
// });
