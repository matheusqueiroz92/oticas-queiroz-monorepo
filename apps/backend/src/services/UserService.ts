import { getRepositories } from "../repositories/RepositoryFactory";
import type { ICreateUserDTO, IUser } from "../interfaces/IUser";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import {
  ValidationError,
  NotFoundError,
  PermissionError,
} from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";
import { ExportUtils } from "../utils/exportUtils";
import type { ExportOptions } from "../utils/exportUtils";

type CreateUserInput = Omit<IUser, "comparePassword">;
type UpdateUserInput = Partial<CreateUserInput>;

export class UserService {
  private userRepository: IUserRepository;
  private exportUtils: ExportUtils;

  constructor() {
    const { userRepository } = getRepositories();
    this.userRepository = userRepository;
    this.exportUtils = new ExportUtils();
  }

  private validateUserData(userData: CreateUserInput | UpdateUserInput): void {
    if (userData.email) {
      if (
        "email" in userData &&
        (!userData.email?.trim() || !userData.email.includes("@"))
      ) {
        throw new ValidationError("Email inválido", ErrorCode.INVALID_EMAIL);
      }
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
      !["admin", "employee", "customer", "institution"].includes(userData.role)
    ) {
      throw new ValidationError("Role inválida", ErrorCode.INVALID_ROLE);
    }

    if (userData.role === "institution") {
      // CNPJ é obrigatório para instituições
      if (!userData.cnpj) {
        throw new ValidationError("CNPJ é obrigatório para instituições", ErrorCode.VALIDATION_ERROR);
      }
      
      // Validar formato do CNPJ
      if (userData.cnpj && !/^\d{14}$/.test(userData.cnpj.toString())) {
        throw new ValidationError(
          "CNPJ inválido. Deve conter 14 dígitos numéricos",
          ErrorCode.INVALID_CNPJ
        );
      }
    } else if (userData.role === "customer" || userData.role === "employee" || userData.role === "admin") {
      // CPF agora é opcional para todos os tipos de usuário
      // Validar formato do CPF apenas se fornecido
      if ("cpf" in userData && userData.cpf !== undefined && userData.cpf !== null && userData.cpf !== "") {
        const cpfString = userData.cpf.toString();
        if (!/^\d{11}$/.test(cpfString)) {
          throw new ValidationError(
            "CPF inválido. Deve conter 11 dígitos numéricos",
            ErrorCode.INVALID_CPF
          );
        }
      }
    }

    if (userData.rg) {
      if ("rg" in userData && userData.rg !== undefined) {
        const rgString = userData.rg.toString();
        if (!/^\d{6,14}$/.test(rgString)) {
          throw new ValidationError(
            "RG inválido. Deve conter entre 6 e 14 dígitos numéricos",
            ErrorCode.INVALID_RG
          );
        }
      }
    }
  }

  async createUser(userData: ICreateUserDTO, creatorRole?: string): Promise<IUser> {
    // NOVA REGRA: Gerar senha automática para clientes se não enviada (ANTES da validação)
    if (
      userData.role === "customer" &&
      (!userData.password || userData.password.trim() === "")
    ) {
      if (!userData.birthDate) {
        throw new ValidationError(
          "Data de nascimento é obrigatória para gerar a senha do cliente.",
          ErrorCode.VALIDATION_ERROR
        );
      }
      const birth = new Date(userData.birthDate);
      const day = String(birth.getUTCDate()).padStart(2, "0");
      const month = String(birth.getUTCMonth() + 1).padStart(2, "0");
      const year = String(birth.getUTCFullYear());
      userData.password = `${day}${month}${year}`;
    }

    this.validateUserData(userData);

    if (creatorRole === "employee" && 
      userData.role && 
      userData.role !== "customer" && 
      userData.role !== "institution") {
      throw new PermissionError(
        "Funcionários só podem cadastrar clientes e instituições",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }
    
    if (userData.role === "institution" && userData.cnpj) {
      const existingInstitution = await this.userRepository.findByCnpj(userData.cnpj);
      if (existingInstitution) {
        throw new ValidationError("CNPJ já cadastrado", ErrorCode.DUPLICATE_CNPJ);
      }
    } else if (userData.cpf && userData.cpf.trim() !== "") {
      const existingUserByCpf = await this.userRepository.findByCpf(userData.cpf);
      if (existingUserByCpf) {
        throw new ValidationError("CPF já cadastrado", ErrorCode.DUPLICATE_CPF);
      }
    }

    const email = userData.email?.trim().toLowerCase() || null;

    if (email) {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ValidationError(
          "Email já cadastrado",
          ErrorCode.DUPLICATE_EMAIL
        );
      }
    }
    const userToCreate: Omit<IUser, "_id"> = {
        ...userData,
        email: email || undefined,
        comparePassword: undefined as any,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    try {
      return await this.userRepository.create(userToCreate);
    } catch (error) {
      if ((error as any).code === 11000 && (error as any).keyPattern?.email) {
        throw new ValidationError(
          "Email já cadastrado",
          ErrorCode.DUPLICATE_EMAIL
        );
      }
      throw error;
    }
  }
  
  async getAllUsers(
    page = 1,
    limit = 10,
    filters: Record<string, any> = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const result = await this.userRepository.findAll(page, limit, filters);
    
    // Retorna array vazio ao invés de lançar erro quando não há resultados
    return {
      users: result.items,
      total: result.total
    };
  }

  async searchUsers(
    searchTerm: string,
    page = 1,
    limit = 10
  ): Promise<{ users: IUser[]; total: number }> {
    const sanitizedSearch = searchTerm.trim().toLowerCase();
  
    if (!sanitizedSearch) {
      return this.getAllUsers(page, limit);
    }
  
    const result = await this.userRepository.findAll(page, limit, { searchTerm: sanitizedSearch });
    
    // Retorna array vazio ao invés de lançar erro quando não há resultados
    return {
      users: result.items,
      total: result.total
    };
  }

  async getUsersByRole(
    role: string,
    page = 1,
    limit = 10
  ): Promise<{ users: IUser[]; total: number }> {
    if (!["admin", "employee", "customer", "institution"].includes(role)) {
      throw new ValidationError("Role inválida", ErrorCode.INVALID_ROLE);
    }
  
    const result = await this.userRepository.findByRole(role as IUser["role"], page, limit);
    
    // Retorna array vazio ao invés de lançar erro quando não há resultados
    return {
      users: result.items,
      total: result.total
    };
  }

  async getUserById(id: string): Promise<IUser> {
    if (!id?.trim()) {
      throw new ValidationError("ID é obrigatório", ErrorCode.VALIDATION_ERROR);
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND);
    }

    return user;
  }

