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
    // Validações existentes
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

    // Validações para CPF
    if ("cpf" in userData && userData.cpf !== undefined) {
      const cpfString = userData.cpf.toString();
      // Verificar se o CPF tem 11 dígitos
      if (!/^\d{11}$/.test(cpfString)) {
        throw new UserError("CPF inválido. Deve conter 11 dígitos numéricos");
      }

      // Aqui você poderia adicionar uma validação mais completa do CPF
      // para verificar os dígitos verificadores, por exemplo
    }

    // Validações para RG
    if ("rg" in userData && userData.rg !== undefined) {
      const rgString = userData.rg.toString();
      // Verificar se o RG tem entre 6 e 14 dígitos
      if (!/^\d{6,14}$/.test(rgString)) {
        throw new UserError(
          "RG inválido. Deve conter entre 6 e 14 dígitos numéricos"
        );
      }
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

    // Verificar CPF primeiro
    const existingUserByCpf = await this.userModel.findByCpf(userData.cpf);
    if (existingUserByCpf) {
      throw new UserError("CPF já cadastrado");
    }

    // Depois verificar email
    const existingUserByEmail = await this.userModel.findByEmail(
      userData.email
    );
    if (existingUserByEmail?.email) {
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

  async searchUsers(searchTerm: string): Promise<IUser[]> {
    // Remover caracteres especiais e espaços extras
    const sanitizedSearch = searchTerm.trim().toLowerCase();

    // Verificar se está vazio após sanitização
    if (!sanitizedSearch) {
      return this.getAllUsers();
    }

    const users = await this.userModel.search(sanitizedSearch);
    if (!users.length) {
      throw new UserError(
        "Nenhum usuário encontrado com os critérios de busca"
      );
    }

    return users;
  }

  async getUsersByRole(role: string): Promise<IUser[]> {
    if (!["admin", "employee", "customer"].includes(role)) {
      throw new UserError("Role inválida");
    }

    const users = await this.userModel.findByRole(role);
    if (!users.length) {
      throw new UserError(`Nenhum usuário com role '${role}' encontrado`);
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

  async getUserByCpf(cpf: string): Promise<IUser> {
    const sanitizedCpf = cpf.replace(/[^\d]/g, "");

    if (sanitizedCpf.length !== 11) {
      throw new UserError("Formato de CPF inválido");
    }

    const user = await this.userModel.findByCpf(sanitizedCpf);
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

    if (userData.cpf) {
      const existingUser = await this.userModel.findByCpf(userData.cpf);
      if (existingUser && existingUser._id !== id) {
        throw new UserError("CPF já cadastrado");
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

    // Validar os dados antes de atualizar
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
      throw new UserError("Usuário não encontrado");
    }

    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    return this.userModel.checkPassword(userId, password);
  }
}
