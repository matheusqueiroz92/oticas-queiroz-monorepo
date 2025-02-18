import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/AuthService";
import { UserService } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    res.status(200).json(result);
  }

  async register(req: AuthRequest, res: Response): Promise<void> {
    // Usa o userService para criar o usuário, mas com validações específicas de registro
    const user = await this.userService.createUser(req.body, req.user?.role);
    // Não retorna a senha no response
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  }

  async validateToken(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Token não fornecido");
    }

    const user = await this.authService.validateToken(req.user.id);
    res.status(200).json(user);
  }
}
