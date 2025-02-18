import { config } from "dotenv";
import { UserModel } from "../models/UserModel";
import connectDB from "../config/db";

config(); // Carrega as variáveis de ambiente

export const createAdminUser = async () => {
  try {
    await connectDB();
    const userModel = new UserModel();

    const adminData = {
      name: "Admin",
      email: "admin@oticasqueiroz.com",
      password: "admin123",
      role: "admin" as const,
    };

    // Verifica se já existe um admin
    const existingAdmin = await userModel.findByEmail(adminData.email);

    if (existingAdmin) {
      console.log("Admin já existe!");
      process.exit(0);
    }

    // Cria o admin
    const admin = await userModel.create(adminData);
    console.log("Admin criado com sucesso:", admin);
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar admin:", error);
    process.exit(1);
  }
};

createAdminUser();
