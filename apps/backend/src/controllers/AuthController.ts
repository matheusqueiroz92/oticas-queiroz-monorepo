import type { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { isValidCPF } from "../utils/validators";
import { ValidationError, AuthError, PermissionError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
}

const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["admin", "employee", "customer", "institution"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
  image: z.any().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  cpf: z
    .string()
    .min(11, "CPF deve ter pelo menos 11 dígitos")
    .refine((cpf) => isValidCPF(cpf), { message: "CPF inválido" }),
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
});

type RegisterInput = z.infer<typeof registerSchema>;

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);

      const result = await this.authService.login(
        validatedData.login,
        validatedData.password
      );

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados de login inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      throw error;
    }
  }

  async register(req: AuthRequest, res: Response): Promise<void> {
    let validatedData: RegisterInput;

    try {
      validatedData = registerSchema.parse({
        ...req.body,
        cpf: req.body.cpf,
        birthDate: req.body.birthDate,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        throw new ValidationError(
          "Dados de registro inválidos",
          ErrorCode.VALIDATION_ERROR,
          (e as z.ZodError).errors
        );
      }
      throw e;
    }

    const userData = {
      ...validatedData,
      image: req.file
        ? `/images/users/${req.file.filename}`
        : undefined,
    };

    if (!req.user?.role) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    if (req.user.role === "employee" && 
        userData.role !== "customer" && 
        userData.role !== "institution") {
      throw new PermissionError(
        "Funcionários só podem cadastrar clientes e instituições",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    const user = await this.userService.createUser(userData, req.user.role);

    const { password, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  }

  async validateToken(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AuthError("Token não fornecido", ErrorCode.UNAUTHORIZED);
    }

    const user = await this.authService.validateToken(req.user.id);
    res.status(200).json(user);
  }
}
