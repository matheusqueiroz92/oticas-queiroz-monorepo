import { UserModel } from "../models/UserModel";
import type { IUser } from "../interfaces/IUser";

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

type CreateUserInput = Omit<IUser, "comparePassword">;
type UpdateUserInput = Partial<CreateUserInput>;

export class UserService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  private validateUserData(userData: CreateUserInput | UpdateUserInput): void {
    if (
      "email" in userData &&
      (!userData.email?.trim() || !userData.email.includes("@"))
    ) {
      throw new UserError("Email inválido");
    }
    if (
      "password" in userData &&
      (!userData.password?.trim() || userData.password.length < 6)
    ) {
      throw new UserError("Senha deve ter pelo menos 6 caracteres");
    }
    if (
      "role" in userData &&
      userData.role &&
      !["admin", "employee", "customer"].includes(userData.role)
    ) {
      throw new UserError("Role inválida");
    }
  }

  async createUser(
    userData: CreateUserInput,
    creatorRole?: string
  ): Promise<IUser> {
    this.validateUserData(userData);

    if (
      creatorRole === "employee" &&
      userData.role &&
      userData.role !== "customer"
    ) {
      throw new UserError("Funcionários só podem cadastrar clientes");
    }

    const existingUser = await this.userModel.findByEmail(userData.email);
    if (existingUser?.email) {
      throw new UserError("Email já cadastrado");
    }

    return this.userModel.create(userData);
  }

  async getAllUsers(): Promise<IUser[]> {
    const users = await this.userModel.findAll();
    if (!users.length) {
      throw new UserError("Nenhum usuário encontrado");
    }
    return users;
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new UserError("Usuário não encontrado");
    }
    return user;
  }

  async updateUser(id: string, userData: UpdateUserInput): Promise<IUser> {
    this.validateUserData(userData);

    if (userData.email) {
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser?.email && existingUser?._id !== id) {
        throw new UserError("Email já cadastrado");
      }
    }

    const user = await this.userModel.update(id, userData);
    if (!user) {
      throw new UserError("Usuário não encontrado");
    }

    return user;
  }

  async deleteUser(id: string): Promise<IUser> {
    const user = await this.userModel.delete(id);
    if (!user) {
      throw new UserError("Usuário não encontrado");
    }
    return user;
  }

  async getProfile(userId: string): Promise<IUser> {
    return this.getUserById(userId);
  }

  async updateProfile(
    userId: string,
    userData: UpdateUserInput
  ): Promise<IUser> {
    if (userData.role) {
      throw new UserError("Não é permitido alterar a role do usuário");
    }

    return this.updateUser(userId, userData);
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    return this.userModel.checkPassword(userId, password);
  }
}
