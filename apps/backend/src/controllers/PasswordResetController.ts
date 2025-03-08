import type { Request, Response } from "express";
import {
  PasswordResetService,
  PasswordResetError,
} from "../services/PasswordResetService";
import { z } from "zod";
import { PasswordReset } from "../schemas/PasswordResetSchema";

// Esquema de validação para solicitação de redefinição
const requestResetSchema = z.object({
  email: z.string().email("Email inválido"),
});

// Esquema de validação para redefinição de senha
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export class PasswordResetController {
  private passwordResetService: PasswordResetService;

  constructor() {
    this.passwordResetService = new PasswordResetService();
  }

  async requestReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = requestResetSchema.parse(req.body);

      await this.passwordResetService.requestPasswordReset(email);

      // Sempre retornar sucesso por segurança, mesmo que o email não exista
      res.status(200).json({
        message:
          "Se o email existir, você receberá as instruções para redefinição de senha",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }

      console.error("Erro ao solicitar redefinição de senha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);

      await this.passwordResetService.resetPassword(token, password);

      res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Dados inválidos",
          errors: error.errors,
        });
        return;
      }

      if (error instanceof PasswordResetError) {
        res.status(400).json({ message: error.message });
        return;
      }

      console.error("Erro ao redefinir senha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      // Verificar se o token existe e é válido
      const resetToken = await PasswordReset.findOne({ token });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        res.status(400).json({ valid: false });
        return;
      }

      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Erro ao validar token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}
