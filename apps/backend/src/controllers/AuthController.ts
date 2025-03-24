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
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["admin", "employee", "customer"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
  image: z.any().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  cpf: z
    .string()
    .min(11, "CPF deve ter pelo menos 11 dígitos")
    .refine((cpf) => isValidCPF(cpf), { message: "CPF inválido" }),
  rg: z
    .string()
    .min(6, "RG deve ter pelo menos 6 dígitos")
    .refine((rg) => /^\d{6,14}$/.test(rg.replace(/[^\d]/g, "")), {
      message: "RG inválido",
    }),
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

type LoginInput = z.infer<typeof loginSchema>;
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
      // Validação dos dados de entrada
      const validatedData = loginSchema.parse(req.body);

      // Tentativa de login
      const result = await this.authService.login(
        validatedData.login,
        validatedData.password
      );

      // Resposta de sucesso
      res.status(200).json(result);
    } catch (error) {
      // Lançando o erro para ser tratado pelo middleware
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados de login inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      // Para outros erros, apenas propagar
      throw error;
    }
  }

  async register(req: AuthRequest, res: Response): Promise<void> {
    // Definir o tipo explicitamente como RegisterInput
    let validatedData: RegisterInput;

    try {
      // Usar parse para validar os dados
      validatedData = registerSchema.parse({
        ...req.body,
        // Tratar corretamente campos que podem vir como strings em formulários multipart
        cpf: req.body.cpf,
        rg: req.body.rg,
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

    // Adicionar imagem ao usuário, se fornecida
    const userData = {
      ...validatedData,
      image: req.file
        ? `/images/users/${req.file.filename}`
        : undefined,
    };

    // Verificar se o usuário está autenticado
    if (!req.user?.role) {
      throw new AuthError("Usuário não autenticado", ErrorCode.UNAUTHORIZED);
    }

    // Verificar permissões específicas para funcionários
    if (req.user.role === "employee" && userData.role !== "customer") {
      throw new PermissionError(
        "Funcionários só podem cadastrar clientes",
        ErrorCode.INSUFFICIENT_PERMISSIONS
      );
    }

    // Criar o usuário
    const user = await this.userService.createUser(userData, req.user.role);

    // Remover a senha da resposta
    const { password, ...userWithoutPassword } = user;

    // Resposta de sucesso
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
