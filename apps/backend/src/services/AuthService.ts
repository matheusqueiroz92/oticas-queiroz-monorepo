import { getRepositories } from "../repositories/RepositoryFactory";
import {
  generateToken,
  generateRefreshTokenValue,
  getRefreshTokenExpiry,
} from "../utils/jwt";
import { RefreshToken } from "../schemas/RefreshTokenSchema";
import type { IUser } from "../interfaces/IUser";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { AuthError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

interface LoginResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: string;
  user: Omit<IUser, "password" | "comparePassword">;
}

interface RefreshResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: string;
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
      
      if (user && login === password) {
        return this.buildLoginResponse(user);
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
  
    return this.buildLoginResponse(user);
  }

  private async buildLoginResponse(
    user: IUser
  ): Promise<LoginResponse> {
    const token = generateToken(user._id!.toString(), user.role);
    const refreshTokenValue = generateRefreshTokenValue();
    await RefreshToken.create({
      userId: user._id,
      token: refreshTokenValue,
      expiresAt: getRefreshTokenExpiry(),
    });
    const {
      password: _,
      comparePassword: __,
      ...userWithoutSensitiveData
    } = user;

    return {
      token,
      refreshToken: refreshTokenValue,
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      user: userWithoutSensitiveData,
    };
  }

  async refreshToken(refreshTokenValue: string): Promise<RefreshResponse> {
    if (!refreshTokenValue?.trim()) {
      throw new AuthError(
        "Refresh token é obrigatório",
        ErrorCode.VALIDATION_ERROR
      );
    }

    const stored = await RefreshToken.findOne({
      token: refreshTokenValue,
      expiresAt: { $gt: new Date() },
    }).exec();

    if (!stored) {
      throw new AuthError(
        "Refresh token inválido ou expirado",
        ErrorCode.INVALID_TOKEN
      );
    }

    const user = await this.userRepository.findById(stored.userId.toString());
    if (!user) {
      await RefreshToken.deleteOne({ _id: stored._id }).exec();
      throw new AuthError("Usuário não encontrado", ErrorCode.INVALID_TOKEN);
    }

    const token = generateToken(user._id!.toString(), user.role);
    const newRefreshValue = generateRefreshTokenValue();
    await RefreshToken.deleteOne({ _id: stored._id }).exec();
    await RefreshToken.create({
      userId: user._id,
      token: newRefreshValue,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      token,
      refreshToken: newRefreshValue,
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    };
  }

  async revokeRefreshToken(refreshTokenValue: string): Promise<void> {
    if (!refreshTokenValue?.trim()) {
      return; // Idempotente: logout sem token não é erro
    }
    await RefreshToken.deleteOne({ token: refreshTokenValue }).exec();
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