  async getUserByCpf(cpf: string): Promise<IUser> {
    if (!cpf?.trim()) {
      throw new ValidationError("CPF é obrigatório", ErrorCode.VALIDATION_ERROR);
    }

    // Validar formato do CPF
    const cpfString = cpf.toString();
    if (!/^\d{11}$/.test(cpfString)) {
      throw new ValidationError(
        "CPF inválido. Deve conter 11 dígitos numéricos",
        ErrorCode.INVALID_CPF
      );
    }

    const user = await this.userRepository.findByCpf(cpf);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<IUser> {
    if (!email?.trim()) {
      throw new ValidationError("Email é obrigatório", ErrorCode.VALIDATION_ERROR);
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND);
    }

    return user;
  }

  async updateUser(id: string, userData: UpdateUserInput): Promise<IUser> {
    if (!id?.trim()) {
      throw new ValidationError("ID é obrigatório", ErrorCode.VALIDATION_ERROR);
    }

    this.validateUserData(userData);

    // Verificar se o usuário existe
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND);
    }

    // Verificar duplicatas apenas se os valores foram alterados
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.userRepository.emailExists(userData.email);
      if (emailExists) {
        throw new ValidationError("Email já cadastrado", ErrorCode.DUPLICATE_EMAIL);
      }
    }

    if (userData.cpf && userData.cpf !== existingUser.cpf) {
      const existingUserByCpf = await this.userRepository.findByCpf(userData.cpf);
      if (existingUserByCpf) {
        throw new ValidationError("CPF já cadastrado", ErrorCode.DUPLICATE_CPF);
      }
    }

    if (userData.cnpj && userData.cnpj !== existingUser.cnpj) {
      const existingUserByCnpj = await this.userRepository.findByCnpj(userData.cnpj);
      if (existingUserByCnpj) {
        throw new ValidationError("CNPJ já cadastrado", ErrorCode.DUPLICATE_CNPJ);
      }
    }

    const updatedUser = await this.userRepository.update(id, userData);
    if (!updatedUser) {
      throw new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<IUser> {
    if (!id?.trim()) {
      throw new ValidationError("ID é obrigatório", ErrorCode.VALIDATION_ERROR);
    }

    const deletedUser = await this.userRepository.delete(id);
    if (!deletedUser) {
      throw new NotFoundError("Usuário não encontrado", ErrorCode.USER_NOT_FOUND);
    }

    return deletedUser;
  }

  async getProfile(userId: string): Promise<IUser> {
    return this.getUserById(userId);
  }

  async updateProfile(
    userId: string,
    userData: UpdateUserInput
  ): Promise<IUser> {
    // Remover campos que não devem ser alterados no perfil
    const { role, ...profileData } = userData;
    
    return this.updateUser(userId, profileData);
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user.comparePassword ? user.comparePassword(password) : false;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    if (!newPassword?.trim() || newPassword.length < 6) {
      throw new ValidationError(
        "Nova senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }

    await this.updateUser(userId, { password: newPassword });
  }

  // Métodos específicos do repository
  async getUsersWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: Record<string, any>
  ) {
    return this.userRepository.findAll(page, limit, filters);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    return this.userRepository.emailExists(email);
  }

  async checkCpfExists(cpf: string): Promise<boolean> {
    const user = await this.userRepository.findByCpf(cpf);
    return !!user;
  }

  async checkCnpjExists(cnpj: string): Promise<boolean> {
    const user = await this.userRepository.findByCnpj(cnpj);
    return !!user;
  }

  async getActiveUsersCount(): Promise<number> {
    return this.userRepository.count({ isDeleted: { $ne: true } });
  }

  async getCustomersCount(): Promise<number> {
    return this.userRepository.count({ 
      role: "customer",
      isDeleted: { $ne: true }
    });
  }

  async getEmployeesCount(): Promise<number> {
    return this.userRepository.count({ 
      role: "employee",
      isDeleted: { $ne: true }
    });
  }

  async exportUsers(
    options: ExportOptions,
    filters: Record<string, any> = {}
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    try {
      // Buscar todos os usuários com os filtros aplicados
      const { users } = await this.getAllUsers(1, 1000, filters);
      
      // Filtrar apenas funcionários (admin e employee) se necessário
      const employees = users.filter(user => 
        user.role === 'admin' || user.role === 'employee'
      );

      return await this.exportUtils.exportUsers(employees, options);
    } catch (error) {
      console.error("Erro ao exportar usuários:", error);
      throw new Error("Erro ao exportar lista de funcionários");
    }
  }
}
