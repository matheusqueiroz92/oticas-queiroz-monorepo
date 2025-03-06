import { config } from "dotenv";
import { UserModel } from "../models/UserModel";
import connectDB from "../config/db";

config(); // Carrega as variáveis de ambiente

export const createAdminUser = async () => {
  try {
    await connectDB();
    const userModel = new UserModel();

    const adminData = {
      name: "Matheus Queiroz",
      email: "matheus@oticasqueiroz.com.br",
      password: "admin123",
      address: "Rua Ana Nery, nº 121, Alto Maron. Vitória da Conquista-BA",
      phone: "(77)98833-4370",
      image: "/images/users/matheus.png",
      role: "admin" as const,
      cpf: "85804688502",
      rg: "1299106781",
      birthDate: new Date("1992-05-13"),
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
