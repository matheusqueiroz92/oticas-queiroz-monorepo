import { UserModel } from "../../models/UserModel";

export const createTestAdmin = async () => {
  const userModel = new UserModel();

  const adminData = {
    name: "Test Admin",
    email: "admin@test.com",
    password: "admin123",
    role: "admin" as const,
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
