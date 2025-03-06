import { UserModel } from "../../models/UserModel";

export const createTestAdmin = async () => {
  const userModel = new UserModel();

  const adminData = {
    name: "Test Admin",
    email: "admin@test.com",
    password: "admin123",
    role: "admin" as const,
    cpf: "12345678901",
    rg: "987654321",
    birthDate: new Date("1990-01-01"),
  };

  const admin = await userModel.create(adminData);
  return admin;
};

export const setupTestAdmin = async () => {
  const userModel = new UserModel();
  const existingAdmin = await userModel.findByEmail("admin@test.com");

  if (!existingAdmin) {
    return createTestAdmin();
  }

  return existingAdmin;
};
