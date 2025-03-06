import type { Request, Response } from "express";
import { UserService, UserError } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { MulterError } from "multer";
import { isValidCPF } from "../utils/validators";
import type { IUser } from "../interfaces/IUser";

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
  image: z.string().optional(),
  cpf: z
    .string()
    .min(11, "CPF deve ter pelo menos 11 dígitos")
    .refine((cpf) => isValidCPF(cpf), { message: "CPF inválido" })
    .optional(),
  rg: z
    .string()
    .min(6, "RG deve ter pelo menos 6 dígitos")
    .refine((rg) => /^\d{6,14}$/.test(rg.replace(/[^\d]/g, "")), {
      message: "RG inválido",
    })
    .optional(),
  birthDate: z
    .string()
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        return (
          parsedDate instanceof Date &&
          !Number.isNaN(parsedDate.getTime()) &&
          parsedDate <= new Date()
        );
      },
      { message: "Data de nascimento inválida ou no futuro" }
    )
    .transform((date) => new Date(date))
    .optional(),
  purchases: z.array(z.string()).optional(),
  debts: z.number().optional(),
  sales: z.array(z.string()).optional(),
});

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Extrair parâmetros da query
      const { role, search, cpf } = req.query;

      // Obter usuários com base nos filtros
      let users: IUser[];

      if (search) {
        // Busca por termo geral (nome, email, etc.)
        users = await this.userService.searchUsers(search as string);
      } else if (cpf) {
        // Busca específica por CPF
        try {
          const user = await this.userService.getUserByCpf(cpf as string);
          users = user ? [user] : [];
        } catch (error) {
          users = [];
        }
      } else if (role) {
        // Filtrar por role
        users = await this.userService.getUsersByRole(role as string);
      } else {
        // Sem filtros, retornar todos os usuários
        users = await this.userService.getAllUsers();
      }

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

  async getUserByCpf(req: Request, res: Response): Promise<void> {
    try {
      const { cpf } = req.params;

      if (!cpf) {
        res.status(400).json({ message: "CPF é obrigatório" });
        return;
      }

      const user = await this.userService.getUserByCpf(cpf);
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

      if (req.file) {
        userData = {
          ...userData,
          image: `/images/users/${req.file.filename}`,
        };
      }

      if (req.user?.role === "employee" && userData.role) {
        res
          .status(403)
          .json({ message: "Funcionários não podem alterar 'roles'" });
        return;
      }

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

      const user = await this.userService.getUserById(req.user.id);

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
