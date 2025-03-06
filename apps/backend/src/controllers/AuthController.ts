import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/AuthService";
import { UserError, UserService } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { isValidCPF } from "../utils/validators";

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

const updateUserSchema = registerSchema.partial();

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
      const validatedData = loginSchema.parse(req.body);

      const result = await this.authService.login(
        validatedData.login,
        validatedData.password
      );
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof AuthError) {
        res.status(401).json({ message: error.message });
        return;
      }
      console.error("Erro no login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Definir o tipo explicitamente como RegisterInput
      let validatedData: RegisterInput;

      try {
        // Usar parse parcial para permitir campos adicionais como 'file'
        validatedData = registerSchema.parse({
          ...req.body,
          // Tratar corretamente campos que podem vir como strings em formulários multipart
          cpf: req.body.cpf,
          rg: req.body.rg,
          birthDate: req.body.birthDate,
        });
      } catch (e) {
        if (e instanceof z.ZodError) {
          res.status(400).json({
            message: "Dados inválidos",
            errors: e.errors,
          });
          return;
        }
        throw e;
      }

      const userData = {
        ...validatedData,
        image: req.file
          ? `http://localhost:3333/images/users/${req.file.filename}`
          : undefined,
      };

      if (!req.user?.role) {
        throw new AuthError("Usuário não autenticado", 401);
      }

      if (req.user.role === "employee" && userData.role !== "customer") {
        res.status(400).json({
          message: "Funcionários só podem cadastrar clientes",
        });
        return;
      }

      try {
        const user = await this.userService.createUser(userData, req.user.role);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      } catch (err) {
        if (err instanceof UserError) {
          // Verificar a mensagem de erro específica
          if (err.message === "CPF já cadastrado") {
            res.status(400).json({ message: "CPF já cadastrado" });
            return;
          }

          if (err.message === "Email já cadastrado") {
            res.status(400).json({ message: "Email já cadastrado" });
            return;
          }

          res.status(400).json({ message: err.message });
          return;
        }
        throw err;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }
      if (error instanceof AuthError) {
        res.status(error.statusCode || 401).json({ message: error.message });
        return;
      }
      console.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async validateToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AuthError("Token não fornecido");
      }

      const user = await this.authService.validateToken(req.user.id);
      res.status(200).json(user);
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(401).json({ message: error.message });
        return;
      }
      console.error("Erro na validação do token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
