import { UserService } from "./UserService";
import { EmailService } from "./EmailService";
import { PasswordReset } from "../models/PasswordResetModel";
import { User } from "../schemas/UserSchema";
import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { ValidationError, NotFoundError } from "../utils/AppError";
import { ErrorCode } from "../utils/errorCodes";

export class PasswordResetService {
  private userService: UserService;
  private emailService: EmailService;

  constructor() {
    this.userService = new UserService();
    this.emailService = new EmailService();
  }

  /**
   * Cria um token de redefinição para o email especificado
   * e envia um email com instruções.
   *
   * @param email Email do usuário que solicitou a redefinição
   * @returns Token gerado (apenas para propósitos de teste)
   */
  async createResetToken(email: string): Promise<string> {
    try {
      // Verificar se o usuário existe
      const user = await this.userService.getUserByEmail(email);

      // Remover qualquer token existente para este usuário
      await PasswordReset.deleteMany({ userId: user._id });

      // Gerar um token único
      const token = randomBytes(32).toString("hex");

      // Calcular a data de expiração (1 hora a partir de agora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Criar o registro de redefinição
      await PasswordReset.create({
        userId: user._id,
        token,
        expiresAt,
      });

      // Construir link de redefinição
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/auth/reset-password/${token}`;

      // Enviar email com o link de redefinição
      await this.emailService.sendPasswordResetEmail(email, resetLink);

      return token;
    } catch (error) {
      // Se o usuário não for encontrado, tratamos como erro mas não informamos ao cliente
      if (error instanceof NotFoundError) {
        // Registrar o evento por segurança
        // Retornar um token falso para não revelar que o email não existe
        return randomBytes(32).toString("hex");
      }

      // Propagar outros erros
      throw error;
    }
  }

  /**
   * Valida se um token de redefinição é válido e não expirou
   *
   * @param token Token a ser validado
   * @returns Verdadeiro se o token for válido
   */
  async validateResetToken(token: string): Promise<boolean> {
    const resetRequest = await PasswordReset.findOne({ token });

    if (!resetRequest) {
      return false;
    }

    // Verificar se o token expirou
    if (resetRequest.expiresAt < new Date()) {
      // Remover tokens expirados
      await PasswordReset.deleteOne({ _id: resetRequest._id });
      return false;
    }

    return true;
  }

  /**
   * Redefine a senha do usuário usando um token de redefinição
   *
   * @param token Token de redefinição
   * @param newPassword Nova senha
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Buscar o token de redefinição
    const resetRequest = await PasswordReset.findOne({ token });

    if (!resetRequest) {
      throw new ValidationError(
        "Token inválido ou expirado",
        ErrorCode.INVALID_TOKEN
      );
    }

    // Verificar se o token expirou
    if (resetRequest.expiresAt < new Date()) {
      // Remover token expirado
      await PasswordReset.deleteOne({ _id: resetRequest._id });
      throw new ValidationError("Token expirado", ErrorCode.INVALID_TOKEN);
    }

    // Verificar se a senha é válida
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError(
        "A senha deve ter pelo menos 6 caracteres",
        ErrorCode.INVALID_PASSWORD
      );
    }

    // Gerar hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar a senha do usuário
    const updated = await User.findByIdAndUpdate(
      resetRequest.userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updated) {
      throw new NotFoundError(
        "Usuário não encontrado",
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Remover o token de redefinição (uso único)
    await PasswordReset.deleteOne({ _id: resetRequest._id });
  }
}
