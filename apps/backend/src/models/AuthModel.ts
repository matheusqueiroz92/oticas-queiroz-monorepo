import { User } from "../schemas/UserSchema";
import { type Document, Types } from "mongoose";
import type { IUser } from "../interfaces/IUser";

interface UserDocument extends Omit<Document, "_id"> {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  password: string;
  role: "admin" | "employee" | "customer";
  cpf: string;
  rg: string;
  birthDate?: Date;
  image?: string;
  address?: string;
  phone?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export class AuthModel {
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return (await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    })) as unknown as UserDocument | null;
  }

  async findUserByCpf(cpf: string): Promise<UserDocument | null> {
    const sanitizedCpf = cpf.replace(/[^\d]/g, "");

    return (await User.findOne({
      cpf: sanitizedCpf,
    })) as unknown as UserDocument | null;
  }

  async findUserByCnpj(cnpj: string): Promise<UserDocument | null> {
    const sanitizedCnpj = cnpj.replace(/[^\d]/g, "");
  
    return (await User.findOne({
      cnpj: sanitizedCnpj,
    })) as unknown as UserDocument | null;
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return (await User.findById(id)) as unknown as UserDocument | null;
  }

  async findUserByServiceOrder(serviceOrder: string): Promise<UserDocument | null> {
    // Buscar na coleção de pedidos (Order) para encontrar o cliente pelo serviceOrder
    const Order = require("../schemas/OrderSchema").Order;
    
    const order = await Order.findOne({ serviceOrder: serviceOrder.toString() });
    if (!order) return null;

    // Buscar o usuário cliente associado ao pedido
    return (await User.findById(order.clientId)) as unknown as UserDocument | null;
  }

  async verifyPassword(user: UserDocument, password: string): Promise<boolean> {
    return await user.comparePassword(password);
  }

  convertToIUser(doc: UserDocument): IUser {
    const user = doc.toObject();
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      _id: doc._id.toString(),
      comparePassword: doc.comparePassword.bind(doc),
      image: user.image, // Garantir que a imagem seja incluída
      cpf: user.cpf,
      rg: user.rg,
      birthDate: user.birthDate,
    };
  }
}
