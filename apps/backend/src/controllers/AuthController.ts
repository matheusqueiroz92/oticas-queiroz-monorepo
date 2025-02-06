import type { Request, Response } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/jwt";
// import { UserController } from "./UserController";
import { UserService } from "src/services/UserService";

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ message: "Credenciais inválidas" });
        return;
      }

      const token = generateToken(user._id.toString(), user.role);
      res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Erro desconhecido" });
      }
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res.status(400).json({ message: "E-mail já cadastrado" });
        return;
      }

      const userService = new UserService();
      const user = await userService.createUser(req.body, req.user?.role);
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
