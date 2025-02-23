import type { Request, Response } from "express";
import { UserService, UserError } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { MulterError } from "multer";
import { AuthError } from "../services/AuthService";

interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
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
  image: z.string().optional(),
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
      let userData = userUpdateSchema.parse(req.body);

      // Adicionar imagem se existir
      if (req.file) {
        userData = {
          ...userData,
          image: `/images/users/${req.file.filename}`,
        };
      }

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
      if (error instanceof MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          res
            .status(400)
            .json({ message: "Arquivo muito grande. Tamanho máximo: 5MB" });
          return;
        }
        res.status(400).json({ message: error.message });
        return;
      }

      if (
        error instanceof Error &&
        error.message.includes("Tipo de arquivo não suportado")
      ) {
        res.status(400).json({
          message: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.",
        });
        return;
      }

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

      // Buscar usuário pelo ID
      const user = await this.userService.getUserById(req.user.id);

      // Remover dados sensíveis
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
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

      const validatedData = userUpdateSchema.parse(req.body);

      const userData = {
        ...validatedData,
        image: req.file
          ? `/images/users/${req.file.filename}`
          : validatedData.image,
      };

      const updatedUser = await this.userService.updateProfile(
        req.user.id,
        userData
      );
      res.status(200).json(updatedUser);
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

function next(error: unknown) {
  throw new Error("Function not implemented.");
}
