import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/AuthService";
import type { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async validateToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Token não fornecido" });
        return;
      }

      const user = await this.authService.validateToken(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  // async register(req: AuthRequest, res: Response): Promise<void> {
  //   try {
  //     const { email } = req.body;
  //     const existingUser = await User.findOne({ email });
  //     if (existingUser) {
  //       res.status(400).json({ message: "E-mail já cadastrado" });
  //       return;
  //     }
  //     // Hash da senha antes de criar o usuário
  //     req.body.password = await bcrypt.hash(req.body.password, 10);
  //     const user = await this.userService.createUser(req.body, req.user?.role);
  //     res.status(201).json(user);
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       res.status(400).json({ message: error.message });
  //     } else {
  //       res.status(500).json({ message: "Erro desconhecido" });
  //     }
  //   }
  // }
}
