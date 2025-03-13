// src/services/UserService.ts
import { UserModel } from "../models/UserModel";
import type { ICreateUserDTO, IUser } from "../interfaces/IUser";
import {
  ValidationError,
  NotFoundError,
  PermissionError,
} from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

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
      throw new ValidationError("Email inválido", ErrorCode.INVALID_EMAIL);
    }
    if (
      "password" in userData &&
      (!userData.password?.trim() || userData.password.length < 6)
    ) {
      throw new ValidationError(
        "Senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }
    if (
      "role" in userData &&
      userData.role &&
      !["admin", "employee", "customer"].includes(userData.role)
    ) {
      throw new ValidationError("Role inválida", ErrorCode.INVALID_ROLE);
    }

    // Validações para CPF
    if ("cpf" in userData && userData.cpf !== undefined) {
      const cpfString = userData.cpf.toString();
      // Verificar se o CPF tem 11 dígitos
      if (!/^\d{11}$/.test(cpfString)) {
        throw new ValidationError(
          "CPF inválido. Deve conter 11 dígitos numéricos",
          ErrorCode.INVALID_CPF
        );
      }
    }

    // Validações para RG
    if ("rg" in userData && userData.rg !== undefined) {
      const rgString = userData.rg.toString();
      // Verificar se o RG tem entre 6 e 14 dígitos
      if (!/^\d{6,14}$/.test(rgString)) {
        throw new ValidationError(
          "RG inválido. Deve conter entre 6 e 14 dígitos numéricos",
          ErrorCode.INVALID_RG
        );
      }
    }
  }

  async createUser(
    userData: ICreateUserDTO,
    creatorRole?: string
  ): Promise<IUser> {
    this.validateUserData(userData);

    if (
      creatorRole === "employee" &&
      userData.role &&
      userData.role !== "customer"
    ) {
      throw new PermissionError(
        "Funcionários só podem cadastrar clientes",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    const existingUserByCpf = await this.userModel.findByCpf(userData.cpf);
    if (existingUserByCpf) {
      throw new ValidationError("CPF já cadastrado", ErrorCode.DUPLICATE_CPF);
    }

    const existingUserByEmail = await this.userModel.findByEmail(
      userData.email
    );
    if (existingUserByEmail?.email) {
      throw new ValidationError(
        "Email já cadastrado",
        ErrorCode.DUPLICATE_EMAIL
      );
    }

    return this.userModel.create(userData);
  }

  async getAllUsers(): Promise<IUser[]> {
    const users = await this.userModel.findAll();
    if (!users.length) {
      throw new NotFoundError(
        "Nenhum usuário encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }
    return users;
  }

  async searchUsers(searchTerm: string): Promise<IUser[]> {
    const sanitizedSearch = searchTerm.trim().toLowerCase();

    if (!sanitizedSearch) {
      return this.getAllUsers();
    }

    const users = await this.userModel.search(sanitizedSearch);
    if (!users.length) {
      throw new NotFoundError(
        "Nenhum usuário encontrado com os critérios de busca",
        ErrorCode.USER_NOT_FOUND
      );
    }

    return users;
  }

  async getUsersByRole(role: string): Promise<IUser[]> {
    if (!["admin", "employee", "customer"].includes(role)) {
      throw new ValidationError("Role inválida", ErrorCode.INVALID_ROLE);
    }

    const users = await this.userModel.findByRole(role);
    if (!users.length) {
      throw new NotFoundError(
        `Nenhum usuário com role '${role}' encontrado`,
        ErrorCode.USER_NOT_FOUND
      );
    }

    return users;
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }
    return user;
  }

  async getUserByCpf(cpf: string): Promise<IUser> {
    const sanitizedCpf = cpf.replace(/[^\d]/g, "");

    if (sanitizedCpf.length !== 11) {
      throw new ValidationError(
        "Formato de CPF inválido",
        ErrorCode.INVALID_CPF
      );
    }

    const user = await this.userModel.findByCpf(sanitizedCpf);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }

    return user;
  }

  async updateUser(id: string, userData: UpdateUserInput): Promise<IUser> {
    this.validateUserData(userData);

    if (userData.email) {
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser?.email && existingUser._id.toString() !== id) {
        throw new ValidationError(
          "Email já cadastrado",
          ErrorCode.DUPLICATE_EMAIL
        );
      }
    }

    if (userData.cpf) {
      const existingUser = await this.userModel.findByCpf(userData.cpf);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ValidationError("CPF já cadastrado", ErrorCode.DUPLICATE_CPF);
      }
    }

    const user = await this.userModel.update(id, userData);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }

    return user;
  }

  async deleteUser(id: string): Promise<IUser> {
    const user = await this.userModel.delete(id);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
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
      throw new PermissionError(
        "Não é permitido alterar a role do usuário",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    this.validateUserData(userData);

    const updatedData = {
      ...userData,
      image: userData.image
        ? userData.image.startsWith("/")
          ? userData.image
          : `/images/users/${userData.image}`
        : userData.image,
    };

    const user = await this.userModel.update(userId, updatedData);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }

    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    return this.userModel.checkPassword(userId, password);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError(
        "Senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }

    await this.userModel.update(userId, { password: newPassword });
  }

  async getUserByEmail(email: string): Promise<IUser> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }
    return user;
  }
}
