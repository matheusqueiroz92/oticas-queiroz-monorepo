import type { Request, Response } from "express";
import { UserService, UserError } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "employee", "customer"]).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  prescription: z
    .object({
      leftEye: z.number(),
      rightEye: z.number(),
      addition: z.number().optional(),
    })
    .optional(),
  purchases: z.array(z.string()).optional(),
  debts: z.number().optional(),
});

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      if (error instanceof UserError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof UserError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userData = userUpdateSchema.parse(req.body);

      // Se for employee tentando mudar role
      if (req.user?.role === "employee" && userData.role) {
        res
          .status(403)
          .json({ message: "Funcionários não podem alterar roles" });
        return;
      }

      // Se for employee tentando atualizar não-customer
      const targetUser = await this.userService.getUserById(req.params.id);
      if (req.user?.role === "employee" && targetUser.role !== "customer") {
        res.status(403).json({
          message: "Funcionários só podem atualizar dados de clientes",
        });
        return;
      }

      const user = await this.userService.updateUser(req.params.id, userData);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof UserError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      await this.userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof UserError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }
      const user = await this.userService.getProfile(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof UserError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: "Usuário não autenticado" });
        return;
      }

      const userData = userUpdateSchema.parse(req.body);

      // Não permitir atualização de role no perfil
      if (userData.role) {
        res
          .status(400)
          .json({ message: "Não é permitido alterar a role do usuário" });
        return;
      }

      const user = await this.userService.updateProfile(req.user.id, userData);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof UserError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
