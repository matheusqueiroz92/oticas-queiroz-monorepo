import bcrypt from "bcrypt";
import { User } from "../models/User";
import type { IUser } from "../interfaces/IUser";

export class UserService {
  async createUser(userData: IUser, creatorRole?: string): Promise<IUser> {
    if (creatorRole === "employee" && userData.role !== "customer") {
      throw new Error("Funcionários só podem cadastrar clientes");
    }

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({ ...userData, password: hashedPassword });
    return user.save();
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.find().select("-password");
  }

  async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id).select("-password");
  }

  async updateUser(
    id: string,
    userData: Partial<IUser>
  ): Promise<IUser | null> {
    if (userData.email) {
      const existingUser = await User.findOne({
        email: userData.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new Error("Email já cadastrado");
      }
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    return User.findByIdAndUpdate(id, userData, {
      new: true,
      runValidators: true,
    }).select("-password");
  }

  async deleteUser(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id);
  }

  async getProfile(userId: string): Promise<IUser | null> {
    return User.findById(userId).select("-password");
  }

  async updateProfile(
    userId: string,
    userData: Partial<IUser>
  ): Promise<IUser | null> {
    if (userData.role) {
      throw new Error("Não é permitido alterar a role do usuário");
    }
    return this.updateUser(userId, userData);
  }
}
