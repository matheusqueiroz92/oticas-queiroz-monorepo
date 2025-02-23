import type { Request, Response } from "express";
import { AuthService, AuthError } from "../services/AuthService";
import { UserError, UserService } from "../services/UserService";
import type { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import multer, { MulterError } from "multer";

interface AuthRequest extends Request {
  user?: JwtPayload;
  file?: Express.Multer.File;
}

// Schema para login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Schema para registro de usuário
const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["admin", "employee", "customer"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
  address: z.string().optional(),
  phone: z.string().optional(),
  prescription: z
    .object({
      leftEye: z.number(),
      rightEye: z.number(),
      addition: z.number().optional(),
    })
    .optional(),
});

// Para validação de dados parciais na atualização
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
      // Validação dos dados de entrada
      const validatedData = loginSchema.parse(req.body);

      const result = await this.authService.login(
        validatedData.email,
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
      const validatedData = registerSchema.parse(req.body);

      const userData = {
        ...validatedData,
        image: req.file ? `/images/users/${req.file.filename}` : undefined,
      };

      if (!req.user?.role) {
        throw new AuthError("Usuário não autenticado", 401);
      }

      // Primeiro verificar se é employee tentando criar não-customer
      if (req.user.role === "employee" && userData.role !== "customer") {
        res.status(400).json({
          message: "Funcionários só podem cadastrar clientes",
        });
        return;
      }

      // Depois tentar criar o usuário
      try {
        const user = await this.userService.createUser(userData, req.user.role);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      } catch (err) {
        if (err instanceof UserError) {
          if (err.message.includes("já cadastrado")) {
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
