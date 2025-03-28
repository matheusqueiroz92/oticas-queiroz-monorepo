import type { Request, Response } from "express";
import { UserService } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { isValidCPF } from "../utils/validators";
import type { IUser } from "../interfaces/IUser";
import {
  ValidationError,
  AuthError,
  PermissionError,
  NotFoundError,
} from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

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
  rg: z.string().optional(),
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

type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    const { role, search, cpf } = req.query;

    let users: IUser[];

    if (search) {
      users = await this.userService.searchUsers(search as string);
    } else if (cpf) {
      try {
        const user = await this.userService.getUserByCpf(cpf as string);
        users = user ? [user] : [];
      } catch (error) {
        if (error instanceof NotFoundError) {
          users = [];
        } else {
          throw error;
        }
      }
    } else if (role) {
      users = await this.userService.getUsersByRole(role as string);
    } else {
      users = await this.userService.getAllUsers();
    }

    res.status(200).json(users);
  }

  async getUserById(req: AuthRequest, res: Response): Promise<void> {
    const user = await this.userService.getUserById(req.params.id);
    res.status(200).json(user);
  }

  async getUserByCpf(req: Request, res: Response): Promise<void> {
    const { cpf } = req.params;

    if (!cpf) {
      throw new ValidationError("CPF é obrigatório", ErrorCode.INVALID_CPF);
    }

    const user = await this.userService.getUserByCpf(cpf);
    res.status(200).json(user);
  }

  async updateUser(req: AuthRequest, res: Response): Promise<void> {
    let userData: UserUpdateInput;
    try {
      userData = userUpdateSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      throw error;
    }

    if (req.file) {
      userData = {
        ...userData,
        image: `/images/users/${req.file.filename}`,
      };
    }

    if (req.user?.role === "employee" && userData.role) {
      throw new PermissionError(
        "Funcionários não podem alterar 'roles'",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    const targetUser = await this.userService.getUserById(req.params.id);
    if (req.user?.role === "employee" && targetUser.role !== "customer") {
      throw new PermissionError(
        "Funcionários só podem atualizar dados de clientes",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    const user = await this.userService.updateUser(req.params.id, userData);
    res.status(200).json(user);
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    await this.userService.deleteUser(req.params.id);
    res.status(204).send();
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    const user = await this.userService.getUserById(req.user.id);

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    let validatedData: UserUpdateInput;
    try {
      validatedData = userUpdateSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      throw error;
    }

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
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError(
        "Senha atual e nova senha são obrigatórias",
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (newPassword.length < 6) {
      throw new ValidationError(
        "A nova senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }

    const isPasswordValid = await this.userService.verifyPassword(
      req.user.id,
      currentPassword
    );

    if (!isPasswordValid) {
      throw new ValidationError(
        "Senha atual incorreta",
        ErrorCode.INVALID_PASSWORD
      );
    }

    await this.userService.updatePassword(req.user.id, newPassword);

    res.status(200).json({ message: "Senha alterada com sucesso" });
  }
}
