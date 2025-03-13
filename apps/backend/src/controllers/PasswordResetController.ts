import type { Request, Response } from "express";
import { PasswordResetService } from "../services/PasswordResetService";
import { z } from "zod";
import { ValidationError, NotFoundError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

// Esquema de validação para a solicitação de redefinição de senha
const requestResetSchema = z.object({
  email: z.string().email("Email inválido"),
});

// Esquema de validação para a redefinição de senha
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export class PasswordResetController {
  private passwordResetService: PasswordResetService;

  constructor() {
    this.passwordResetService = new PasswordResetService();
  }

  // Solicitar redefinição de senha
  async requestReset(req: Request, res: Response): Promise<void> {
    try {
      // Validar dados de entrada
      const data = requestResetSchema.parse(req.body);

      // Processar a solicitação
      await this.passwordResetService.createResetToken(data.email);

      // Responder com sucesso (mesmo se o email não existir, por segurança)
      res.status(200).json({
        message:
          "Se o email for válido, você receberá instruções para redefinir sua senha.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          "Dados inválidos",
          ErrorCode.VALIDATION_ERROR,
          error.errors
        );
      }
      // Suprimir erros específicos e propagar outros
      if (error instanceof NotFoundError) {
        // Por segurança, não informamos ao cliente que o email não existe
        res.status(200).json({
          message:
            "Se o email for válido, você receberá instruções para redefinir sua senha.",
        });
        return;
      }
      throw error;
    }
  }

  // Redefinir senha com token
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validar dados de entrada
      const data = resetPasswordSchema.parse(req.body);

      // Redefinir a senha
      await this.passwordResetService.resetPassword(data.token, data.password);

      // Responder com sucesso
      res.status(200).json({
        message: "Senha redefinida com sucesso",
      });
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
  }

  // Validar token de redefinição
  async validateToken(req: Request, res: Response): Promise<void> {
    const { token } = req.params;

    if (!token) {
      throw new ValidationError(
        "Token não fornecido",
        ErrorCode.VALIDATION_ERROR
      );
    }

    // Verificar se o token é válido
    const isValid = await this.passwordResetService.validateResetToken(token);

    // Responder com o resultado da validação
    res.status(200).json({
      valid: isValid,
    });
  }
}
