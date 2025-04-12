import { AuthModel } from "../models/AuthModel";
import { generateToken } from "../utils/jwt";
import type { IUser } from "../interfaces/IUser";
import { AuthError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

interface LoginResponse {
  token: string;
  user: Omit<IUser, "password" | "comparePassword">;
}

export class AuthService {
  private authModel: AuthModel;

  constructor() {
    this.authModel = new AuthModel();
  }

  async login(login: string, password: string): Promise<LoginResponse> {
    // Validação básica
    if (!login?.trim() || !password?.trim()) {
      throw new AuthError(
        "Login e senha são obrigatórios",
        ErrorCode.VALIDATION_ERROR
      );
    }
  
    // Verificamos se o login é um email, CPF ou CNPJ
    let user = null;
    
    // Verifica se é um CNPJ (apenas números e exatamente 14 dígitos)
    const isCNPJ = /^\d{14}$/.test(login.replace(/[^\d]/g, ""));
    
    // Verifica se é um CPF (apenas números e exatamente 11 dígitos)
    const isCPF = /^\d{11}$/.test(login.replace(/[^\d]/g, ""));
  
    if (isCNPJ) {
      // Buscar por CNPJ
      const sanitizedCNPJ = login.replace(/[^\d]/g, "");
      user = await this.authModel.findUserByCnpj(sanitizedCNPJ);
    } else if (isCPF) {
      // Buscar por CPF
      const sanitizedCPF = login.replace(/[^\d]/g, "");
      user = await this.authModel.findUserByCpf(sanitizedCPF);
    } else {
      // Buscar por email
      user = await this.authModel.findUserByEmail(login);
    }
  
    if (!user) {
      throw new AuthError(
        "Credenciais inválidas",
        ErrorCode.INVALID_CREDENTIALS
      );
    }
  
    const isValidPassword = await this.authModel.verifyPassword(user, password);
    if (!isValidPassword) {
      throw new AuthError(
        "Credenciais inválidas",
        ErrorCode.INVALID_CREDENTIALS
      );
    }
  
    const token = generateToken(user._id.toString(), user.role);
    const userData = this.authModel.convertToIUser(user);
    const {
      password: _,
      comparePassword: __,
      ...userWithoutSensitiveData
    } = userData;
  
    return {
      token,
      user: userWithoutSensitiveData,
    };
  }

  async validateToken(userId: string): Promise<IUser> {
    const user = await this.authModel.findUserById(userId);
    if (!user) {
      throw new AuthError("Token inválido", ErrorCode.INVALID_TOKEN);
    }

    const userData = this.authModel.convertToIUser(user);
    const {
      password: _,
      comparePassword: __,
      ...userWithoutSensitiveData
    } = userData;

    return userWithoutSensitiveData as IUser;
  }
}
