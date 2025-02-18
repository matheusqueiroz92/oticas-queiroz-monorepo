import type { Request, Response } from "express";
import { UserService, UserError } from "../services/UserService";
import { z } from "zod";
import type { JwtPayload } from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: JwtPayload;
}

const prescriptionSchema = z.object({
  leftEye: z.number(),
  rightEye: z.number(),
  addition: z.number().optional(),
});

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["admin", "employee", "customer"], {
    errorMap: () => ({ message: "Role inválida" }),
  }),
  address: z.string().optional(),
  phone: z.string().optional(),
  prescription: prescriptionSchema.optional(),
  purchases: z.array(z.string()).optional(),
  debts: z.number().min(0).optional(),
});

const updateUserSchema = createUserSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Pelo menos um campo deve ser fornecido para atualização"
  );

type CreateUserInput = z.infer<typeof createUserSchema>;
type UpdateUserInput = z.infer<typeof updateUserSchema>;

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await this.userService.createUser(
        validatedData,
        req.user?.role
      );
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
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
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getAllUsers(_req: AuthRequest, res: Response): Promise<void> {
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
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof UserError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deleteUser(req: AuthRequest, res: Response): Promise<void> {
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
      const user = await this.userService.updateProfile(req.user.id, req.body);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof UserError) {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
