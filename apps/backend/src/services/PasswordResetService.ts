import { PasswordReset } from "../schemas/PasswordResetSchema";
import { UserService, UserError } from "../services/UserService";
import { EmailService } from "../services/EmailService";
import { randomBytes } from "node:crypto";

export class PasswordResetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordResetError";
  }
}

export class PasswordResetService {
  private userService: UserService;
  private emailService: EmailService;

  constructor() {
    this.userService = new UserService();
    this.emailService = new EmailService();
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      // Buscar usuário pelo email
      const user = await this.userService.getUserByEmail(email);

      // Gerar token aleatório
      const token = randomBytes(32).toString("hex");

      // Definir data de expiração (1 hora)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Remover qualquer token existente para este usuário
      await PasswordReset.deleteMany({ userId: user._id });

      // Salvar novo token
      await PasswordReset.create({
        userId: user._id,
        token,
        expiresAt,
      });

      // Construir link de redefinição
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetLink = `${frontendUrl}/auth/reset-password/${token}`;

      // Enviar email
      await this.emailService.sendPasswordResetEmail(email, resetLink);
    } catch (error) {
      if (error instanceof UserError) {
        // Não informar ao cliente se o email existe ou não por segurança
        console.log(
          `Reset password requested for non-existent email: ${email}`
        );
        return;
      }
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Buscar token
    const resetToken = await PasswordReset.findOne({ token });

    if (!resetToken) {
      throw new PasswordResetError("Token de redefinição inválido ou expirado");
    }

    // Verificar se o token expirou
    if (resetToken.expiresAt < new Date()) {
      await PasswordReset.deleteOne({ _id: resetToken._id });
      throw new PasswordResetError("Token de redefinição expirado");
    }

    // Atualizar senha do usuário
    await this.userService.updatePassword(
      resetToken.userId.toString(),
      newPassword
    );

    // Remover token usado
    await PasswordReset.deleteOne({ _id: resetToken._id });
  }
}
