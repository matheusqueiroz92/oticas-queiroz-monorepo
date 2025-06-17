import { getRepositories } from "../repositories/RepositoryFactory";
import { generateToken } from "../utils/jwt";
import type { IUser } from "../interfaces/IUser";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { AuthError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

interface LoginResponse {
  token: string;
  user: Omit<IUser, "password" | "comparePassword">;
}

export class AuthService {
  private userRepository: IUserRepository;

  constructor() {
    const { userRepository } = getRepositories();
    this.userRepository = userRepository;
  }

  async login(login: string, password: string): Promise<LoginResponse> {
    // Validação básica
    if (!login?.trim() || !password?.trim()) {
      throw new AuthError(
        "Login e senha são obrigatórios",
        ErrorCode.VALIDATION_ERROR
      );
    }
  
    // Verificamos se o login é um email, CPF, CNPJ ou número de O.S.
    let user: IUser | null = null;
    
    // Verifica se é um CNPJ (apenas números e exatamente 14 dígitos)
    const isCNPJ = /^\d{14}$/.test(login.replace(/[^\d]/g, ""));
    
    // Verifica se é um CPF (apenas números e exatamente 11 dígitos)
    const isCPF = /^\d{11}$/.test(login.replace(/[^\d]/g, ""));
    
    // Verifica se é um número de O.S. (apenas números, mas menor que CPF)
    const isServiceOrder = /^\d+$/.test(login) && login.length < 11;
  
    if (isCNPJ) {
      // Buscar por CNPJ
      const sanitizedCNPJ = login.replace(/[^\d]/g, "");
      user = await this.userRepository.findByCnpj(sanitizedCNPJ);
    } else if (isCPF) {
      // Buscar por CPF
      const sanitizedCPF = login.replace(/[^\d]/g, "");
      user = await this.userRepository.findByCpf(sanitizedCPF);
    } else if (isServiceOrder) {
      // Buscar por número de O.S.
      user = await this.userRepository.findByServiceOrder(login);
      
      // Para login com O.S., a senha deve ser o próprio número da O.S.
      if (user && login !== password) {
        throw new AuthError(
          "Credenciais inválidas",
          ErrorCode.INVALID_CREDENTIALS
        );
      }
      
      // Se encontrou o usuário e as credenciais são válidas (O.S. = senha)
      if (user && login === password) {
        const token = generateToken(user._id!.toString(), user.role);
        const {
          password: _,
          comparePassword: __,
          ...userWithoutSensitiveData
        } = user;
      
        return {
          token,
          user: userWithoutSensitiveData,
        };
      }
    } else {
      // Buscar por email
      user = await this.userRepository.findByEmail(login);
    }
  
    if (!user) {
      throw new AuthError(
        "Credenciais inválidas",
        ErrorCode.INVALID_CREDENTIALS
      );
    }
  
    // Para login tradicional (não O.S.), verificar senha hash
    const isValidPassword = user.comparePassword ? await user.comparePassword(password) : false;
    if (!isValidPassword) {
      throw new AuthError(
        "Credenciais inválidas",
        ErrorCode.INVALID_CREDENTIALS
      );
    }
  
    const token = generateToken(user._id!.toString(), user.role);
    const {
      password: _,
      comparePassword: __,
      ...userWithoutSensitiveData
    } = user;
  
    return {
      token,
      user: userWithoutSensitiveData,
    };
  }

  async validateToken(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthError("Token inválido", ErrorCode.INVALID_TOKEN);
    }

    const {
      password: _,
      comparePassword: __,
      ...userWithoutSensitiveData
    } = user;

    return userWithoutSensitiveData as IUser;
  }

  // Métodos adicionais usando repository
  async getUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  async getUserByCpf(cpf: string): Promise<IUser | null> {
    return this.userRepository.findByCpf(cpf);
  }

  async getUserByCnpj(cnpj: string): Promise<IUser | null> {
    return this.userRepository.findByCnpj(cnpj);
  }

  async verifyUserPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.comparePassword) {
      return false;
    }
    return user.comparePassword(password);
  }
}
