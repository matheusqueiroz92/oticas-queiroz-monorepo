import type { Request, Response } from "express";
import { User } from "../schemas/UserSchema";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import { UserService } from "../services/UserService"; // Corrigir caminho da importação
import type { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ message: "Credenciais inválidas" });
        return;
      }

      const token = generateToken(user._id.toString(), user.role);
      res.status(200).json({ token });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro desconhecido" });
      }
    }
  }

  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res.status(400).json({ message: "E-mail já cadastrado" });
        return;
      }

      // Hash da senha antes de criar o usuário
      req.body.password = await bcrypt.hash(req.body.password, 10);
      const user = await this.userService.createUser(req.body, req.user?.role);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro desconhecido" });
      }
    }
  }
}
