import { AuthModel } from "../models/AuthModel";
import { generateToken } from "../utils/jwt";
import type { IUser } from "../interfaces/IUser";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

interface LoginResponse {
  token: string;
  user: Omit<IUser, "password" | "comparePassword">;
}

export class AuthService {
  private authModel: AuthModel;

  constructor() {
    this.authModel = new AuthModel();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    if (!email?.trim() || !password?.trim()) {
      throw new AuthError("Email e senha são obrigatórios");
    }

    const user = await this.authModel.findUserByEmail(email);
    if (!user) {
      throw new AuthError("Credenciais inválidas");
    }

    const isValidPassword = await this.authModel.verifyPassword(user, password);
    if (!isValidPassword) {
      throw new AuthError("Credenciais inválidas");
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
      throw new AuthError("Token inválido");
    }

    return this.authModel.convertToIUser(user);
  }
}
